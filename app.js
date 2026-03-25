const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const path = require("node:path");

const Transaction = require("./models/Transaction");
const User = require("./models/users");
const {
  buildBusinessSnapshot,
  buildFinanceInsights,
  buildFinanceOverview,
  normalizeTransactionInput,
  serializeForInlineScript,
} = require("./utils/finance");
const {
  SESSION_COOKIE_NAME,
  VALID_CURRENCIES,
  buildCookie,
  createSignedSession,
  getUserInitials,
  hashPassword,
  normalizeUserInput,
  parseCookies,
  verifyPassword,
  verifySignedSession,
} = require("./utils/auth");

require("dotenv").config();

mongoose.set("strictQuery", true);
const AI_KEY_PLACEHOLDERS = new Set([
  "your_openai_api_key_here",
  "your_gemini_api_key_here",
  "your_google_ai_api_key_here",
]);
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const app = express();
app.disable("x-powered-by");

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/boilerplate");

function getAssistantApiKey() {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.OPENAI_API_KEY,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();

    if (value && !AI_KEY_PLACEHOLDERS.has(value)) {
      return value;
    }
  }

  return "";
}

function getAssistantModel() {
  const model = String(process.env.GEMINI_MODEL || "").trim();
  return model || DEFAULT_GEMINI_MODEL;
}

function isAiConfigured() {
  return Boolean(getAssistantApiKey());
}

function buildAssistantInstructions() {
  return [
    "You are FinPulse Coach, an AI business reviewer inside a finance dashboard.",
    "Use the current business snapshot provided in the latest user message as your source of truth.",
    "Give practical advice for a small business owner.",
    "Keep answers concise, specific, and action-oriented.",
    "When the data is weak or incomplete, say that clearly before making recommendations.",
    "Prefer priorities, risks, and next actions over generic encouragement.",
  ].join(" ");
}

function normalizeAssistantHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((entry) => ({
      role: entry?.role === "assistant" ? "model" : "user",
      text: typeof entry?.text === "string" ? entry.text.trim() : "",
    }))
    .filter((entry) => entry.text)
    .slice(-10)
    .map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.text }],
    }));
}

function extractAssistantText(payload) {
  if (!Array.isArray(payload?.candidates)) {
    return "I could not generate a reply right now.";
  }

  for (const candidate of payload.candidates) {
    const parts = candidate?.content?.parts;

    if (!Array.isArray(parts)) {
      continue;
    }

    const text = parts
      .map((part) => (typeof part?.text === "string" ? part.text.trim() : ""))
      .filter(Boolean)
      .join("\n\n");

    if (text) {
      return text;
    }
  }

  if (payload?.promptFeedback?.blockReason) {
    return "The assistant could not answer that prompt because it was blocked by safety settings.";
  }

  return "I could not generate a reply right now.";
}

function getSafeRedirectPath(value, fallback = "/dashboard") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

function buildRedirectWithFlash(targetPath, type, message) {
  const url = new URL(targetPath, "http://finpulse.local");

  if (type) {
    url.searchParams.set("flashType", type);
  }

  if (message) {
    url.searchParams.set("flashMessage", message);
  }

  return `${url.pathname}${url.search}`;
}

function redirectWithFlash(res, targetPath, type, message) {
  return res.redirect(buildRedirectWithFlash(targetPath, type, message));
}

function setSessionCookie(res, userId) {
  res.append(
    "Set-Cookie",
    buildCookie(SESSION_COOKIE_NAME, createSignedSession(userId), {
      maxAge: SESSION_MAX_AGE_SECONDS,
    }),
  );
}

function clearSessionCookie(res) {
  res.append(
    "Set-Cookie",
    buildCookie(SESSION_COOKIE_NAME, "", {
      maxAge: 0,
    }),
  );
}

async function getUserList() {
  const users = await User.find()
    .sort({ createdAt: 1, name: 1 })
    .select("name email businessName profession currency profileImage")
    .lean();

  return users.map((user) => ({
    ...user,
    initials: getUserInitials(user.name),
  }));
}

async function getFinancePageData(currentUser) {
  const transactions = await Transaction.find({ userId: currentUser._id })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const overview = buildFinanceOverview(transactions);
  const insights = buildFinanceInsights(overview);

  return {
    ...overview,
    insights,
    serializedMonthly: serializeForInlineScript(overview.monthly),
    serializedCategoryBreakdown: serializeForInlineScript(
      overview.categoryBreakdown,
    ),
  };
}

async function createTransaction(req, res, next) {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        error: "Please sign in to add a transaction.",
      });
    }

    const { errors, value } = normalizeTransactionInput(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors.join(" "),
      });
    }

    const transaction = await Transaction.create({
      userId: req.currentUser._id,
      ...value,
    });

    return res.status(201).json({
      message: "Transaction saved successfully.",
      data: transaction,
    });
  } catch (error) {
    return next(error);
  }
}

async function requestBusinessAssistant({
  message,
  history,
  financeData,
  currentUser,
}) {
  const apiKey = getAssistantApiKey();
  const model = getAssistantModel();

  if (!isAiConfigured()) {
    const error = new Error(
      "AI chat is not configured yet. Add GEMINI_API_KEY to your .env file.",
    );
    error.status = 503;
    error.expose = true;
    throw error;
  }

  const identitySnapshot = [
    `Business name: ${currentUser.businessName}`,
    `Owner name: ${currentUser.name}`,
    currentUser.profession ? `Profession: ${currentUser.profession}` : null,
    `Preferred currency: ${currentUser.currency || "INR"}`,
  ]
    .filter(Boolean)
    .join("\n");
  const financeSnapshot = buildBusinessSnapshot(financeData);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: buildAssistantInstructions() }],
        },
        contents: [
          ...normalizeAssistantHistory(history),
          {
            role: "user",
            parts: [
              {
                text: `Business identity:\n${identitySnapshot}\n\nCurrent business snapshot:\n${financeSnapshot}\n\nUser request:\n${message}`,
              },
            ],
          },
        ],
        generationConfig: {
          candidateCount: 1,
          maxOutputTokens: 450,
          temperature: 0.4,
        },
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || "The AI assistant request failed.",
    );
    error.status =
      response.status >= 400 && response.status < 500 ? response.status : 502;
    error.expose = true;
    throw error;
  }

  return {
    reply: extractAssistantText(payload),
    model,
  };
}

app.use(async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const sessionToken = cookies[SESSION_COOKIE_NAME];
    const userId = verifySignedSession(sessionToken);

    res.locals.currentPath = req.path;
    res.locals.flash = req.query.flashMessage
      ? {
          type: req.query.flashType === "error" ? "danger" : "success",
          message: String(req.query.flashMessage),
        }
      : null;
    res.locals.currentUser = null;
    res.locals.currentUserInitials = "FP";
    res.locals.userList = [];
    res.locals.validCurrencies = VALID_CURRENCIES;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return next();
    }

    const currentUser = await User.findById(userId).lean();

    if (!currentUser) {
      clearSessionCookie(res);
      return next();
    }

    req.currentUser = currentUser;
    res.locals.currentUser = currentUser;
    res.locals.currentUserInitials = getUserInitials(currentUser.name);
    return next();
  } catch (error) {
    return next(error);
  }
});

app.use(async (req, res, next) => {
  try {
    if (req.path === "/auth" || req.currentUser) {
      res.locals.userList = await getUserList();
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

app.use((req, res, next) => {
  if (req.path === "/auth" || req.path.startsWith("/auth/")) {
    return next();
  }

  if (req.currentUser) {
    return next();
  }

  if (req.path.startsWith("/api/") || req.method !== "GET") {
    return res.status(401).json({
      error: "Please sign in to continue.",
    });
  }

  return res.redirect("/auth");
});

app.get("/", (req, res) => {
  res.redirect(req.currentUser ? "/dashboard" : "/auth");
});

app.get("/auth", (req, res) => {
  if (req.currentUser) {
    return res.redirect("/dashboard");
  }

  return res.render("auth", {
    layout: false,
    pageTitle: "Sign In",
    users: res.locals.userList,
    flash: res.locals.flash,
    validCurrencies: VALID_CURRENCIES,
  });
});

app.post("/auth/login", async (req, res, next) => {
  try {
    const redirectTo = getSafeRedirectPath(req.body.redirectTo, "/dashboard");
    const selectedUserId =
      typeof req.body.userId === "string" ? req.body.userId.trim() : "";
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body.password === "string" ? req.body.password.trim() : "";

    let user = null;

    if (selectedUserId && mongoose.isValidObjectId(selectedUserId)) {
      user = await User.findById(selectedUserId);
    } else if (email) {
      user = await User.findOne({ email });
    }

    if (
      !user ||
      !verifyPassword(password, user.passwordHash, user.passwordSalt)
    ) {
      return redirectWithFlash(
        res,
        req.currentUser ? redirectTo : "/auth",
        "error",
        "Invalid user or password.",
      );
    }

    setSessionCookie(res, user._id.toString());
    return redirectWithFlash(
      res,
      redirectTo,
      "success",
      isAiConfigured() ? "Connected" : `Welcome back, ${user.name}.`,
    );
  } catch (error) {
    return next(error);
  }
});

app.post("/auth/users", async (req, res, next) => {
  try {
    const redirectTo = getSafeRedirectPath(req.body.redirectTo, "/dashboard");
    const { errors, value } = normalizeUserInput(req.body);
    const existingUserCount = await User.countDocuments();

    if (errors.length > 0) {
      return redirectWithFlash(
        res,
        req.currentUser ? redirectTo : "/auth",
        "error",
        errors.join(" "),
      );
    }

    const existingUser = await User.findOne({ email: value.email }).lean();

    if (existingUser) {
      return redirectWithFlash(
        res,
        req.currentUser ? redirectTo : "/auth",
        "error",
        "A user with this email already exists.",
      );
    }

    const { passwordHash, passwordSalt } = hashPassword(value.password);
    const user = await User.create({
      name: value.name,
      email: value.email,
      passwordHash,
      passwordSalt,
      profession: value.profession,
      businessName: value.businessName,
      currency: value.currency,
      profileImage: value.profileImage,
    });

    if (existingUserCount === 0) {
      await Transaction.collection.updateMany(
        {
          $or: [
            { userId: "demoUser" },
            { userId: { $exists: false } },
            { userId: null },
          ],
        },
        {
          $set: {
            userId: user._id,
          },
        },
      );
    }

    setSessionCookie(res, user._id.toString());
    return redirectWithFlash(
      res,
      "/dashboard",
      "success",
      `User ${user.name} added successfully.`,
    );
  } catch (error) {
    if (error?.code === 11000) {
      return redirectWithFlash(
        res,
        req.currentUser
          ? getSafeRedirectPath(req.body.redirectTo, "/dashboard")
          : "/auth",
        "error",
        "A user with this email already exists.",
      );
    }

    return next(error);
  }
});

app.post("/auth/profile", async (req, res, next) => {
  try {
    if (!req.currentUser) {
      return redirectWithFlash(res, "/auth", "error", "Please sign in first.");
    }

    const redirectTo = getSafeRedirectPath(req.body.redirectTo, "/dashboard");
    const { errors, value } = normalizeUserInput(req.body, {
      requirePassword: false,
    });

    if (errors.length > 0) {
      return redirectWithFlash(res, redirectTo, "error", errors.join(" "));
    }

    const duplicateUser = await User.findOne({
      email: value.email,
      _id: { $ne: req.currentUser._id },
    }).lean();

    if (duplicateUser) {
      return redirectWithFlash(
        res,
        redirectTo,
        "error",
        "Another user already uses this email.",
      );
    }

    const updates = {
      name: value.name,
      email: value.email,
      profession: value.profession,
      businessName: value.businessName,
      currency: value.currency,
    };

    if (value.profileImage) {
      updates.profileImage = value.profileImage;
    }

    if (value.password) {
      Object.assign(updates, hashPassword(value.password));
    }

    await User.updateOne({ _id: req.currentUser._id }, updates);

    return redirectWithFlash(
      res,
      redirectTo,
      "success",
      "Profile updated successfully.",
    );
  } catch (error) {
    return next(error);
  }
});

app.post("/auth/logout", (req, res) => {
  clearSessionCookie(res);
  return redirectWithFlash(res, "/auth", "success", "Signed out successfully.");
});

app.post("/auth/users/:userId/delete", async (req, res, next) => {
  try {
    if (!req.currentUser) {
      return redirectWithFlash(res, "/auth", "error", "Please sign in first.");
    }

    const targetUserId = req.params.userId;
    const redirectTo = getSafeRedirectPath(req.body.redirectTo, "/dashboard");
    const password =
      typeof req.body.password === "string" ? req.body.password.trim() : "";

    if (String(req.currentUser._id) !== String(targetUserId)) {
      return redirectWithFlash(
        res,
        redirectTo,
        "error",
        "You can only delete the currently signed-in user.",
      );
    }

    const currentUser = await User.findById(req.currentUser._id);

    if (
      !currentUser ||
      !verifyPassword(
        password,
        currentUser.passwordHash,
        currentUser.passwordSalt,
      )
    ) {
      return redirectWithFlash(
        res,
        redirectTo,
        "error",
        "Password is required to delete this user.",
      );
    }

    await Transaction.deleteMany({ userId: currentUser._id });
    await User.deleteOne({ _id: currentUser._id });

    const nextUser = await User.findOne().sort({ createdAt: 1 }).lean();

    if (!nextUser) {
      clearSessionCookie(res);
      return redirectWithFlash(
        res,
        "/auth",
        "success",
        "User deleted. Create a new user to continue.",
      );
    }

    setSessionCookie(res, nextUser._id.toString());
    return redirectWithFlash(
      res,
      "/dashboard",
      "success",
      `${currentUser.name} deleted. Switched to ${nextUser.name}.`,
    );
  } catch (error) {
    return next(error);
  }
});

app.post("/transactions", createTransaction);
app.post("/api/transactions", createTransaction);

app.post("/api/assistant", async (req, res, next) => {
  try {
    const message =
      typeof req.body.message === "string" ? req.body.message.trim() : "";
    const history = Array.isArray(req.body.history) ? req.body.history : [];

    if (!message) {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

    if (message.length > 1500) {
      return res.status(400).json({
        error: "Message is too long. Keep it under 1500 characters.",
      });
    }

    const financeData = await getFinancePageData(req.currentUser);
    const assistant = await requestBusinessAssistant({
      message,
      history,
      financeData,
      currentUser: req.currentUser,
    });

    return res.json(assistant);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/transactions", async (_req, res, next) => {
  try {
    const { transactions } = await getFinancePageData(res.locals.currentUser);

    res.json({
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/summary", async (_req, res, next) => {
  try {
    const { summary } = await getFinancePageData(res.locals.currentUser);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

app.get("/api/analytics", async (_req, res, next) => {
  try {
    const { monthly, categoryBreakdown } = await getFinancePageData(
      res.locals.currentUser,
    );

    res.json({
      monthly,
      categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/dashboard", async (_req, res, next) => {
  try {
    const data = await getFinancePageData(res.locals.currentUser);

    res.render("dashboard", {
      pageTitle: "Dashboard",
      aiEnabled: isAiConfigured(),
      aiModel: getAssistantModel(),
      currentUserId: String(res.locals.currentUser._id),
      businessName: res.locals.currentUser.businessName,
      ownerName: res.locals.currentUser.name,
      ownerProfession: res.locals.currentUser.profession,
      ownerInitials: res.locals.currentUserInitials,
      ownerImage: res.locals.currentUser.profileImage,
      currencyCode: res.locals.currentUser.currency || "INR",
      ...data,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/transactions", async (_req, res, next) => {
  try {
    const data = await getFinancePageData(res.locals.currentUser);

    res.render("transactions", {
      pageTitle: "Transactions",
      ...data,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/summary", async (_req, res, next) => {
  try {
    const data = await getFinancePageData(res.locals.currentUser);

    res.render("summary", {
      pageTitle: "Summary",
      ...data,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/analytics", async (_req, res, next) => {
  try {
    const data = await getFinancePageData(res.locals.currentUser);

    res.render("analytics", {
      pageTitle: "Analytics",
      ...data,
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).render("404", {
    pageTitle: "Page Not Found",
  });
});

app.use((error, req, res, _next) => {
  console.error(error);

  if (req.path.startsWith("/api/") || req.method !== "GET") {
    return res.status(error.status || 500).json({
      error: error.expose ? error.message : "Internal server error",
    });
  }

  return res.status(error.status || 500).render("error", {
    pageTitle: "Something Went Wrong",
    message: "Something went wrong while loading this page.",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

async function startServer() {
  const mongoUri = process.env.MONGO_URI;
  const port = Number(process.env.PORT) || 8080;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in the environment.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB Connected");

  return app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start FinPulse:", error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };

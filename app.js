const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const path = require("node:path");

const Transaction = require("./models/Transaction");
const {
  buildFinanceOverview,
  normalizeTransactionInput,
  serializeForInlineScript,
} = require("./utils/finance");

require("dotenv").config();

mongoose.set("strictQuery", true);

const app = express();
app.disable("x-powered-by");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/boilerplate");

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

async function getFinancePageData() {
  const transactions = await Transaction.find()
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const overview = buildFinanceOverview(transactions);

  return {
    ...overview,
    serializedMonthly: serializeForInlineScript(overview.monthly),
    serializedCategoryBreakdown: serializeForInlineScript(
      overview.categoryBreakdown,
    ),
  };
}

async function createTransaction(req, res, next) {
  try {
    const { errors, value } = normalizeTransactionInput(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors.join(" "),
      });
    }

    const transaction = await Transaction.create({
      userId: "demoUser",
      ...value,
    });

    return res.status(201).json({
      message: "Transaction saved successfully",
      data: transaction,
    });
  } catch (error) {
    return next(error);
  }
}

app.get("/", (_req, res) => {
  res.redirect("/dashboard");
});

app.post("/transactions", createTransaction);
app.post("/api/transactions", createTransaction);

app.get("/api/transactions", async (_req, res, next) => {
  try {
    const { transactions } = await getFinancePageData();

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
    const { summary } = await getFinancePageData();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

app.get("/api/analytics", async (_req, res, next) => {
  try {
    const { monthly, categoryBreakdown } = await getFinancePageData();

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
    const data = await getFinancePageData();

    res.render("dashboard", {
      pageTitle: "Dashboard",
      ...data,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/transactions", async (_req, res, next) => {
  try {
    const data = await getFinancePageData();

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
    const data = await getFinancePageData();

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
    const data = await getFinancePageData();

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
    return res.status(500).json({
      error: "Internal server error",
    });
  }

  return res.status(500).render("error", {
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

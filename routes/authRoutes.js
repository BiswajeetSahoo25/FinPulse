const express = require("express");
const User = require("../models/User");
const { wantsJson } = require("../middleware/auth");
const { createPasswordHash, verifyPassword } = require("../utils/password");

const router = express.Router();
const SESSION_COOKIE_NAME = "finpulseUserId";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function buildSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    businessName: user.businessName,
    avatar: user.avatar,
  };
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_DURATION_MS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

function createSession(res, userId) {
  res.cookie(SESSION_COOKIE_NAME, userId.toString(), getSessionCookieOptions());
}

function clearSession(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function renderRegisterPage(res, options = {}) {
  return res.status(options.status || 200).render("register", {
    pageTitle: "Create account",
    hideShell: true,
    error: options.error || "",
    formData: options.formData || {},
  });
}

function renderLoginPage(res, options = {}) {
  return res.status(options.status || 200).render("login", {
    pageTitle: "Login",
    hideShell: true,
    error: options.error || "",
    formData: options.formData || {},
  });
}

router.get("/register", (req, res) => {
  if (req.currentUser) {
    return res.redirect("/dashboard");
  }

  return renderRegisterPage(res);
});

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, businessName, avatar } = req.body;

    if (!name || !email || !password || !businessName) {
      const message = "Please fill in name, email, password, and business name.";

      if (wantsJson(req)) {
        return res.status(400).json({ message });
      }

      return renderRegisterPage(res, {
        status: 400,
        error: message,
        formData: req.body,
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      const message = "An account with that email already exists.";

      if (wantsJson(req)) {
        return res.status(409).json({ message });
      }

      return renderRegisterPage(res, {
        status: 409,
        error: message,
        formData: req.body,
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: await createPasswordHash(password.trim()),
      businessName: businessName.trim(),
      avatar: avatar ? avatar.trim() : undefined,
    });

    createSession(res, user._id);

    if (wantsJson(req)) {
      return res.status(201).json({
        message: "Registration successful.",
        user: buildSafeUser(user),
      });
    }

    return res.redirect("/dashboard");
  } catch (error) {
    next(error);
  }
});

router.get("/login", (req, res) => {
  if (req.currentUser) {
    return res.redirect("/dashboard");
  }

  return renderLoginPage(res);
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? email.trim().toLowerCase() : "";
    const trimmedPassword = password ? password.trim() : "";

    if (!normalizedEmail || !trimmedPassword) {
      const message = "Please enter your email and password.";

      if (wantsJson(req)) {
        return res.status(400).json({ message });
      }

      return renderLoginPage(res, {
        status: 400,
        error: message,
        formData: req.body,
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const message = "Invalid email or password.";

      if (wantsJson(req)) {
        return res.status(401).json({ message });
      }

      return renderLoginPage(res, {
        status: 401,
        error: message,
        formData: req.body,
      });
    }

    const passwordCheck = await verifyPassword(trimmedPassword, user.password);

    if (!passwordCheck.isValid) {
      const message = "Invalid email or password.";

      if (wantsJson(req)) {
        return res.status(401).json({ message });
      }

      return renderLoginPage(res, {
        status: 401,
        error: message,
        formData: req.body,
      });
    }

    if (passwordCheck.needsRehash) {
      user.password = await createPasswordHash(trimmedPassword);
      await user.save();
    }

    createSession(res, user._id);

    if (wantsJson(req)) {
      return res.json({
        message: "Login successful.",
        user: buildSafeUser(user),
      });
    }

    return res.redirect("/dashboard");
  } catch (error) {
    next(error);
  }
});

function handleLogout(req, res) {
  clearSession(res);

  if (wantsJson(req)) {
    return res.json({ message: "Logout successful." });
  }

  return res.redirect("/login");
}

router.get("/logout", handleLogout);
router.post("/logout", handleLogout);

module.exports = router;

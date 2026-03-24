const express = require("express");
const User = require("../models/User");
const { wantsJson } = require("../middleware/auth");

const router = express.Router();

function buildSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    businessName: user.businessName,
    avatar: user.avatar,
  };
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
      password: password.trim(),
      businessName: businessName.trim(),
      avatar: avatar ? avatar.trim() : undefined,
    });

    res.cookie("finpulseUserId", user._id.toString(), {
      httpOnly: true,
      sameSite: "lax",
    });

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

    if (!email || !password) {
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

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

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

    res.cookie("finpulseUserId", user._id.toString(), {
      httpOnly: true,
      sameSite: "lax",
    });

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

router.get("/logout", (req, res) => {
  res.clearCookie("finpulseUserId");
  return res.redirect("/login");
});

module.exports = router;

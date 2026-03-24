const User = require("../models/User");

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((cookiePart) => cookiePart.trim())
    .filter(Boolean)
    .reduce((cookies, cookiePart) => {
      const [key, ...valueParts] = cookiePart.split("=");

      if (!key) {
        return cookies;
      }

      cookies[key] = decodeURIComponent(valueParts.join("="));
      return cookies;
    }, {});
}

function wantsJson(req) {
  const acceptHeader = req.headers.accept || "";
  const contentType = req.headers["content-type"] || "";

  return (
    acceptHeader.includes("application/json") ||
    contentType.includes("application/json")
  );
}

async function attachCurrentUser(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const currentUserId = cookies.finpulseUserId;

    if (!currentUserId) {
      res.locals.currentUser = null;
      return next();
    }

    const currentUser = await User.findById(currentUserId).lean();

    if (!currentUser) {
      res.clearCookie("finpulseUserId");
      res.locals.currentUser = null;
      return next();
    }

    req.currentUser = currentUser;
    res.locals.currentUser = currentUser;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (req.currentUser) {
    return next();
  }

  if (wantsJson(req)) {
    return res.status(401).json({ message: "Please login first." });
  }

  return res.redirect("/login");
}

module.exports = {
  attachCurrentUser,
  requireAuth,
  wantsJson,
};

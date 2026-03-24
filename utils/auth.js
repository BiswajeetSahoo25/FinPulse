const crypto = require("node:crypto");

const SESSION_COOKIE_NAME = "finpulse_session";
const DEFAULT_SESSION_SECRET = "finpulse-local-session-secret";
const VALID_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];
const IMAGE_DATA_URL_PATTERN =
  /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;
const MAX_PROFILE_IMAGE_LENGTH = 900000;

function sanitizeText(value, maxLength = 120) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function sanitizeEmail(value) {
  return sanitizeText(value, 120).toLowerCase();
}

function sanitizeCurrency(value) {
  const currency = sanitizeText(value, 10).toUpperCase();
  return currency || "INR";
}

function sanitizeProfileImage(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (
    trimmed.length > MAX_PROFILE_IMAGE_LENGTH ||
    !IMAGE_DATA_URL_PATTERN.test(trimmed)
  ) {
    return null;
  }

  return trimmed;
}

function normalizeUserInput(input = {}, options = {}) {
  const errors = [];
  const requirePassword = options.requirePassword !== false;

  const name = sanitizeText(input.name, 80);
  const email = sanitizeEmail(input.email);
  const password =
    typeof input.password === "string" ? input.password.trim() : "";
  const profession = sanitizeText(input.profession, 80);
  const businessName = sanitizeText(input.businessName, 100);
  const currency = sanitizeCurrency(input.currency);
  const profileImage = sanitizeProfileImage(
    input.profileImageData || input.profileImage,
  );

  if (!name) {
    errors.push("Name is required.");
  }

  if (!email) {
    errors.push("Email is required.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email must be valid.");
  }

  if (!businessName) {
    errors.push("Business name is required.");
  }

  if (!VALID_CURRENCIES.includes(currency)) {
    errors.push(`Currency must be one of: ${VALID_CURRENCIES.join(", ")}.`);
  }

  if (requirePassword && password.length < 6) {
    errors.push("Password must be at least 6 characters long.");
  }

  if (!requirePassword && password && password.length < 6) {
    errors.push("New password must be at least 6 characters long.");
  }

  if (profileImage === null) {
    errors.push("Profile picture must be a valid image under 900 KB.");
  }

  return {
    errors,
    value: {
      name,
      email,
      password,
      profession: profession || undefined,
      businessName,
      currency,
      profileImage: profileImage || undefined,
    },
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 120000, 64, "sha512")
    .toString("hex");

  return {
    passwordHash: hash,
    passwordSalt: salt,
  };
}

function verifyPassword(password, passwordHash, passwordSalt) {
  if (!password || !passwordHash || !passwordSalt) {
    return false;
  }

  const candidateHash = crypto
    .pbkdf2Sync(password, passwordSalt, 120000, 64, "sha512")
    .toString("hex");

  if (candidateHash.length !== passwordHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, "hex"),
    Buffer.from(passwordHash, "hex"),
  );
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET;
}

function createSignedSession(userId) {
  const id = String(userId || "");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(id)
    .digest("hex");

  return `${id}.${signature}`;
}

function verifySignedSession(token) {
  if (typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [userId, signature] = token.split(".");

  if (!userId || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("hex");

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    )
  ) {
    return null;
  }

  return userId;
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separatorIndex = item.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = item.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(item.slice(separatorIndex + 1));
      cookies[key] = value;
      return cookies;
    }, {});
}

function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  parts.push(`Path=${options.path || "/"}`);
  parts.push(`SameSite=${options.sameSite || "Lax"}`);

  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  return parts.join("; ");
}

function getUserInitials(name) {
  const parts = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "FP";
  }

  return parts.map((part) => part[0].toUpperCase()).join("");
}

module.exports = {
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
};

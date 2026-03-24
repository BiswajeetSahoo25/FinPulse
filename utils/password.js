const crypto = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

async function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);

  return `${HASH_PREFIX}$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
}

async function verifyPassword(password, storedPassword) {
  if (!storedPassword || typeof storedPassword !== "string") {
    return {
      isValid: false,
      needsRehash: false,
    };
  }

  if (!storedPassword.startsWith(`${HASH_PREFIX}$`)) {
    const isValid = password === storedPassword;

    return {
      isValid,
      needsRehash: isValid,
    };
  }

  const [, salt, storedHash] = storedPassword.split("$");

  if (!salt || !storedHash) {
    return {
      isValid: false,
      needsRehash: false,
    };
  }

  const storedBuffer = Buffer.from(storedHash, "hex");
  const derivedKey = await scryptAsync(password, salt, storedBuffer.length);
  const derivedBuffer = Buffer.from(derivedKey);

  if (storedBuffer.length !== derivedBuffer.length) {
    return {
      isValid: false,
      needsRehash: false,
    };
  }

  return {
    isValid: crypto.timingSafeEqual(storedBuffer, derivedBuffer),
    needsRehash: false,
  };
}

module.exports = {
  createPasswordHash,
  verifyPassword,
};

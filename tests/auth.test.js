const assert = require("node:assert/strict");

const {
  VALID_CURRENCIES,
  createSignedSession,
  hashPassword,
  normalizeUserInput,
  verifyPassword,
  verifySignedSession,
} = require("../utils/auth");

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

run("normalizeUserInput validates and sanitizes profile data", () => {
  const { errors, value } = normalizeUserInput({
    name: "  Demo User  ",
    email: "  TEST@Example.com ",
    password: "secret12",
    profession: "  Shop owner ",
    businessName: "  FinPulse Store ",
    currency: "inr",
  });

  assert.deepEqual(errors, []);
  assert.equal(value.name, "Demo User");
  assert.equal(value.email, "test@example.com");
  assert.equal(value.profession, "Shop owner");
  assert.equal(value.businessName, "FinPulse Store");
  assert.equal(value.currency, "INR");
});

run("normalizeUserInput rejects weak password and bad currency", () => {
  const { errors } = normalizeUserInput({
    name: "Demo",
    email: "demo@example.com",
    password: "123",
    businessName: "FinPulse",
    currency: "btc",
  });

  assert.deepEqual(errors, [
    `Currency must be one of: ${VALID_CURRENCIES.join(", ")}.`,
    "Password must be at least 6 characters long.",
  ]);
});

run("hashPassword and verifyPassword work together", () => {
  const { passwordHash, passwordSalt } = hashPassword("secret123");

  assert.ok(passwordHash);
  assert.ok(passwordSalt);
  assert.equal(verifyPassword("secret123", passwordHash, passwordSalt), true);
  assert.equal(verifyPassword("wrong-pass", passwordHash, passwordSalt), false);
});

run("signed session tokens verify and reject tampering", () => {
  const token = createSignedSession("user-123");

  assert.equal(verifySignedSession(token), "user-123");
  assert.equal(verifySignedSession(`${token}oops`), null);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

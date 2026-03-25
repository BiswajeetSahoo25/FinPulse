const assert = require("node:assert/strict");

const {
  DEMO_USER_PASSWORD,
  DEMO_USER_PROFILE,
  buildDemoTransactions,
} = require("../services/demoSeed");

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

run("demo showcase profile matches the seeded Biswajeet Sahoo account", () => {
  assert.equal(DEMO_USER_PROFILE.name, "Biswajeet Sahoo");
  assert.equal(DEMO_USER_PROFILE.businessName, "Sahoo Smart Supplies");
  assert.equal(DEMO_USER_PROFILE.currency, "INR");
  assert.equal(DEMO_USER_PASSWORD, "Biswajeet123");
});

run("demo showcase transactions cover Jan 2025 through Feb 2026", () => {
  const transactions = buildDemoTransactions("demo-user-id");
  const monthKeys = Array.from(
    new Set(transactions.map((transaction) => transaction.date.toISOString().slice(0, 7))),
  ).sort();

  assert.equal(transactions.length, 98);
  assert.deepEqual(monthKeys, [
    "2025-01",
    "2025-02",
    "2025-03",
    "2025-04",
    "2025-05",
    "2025-06",
    "2025-07",
    "2025-08",
    "2025-09",
    "2025-10",
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-02",
  ]);
});

run("demo showcase data includes both strong profit months and loss months", () => {
  const transactions = buildDemoTransactions("demo-user-id");
  const monthlyNet = transactions.reduce((summary, transaction) => {
    const monthKey = transaction.date.toISOString().slice(0, 7);
    const sign = transaction.type === "income" ? 1 : -1;

    summary[monthKey] = (summary[monthKey] || 0) + sign * transaction.amount;
    return summary;
  }, {});

  assert.ok(monthlyNet["2025-10"] > 100000);
  assert.ok(monthlyNet["2025-07"] > 100000);
  assert.ok(monthlyNet["2025-04"] < 0);
  assert.ok(monthlyNet["2025-08"] < 0);
  assert.ok(monthlyNet["2026-01"] < 0);
  assert.ok(monthlyNet["2026-02"] > 50000);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

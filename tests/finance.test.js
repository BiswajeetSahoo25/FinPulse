const assert = require("node:assert/strict");

const {
  buildBusinessSnapshot,
  buildFinanceInsights,
  buildFinanceOverview,
  normalizeTransactionInput,
  serializeForInlineScript,
} = require("../utils/finance");

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

run("normalizeTransactionInput trims values and coerces amount", () => {
  const { errors, value } = normalizeTransactionInput({
    type: " Income ",
    amount: "1450.50",
    category: " Sales ",
    method: " UPI ",
    source: " Counter ",
    note: " Paid in full ",
  });

  assert.deepEqual(errors, []);
  assert.equal(value.type, "income");
  assert.equal(value.amount, 1450.5);
  assert.equal(value.category, "Sales");
  assert.equal(value.method, "upi");
  assert.equal(value.source, "Counter");
  assert.equal(value.note, "Paid in full");
});

run("normalizeTransactionInput rejects invalid transaction payloads", () => {
  const { errors } = normalizeTransactionInput({
    type: "refund",
    amount: "-5",
    method: "cheque",
  });

  assert.deepEqual(errors, [
    "Type must be either income or expense.",
    "Amount must be a valid number greater than 0.",
    "Method must be cash, upi, bank, or card.",
  ]);
});

run("buildFinanceOverview aggregates totals, months, and categories", () => {
  const overview = buildFinanceOverview([
    {
      type: "income",
      amount: 1000,
      category: "Sales",
      date: "2026-03-01T00:00:00.000Z",
    },
    {
      type: "expense",
      amount: 250,
      category: "Supplies",
      date: "2026-03-02T00:00:00.000Z",
    },
    {
      type: "expense",
      amount: 100,
      category: "",
      date: "2026-02-02T00:00:00.000Z",
    },
  ]);

  assert.deepEqual(overview.summary, {
    totalIncome: 1000,
    totalExpense: 350,
    profit: 650,
  });
  assert.deepEqual(overview.monthly, {
    "2026-03": {
      income: 1000,
      expense: 250,
    },
    "2026-02": {
      income: 0,
      expense: 100,
    },
  });
  assert.deepEqual(overview.categoryBreakdown, {
    Supplies: 250,
    Other: 100,
  });
});

run("buildFinanceInsights derives strongest month and concentration", () => {
  const insights = buildFinanceInsights({
    summary: { totalIncome: 1000, totalExpense: 350, profit: 650 },
    monthly: {
      "2026-03": { income: 1000, expense: 250 },
      "2026-02": { income: 0, expense: 100 },
    },
    categoryBreakdown: { Supplies: 250, Other: 100 },
  });

  assert.equal(insights.trackedMonths, 2);
  assert.equal(insights.strongestMonth.key, "2026-03");
  assert.equal(insights.weakestMonth.key, "2026-02");
  assert.equal(insights.averageMonthlyNet, 325);
  assert.equal(Number(insights.savingsRate.toFixed(1)), 65);
  assert.equal(insights.topExpenseCategory.name, "Supplies");
  assert.equal(Number(insights.topExpenseCategory.share.toFixed(1)), 71.4);
});

run("buildBusinessSnapshot summarizes the important context for the assistant", () => {
  const overview = buildFinanceOverview([
    {
      type: "income",
      amount: 1000,
      category: "Sales",
      method: "upi",
      date: "2026-03-01T00:00:00.000Z",
    },
    {
      type: "expense",
      amount: 250,
      category: "Supplies",
      method: "card",
      date: "2026-03-02T00:00:00.000Z",
    },
  ]);

  const snapshot = buildBusinessSnapshot({
    ...overview,
    insights: buildFinanceInsights(overview),
  });

  assert.match(snapshot, /Total income: INR 1000.00/);
  assert.match(snapshot, /Strongest month: 2026-03 with net INR 750.00/);
  assert.match(snapshot, /Largest expense category: Supplies at 100.0% of total expense/);
  assert.match(snapshot, /2026-03: income INR 1000.00, expense INR 250.00, net INR 750.00/);
  assert.match(snapshot, /Supplies: INR 250.00/);
  assert.match(snapshot, /2026-03-02: expense \| Supplies \| INR 250.00 \| card/);
});

run("serializeForInlineScript escapes script-breaking characters", () => {
  const serialized = serializeForInlineScript({
    category: "</script><script>alert('xss')</script>",
  });

  assert.ok(serialized.includes("\\u003c/script\\u003e"));
  assert.ok(!serialized.includes("</script>"));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

const VALID_TRANSACTION_TYPES = ["income", "expense"];
const VALID_PAYMENT_METHODS = ["cash", "upi", "bank", "card"];

function sanitizeOptionalText(value, maxLength = 120) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function normalizeTransactionInput(input = {}) {
  const errors = [];

  const type =
    typeof input.type === "string" ? input.type.trim().toLowerCase() : "";
  const method =
    typeof input.method === "string" ? input.method.trim().toLowerCase() : "";
  const amount = Number(
    typeof input.amount === "string" ? input.amount.trim() : input.amount,
  );

  if (!VALID_TRANSACTION_TYPES.includes(type)) {
    errors.push("Type must be either income or expense.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Amount must be a valid number greater than 0.");
  }

  if (method && !VALID_PAYMENT_METHODS.includes(method)) {
    errors.push("Method must be cash, upi, bank, or card.");
  }

  return {
    errors,
    value: {
      type,
      amount,
      category: sanitizeOptionalText(input.category, 60),
      method: method || undefined,
      source: sanitizeOptionalText(input.source, 80),
      note: sanitizeOptionalText(input.note, 300),
    },
  };
}

function buildFinanceOverview(transactions = []) {
  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    profit: 0,
  };

  const monthly = {};
  const categoryBreakdown = {};
  const normalizedTransactions = transactions.map((transaction) => {
    const date = transaction.date ? new Date(transaction.date) : null;
    const amount = Number(transaction.amount) || 0;

    return {
      ...transaction,
      amount,
      date,
    };
  });

  normalizedTransactions.forEach((transaction) => {
    const amount = transaction.amount;
    const isIncome = transaction.type === "income";

    if (isIncome) {
      summary.totalIncome += amount;
    } else {
      summary.totalExpense += amount;
    }

    if (transaction.date && !Number.isNaN(transaction.date.getTime())) {
      const month = String(transaction.date.getMonth() + 1).padStart(2, "0");
      const monthKey = `${transaction.date.getFullYear()}-${month}`;

      if (!monthly[monthKey]) {
        monthly[monthKey] = { income: 0, expense: 0 };
      }

      if (isIncome) {
        monthly[monthKey].income += amount;
      } else {
        monthly[monthKey].expense += amount;
      }
    }

    if (!isIncome) {
      const category = transaction.category || "Other";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + amount;
    }
  });

  summary.profit = summary.totalIncome - summary.totalExpense;

  return {
    summary,
    monthly,
    categoryBreakdown,
    transactions: normalizedTransactions,
  };
}

function formatCurrencyValue(amount) {
  return Number(amount || 0).toFixed(2);
}

function buildFinanceInsights({ summary, monthly, categoryBreakdown }) {
  const monthEntries = Object.entries(monthly || {}).map(([key, entry]) => ({
    key,
    income: Number(entry.income) || 0,
    expense: Number(entry.expense) || 0,
    net: (Number(entry.income) || 0) - (Number(entry.expense) || 0),
  }));
  const sortedCategories = Object.entries(categoryBreakdown || {}).sort(
    (first, second) => second[1] - first[1],
  );
  const strongestMonth = monthEntries.reduce((best, current) => {
    if (!best || current.net > best.net) {
      return current;
    }

    return best;
  }, null);
  const weakestMonth = monthEntries.reduce((worst, current) => {
    if (!worst || current.net < worst.net) {
      return current;
    }

    return worst;
  }, null);
  const topExpenseCategory = sortedCategories[0]
    ? {
        name: sortedCategories[0][0],
        amount: sortedCategories[0][1],
        share:
          summary && summary.totalExpense > 0
            ? (sortedCategories[0][1] / summary.totalExpense) * 100
            : 0,
      }
    : null;

  return {
    trackedMonths: monthEntries.length,
    averageMonthlyNet:
      monthEntries.length > 0
        ? monthEntries.reduce((total, entry) => total + entry.net, 0) /
          monthEntries.length
        : 0,
    savingsRate:
      summary && summary.totalIncome > 0
        ? (summary.profit / summary.totalIncome) * 100
        : 0,
    strongestMonth,
    weakestMonth,
    topExpenseCategory,
  };
}

function buildBusinessSnapshot({ summary, monthly, categoryBreakdown, transactions }) {
  const monthKeys = Object.keys(monthly || {}).sort().reverse();
  const categoryEntries = Object.entries(categoryBreakdown || {})
    .sort((first, second) => second[1] - first[1])
    .slice(0, 5);
  const recentTransactions = (transactions || []).slice(0, 5);
  const insights = buildFinanceInsights({ summary, monthly, categoryBreakdown });

  const monthLines =
    monthKeys.length > 0
      ? monthKeys.slice(0, 4).map((key) => {
          const entry = monthly[key];
          const net = entry.income - entry.expense;
          return `${key}: income INR ${formatCurrencyValue(entry.income)}, expense INR ${formatCurrencyValue(entry.expense)}, net INR ${formatCurrencyValue(net)}`;
        })
      : ["No monthly history recorded yet."];

  const categoryLines =
    categoryEntries.length > 0
      ? categoryEntries.map(([name, amount]) => `${name}: INR ${formatCurrencyValue(amount)}`)
      : ["No expense categories recorded yet."];

  const recentLines =
    recentTransactions.length > 0
      ? recentTransactions.map((transaction) => {
          const dateLabel =
            transaction.date && !Number.isNaN(transaction.date.getTime())
              ? transaction.date.toISOString().slice(0, 10)
              : "unknown-date";

          return `${dateLabel}: ${transaction.type} | ${transaction.category || "General"} | INR ${formatCurrencyValue(transaction.amount)} | ${transaction.method || "no method"}`;
        })
      : ["No recent transactions recorded yet."];

  const insightLines = [
    insights.strongestMonth
      ? `Strongest month: ${insights.strongestMonth.key} with net INR ${formatCurrencyValue(insights.strongestMonth.net)}`
      : "Strongest month: not enough data yet.",
    insights.weakestMonth
      ? `Weakest month: ${insights.weakestMonth.key} with net INR ${formatCurrencyValue(insights.weakestMonth.net)}`
      : "Weakest month: not enough data yet.",
    insights.topExpenseCategory
      ? `Largest expense category: ${insights.topExpenseCategory.name} at ${insights.topExpenseCategory.share.toFixed(1)}% of total expense`
      : "Largest expense category: not enough data yet.",
  ];

  return [
    `Total income: INR ${formatCurrencyValue(summary?.totalIncome)}`,
    `Total expense: INR ${formatCurrencyValue(summary?.totalExpense)}`,
    `Net profit: INR ${formatCurrencyValue(summary?.profit)}`,
    `Tracked transactions: ${(transactions || []).length}`,
    `Savings rate: ${Number(insights.savingsRate || 0).toFixed(1)}%`,
    "High-level insights:",
    ...insightLines,
    "Recent monthly performance:",
    ...monthLines,
    "Top expense categories:",
    ...categoryLines,
    "Most recent transactions:",
    ...recentLines,
  ].join("\n");
}

function serializeForInlineScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

module.exports = {
  VALID_PAYMENT_METHODS,
  VALID_TRANSACTION_TYPES,
  buildBusinessSnapshot,
  buildFinanceInsights,
  buildFinanceOverview,
  normalizeTransactionInput,
  serializeForInlineScript,
};

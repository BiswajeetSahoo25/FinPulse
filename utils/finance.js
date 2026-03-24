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
  buildFinanceOverview,
  normalizeTransactionInput,
  serializeForInlineScript,
};

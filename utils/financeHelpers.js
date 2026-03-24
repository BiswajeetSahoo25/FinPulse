function roundCurrency(value) {
  return Number((value || 0).toFixed(2));
}

function getMonthKey(dateValue) {
  const date = new Date(dateValue);
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${date.getFullYear()}-${month}`;
}

function calculateSummary(transactions = []) {
  const totals = transactions.reduce(
    (summary, transaction) => {
      if (transaction.type === "income") {
        summary.totalIncome += transaction.amount;
      }

      if (transaction.type === "expense") {
        summary.totalExpense += transaction.amount;
      }

      return summary;
    },
    {
      totalIncome: 0,
      totalExpense: 0,
    }
  );

  return {
    totalIncome: roundCurrency(totals.totalIncome),
    totalExpense: roundCurrency(totals.totalExpense),
    profit: roundCurrency(totals.totalIncome - totals.totalExpense),
  };
}

function calculateAnalytics(transactions = []) {
  const monthly = {};
  const categoryBreakdown = {};

  transactions.forEach((transaction) => {
    const monthKey = getMonthKey(transaction.date);

    if (!monthly[monthKey]) {
      monthly[monthKey] = {
        income: 0,
        expense: 0,
      };
    }

    if (transaction.type === "income") {
      monthly[monthKey].income += transaction.amount;
    }

    if (transaction.type === "expense") {
      monthly[monthKey].expense += transaction.amount;
      categoryBreakdown[transaction.category] =
        (categoryBreakdown[transaction.category] || 0) + transaction.amount;
    }
  });

  if (Object.keys(monthly).length === 0) {
    const currentMonth = getMonthKey(new Date());
    monthly[currentMonth] = { income: 0, expense: 0 };
  }

  const sortedMonthly = Object.keys(monthly)
    .sort()
    .reduce((result, monthKey) => {
      result[monthKey] = {
        income: roundCurrency(monthly[monthKey].income),
        expense: roundCurrency(monthly[monthKey].expense),
      };

      return result;
    }, {});

  const sortedCategoryBreakdown = Object.keys(categoryBreakdown)
    .sort()
    .reduce((result, category) => {
      result[category] = roundCurrency(categoryBreakdown[category]);
      return result;
    }, {});

  return {
    monthly: sortedMonthly,
    categoryBreakdown: sortedCategoryBreakdown,
  };
}

module.exports = {
  calculateSummary,
  calculateAnalytics,
};

function roundCurrency(value) {
  return Number((value || 0).toFixed(2));
}

function getMonthKey(dateValue) {
  const date = new Date(dateValue);
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${date.getFullYear()}-${month}`;
}

function getLastTwelveMonthKeys(referenceDate = new Date()) {
  const monthKeys = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - offset,
      1
    );

    monthKeys.push(getMonthKey(date));
  }

  return monthKeys;
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
  const monthly = getLastTwelveMonthKeys().reduce((result, monthKey) => {
    result[monthKey] = {
      income: 0,
      expense: 0,
    };

    return result;
  }, {});
  const categoryBreakdown = {};

  transactions.forEach((transaction) => {
    const monthKey = getMonthKey(transaction.date);

    if (transaction.type === "income" && monthly[monthKey]) {
      monthly[monthKey].income += transaction.amount;
    }

    if (transaction.type === "expense") {
      if (monthly[monthKey]) {
        monthly[monthKey].expense += transaction.amount;
      }

      categoryBreakdown[transaction.category] =
        (categoryBreakdown[transaction.category] || 0) + transaction.amount;
    }
  });

  const sortedMonthly = Object.keys(monthly).reduce((result, monthKey) => {
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

const Transaction = require("../models/Transaction");
const { calculateAnalytics, calculateSummary } = require("../utils/financeHelpers");

async function getTransactionsByUser(userId) {
  return Transaction.find({ userId }).sort({ date: -1, createdAt: -1 }).lean();
}

async function getDashboardSnapshot(userId) {
  const transactions = await getTransactionsByUser(userId);

  return {
    transactions,
    summary: calculateSummary(transactions),
    analytics: calculateAnalytics(transactions),
  };
}

module.exports = {
  getTransactionsByUser,
  getDashboardSnapshot,
};

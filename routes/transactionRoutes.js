const express = require("express");
const Transaction = require("../models/Transaction");
const { requireAuth, wantsJson } = require("../middleware/auth");
const { calculateAnalytics, calculateSummary } = require("../utils/financeHelpers");
const { getTransactionsByUser } = require("../services/financeService");

const router = express.Router();

router.post("/transactions", requireAuth, async (req, res, next) => {
  try {
    const { type, amount, category, method, source, note, date } = req.body;
    const parsedAmount = Number(amount);

    if (!type || !category || !method || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      const message =
        "Please enter a valid type, amount, category, and payment method.";

      if (wantsJson(req)) {
        return res.status(400).json({ message });
      }

      return res.redirect("/dashboard?message=Please+check+the+transaction+details.");
    }

    const transaction = await Transaction.create({
      userId: req.currentUser._id,
      type,
      amount: parsedAmount,
      category: category.trim(),
      method,
      source: source ? source.trim() : "",
      note: note ? note.trim() : "",
      date: date ? new Date(date) : undefined,
    });

    if (wantsJson(req)) {
      return res.status(201).json(transaction);
    }

    return res.redirect("/dashboard?message=Transaction+added+successfully.");
  } catch (error) {
    next(error);
  }
});

router.get("/transactions", requireAuth, async (req, res, next) => {
  try {
    const transactions = await getTransactionsByUser(req.currentUser._id);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

router.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const transactions = await getTransactionsByUser(req.currentUser._id);
    res.json(calculateSummary(transactions));
  } catch (error) {
    next(error);
  }
});

router.get("/analytics", requireAuth, async (req, res, next) => {
  try {
    const transactions = await getTransactionsByUser(req.currentUser._id);
    res.json(calculateAnalytics(transactions));
  } catch (error) {
    next(error);
  }
});

module.exports = router;

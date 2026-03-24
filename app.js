const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("./models/Transaction.js");
// const bodyParser = require("body-parser");
const expressLayouts = require("express-ejs-layouts");
require("dotenv").config();

const app = express();


// Middleware
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(expressLayouts);

// DB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Routes
app.get("/", (req, res) => {
  res.send("FinPulse is running ");
});

// TRANSACTION
//Create
app.post("/transactions", async (req, res) => {
  try {
    const { type, amount, category, method, source, note } = req.body;

    //  Basic validation
    if (!type || !amount) {
      return res.status(400).json({
        error: "Type and amount are required",
      });
    }

    // Create transaction
    const newTransaction = new Transaction({
      userId: "demoUser", // temporary (we’ll improve later)
      type,
      amount,
      category,
      method,
      source,
      note,
    });

    await newTransaction.save();

    res.status(201).json({
      message: "Transaction saved successfully",
      data: newTransaction,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

//Get
app.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find();

    res.json({
      count: transactions.length,
      data: transactions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//SUMMARY
app.get("/summary", async (req, res) => {
  try {
    const transactions = await Transaction.find();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      if (t.type === "income") {
        totalIncome += t.amount;
      } else if (t.type === "expense") {
        totalExpense += t.amount;
      }
    });

    const profit = totalIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      profit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//ANALYTICS
app.get("/analytics", async (req, res) => {
  try {
    const transactions = await Transaction.find();

    const monthly = {};
    const categoryBreakdown = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);

      // Proper month formatting (YYYY-MM)
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const monthKey = `${date.getFullYear()}-${month}`;

      // Monthly grouping
      if (!monthly[monthKey]) {
        monthly[monthKey] = { income: 0, expense: 0 };
      }

      if (t.type === "income") {
        monthly[monthKey].income += t.amount;
      } else {
        monthly[monthKey].expense += t.amount;
      }

      // Category breakdown (expenses only)
      if (t.type === "expense") {
        const cat = t.category || "other";
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + t.amount;
      }
    });

    res.json({
      monthly,
      categoryBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DASHBOARD
app.get("/dashboard", async (req, res) => {
  try {
    const transactions = await Transaction.find();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      if (t.type === "income") totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    const summary = {
      totalIncome,
      totalExpense,
      profit: totalIncome - totalExpense,
    };

    res.render("dashboard", { summary });

  } catch (err) {
    res.send(err.message);
  }
});

// const transactionRoutes = require("./routes/transactionRoutes");

// app.use("/transactions", transactionRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

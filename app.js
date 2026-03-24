const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("./models/Transaction.js");
// const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

// Middleware
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
// app.set("view engine", "ejs");
// app.use(express.static("public"));

// DB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Routes
app.get("/", (req, res) => {
  res.send("FinPulse is running 🚀");
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
      4;
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
      message: "Transaction saved successfully ✅",
      data: newTransaction,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

//Get
app.get("/transactions", (req, res) => {
  res.send("hello");
});

// const transactionRoutes = require("./routes/transactionRoutes");

// app.use("/transactions", transactionRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

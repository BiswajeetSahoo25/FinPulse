const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // later can be ObjectId
    },

    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    category: {
      type: String, // food, rent, sales
    },

    method: {
      type: String, // upi, cash, bank
    },

    source: {
      type: String, // customer UPI id or "offline"
    },

    note: {
      type: String, // free text (customer, product, etc.)
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Transaction", transactionSchema);

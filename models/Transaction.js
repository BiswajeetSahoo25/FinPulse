const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 60,
    },

    method: {
      type: String,
      trim: true,
      enum: ["cash", "upi", "bank", "card", null],
    },

    source: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Transaction", transactionSchema);

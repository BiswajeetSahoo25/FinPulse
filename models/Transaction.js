// const mongoose = require("mongoose");

// const transactionSchema = new mongoose.Schema({
//   userId: String,

//   type: {
//     type: String,
//     enum: ["income", "expense"],
//     required: true
//   },

//   amount: Number,
//   category: String,
//   method: String,   // upi, cash

//   source: String,   // upi id or "offline"
//   note: String,

//   date: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model("Transaction", transactionSchema);
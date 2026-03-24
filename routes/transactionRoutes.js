// const express = require("express");
// const router = express.Router();
// const Transaction = require("../models/Transaction");

// // Add transaction
// router.post("/add", async (req, res) => {
//   try {
//     const data = req.body;
//     const transaction = new Transaction(data);
//     await transaction.save();

//     res.send("Transaction added ✅");
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });

// // Get all transactions
// router.get("/", async (req, res) => {
//   const data = await Transaction.find();
//   res.json(data);
// });

// module.exports = router;
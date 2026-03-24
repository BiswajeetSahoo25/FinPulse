const express = require("express");
const mongoose = require("mongoose");
// const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

// Middleware
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
// app.set("view engine", "ejs");
// app.use(express.static("public"));

// DB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Routes
app.get("/", (req, res) => {
  res.send("FinPulse is running 🚀");
});

// TRANSACTION
//Create
app.post("/transactions", (req, res) => {
  const data = req.body;

  console.log(data);
  res.json({
    message: "Transaction created",
    data: data,
  });
});

//Get
app.get("/transactions", (req, res) => {
  res.send("hello");
});

// const transactionRoutes = require("./routes/transactionRoutes");

// app.use("/transactions", transactionRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

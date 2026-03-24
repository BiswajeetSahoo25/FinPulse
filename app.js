const express = require("express");
// const mongoose = require("mongoose");
// const bodyParser = require("body-parser");
// require("dotenv").config();

const app = express();

// Middleware
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
// app.set("view engine", "ejs");
// app.use(express.static("public"));

// DB connection
// mongoose.connect(process.env.MONGO_URI)
// .then(() => console.log("MongoDB Connected"))
// .catch(err => console.log(err));

// Routes
app.get("/", (req, res) => {
  res.send("FinPulse is running 🚀");
});

// const transactionRoutes = require("./routes/transactionRoutes");

// app.use("/transactions", transactionRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
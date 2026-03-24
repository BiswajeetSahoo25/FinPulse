require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { attachCurrentUser, wantsJson } = require("./middleware/auth");

const app = express();
const PORT = 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/finpulse";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/boilerplate");

app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(attachCurrentUser);

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.locals.formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

app.locals.formatDateInput = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

app.use(authRoutes);
app.use(transactionRoutes);
app.use(dashboardRoutes);

app.use((req, res) => {
  if (wantsJson(req)) {
    return res.status(404).json({ message: "Route not found." });
  }

  if (req.currentUser) {
    return res.redirect("/dashboard");
  }

  return res.redirect("/login");
});

app.use((error, req, res, next) => {
  console.error(error);

  if (wantsJson(req)) {
    return res.status(500).json({ message: "Something went wrong." });
  }

  return res
    .status(500)
    .send("Something went wrong. Please restart the app and try again.");
});

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`FinPulse is live on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start FinPulse:", error.message);
    process.exit(1);
  }
}

startServer();

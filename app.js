require("dotenv").config();

const express = require("express");

const app = express();
const PORT = 4000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("FinPulse scaffold is ready.");
});

app.listen(PORT, () => {
  console.log(`FinPulse is live on http://localhost:${PORT}`);
});

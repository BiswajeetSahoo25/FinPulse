# FinPulse 💸

FinPulse is a simple and intuitive fintech dashboard built as a hackathon MVP to help small business owners track their income, expenses, and overall financial health.

The goal of this project is to make financial insights easy to understand without requiring complex tools or accounting knowledge.

---

## 🚀 Features

* 📊 Dashboard with total income, expenses, and profit
* 📈 Monthly analytics (income vs expense trends)
* 🧾 Transaction tracking (income & expense entries)
* 👤 Basic user system (name, business name, login)
* 📉 Clean and minimal UI designed for clarity

---

## 🛠 Tech Stack

* **Backend:** Node.js, Express
* **Database:** MongoDB (Mongoose)
* **Frontend:** EJS, CSS

---

## 📂 Project Structure

models/ → Database schemas (User, Transaction)
views/ → EJS templates (dashboard, layout, etc.)
public/ → Static files (CSS)
app.js → Main server file

---

## 🧪 Running Locally

1. Clone the repository

   ```bash
   git clone https://github.com/BiswajeetSahoo25/FinPulse.git
   cd FinPulse
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Make sure MongoDB is running locally

   ```
   mongodb://127.0.0.1:27017/finpulse
   ```

4. Create a `.env` file and add:

   ```
   PORT=4000
   MONGO_URI=mongodb://127.0.0.1:27017/finpulse
   ```

5. Start the server

   ```bash
   node app.js
   ```

6. Open in browser

   ```
   http://localhost:4000
   ```

---

## 🎯 Motivation

Small business owners often don’t have access to structured financial tools. FinPulse aims to provide a lightweight and easy-to-use solution that gives clear insights into business performance.

---

## ⚡ Future Improvements

* Authentication using JWT
* Better UI/UX (animations, responsiveness)
* Export reports (PDF/CSV)
* Multi-user support

---

## 🙌 Acknowledgements

Built as part of a hackathon project to explore full-stack development and real-world problem solving.

---

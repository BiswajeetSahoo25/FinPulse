const express = require("express");
const { requireAuth, wantsJson } = require("../middleware/auth");
const { getDashboardSnapshot } = require("../services/financeService");

const router = express.Router();

router.get("/", (req, res) => {
  if (req.currentUser) {
    return res.redirect("/dashboard");
  }

  return res.redirect("/login");
});

router.get("/dashboard", requireAuth, async (req, res, next) => {
  try {
    const dashboardData = await getDashboardSnapshot(req.currentUser._id);

    if (wantsJson(req)) {
      return res.json({
        user: req.currentUser,
        ...dashboardData,
      });
    }

    return res.render("dashboard", {
      pageTitle: "Dashboard",
      message: req.query.message || "",
      user: req.currentUser,
      summary: dashboardData.summary,
      analytics: dashboardData.analytics,
      transactions: dashboardData.transactions,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

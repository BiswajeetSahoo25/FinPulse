const Transaction = require("../models/Transaction");
const User = require("../models/users");
const { hashPassword } = require("../utils/auth");

const DEMO_NOTE_PREFIX = "FinPulse demo showcase";
const DEMO_USER_EMAIL = "biswajeet.sahoo@finpulse.demo";
const DEMO_USER_PASSWORD = "Biswajeet123";
const DEMO_USER_PROFILE = Object.freeze({
  name: "Biswajeet Sahoo",
  email: DEMO_USER_EMAIL,
  profession: "Founder and operations lead",
  businessName: "Sahoo Smart Supplies",
  currency: "INR",
  profileImage: buildProfileImageDataUrl("Biswajeet Sahoo"),
});

const INCOME_BLUEPRINTS = [
  {
    key: "retailSales",
    category: "Retail Sales",
    source: "Storefront collections",
    method: "upi",
    day: 6,
    note: "Walk-in sales closed across the main counter.",
  },
  {
    key: "onlineOrders",
    category: "Online Orders",
    source: "Marketplace payout",
    method: "bank",
    day: 14,
    note: "Online channel settlements arrived from marketplace partners.",
  },
  {
    key: "corporateOrders",
    category: "Corporate Orders",
    source: "Bulk client invoice",
    method: "bank",
    day: 23,
    note: "Bulk business orders were settled by repeat clients.",
  },
];

const CORE_EXPENSE_BLUEPRINTS = [
  {
    key: "inventory",
    category: "Inventory",
    source: "Supplier restock",
    method: "bank",
    day: 3,
    note: "Fast-moving inventory was replenished for the month.",
  },
  {
    key: "payroll",
    category: "Payroll",
    source: "Monthly payroll",
    method: "bank",
    day: 26,
    note: "Team salaries and incentives were paid out.",
  },
  {
    key: "rentAndUtilities",
    category: "Rent & Utilities",
    source: "Store lease and utilities",
    method: "upi",
    day: 28,
    note: "Rent, electricity, and internet were cleared.",
  },
];

const DEMO_MONTH_PLANS = [
  {
    month: "2025-01",
    story: "January opened with steady counter traffic and office resupply demand.",
    retailSales: 118000,
    onlineOrders: 32000,
    corporateOrders: 26000,
    inventory: 87000,
    payroll: 24000,
    rentAndUtilities: 14000,
    focusExpense: {
      category: "Marketing",
      amount: 9000,
      source: "Neighborhood awareness campaign",
      method: "card",
      day: 18,
      note: "A local awareness push supported the new-year sales cycle.",
    },
  },
  {
    month: "2025-02",
    story: "February stayed positive but conversion slowed after the new-year rush.",
    retailSales: 112000,
    onlineOrders: 30000,
    corporateOrders: 26000,
    inventory: 92000,
    payroll: 24000,
    rentAndUtilities: 14000,
    focusExpense: {
      category: "Logistics",
      amount: 13000,
      source: "Regional delivery support",
      method: "bank",
      day: 17,
      note: "Shipping and order-fulfillment costs rose during regional deliveries.",
    },
  },
  {
    month: "2025-03",
    story: "March closed strong on repeat clients and a healthy online pipeline.",
    retailSales: 145000,
    onlineOrders: 38000,
    corporateOrders: 42000,
    inventory: 101000,
    payroll: 25000,
    rentAndUtilities: 14000,
    focusExpense: {
      category: "Software",
      amount: 16000,
      source: "Billing and inventory tools",
      method: "card",
      day: 19,
      note: "New billing tools and reporting software were rolled out.",
    },
  },
  {
    month: "2025-04",
    story: "April slipped into a small loss while brand spend rose ahead of summer.",
    retailSales: 98000,
    onlineOrders: 27000,
    corporateOrders: 33000,
    inventory: 106000,
    payroll: 25000,
    rentAndUtilities: 15000,
    focusExpense: {
      category: "Brand Launch",
      amount: 25000,
      source: "Print, social, and storefront refresh",
      method: "card",
      day: 18,
      note: "A heavier brand refresh spend compressed the month's profit.",
    },
  },
  {
    month: "2025-05",
    story: "May recovered sharply with bigger bulk orders and stronger digital sales.",
    retailSales: 164000,
    onlineOrders: 46000,
    corporateOrders: 54000,
    inventory: 112000,
    payroll: 26000,
    rentAndUtilities: 15000,
    focusExpense: {
      category: "Logistics",
      amount: 19000,
      source: "Warehouse and dispatch support",
      method: "bank",
      day: 17,
      note: "Higher dispatch volume pushed delivery and handling costs upward.",
    },
  },
  {
    month: "2025-06",
    story: "June weakened as footfall cooled and repair costs hit operations.",
    retailSales: 101000,
    onlineOrders: 29000,
    corporateOrders: 44000,
    inventory: 118000,
    payroll: 27000,
    rentAndUtilities: 15000,
    focusExpense: {
      category: "Equipment Repair",
      amount: 31000,
      source: "POS and storage maintenance",
      method: "card",
      day: 18,
      note: "Unexpected repair work on storage and billing equipment cut margin.",
    },
  },
  {
    month: "2025-07",
    story: "July became a breakout month with strong institutional buying.",
    retailSales: 177000,
    onlineOrders: 51000,
    corporateOrders: 68000,
    inventory: 118000,
    payroll: 28000,
    rentAndUtilities: 15000,
    focusExpense: {
      category: "Marketing",
      amount: 19000,
      source: "Mid-year campaign burst",
      method: "card",
      day: 18,
      note: "Campaign spend stayed controlled while institutional demand surged.",
    },
  },
  {
    month: "2025-08",
    story: "August dipped below zero after a weak sales month and facility upkeep.",
    retailSales: 97000,
    onlineOrders: 28000,
    corporateOrders: 44000,
    inventory: 124000,
    payroll: 28000,
    rentAndUtilities: 15000,
    focusExpense: {
      category: "Maintenance",
      amount: 31000,
      source: "Store and storage upkeep",
      method: "bank",
      day: 18,
      note: "Facility upkeep and maintenance work pushed the month into loss.",
    },
  },
  {
    month: "2025-09",
    story: "September normalized with healthier business orders and better stock turns.",
    retailSales: 146000,
    onlineOrders: 36000,
    corporateOrders: 56000,
    inventory: 125000,
    payroll: 29000,
    rentAndUtilities: 15000,
    focusExpense: {
      category: "Software",
      amount: 17000,
      source: "Finance and CRM subscriptions",
      method: "card",
      day: 19,
      note: "Reporting and CRM subscriptions were renewed for the next cycle.",
    },
  },
  {
    month: "2025-10",
    story: "October delivered a major festive spike and the year's strongest profit.",
    retailSales: 214000,
    onlineOrders: 58000,
    corporateOrders: 80000,
    inventory: 136000,
    payroll: 30000,
    rentAndUtilities: 16000,
    focusExpense: {
      category: "Festival Campaign",
      amount: 19000,
      source: "Seasonal promotions",
      method: "card",
      day: 18,
      note: "Festive promotions stayed efficient relative to the revenue jump.",
    },
  },
  {
    month: "2025-11",
    story: "November softened with cautious buyers and heavier returns handling.",
    retailSales: 109000,
    onlineOrders: 34000,
    corporateOrders: 44000,
    inventory: 141000,
    payroll: 30000,
    rentAndUtilities: 16000,
    focusExpense: {
      category: "Returns Handling",
      amount: 22000,
      source: "Discounts and reverse logistics",
      method: "bank",
      day: 18,
      note: "Returns and markdown handling erased what would have been a flat month.",
    },
  },
  {
    month: "2025-12",
    story: "December rebounded with holiday demand and repeat corporate gifting orders.",
    retailSales: 205000,
    onlineOrders: 61000,
    corporateOrders: 72000,
    inventory: 147000,
    payroll: 31000,
    rentAndUtilities: 16000,
    focusExpense: {
      category: "Seasonal Staffing",
      amount: 20000,
      source: "Holiday support crew",
      method: "bank",
      day: 20,
      note: "Seasonal staffing supported peak demand without breaking the margin.",
    },
  },
  {
    month: "2026-01",
    story: "January 2026 turned negative after a post-season slowdown and refresh spend.",
    retailSales: 98000,
    onlineOrders: 31000,
    corporateOrders: 63000,
    inventory: 167000,
    payroll: 32000,
    rentAndUtilities: 16000,
    focusExpense: {
      category: "Store Refresh",
      amount: 31000,
      source: "Layout reset and fixture work",
      method: "card",
      day: 18,
      note: "A storefront refresh and slower demand created the deepest loss in the set.",
    },
  },
  {
    month: "2026-02",
    story: "February 2026 snapped back with cleaner spending and renewed client orders.",
    retailSales: 162000,
    onlineOrders: 41000,
    corporateOrders: 68000,
    inventory: 126000,
    payroll: 31000,
    rentAndUtilities: 16000,
    focusExpense: {
      category: "Marketing",
      amount: 15000,
      source: "Lead generation campaign",
      method: "card",
      day: 21,
      note: "Lean marketing helped demand recover ahead of the next quarter.",
    },
  },
];

function buildProfileImageDataUrl(name) {
  const initials = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const safeLabel = String(name || "Demo user")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img">',
    `<title>${safeLabel}</title>`,
    "<defs>",
    '<linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">',
    '<stop offset="0%" stop-color="#1d4ed8" />',
    '<stop offset="100%" stop-color="#16a34a" />',
    "</linearGradient>",
    "</defs>",
    '<rect width="160" height="160" rx="36" fill="url(#avatarGradient)" />',
    '<circle cx="122" cy="38" r="18" fill="rgba(255,255,255,0.16)" />',
    '<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI, Arial, sans-serif" font-size="56" font-weight="700" fill="#ffffff">',
    initials || "BS",
    "</text>",
    "</svg>",
  ].join("");

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildUtcDate(monthKey, day) {
  const [yearValue, monthValue] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(yearValue, monthValue - 1, day, 10, 0, 0));
}

function buildDemoTransactions(userId) {
  return DEMO_MONTH_PLANS.flatMap((plan) => {
    const sharedPrefix = `${DEMO_NOTE_PREFIX}. ${plan.story}`;
    const transactions = [];

    INCOME_BLUEPRINTS.forEach((blueprint) => {
      transactions.push({
        userId,
        type: "income",
        amount: plan[blueprint.key],
        category: blueprint.category,
        method: blueprint.method,
        source: blueprint.source,
        date: buildUtcDate(plan.month, blueprint.day),
        note: `${sharedPrefix} ${blueprint.note}`,
      });
    });

    CORE_EXPENSE_BLUEPRINTS.forEach((blueprint) => {
      transactions.push({
        userId,
        type: "expense",
        amount: plan[blueprint.key],
        category: blueprint.category,
        method: blueprint.method,
        source: blueprint.source,
        date: buildUtcDate(plan.month, blueprint.day),
        note: `${sharedPrefix} ${blueprint.note}`,
      });
    });

    transactions.push({
      userId,
      type: "expense",
      amount: plan.focusExpense.amount,
      category: plan.focusExpense.category,
      method: plan.focusExpense.method,
      source: plan.focusExpense.source,
      date: buildUtcDate(plan.month, plan.focusExpense.day),
      note: `${sharedPrefix} ${plan.focusExpense.note}`,
    });

    return transactions;
  });
}

function escapeForRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function ensureDemoUserAndTransactions() {
  let user = await User.findOne({ email: DEMO_USER_EMAIL });
  let createdUser = false;

  if (!user) {
    const { passwordHash, passwordSalt } = hashPassword(DEMO_USER_PASSWORD);
    user = await User.create({
      ...DEMO_USER_PROFILE,
      passwordHash,
      passwordSalt,
    });
    createdUser = true;
  }

  const demoTransactions = buildDemoTransactions(user._id);
  const demoNotePattern = new RegExp(`^${escapeForRegex(DEMO_NOTE_PREFIX)}`);
  const existingDemoCount = await Transaction.countDocuments({
    userId: user._id,
    note: demoNotePattern,
  });

  let createdTransactions = false;

  if (existingDemoCount !== demoTransactions.length) {
    await Transaction.deleteMany({
      userId: user._id,
      note: demoNotePattern,
    });
    await Transaction.insertMany(demoTransactions);
    createdTransactions = true;
  }

  return {
    user,
    createdUser,
    createdTransactions,
    transactionCount: demoTransactions.length,
  };
}

module.exports = {
  DEMO_MONTH_PLANS,
  DEMO_NOTE_PREFIX,
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  DEMO_USER_PROFILE,
  buildDemoTransactions,
  ensureDemoUserAndTransactions,
};

require("dotenv").config();

const mongoose = require("mongoose");

const {
  DEMO_USER_PASSWORD,
  DEMO_USER_PROFILE,
  ensureDemoUserAndTransactions,
} = require("../services/demoSeed");

async function run() {
  const mongoUri = String(process.env.MONGO_URI || "").trim();

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in the environment.");
  }

  await mongoose.connect(mongoUri);

  try {
    const result = await ensureDemoUserAndTransactions();

    console.log(`Demo user ready: ${DEMO_USER_PROFILE.name}`);
    console.log(`Business: ${DEMO_USER_PROFILE.businessName}`);
    console.log(`Email: ${DEMO_USER_PROFILE.email}`);
    console.log(`Password: ${DEMO_USER_PASSWORD}`);
    console.log(`Transactions seeded: ${result.transactionCount}`);
    console.log(
      result.createdUser || result.createdTransactions
        ? "Demo data was created or refreshed."
        : "Demo data was already up to date.",
    );
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error("Failed to seed demo data:", error.message);
  process.exit(1);
});

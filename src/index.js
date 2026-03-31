require("dotenv").config();
const { createBot } = require("./bot");

// ─── Validate environment variables ─────────────────────────
const requiredEnvVars = ["TELEGRAM_BOT_TOKEN", "GROQ_API_KEY"];
const missing = requiredEnvVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error("❌ Missing required environment variables:");
  missing.forEach((v) => console.error(`   - ${v}`));
  console.error("\n📋 Steps to fix:");
  console.error("   1. Copy .env.example to .env");
  console.error("   2. Fill in your API keys");
  console.error("   3. See SETUP.md for detailed instructions");
  process.exit(1);
}

// ─── Start the bot ──────────────────────────────────────────
async function main() {
  console.log("┌─────────────────────────────────────────┐");
  console.log("│       🤖 Resume Scorer Bot v1.0         │");
  console.log("│       Powered by Google Gemini AI       │");
  console.log("└─────────────────────────────────────────┘");

  const bot = createBot();

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    bot.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Start polling
  console.log("⏳ Connecting to Telegram...");
  await bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot is running! @${botInfo.username}`);
      console.log(`🔗 Open: https://t.me/${botInfo.username}`);
      console.log("\n📋 Waiting for messages...\n");
    },
  });
}

main().catch((err) => {
  console.error("💥 Fatal error:", err.message);
  process.exit(1);
});

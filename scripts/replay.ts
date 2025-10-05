#!/usr/bin/env node
/**
 * Replay Script
 * 
 * This script allows you to run the NHL GameBot for a specific date,
 * replaying games from the past for testing or analysis purposes.
 * 
 * Usage:
 *   npm run replay 2024-03-15
 *   OR
 *   npx ts-node scripts/replay.ts 2024-03-15
 */

import { main } from "../src/index";
import { logger } from "../src/logger";

// Get the date argument from command line
const replayDate = process.argv[2];

if (!replayDate) {
  console.error("❌ Error: No date provided");
  console.error("\nUsage:");
  console.error("  npm run replay YYYY-MM-DD");
  console.error("  npx ts-node scripts/replay.ts YYYY-MM-DD");
  console.error("\nExample:");
  console.error("  npm run replay 2024-03-15");
  process.exit(1);
}

// Validate date format
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(replayDate)) {
  console.error("❌ Error: Invalid date format");
  console.error(`   Received: ${replayDate}`);
  console.error(`   Expected: YYYY-MM-DD (e.g., 2024-03-15)`);
  process.exit(1);
}

// Validate that the date is actually valid
const date = new Date(replayDate);
if (isNaN(date.getTime())) {
  console.error("❌ Error: Invalid date");
  console.error(`   The date ${replayDate} is not a valid calendar date`);
  process.exit(1);
}

// Log replay information
console.log("\n" + "=".repeat(60));
console.log("🎮 NHL GameBot - Replay Mode");
console.log("=".repeat(60));
console.log(`📅 Replay Date: ${replayDate}`);
console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
console.log("=".repeat(60) + "\n");

logger.info(`Starting NHL GameBot in replay mode for date: ${replayDate}`);

// Start the bot in replay mode
main(replayDate).catch((error) => {
  logger.error("Fatal error in replay mode:", error);
  console.error("\n❌ Fatal error occurred:");
  console.error(error);
  process.exit(1);
});

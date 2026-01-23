/**
 * Example script to test shot chart generation with a real game
 * 
 * This script generates shot charts for game 2025020743
 * and saves them in the temp folder so you can verify the output.
 * 
 * Usage:
 *   tsx scripts/testShotChart.ts
 */

import { createShotChart } from "../src/graphic/shotChart";
import path from "path";

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("Shot Chart Test Script");
  console.log("=".repeat(60) + "\n");

  const gameId = "2025020743";
  const tempDir = path.join(process.cwd(), "temp");

  try {
    // Test 1: Full game shot chart with both teams
    console.log("📊 Test 1: Creating full game shot chart (both teams)...");
    const fullChart = path.join(tempDir, `shot-chart-${gameId}-full.png`);
    await createShotChart(gameId, fullChart, {
      includeHeatmap: true,
      includeShots: true,
    });
    console.log(`✅ Success! Saved to: ${fullChart}\n`);

    // Test 2: Home team only with heatmap
    console.log("🏠 Test 2: Creating home team shot chart...");
    const homeChart = path.join(tempDir, `shot-chart-${gameId}-home.png`);
    await createShotChart(gameId, homeChart, {
      homeTeamOnly: true,
      includeHeatmap: true,
      includeShots: true,
      bandwidth: 6,
      maxOpacity: 0.8,
    });
    console.log(`✅ Success! Saved to: ${homeChart}\n`);

    // Test 3: Away team only
    console.log("✈️  Test 3: Creating away team shot chart...");
    const awayChart = path.join(tempDir, `shot-chart-${gameId}-away.png`);
    await createShotChart(gameId, awayChart, {
      awayTeamOnly: true,
      includeHeatmap: true,
      includeShots: true,
    });
    console.log(`✅ Success! Saved to: ${awayChart}\n`);

    // Test 4: Shots only (no heatmap)
    console.log("🎯 Test 4: Creating shot markers only (no heatmap)...");
    const shotsOnlyChart = path.join(tempDir, `shot-chart-${gameId}-shots-only.png`);
    await createShotChart(gameId, shotsOnlyChart, {
      includeHeatmap: false,
      includeShots: true,
    });
    console.log(`✅ Success! Saved to: ${shotsOnlyChart}\n`);

    // Test 5: Heatmap only (no individual shots)
    console.log("🔥 Test 5: Creating heatmap only (no markers)...");
    const heatmapOnlyChart = path.join(tempDir, `shot-chart-${gameId}-heatmap-only.png`);
    await createShotChart(gameId, heatmapOnlyChart, {
      includeHeatmap: true,
      includeShots: false,
      bandwidth: 8,
      maxOpacity: 0.9,
    });
    console.log(`✅ Success! Saved to: ${heatmapOnlyChart}\n`);

    // Summary
    console.log("=".repeat(60));
    console.log("✅ All tests completed successfully!");
    console.log("=".repeat(60));
    console.log("\nGenerated files:");
    console.log(`  1. ${path.basename(fullChart)} - Full game (both teams)`);
    console.log(`  2. ${path.basename(homeChart)} - Home team only`);
    console.log(`  3. ${path.basename(awayChart)} - Away team only`);
    console.log(`  4. ${path.basename(shotsOnlyChart)} - Shot markers only`);
    console.log(`  5. ${path.basename(heatmapOnlyChart)} - Heatmap only`);
    console.log(`\n📁 All files are in the 'temp' folder`);
    console.log(`\nYou can now open these PNG files to verify the shot charts!\n`);

  } catch (error) {
    console.error("\n❌ Error occurred:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    console.log("\nPossible issues:");
    console.log("  - Game ID might be invalid or not found");
    console.log("  - Network connection issues with NHL API");
    console.log("  - The game might not have shot data yet\n");
    process.exit(1);
  }
}

main();

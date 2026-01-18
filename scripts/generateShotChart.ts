/**
 * Example script to generate shot charts for NHL games
 * 
 * Usage:
 *   tsx scripts/generateShotChart.ts <gameId> [options]
 * 
 * Examples:
 *   tsx scripts/generateShotChart.ts 2023020001
 *   tsx scripts/generateShotChart.ts 2023020001 --home-only
 *   tsx scripts/generateShotChart.ts 2023020001 --away-only
 *   tsx scripts/generateShotChart.ts 2023020001 --no-heatmap
 * 
 * Output: PNG files ready for social media posting
 */

import { createAndSaveShotChart, createShotChart } from "../src/graphic/shotChart";
import { logger } from "../src/logger";
import path from "path";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
Usage: tsx scripts/generateShotChart.ts <gameId> [options]

Arguments:
  gameId          NHL game ID (e.g., 2023020001)

Options:
  --home-only     Show only home team shots
  --away-only     Show only away team shots
  --no-heatmap    Disable heatmap layer
  --no-shots      Disable individual shot markers
  --bandwidth N   Set heatmap smoothing radius (default: 5)
  --opacity N     Set max heatmap opacity (default: 0.7)
  --output PATH   Custom output path

Examples:
  tsx scripts/generateShotChart.ts 2023020001
  tsx scripts/generateShotChart.ts 2023020001 --home-only
  tsx scripts/generateShotChart.ts 2023020001 --bandwidth 8 --opacity 0.9
  tsx scripts/generateShotChart.ts 2023020001 --output ./my-chart.png
    `);
    process.exit(0);
  }

  const gameId = args[0];
  const options: any = {};
  let customOutput: string | undefined;

  // Parse command line options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--home-only":
        options.homeTeamOnly = true;
        break;
      case "--away-only":
        options.awayTeamOnly = true;
        break;
      case "--no-heatmap":
        options.includeHeatmap = false;
        break;
      case "--no-shots":
        options.includeShots = false;
        break;
      case "--bandwidth":
        options.bandwidth = parseFloat(args[++i]);
        break;
      case "--opacity":
        options.maxOpacity = parseFloat(args[++i]);
        break;
      case "--output":
        customOutput = args[++i];
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
    }
  }

  try {
    logger.info(`Generating shot chart for game ${gameId}...`);
    logger.info(`Options: ${JSON.stringify(options, null, 2)}`);

    let outputPath: string;

    if (customOutput) {
      // Use custom output path
      await createShotChart(gameId, customOutput, options);
      outputPath = customOutput;
    } else {
      // Use default temp folder
      outputPath = await createAndSaveShotChart(gameId, options);
    }

    logger.info(`✅ Shot chart successfully generated!`);
    logger.info(`📁 Location: ${outputPath}`);
    
    // Calculate absolute path for display
    const absolutePath = path.isAbsolute(outputPath) 
      ? outputPath 
      : path.resolve(process.cwd(), outputPath);
    
    console.log(`\n✅ Shot chart created successfully!`);
    console.log(`📁 File: ${absolutePath}\n`);

  } catch (error) {
    logger.error(`Failed to generate shot chart:`, error);
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

main();

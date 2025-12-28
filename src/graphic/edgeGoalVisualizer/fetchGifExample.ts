/**
 * Example script to fetch tracking data from NHL EDGE API and create a GIF
 * Run with: npx tsx src/graphic/edgeGoalVisualizer/fetchGifExample.ts
 */

import { fetchAndCreateGif } from "./fetchAndCreateGif";
import path from "path";

// Example: Fetching tracking data from NHL EDGE API
const trackingUrl = "https://wsr.nhle.com/sprites/20252026/2025020583/ev187.json";

// Output path for the GIF
const outputPath = path.join(process.cwd(), "temp/edge-goal-animation.gif");

console.log("===================================");
console.log("NHL EDGE Goal Visualization");
console.log("===================================\n");

// Create GIF from tracking data
fetchAndCreateGif({
  url: trackingUrl,
  homeTeam: "Flyers",      // Replace with actual home team
  awayTeam: "Blackhawks",  // Replace with actual away team
  period: 1,               // Replace with actual period
  outputPath,
  options: {
    highlightPlayerId: 8482176, // Player #44 (CHI) - adjust to actual goal scorer
    showNumbers: true,
      width: 960,  // Reduced from 960 for smaller file size
      height: 405, // Reduced from 405 (maintains 2400:1013 aspect ratio)
      quality: 20, // Increased from 20 for faster encoding and smaller file
      repeat: 0, // Loop forever
      frameSkip: 1, // Use all frames for smooth playback
  },
})
  .then(() => {
    console.log("\n===================================");
    console.log(`✓ Animation ready: ${outputPath}`);
    console.log("===================================");
  })
  .catch((error) => {
    console.error("\n❌ Failed to create animation");
    console.error(error);
    process.exit(1);
  });

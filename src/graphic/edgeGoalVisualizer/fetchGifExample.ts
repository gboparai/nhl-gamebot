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
    width: 960,            // Reduced for smaller file size
    height: 405,           // Reduced for smaller file size
    quality: 20,           // Maximum compression
    repeat: 0,             // Loop forever
    frameSkip: 0,          // Use every 2nd frame for smoother playback
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

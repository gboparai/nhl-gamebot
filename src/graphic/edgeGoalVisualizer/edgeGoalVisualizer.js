import path from "path";
import { fetchAndCreateGif } from "./fetchAndCreateGif";
/**
 * Generates an animated GIF visualization of a goal using NHL EDGE tracking data.
 * This is the main function to call for creating edge goal visualizations.
 *
 * @param params - Parameters including tracking URL, teams, period, and optional goal scorer
 * @returns Promise that resolves to the output file path when GIF is created
 *
 * @example
 * ```typescript
 * const gifPath = await generateEdgeGoalVisualization({
 *   trackingUrl: "https://wsr.nhle.com/sprites/20252026/2025020583/ev187.json",
 *   homeTeam: "Flyers",
 *   awayTeam: "Blackhawks",
 *   period: 1,
 *   goalScorerId: 8482176
 * });
 * ```
 */
export async function generateEdgeGoalVisualization(params) {
    const { trackingUrl, homeTeam, awayTeam, period, goalScorerId, outputPath = path.join(process.cwd(), "temp/edge-goal.gif"), } = params;
    // Use consistent settings optimized for file size and quality
    await fetchAndCreateGif({
        url: trackingUrl,
        homeTeam,
        awayTeam,
        period,
        outputPath,
        options: {
            highlightPlayerId: goalScorerId,
            showNumbers: true,
            width: 960,
            height: 405,
            quality: 30,
            repeat: 0,
            frameSkip: 1,
        },
    });
    return outputPath;
}

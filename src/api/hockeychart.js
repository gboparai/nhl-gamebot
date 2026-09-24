import axios from "axios";
import { logger } from "../logger";
const hockeyChartApiBaseUrl = process.env.HOCKEYCHART_API_BASE_URL ?? "https://api.hockeychart.com/api";
/**
 * Fetches live advanced game stats from the HockeyChart endpoint.
 * @param gameID - NHL game ID.
 * @returns Live advanced stats for home and away teams.
 */
export async function fetchLiveAdvancedGameStats(gameID) {
    try {
        const response = await axios.get(`${hockeyChartApiBaseUrl}/game/live/${gameID}`);
        return response.data;
    }
    catch (error) {
        logger.error("Error fetching live advanced game stats data:", error);
        throw error;
    }
}
/**
 * Fetches season per-game advanced averages for a single team.
 * @param season - NHL season in API format (for example: "20242025").
 * @param teamAbbrev - Team abbreviation (for example: "VAN").
 * @param gameType - Optional game type ("regular", "playoff", "preseason").
 * @returns Team-level per-game advanced stats.
 */
export async function fetchTeamAverageAdvancedStats(season, teamAbbrev, gameType) {
    try {
        const url = gameType
            ? `${hockeyChartApiBaseUrl}/team/${season}/${teamAbbrev}?game_type=${gameType}`
            : `${hockeyChartApiBaseUrl}/team/${season}/${teamAbbrev}`;
        const response = await axios.get(url, {
            validateStatus: function (status) {
                return status >= 200 && status < 300 || status === 400; // Accept 400s if it's the custom error format
            }
        });
        if (response.data && response.data.success === false && response.data.error && response.data.error.includes("No completed")) {
            return null;
        }
        return response.data;
    }
    catch (error) {
        if (error.response && error.response.data && error.response.data.success === false && error.response.data.error && error.response.data.error.includes("No completed")) {
            return null;
        }
        logger.error("Error fetching team average advanced stats data:", error);
        throw error;
    }
}

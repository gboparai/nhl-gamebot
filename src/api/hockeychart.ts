import axios from "axios";
import { logger } from "../logger";
import {
  LiveAdvancedGameStatsResponse,
  TeamAverageAdvancedStatsResponse,
} from "../types";

const hockeyChartApiBaseUrl =
  process.env.HOCKEYCHART_API_BASE_URL ?? "http://127.0.0.1:8000/api";

/**
 * Fetches live advanced game stats from the HockeyChart endpoint.
 * @param gameID - NHL game ID.
 * @returns Live advanced stats for home and away teams.
 */
export async function fetchLiveAdvancedGameStats(
  gameID: string,
): Promise<LiveAdvancedGameStatsResponse> {
  try {
    const response = await axios.get(
      `${hockeyChartApiBaseUrl}/game/live/${gameID}`,
    );
    return response.data as LiveAdvancedGameStatsResponse;
  } catch (error) {
    logger.error("Error fetching live advanced game stats data:", error);
    throw error;
  }
}

/**
 * Fetches season per-game advanced averages for a single team.
 * @param season - NHL season in API format (for example: "20242025").
 * @param teamAbbrev - Team abbreviation (for example: "VAN").
 * @returns Team-level per-game advanced stats.
 */
export async function fetchTeamAverageAdvancedStats(
  season: string,
  teamAbbrev: string,
): Promise<TeamAverageAdvancedStatsResponse> {
  try {
    const response = await axios.get(
      `${hockeyChartApiBaseUrl}/team/${season}/${teamAbbrev}`,
    );
    return response.data as TeamAverageAdvancedStatsResponse;
  } catch (error) {
    logger.error("Error fetching team average advanced stats data:", error);
    throw error;
  }
}

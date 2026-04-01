import axios from "axios";
import { logger } from "../logger";
import { LiveAdvancedGameStatsResponse } from "../types";

/**
 * Fetches live advanced game stats from the HockeyChart endpoint.
 * @param gameID - NHL game ID.
 * @returns Live advanced stats for home and away teams.
 */
export async function fetchLiveAdvancedGameStats(
  gameID: string,
): Promise<LiveAdvancedGameStatsResponse> {
  try {
    const response = await axios.get(`http://localhost:8000/game/live/${gameID}`);
    return response.data as LiveAdvancedGameStatsResponse;
  } catch (error) {
    logger.error("Error fetching live advanced game stats data:", error);
    throw error;
  }
}

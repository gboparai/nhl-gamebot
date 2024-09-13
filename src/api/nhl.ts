import axios from "axios";
import {
  GameLanding,
  PlayByPlayGame,
  Boxscore,
  TeamSummaries,
  NHLScores,
  ISODateString,
} from '../types';

const BASE_URL = 'https://api-web.nhle.com/v1';

/**
 * Fetches team summaries from the NHL API.
 * @returns A promise that resolves to an array of team summaries.
 * @throws If an error occurs while fetching the team summaries.
 */
export async function fetchTeamSummaries() {
  try {
    const response = await axios.get(
      "https://api.nhle.com/stats/rest/en/team/summary",
    );
    return response.data as TeamSummaries;
  } catch (error) {
    console.error("Error fetching team summaries:", error);
    throw error;
  }
}

/**
 * Fetches the landing data for a specific game.
 * @param gameID - The ID of the game to fetch the landing data for.
 * @returns A promise that resolves to the landing data of the game.
 * @throws If there is an error while fetching the data.
 */
export async function fetchGameLanding(gameID: string) {
  try {
    const response = await axios.get(
      `${BASE_URL}/gamecenter/${gameID}/landing`,
    );
    return response.data as GameLanding;
  } catch (error) {
    console.error("Error fetching game landing data:", error);
    throw error;
  }
}

/**
 * Fetches the boxscore data for a specific game.
 * @param gameID - The ID of the game.
 * @returns A promise that resolves to the boxscore data.
 * @throws If there is an error fetching the boxscore data.
 */
export async function fetchBoxscore(gameID: string) {
  try {
    const response = await axios.get(
      `${BASE_URL}/gamecenter/${gameID}/boxscore`,
    );
    return response.data as Boxscore;
  } catch (error) {
    console.error("Error fetching boxscore data:", error);
    throw error;
  }
}

/**
 * Fetches the play-by-play data for a specific game.
 * @param gameID - The ID of the game to fetch play-by-play data for.
 * @returns A Promise that resolves to the play-by-play data for the game.
 * @throws If an error occurs while fetching the data.
 */
export async function fetchPlayByPlay(gameID: string) {
  try {
    const response = await axios.get(
      `${BASE_URL}/gamecenter/${gameID}/play-by-play`,
    );
    return response.data as PlayByPlayGame;
  } catch (error) {
    console.error("Error fetching play-by-play data:", error);
    throw error;
  }
}

/**
 * Fetches NHL scores for a specific date.
 * @param date - The date for which to fetch the scores in ISO 8601 format (YYYY-MM-DD).
 * @returns A promise that resolves to the NHL scores for the specified date.
 * @throws If there is an error fetching the scores.
 */
export async function fetchNHLScores(date: ISODateString) {
  try {
    const response = await axios.get(`${BASE_URL}/score/${date}`);
    return response.data as NHLScores;
  } catch (error) {
    console.error("Error fetching NHL scores:", error);
    throw error;
  }
}

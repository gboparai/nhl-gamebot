import axios from "axios";
import {
  GameLanding,
  PlayByPlayGame,
  Boxscore,
  TeamSummaries,
  NHLScores,
  GameCenterRightRail,
  ISODateString,
} from "../types";

const BASE_URL = "https://api-web.nhle.com/v1";

/**
 * Returns the current NHL season id string in the format YYYYYYYY (e.g. 20242025).
 * Assumption: a new season is considered to have started in July of the calendar year
 * (i.e. if month >= July, season start = current year, else season start = previous year).
 */
function getCurrentSeasonId(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  const seasonStartYear = month >= 7 ? year : year - 1; // season spans seasonStartYear -> seasonStartYear+1
  const seasonEndYear = seasonStartYear + 1;
  return `${seasonStartYear}${seasonEndYear}`;
}

/**
 * Fetches team summaries from the NHL API.
 * @returns A promise that resolves to an array of team summaries.
 * @throws If an error occurs while fetching the team summaries.
 */
export async function fetchTeamSummaries() {
  try {
    const seasonId = getCurrentSeasonId();
    const url = `https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId=${seasonId}`;
    let response = await axios.get(url);
    let data: any = response.data;

    // Helper to detect empty results for a few possible response shapes
    const isEmpty = (d: any) => {
      if (!d) return true;
      if (Array.isArray(d) && d.length === 0) return true;
      if (Array.isArray(d.data) && d.data.length === 0) return true;
      return false;
    };

    if (isEmpty(data)) {
      // Try last season as a fallback
      console.warn(`Team summaries for season ${seasonId} returned empty — falling back to previous season`);
      const startYear = parseInt(seasonId.slice(0, 4), 10);
      const prevStart = startYear - 1;
      const prevSeasonId = `${prevStart}${prevStart + 1}`;
      const prevUrl = `https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId=${prevSeasonId}`;
      try {
        response = await axios.get(prevUrl);
        data = response.data;
        if (isEmpty(data)) {
          console.warn(`Fallback to previous season ${prevSeasonId} also returned empty`);
        } else {
          console.log(`Fetched team summaries for previous season ${prevSeasonId}`);
        }
      } catch (err) {
        console.warn(`Error fetching team summaries for previous season ${prevSeasonId}:`, err);
      }
    }

    return data as TeamSummaries;
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

/**
 * Fetches the right rail data for the game center of a specific game.
 * @param gameID - The ID of the game.
 * @returns A promise that resolves to the right rail data for the game center.
 * @throws If there is an error while fetching the data.
 */
export async function fetchGameCenterRightRail(gameID: string) {
  try {
    const response = await axios.get(
      `${BASE_URL}/gamecenter/${gameID}/right-rail`,
    );
    return response.data as GameCenterRightRail;
  } catch (error) {
    console.error("Error fetching game center right rail data:", error);
    throw error;
  }
}


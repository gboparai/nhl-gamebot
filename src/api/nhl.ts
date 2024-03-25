import axios from "axios";
import { GameLanding, PlayByPlayGame, Boxscore, TeamSummaries, NHLScores } from '../types';


const BASE_URL = 'https://api-web.nhle.com/v1';

// Function to fetch team summaries
export async function fetchTeamSummaries() {
    try {
        const response = await axios.get("https://api.nhle.com/stats/rest/en/team/summary");
        return response.data as TeamSummaries;
    } catch (error) {
        console.error("Error fetching team summaries:", error);
        throw error;
    }
}

// Function to fetch game landing data
export async function fetchGameLanding(gameID: string) {
    try {
        const response = await axios.get(`${BASE_URL}/gamecenter/${gameID}/landing`);
        return response.data as GameLanding;
    } catch (error) {
        console.error("Error fetching game landing data:", error);
        throw error;
    }
}

// Function to fetch boxscore data
export async function fetchBoxscore(gameID: string) {
    try {
        const response = await axios.get(`${BASE_URL}/gamecenter/${gameID}/boxscore`);
        return response.data as Boxscore;
    } catch (error) {
        console.error("Error fetching boxscore data:", error);
        throw error;
    }
}

// Function to fetch play-by-play data
export async function fetchPlayByPlay(gameID: string) {
    try {
        const response = await axios.get(`${BASE_URL}/gamecenter/${gameID}/play-by-play`);
        return response.data as PlayByPlayGame;
    } catch (error) {
        console.error("Error fetching play-by-play data:", error);
        throw error;
    }
}

// Function to fetch NHL scores for a specific date
export async function fetchNHLScores(date: string) {
    try {
        const response = await axios.get(`${BASE_URL}/score/${date}`);
        return response.data as NHLScores;
    } catch (error) {
        console.error("Error fetching NHL scores:", error);
        throw error;
    }
}
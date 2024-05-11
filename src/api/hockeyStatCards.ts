import axios from "axios";
import { Game } from '../types';

/**
 * Represents the score of a game.
 */
type GameScore = {
    [key: string]: any;
};

/**
 * Represents the scores of two teams in a game.
 * @typedef {Array<GameScore[], GameScore[]>} GameScores
 */
export type GameScores = [GameScore[], GameScore[]];

/**
 * Retrieves the hockey stat cards for a given game.
 * @param game - The game object containing information about the game.
 * @returns A promise that resolves to an array of game scores or `false` if the game is not found.
 */
export async function hockeyStatCards(game: Game): Promise<GameScores | boolean> {
    const hscBase: string = "https://api.hockeystatcards.com/webapi";

    const hscSeason: string = String(game.season).slice(2, 4) + String(game.season).slice(6, 8);
    const hscGametype: string = game.gameType === 1 ? "ps" : game.gameType === 3 ? 'po' : "rs";
    const hscNstNum: number = parseInt(`${game.id}`);
    let hscGameNum: string | null = null;

    try {

        const resp = await axios.get(`${hscBase}/get-games`, {
            params: {
                date: game.gameDate,
                y: hscSeason,
                s: hscGametype
            }
        });


        const hscGamesJson = resp.data;

        const hscGames = hscGamesJson["gameList"];

        for (const hscGame of hscGames) {
            if (hscNstNum == hscGame["nhl_game_num"]) {
                hscGameNum = hscGame["gamenum"];
                console.info(`Hockey Stat Cards valid game found - HSC Game #${hscGameNum}`);
                break;
            }
        }

        if (!hscGameNum) {
            return false;
        }

        const gsResp = await axios.get(`${hscBase}/get-gamescore-card/${hscGameNum}`, {
            params: {
                date: game.gameDate,
                y: hscSeason,
                s: hscGametype
            }
        });


        const homeAbbrev: string = game.homeTeam.abbrev.toLocaleUpperCase().replace(".", ""); // Assuming nst_abbreviation function is defined

        const awayAbbrev: string = game.awayTeam.abbrev.toLocaleUpperCase().replace(".", ""); // Assuming nst_abbreviation function is defined



        const hscGs = gsResp.data;
        const allPlayerData = hscGs["playerData"];

        const homeGs = allPlayerData.filter((x: any) => x["team"] === homeAbbrev);
        const awayGs = allPlayerData.filter((x: any) => x["team"] === awayAbbrev);

        const homeGsSorted = homeGs.sort((a: any, b: any) => b["GameScore"] - a["GameScore"]);
        const awayGsSorted = awayGs.sort((a: any, b: any) => b["GameScore"] - a["GameScore"]);

        const gameScores: GameScores = [homeGsSorted, awayGsSorted];
        return gameScores;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}
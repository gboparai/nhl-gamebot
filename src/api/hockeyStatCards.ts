import axios from "axios";
import { nstAbbreviation } from "./utils"
import { Game } from '../types';

interface GameScore {
    [key: string]: any; // Define the structure of game score object
}

type GameScores = [GameScore[], GameScore[]];

export async function hockeyStatCards(game: Game): Promise<GameScores | boolean> {
    const hscBase: string = "https://api.hockeystatcards.com/webapi";

    const hscSeason: string = String(game.season).slice(2, 4) + String(game.season).slice(6, 8);
    const hscGametype: string = game.gameType === 1 ? "ps" : "rs";
    const hscNstNum: number = parseInt(`${game.gameType}${game.id}`);
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
            if (hscNstNum === hscGame["nstnum"]) {
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

        const homeTeam: string = game.homeTeam.name.default;
        const homeAbbrev: string = nstAbbreviation(homeTeam).replace(".", ""); // Assuming nst_abbreviation function is defined
        const awayTeam: string = game.awayTeam.name.default;
        const awayAbbrev: string = nstAbbreviation(awayTeam).replace(".", ""); // Assuming nst_abbreviation function is defined

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
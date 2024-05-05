
import config from '../config.json';
import { fetchTeamSummaries, fetchGameLanding, fetchBoxscore, fetchPlayByPlay, fetchNHLScores } from './api/nhl';
import { youtubeCondensed } from './api/youtube';
import { hockeyStatCards } from './api/hockeyStatCards';
import { GameDetails, fetchGameDetails } from './api/scoutingTheRefs';
import { Game, TeamSummary, GameLanding, Boxscore, PlayByPlayGame, NHLScores } from './types';
import { logObjectToFile } from './social/socialHandler';
/**
 * Represents the possible states of a game.
 */
enum GameStates {
    WAITING = 'WAITING',
    PREGAME = 'PREGAME',
    INGAME = 'INGAME',
    POSTGAME = 'POSTGAME',
    POSTGAMEVID = 'POSTGAMEVID'
}

/**
 * Pauses the execution for the specified number of milliseconds.
 * @param milliseconds - The number of milliseconds to sleep.
 * @returns A Promise that resolves after the specified number of milliseconds.
 */
const sleep = (milliseconds: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

/**
 * Pauses the execution until the next time specified by the target hour, minute, and second.
 * @param targetHour - The target hour.
 * @param targetMinute - The target minute.
 * @param targetSecond - The target second.
 * @returns A Promise that resolves after the specified time.
 */
const sleepUntilNextTime = (targetHour: number, targetMinute: number, targetSecond: number): Promise<void> => {
    const calculateTimeUntilNextTime = (): number => {
        const now = new Date();
        const nextTime = new Date(now);
        nextTime.setHours(targetHour, targetMinute, targetSecond, 0);

        if (now > nextTime) {
            // If it's already past the target time, calculate the time until the next day at the target time
            nextTime.setDate(now.getDate() + 1);
        }

        return nextTime.getTime() - now.getTime();
    };

    return (async () => {
        const timeUntilNextTime = calculateTimeUntilNextTime();
        await sleep(timeUntilNextTime);
    })();
};

/**
 * The main function that controls the game state transitions.
 * @returns A Promise that resolves to void.
 */
const main = async (): Promise<void> => {
    let CurrentState: GameStates = GameStates.WAITING;
    let currentGame: Game | undefined;
    let gameLanding: GameLanding | undefined;
    let boxscore: Boxscore | undefined;
    let playByPlay: PlayByPlayGame | undefined;
    let homeTeamSummary: TeamSummary | undefined;
    let awayTeamSummary: TeamSummary | undefined;
    let scouteDetails: GameDetails | undefined;
    while (true) {
        if (CurrentState === GameStates.WAITING) {
            let nhlScores: NHLScores = await fetchNHLScores(new Date().toISOString().split('T')[0]);
            currentGame = nhlScores.games.find((game) => game.awayTeam.abbrev === config.app.script.team || game.homeTeam.abbrev === config.app.script.team);
            if (currentGame !== undefined) {
                let sleepTime = new Date(currentGame.startTimeUTC);
                sleepTime.setHours(sleepTime.getHours() - 1);
                await sleep(sleepTime.getTime() - Date.now());
                CurrentState = GameStates.PREGAME;
            }
            else {
                await sleepUntilNextTime(7, 0, 0);
            }
        }
        else if (CurrentState === GameStates.PREGAME && currentGame !== undefined) {
            gameLanding = await fetchGameLanding(String(currentGame.id));
            boxscore = await fetchBoxscore(String(currentGame.id));
            let teamSummaries = await fetchTeamSummaries();
            homeTeamSummary = teamSummaries.data.find((team) => team.teamId === currentGame!.homeTeam.id);
            awayTeamSummary = teamSummaries.data.find((team) => team.teamId === currentGame!.awayTeam.id);
            scouteDetails = await fetchGameDetails(currentGame);

            if (scouteDetails.confirmed === false) {
                await sleep(config.app.script.pregame_sleep_time);
            }
            else {
                let sleepTime = new Date(currentGame.startTimeUTC);
                await sleep(sleepTime.getTime() - Date.now());
                CurrentState = GameStates.INGAME;
            }
        }
        else if (CurrentState === GameStates.INGAME) {
            playByPlay = await fetchPlayByPlay(String(currentGame!.id));
            playByPlay.gameState = 'LIVE';
            await sleep(config.app.script.live_sleep_time);
            await sleep(config.app.script.intermission_sleep_time);
            CurrentState = GameStates.POSTGAME
        }
        else if (CurrentState === GameStates.POSTGAME) {
            boxscore = await fetchBoxscore(String(currentGame!.id));
            playByPlay = await fetchPlayByPlay(String(currentGame!.id));
            CurrentState = GameStates.POSTGAMEVID
        }
        else if (CurrentState === GameStates.POSTGAMEVID) {
            let video = await youtubeCondensed(currentGame!.awayTeam.name.default, currentGame!.homeTeam.name.default);
            await sleep(config.app.script.final_sleep_time);
            CurrentState = GameStates.WAITING
        }
    }

}

main();
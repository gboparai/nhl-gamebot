
import config from '../config.json';
import { fetchTeamSummaries, fetchGameLanding, fetchBoxscore, fetchPlayByPlay, fetchNHLScores } from './api/nhl';
import { youtubeCondensed } from './api/youtube';
//import { hockeyStatCards } from './api/hockeyStatCards';
import { GameDetails, fetchGameDetails } from './api/scoutingTheRefs';
import { Game, TeamSummary, GameLanding, Boxscore, PlayByPlayGame, NHLScores } from './types';
import { logObjectToFile } from './logger';
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
    let refereeDetails: GameDetails | undefined;
    let hasSentIntermission: boolean = false;

    let lastEventID: number = 0;
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
                await sleep(25200000);
            }
        }
        else if (CurrentState === GameStates.PREGAME && currentGame !== undefined) {
            gameLanding = await fetchGameLanding(String(currentGame.id));
            boxscore = await fetchBoxscore(String(currentGame.id));

            let teamSummaries = await fetchTeamSummaries();
            homeTeamSummary = teamSummaries.data.find((team) => team.teamId === currentGame!.homeTeam.id);
            awayTeamSummary = teamSummaries.data.find((team) => team.teamId === currentGame!.awayTeam.id);
            refereeDetails = await fetchGameDetails(config.app.script.teamName);


            if (refereeDetails.confirmed === false) {
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
            logObjectToFile(playByPlay, 'playbyplay-ingame');
            if (playByPlay.clock.inIntermission) {
                await sleep(config.app.script.intermission_sleep_time);
                if (!hasSentIntermission) {
                    hasSentIntermission = true;
                }
            }
            else {
                hasSentIntermission = false;
                if (playByPlay.plays.length > 0) {
                    const plays = playByPlay.plays.filter((play) => play.sortOrder > (lastEventID) && (play.typeDescKey === "goal" || play.typeDescKey === "penalty"));
                    lastEventID = playByPlay.plays[playByPlay.plays.length - 1].sortOrder;
                    logObjectToFile(plays, 'plays-ingame');
                }
                await sleep(config.app.script.live_sleep_time);

            }
            if (playByPlay.plays.some((play) => play.typeDescKey === "game-end")) {
                CurrentState = GameStates.POSTGAME

                lastEventID = 0;
            }
        }
        else if (CurrentState === GameStates.POSTGAME) {
            boxscore = await fetchBoxscore(String(currentGame!.id));
            playByPlay = await fetchPlayByPlay(String(currentGame!.id));
            await sleep(1800000);
            CurrentState = GameStates.POSTGAMEVID
        }
        else if (CurrentState === GameStates.POSTGAMEVID) {
            let video = await youtubeCondensed(currentGame!.awayTeam.name.default, currentGame!.homeTeam.name.default);
            await sleep(25200000);
            CurrentState = GameStates.WAITING

        }
    }
}

main();

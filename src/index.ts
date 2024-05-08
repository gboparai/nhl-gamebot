
import config from '../config.json';
import { fetchTeamSummaries, fetchGameLanding, fetchBoxscore, fetchPlayByPlay, fetchNHLScores } from './api/nhl';
import { youtubeCondensed } from './api/youtube';
//import { hockeyStatCards } from './api/hockeyStatCards';
import { GameDetails, fetchGameDetails } from './api/scoutingTheRefs';
import { Game, TeamSummary, GameLanding, Boxscore, PlayByPlayGame, NHLScores, Team } from './types';
import { logObjectToFile } from './logger';
import { send } from './social/socialHandler';
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
    let prefTeam: Team | undefined;
    let oppTeam: Team | undefined;
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
                prefTeam = currentGame.awayTeam.abbrev === config.app.script.team ? currentGame.awayTeam : currentGame.homeTeam;
                oppTeam = currentGame.awayTeam.abbrev === config.app.script.team ? currentGame.homeTeam : currentGame.awayTeam;
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
                const pacificTime = new Date(currentGame.startTimeUTC);
                pacificTime.setHours(pacificTime.getHours() - config.app.script.timeZoneOffset);
                const formattedTime = pacificTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                const hours = formattedTime.split(':')[0];
                const minutes = formattedTime.split(':')[1].split(' ')[0];
                const ampm = formattedTime.split(' ')[1];
                const formattedHour = hours.length === 1 ? `0${hours}` : hours;
                const formattedMinutes = minutes.length === 1 ? `0${minutes}` : minutes;
                const formattedTime12Hr = `${formattedHour}:${formattedMinutes} ${ampm}`;

                send(
                    `Tune in tonight when the new ${prefTeam?.name.default} take on the ${oppTeam?.name.default} at ${currentGame.venue.default} in Pacific Time.
                    \n
                    \n🕢 ${formattedTime12Hr}
                    \n📺 ${currentGame.tvBroadcasts.map((broadcast) => broadcast.network).join(',')}`,
                    currentGame
                );



                const refereeDetails: GameDetails | undefined = await fetchGameDetails(config.app.script.teamName);
                if (refereeDetails?.confirmed) {
                    const referees = refereeDetails.referees.map((referee) => `R: ${referee.name} (Games: ${referee.careergames} | P/GM: ${referee.penaltygame})`).join('\n');
                    const linesmens = refereeDetails.linesmens.map((linesman) => `L: ${linesman.name} (Games: ${linesman.careergames})`).join('\n');

                    send(
                        `The officials (via @ScoutingTheRefs) -
                        \n
                        \n${referees}
                        \n${linesmens}`,
                        currentGame
                    );
                }


                let sleepTime = new Date(currentGame.startTimeUTC);
                await sleep(sleepTime.getTime() - Date.now());
                CurrentState = GameStates.INGAME;
            }

        }
        else if (CurrentState === GameStates.INGAME) {
            playByPlay = await fetchPlayByPlay(String(currentGame!.id));
            logObjectToFile(playByPlay, 'playbyplay-ingame');
            if (playByPlay.clock.inIntermission) {

                if (!hasSentIntermission) {
                    hasSentIntermission = true;
                    boxscore = await fetchBoxscore(String(currentGame?.id));
                    send(
                        `It's end of the ${ordinalSuffixOf(playByPlay?.displayPeriod || 0)} period at ${currentGame!.venue.default}
                            \n\n${currentGame?.homeTeam.name.default}: ${boxscore.summary.linescore.totals.home}
                            \n${currentGame?.awayTeam.name.default}: ${boxscore.summary.linescore.totals.away}
                        `,
                        currentGame!
                    );
                }
                await sleep(config.app.script.intermission_sleep_time);
            }
            else {
                hasSentIntermission = false;
                if (playByPlay.plays.length > 0) {
                    const plays = playByPlay.plays.filter((play) => play.sortOrder > (lastEventID) && (play.typeDescKey === "goal" || play.typeDescKey === "penalty" || play.typeDescKey === 'period-start' || play.typeDescKey === 'period-end' || play.typeDescKey === 'game-end'));
                    lastEventID = playByPlay.plays[playByPlay.plays.length - 1].sortOrder;
                    plays.forEach(play => {


                        //TODO add type of goal
                        if (play.typeDescKey === "goal") {
                            const scoringTeam = play.details?.eventOwnerTeamId === currentGame?.awayTeam.id ? currentGame?.awayTeam : currentGame?.homeTeam;
                            const scoringTeamsScore = play.details?.eventOwnerTeamId === currentGame?.awayTeam.id ? play.details?.awayScore : play.details?.homeScore;
                            const scoringPlayer = playByPlay?.rosterSpots.find((player) => player.playerId === play.details?.scoringPlayerId);

                            let goalMessage = `${scoringTeam?.name.default} GOAL! ${goalEmojis(scoringTeamsScore || 0)}
                                    \n\n${scoringPlayer?.firstName} ${scoringPlayer?.lastName} (${play.details?.scoringPlayerTotal}) scores with ${play.timeRemaining} in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.
                                    \n\n${currentGame?.homeTeam.name.default}: ${play.details?.homeScore}
                                    \n${currentGame?.awayTeam.name.default}: ${play.details?.awayScore}`;

                            if (scoringTeam?.id !== prefTeam?.id) {
                                goalMessage = `${scoringTeam?.name.default} score. ${thumbsDownEmojis(scoringTeamsScore || 0)}
                                        \n\n${scoringPlayer?.firstName} ${scoringPlayer?.lastName} (${play.details?.scoringPlayerTotal}) scores with ${play.timeRemaining} in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.
                                        \n\n${currentGame?.homeTeam.name.default}: ${play.details?.homeScore}
                                        \n${currentGame?.awayTeam.name.default}: ${play.details?.awayScore}`;
                            }

                            send(goalMessage, currentGame!);
                        }


                        else if (play.typeDescKey === "penalty") {
                            // Code for handling penalty
                            const penaltyTeam = play.details?.eventOwnerTeamId === currentGame?.awayTeam.id ? currentGame?.awayTeam : currentGame?.homeTeam;
                            const penaltyPlayer = playByPlay?.rosterSpots.find((player) => player.playerId === play.details?.committedByPlayerId);
                            const penaltyMessage = `Penalty ${penaltyTeam?.name.default}
                                \n\n${penaltyPlayer?.firstName} ${penaltyPlayer?.lastName} ${play.details?.duration}:00 minutes for ${convertdescKeyToWords(play.details?.descKey || '')} with ${play.timeRemaining} to play in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.`;
                            send(penaltyMessage, currentGame!);
                        }
                        else if (play.typeDescKey === "period-start") {
                            send(
                                `It's time for the ${ordinalSuffixOf(playByPlay?.displayPeriod || 0)} period at ${currentGame!.venue.default}. let's go ${prefTeam?.name.default}!`,
                                currentGame!
                            );
                        }

                    });
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
            const awayScore = boxscore.summary.linescore.totals.away;
            const homeScore = boxscore.summary.linescore.totals.home;
            let winningTeam = currentGame?.awayTeam.name.default;
            let losingTeam = currentGame?.homeTeam.name.default;

            if (homeScore > awayScore) {
                winningTeam = currentGame?.homeTeam.name.default;
                losingTeam = currentGame?.awayTeam.name.default;
            }

            send(
                `The ${winningTeam} defeat the ${losingTeam} at ${currentGame!.venue.default}!
                    \n\n${currentGame?.homeTeam.name.default}: ${boxscore.summary.linescore.totals.home}
                    \n${currentGame?.awayTeam.name.default}: ${boxscore.summary.linescore.totals.away}
                `,
                currentGame!
            );
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
/**
 * Returns the ordinal suffix of a given number.
 * 
 * @param i - The number to get the ordinal suffix for.
 * @returns The ordinal suffix as a string.
 */
function ordinalSuffixOf(i: number): string {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}


/**
 * Generates a string of goal emojis based on the given number.
 * 
 * @param num - The number of goal emojis to generate.
 * @returns A string of goal emojis.
 */
function goalEmojis(num: number): string {
    let emojis = '';
    for (let i = 0; i < num; i++) {
        emojis += '🚨';
    }
    return emojis;
}

/**
 * Generates a string of thumbs down emojis.
 * 
 * @param num - The number of thumbs down emojis to generate.
 * @returns A string of thumbs down emojis.
 */
function thumbsDownEmojis(num: number): string {
    let emojis = '';
    for (let i = 0; i < num; i++) {
        emojis += '👎🏻';
    }
    return emojis;
}
function convertdescKeyToWords(str: string): string {
    return str
        .split('-')
        .join(' ');
}
main();

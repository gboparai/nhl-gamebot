
import config from '../config.json';
import { fetchTeamSummaries, fetchGameLanding, fetchBoxscore, fetchPlayByPlay, fetchNHLScores } from './api/nhl';
import { youtubeCondensed } from './api/youtube';
import moment from 'moment-timezone';
import { GameDetails, fetchGameDetails } from './api/scoutingTheRefs';
import { Game, TeamSummary, GameLanding, Boxscore, PlayByPlayGame, NHLScores, Team } from './types';
import { logObjectToFile } from './logger';
import { send } from './social/socialHandler';
//import { hockeyStatCards } from './api/hockeyStatCards';
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

            let nhlScores: NHLScores = await fetchNHLScores(getCurrentDateEasternTime());
            currentGame = nhlScores.games.find((game) => game.awayTeam.abbrev === config.app.script.team || game.homeTeam.abbrev === config.app.script.team);


            if (currentGame !== undefined) {
                prefTeam = currentGame.awayTeam.abbrev === config.app.script.team ? currentGame.awayTeam : currentGame.homeTeam;
                oppTeam = currentGame.awayTeam.abbrev === config.app.script.team ? currentGame.homeTeam : currentGame.awayTeam;
                let sleepTime = new Date(currentGame.startTimeUTC);
                sleepTime.setHours(sleepTime.getHours() - 1);
                console.log(sleepTime);
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

                const formattedTime12Hr = convertUTCToLocalTime(currentGame.startTimeUTC, config.app.script.timeZone);

                send(
                    `Tune in tonight when the ${prefTeam?.name.default} take on the ${oppTeam?.name.default} at ${currentGame.venue.default}.
                    \n
                    🕢 ${formattedTime12Hr}
                    📺 ${currentGame.tvBroadcasts.map((broadcast) => broadcast.network).join(', ')}`,
                    currentGame
                );



                const refereeDetails: GameDetails | undefined = await fetchGameDetails(config.app.script.teamName);
                if (refereeDetails?.confirmed) {
                    const referees = refereeDetails.referees.map((referee) => `R: ${referee.name} (P/GM: ${referee.penaltygame})`).join('\n');
                    const linesmens = refereeDetails.linesmens.map((linesman) => `L: ${linesman.name}`).join('\n');

                    send(
                        `The officials (via @ScoutingTheRefs)
                        \n
                        ${referees}
                        ${linesmens}
                        `,
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
            console.log(playByPlay.clock.inIntermission);
            if (playByPlay.clock.inIntermission) {

                if (!hasSentIntermission) {
                    hasSentIntermission = true;
                    boxscore = await fetchBoxscore(String(currentGame?.id));
                    send(
                        `It's end of the ${ordinalSuffixOf(playByPlay?.displayPeriod || 0)} period at ${currentGame!.venue.default}
                            \n${currentGame?.homeTeam.name.default}: ${boxscore.summary.linescore.totals.home}
                            ${currentGame?.awayTeam.name.default}: ${boxscore.summary.linescore.totals.away}
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
                            \n ${scoringPlayer?.firstName.default} ${scoringPlayer?.lastName.default} (${play.details?.scoringPlayerTotal}) scores with ${play.timeRemaining} left in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.
                                    \n${currentGame?.homeTeam.name.default}: ${play.details?.homeScore}
                                    ${currentGame?.awayTeam.name.default}: ${play.details?.awayScore}`;

                            if (scoringTeam?.id !== prefTeam?.id) {
                                goalMessage = `${scoringTeam?.name.default} score ${thumbsDownEmojis(scoringTeamsScore || 0)} 
                                \n${scoringPlayer?.firstName.default} ${scoringPlayer?.lastName.default} (${play.details?.scoringPlayerTotal}) scores with ${play.timeRemaining} left in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.
                                        \n${currentGame?.homeTeam.name.default}: ${play.details?.homeScore}
                                        ${currentGame?.awayTeam.name.default}: ${play.details?.awayScore}`;
                            }

                            send(goalMessage, currentGame!);
                        }


                        else if (play.typeDescKey === "penalty") {
                            // Code for handling penalty
                            const penaltyTeam = play.details?.eventOwnerTeamId === currentGame?.awayTeam.id ? currentGame?.awayTeam : currentGame?.homeTeam;
                            const penaltyPlayer = playByPlay?.rosterSpots.find((player) => player.playerId === play.details?.committedByPlayerId);
                            const penaltyMessage = `Penalty ${penaltyTeam?.name.default}
                                \n${penaltyPlayer?.firstName.default} ${penaltyPlayer?.lastName.default} ${play.details?.duration}:00 minutes for ${convertdescKeyToWords(play.details?.descKey || '')} with ${play.timeRemaining} to play in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.`;
                            send(penaltyMessage, currentGame!);
                        }
                        else if (play.typeDescKey === "period-start") {
                            send(
                                `It's time for the ${ordinalSuffixOf(playByPlay?.displayPeriod || 0)} period at ${currentGame!.venue.default}. let's go ${prefTeam?.name.default}!`,
                                currentGame!
                            );
                        }

                    });
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
                    \n${currentGame?.homeTeam.name.default}: ${boxscore.summary.linescore.totals.home}
                    ${currentGame?.awayTeam.name.default}: ${boxscore.summary.linescore.totals.away}
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
 * Gets the current date in Eastern Time Zone (EST/EDT).
 * @returns The formatted date string in "YYYY-MM-DD" format.
 */
function getCurrentDateEasternTime() {
    // Get current date and time in UTC
    const currentDateUTC = new Date();

    // Get the offset for Eastern Time Zone (EST/EDT)
    const easternOffset = -4; // Eastern Standard Time (EST) is UTC-5, but Eastern Daylight Time (EDT) is UTC-4

    // Calculate the milliseconds offset for the Eastern Time Zone
    const easternOffsetMilliseconds = easternOffset * 60 * 60 * 1000;

    // Adjust the current date by adding the Eastern Time Zone offset
    const currentDateEastern = new Date(currentDateUTC.getTime() + easternOffsetMilliseconds);

    // Format the date as "YYYY-MM-DD"
    const year = currentDateEastern.getFullYear();
    const month = String(currentDateEastern.getMonth() + 1).padStart(2, '0');
    const day = String(currentDateEastern.getDate()).padStart(2, '0');

    // Return the formatted date string
    return `${year}-${month}-${day}`;
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

/**
 * Converts a string with hyphens to words by replacing hyphens with spaces.
 * 
 * @param str - The string to convert.
 * @returns The converted string.
 */
function convertdescKeyToWords(str: string): string {
    return str
        .split('-')
        .join(' ');
}

/**
 * Converts a UTC date and time string to the local time in the specified time zone.
 * @param utcDateTimeString The UTC date and time string to convert.
 * @param timeZone The time zone to convert the date and time to.
 * @returns The converted local time in the format 'h:mm A'.
 */
function convertUTCToLocalTime(utcDateTimeString: string, timeZone: string): string {
    return moment.utc(utcDateTimeString).tz(timeZone).format('h:mm A');
}


main();

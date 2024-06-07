
import config from '../config.json';
import { fetchTeamSummaries, fetchGameLanding, fetchBoxscore, fetchPlayByPlay, fetchNHLScores } from './api/nhl';
import { GameDetails, fetchGameDetails } from './api/scoutingTheRefs';
import { Game, TeamSummary, GameLanding, Boxscore, PlayByPlayGame, NHLScores, Team } from './types';
import { send } from './social/socialHandler';
import { convertUTCToLocalTime, getCurrentDateEasternTime, ordinalSuffixOf, goalEmojis, thumbsDownEmojis, starEmojis, groupedList, getLastName } from './utils';
import moment from 'moment';
import { dailyfaceoffLines } from './api/dailyFaceoff';
import { createPreGameImage } from './graphic/preGame';
import { teamHashtag } from './social/twitter';

/**
 * Represents the possible states of a game.
 */
enum GameStates {
    WAITING = 'WAITING',
    PREGAME = 'PREGAME',
    INGAME = 'INGAME',
    POSTGAME = 'POSTGAME',
    POSTGAMETHREESTARS = 'POSTGAMETHREESTARS',
    POSTGAMEVID = 'POSTGAMEVID',
    ENDGAME = 'ENDGAME'
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
    let CurrentState: GameStates = GameStates.INGAME;
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
    let sentEvents: number[] = [];

    while (true) {
        if (CurrentState === GameStates.WAITING) {

            const nhlScores: NHLScores = await fetchNHLScores(getCurrentDateEasternTime());
            currentGame = nhlScores.games.find((game) => game.awayTeam.abbrev === config.app.script.team || game.homeTeam.abbrev === config.app.script.team);


            if (currentGame !== undefined) {
                prefTeam = currentGame.awayTeam.abbrev === config.app.script.team ? currentGame.awayTeam : currentGame.homeTeam;
                oppTeam = currentGame.awayTeam.abbrev === config.app.script.team ? currentGame.homeTeam : currentGame.awayTeam;
                const sleepTime = new Date(currentGame.startTimeUTC);
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


            const teamSummaries = await fetchTeamSummaries();
            homeTeamSummary = teamSummaries.data.find((team) => team.teamId === currentGame!.homeTeam.id);
            awayTeamSummary = teamSummaries.data.find((team) => team.teamId === currentGame!.awayTeam.id);
            refereeDetails = await fetchGameDetails(config.app.script.teamName);


            if (refereeDetails.confirmed === false) {
                await sleep(config.app.script.pregame_sleep_time);
            }
            else {

                const formattedTime12Hr = convertUTCToLocalTime(currentGame.startTimeUTC, config.app.script.timeZone);
                await createPreGameImage({
                    homeTeam: currentGame.homeTeam.name.default,
                    awayTeam: currentGame.awayTeam.name.default,
                    homeHashtag: teamHashtag(currentGame.homeTeam.name.default) || '',
                    awayHashtag: teamHashtag(currentGame.awayTeam.name.default) || '',
                    venue: currentGame.venue.default,
                    date: moment(currentGame.startTimeUTC).format('MMMM D'),
                    time: formattedTime12Hr,
                    homeLine1: currentGame.gameType === 3 ? currentGame.homeTeam.record || '' : `${homeTeamSummary?.wins}-${homeTeamSummary?.losses}-${homeTeamSummary?.otLosses}`,
                    homeLine2: '',
                    awayLine1: currentGame.gameType === 3 ? currentGame.awayTeam.record || '' : `${awayTeamSummary?.wins}-${awayTeamSummary?.losses}-${awayTeamSummary?.otLosses}`,
                    awayLine2: ''

                });

                //TODO add graphic
                send(
                    `Tune in tonight when the ${prefTeam?.name.default} take on the ${oppTeam?.name.default} at ${currentGame.venue.default}.
                    \n\n🕢 ${formattedTime12Hr}\n📺 ${currentGame.tvBroadcasts.map((broadcast) => broadcast.network).join(', ')}`,
                    currentGame,
                    [`./temp/preGame.png`]
                );

                const dfLines = await dailyfaceoffLines(prefTeam?.name.default || '');
                if (dfLines.confirmed) {
                    send(
                        `Projected lines for the ${prefTeam?.name.default} (via @DailyFaceoff)
                        \n\n${groupedList(dfLines.forwards.map((player) => getLastName(player)), 3)}\n${groupedList(dfLines.defense.map((player) => getLastName(player)), 2)}\n${groupedList(dfLines.goalies.map((player) => getLastName(player)), 1)}`,
                        currentGame
                    );
                }

                const dfLinesOpps = await dailyfaceoffLines(oppTeam?.name.default || '');
                if (dfLinesOpps.confirmed) {
                    send(
                        `Projected lines for the ${oppTeam?.name.default} (via @DailyFaceoff)
                        \n\n${groupedList(dfLinesOpps.forwards.map((player) => getLastName(player)), 3)}\n${groupedList(dfLinesOpps.defense.map((player) => getLastName(player)), 2)}\n${groupedList(dfLinesOpps.goalies.map((player) => getLastName(player)), 1)}`,
                        currentGame
                    );
                }

                const refereeDetails: GameDetails | undefined = await fetchGameDetails(config.app.script.teamName);
                if (refereeDetails?.confirmed) {
                    const referees = refereeDetails.referees.map((referee) => `R: ${referee.name} (P/GM: ${referee.penaltygame})`).join('\n');
                    const linesmens = refereeDetails.linesmens.map((linesman) => `L: ${linesman.name}`).join('\n');

                    send(
                        `The officials (via @ScoutingTheRefs)
                        \n\n${referees}\n${linesmens}
                        `,
                        currentGame
                    );
                }



                const sleepTime = new Date(currentGame.startTimeUTC);
                await sleep(sleepTime.getTime() - Date.now());
                sentEvents = [];
                CurrentState = GameStates.INGAME;
            }

        }
        else if (CurrentState === GameStates.INGAME) {
            const nhlScores: NHLScores = await fetchNHLScores(getCurrentDateEasternTime());
            currentGame = nhlScores.games.find((game) => game.awayTeam.abbrev === config.app.script.team || game.homeTeam.abbrev === config.app.script.team);
            prefTeam = currentGame?.awayTeam.abbrev === config.app.script.team ? currentGame.awayTeam : currentGame?.homeTeam;
            oppTeam = currentGame?.awayTeam.abbrev === config.app.script.team ? currentGame.homeTeam : currentGame?.awayTeam;
            playByPlay = await fetchPlayByPlay(String(currentGame!.id));
            if (playByPlay.clock.inIntermission) {

                if (!hasSentIntermission) {
                    hasSentIntermission = true;
                    boxscore = await fetchBoxscore(String(currentGame?.id));

                    //TODO add graphic
                    send(
                        `It's end of the ${ordinalSuffixOf(playByPlay?.displayPeriod || 0)} period at ${currentGame!.venue.default}
                            \n\n${currentGame?.homeTeam.name.default}: ${boxscore.summary.linescore.totals.home}\n${currentGame?.awayTeam.name.default}: ${boxscore.summary.linescore.totals.away}
                        `,
                        currentGame!
                    );
                }
                await sleep(config.app.script.intermission_sleep_time);
            }
            else {
                hasSentIntermission = false;
                if (playByPlay.plays.length > 0) {
                    const plays = playByPlay.plays.filter((play) => play.sortOrder > (lastEventID)
                        && (play.typeDescKey === "goal" || play.typeDescKey === "penalty" || play.typeDescKey === 'period-start' || play.typeDescKey === 'period-end' || play.typeDescKey === 'game-end')
                        && !sentEvents.includes(play.eventId));
                    lastEventID = plays[plays.length - 1]?.sortOrder || lastEventID;
                    plays.forEach(play => {

                        sentEvents.push(play.eventId);
                        //TODO add type of goal
                        if (play.typeDescKey === "goal") {
                            const scoringTeam = play.details?.eventOwnerTeamId === currentGame?.awayTeam.id ? currentGame?.awayTeam : currentGame?.homeTeam;
                            const scoringTeamsScore = play.details?.eventOwnerTeamId === currentGame?.awayTeam.id ? play.details?.awayScore : play.details?.homeScore;
                            const scoringPlayer = playByPlay?.rosterSpots.find((player) => player.playerId === play.details?.scoringPlayerId);

                            let goalMessage = `${scoringTeam?.name.default} GOAL! ${goalEmojis(scoringTeamsScore || 0)}
                            \n ${scoringPlayer?.firstName.default} ${scoringPlayer?.lastName.default} (${play.details?.scoringPlayerTotal}) scores with ${play.timeRemaining} left in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.
                                    \n${currentGame?.homeTeam.name.default}: ${play.details?.homeScore}\n${currentGame?.awayTeam.name.default}: ${play.details?.awayScore}`;

                            if (scoringTeam?.id !== prefTeam?.id) {
                                goalMessage = `${scoringTeam?.name.default} score ${thumbsDownEmojis(scoringTeamsScore || 0)} 
                                \n${scoringPlayer?.firstName.default} ${scoringPlayer?.lastName.default} (${play.details?.scoringPlayerTotal}) scores with ${play.timeRemaining} left in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.
                                        \n${currentGame?.homeTeam.name.default}: ${play.details?.homeScore}\n${currentGame?.awayTeam.name.default}: ${play.details?.awayScore}`;
                            }

                            send(goalMessage, currentGame!);
                        }

                        //TODO add type of penalty
                        else if (play.typeDescKey === "penalty") {
                            // Code for handling penalty
                            const penaltyTeam = play.details?.eventOwnerTeamId === currentGame?.awayTeam.id ? currentGame?.awayTeam : currentGame?.homeTeam;
                            const penaltyPlayer = playByPlay?.rosterSpots.find((player) => player.playerId === play.details?.committedByPlayerId);
                            const penaltyMessage = `Penalty ${penaltyTeam?.name.default}
                                \n${penaltyPlayer?.firstName.default} ${penaltyPlayer?.lastName.default} ${play.details?.duration}:00 minutes with ${play.timeRemaining} to play in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.`;
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
            //TODO add graphic
            send(
                `The ${winningTeam} defeat the ${losingTeam} at ${currentGame!.venue.default}!
                    \n${currentGame?.homeTeam.name.default}: ${boxscore.summary.linescore.totals.home}\n${currentGame?.awayTeam.name.default}: ${boxscore.summary.linescore.totals.away}
                `,
                currentGame!
            );

            CurrentState = GameStates.POSTGAMETHREESTARS
        }
        else if (CurrentState === GameStates.POSTGAMETHREESTARS) {
            gameLanding = await fetchGameLanding(String(currentGame!.id));
            if (gameLanding?.summary.threeStars !== undefined && gameLanding?.summary.threeStars.length > 0) {
                //TODO add full name and team abbreviation
                const threeStars = gameLanding.summary.threeStars.map((star) => `${starEmojis(star.star)}: ${star.name}`).join('\n');
                send(
                    `Tonight's Three Stars
                    \n\n${threeStars}`,
                    currentGame!
                );
                CurrentState = GameStates.POSTGAMEVID
            }
            else {
                await sleep(60000);
            }
        }
        else if (CurrentState === GameStates.POSTGAMEVID) {
            boxscore = await fetchBoxscore(String(currentGame!.id));
            const video = boxscore?.gameVideo?.threeMinRecap;
            if (video) {
                const videoUrl = `https://www.nhl.com/video/recap-${boxscore.awayTeam.name.default}-at-${boxscore.homeTeam.name.default}-${moment().format('M-D-YY')}-${video}`;
                send(
                    `Check out the game recap for tonight's match between the ${currentGame?.homeTeam.name.default} and the ${currentGame?.awayTeam.name.default}:
                    \n\n${videoUrl}`,
                    currentGame!
                );
            }
            else {
                await sleep(60000);
            }
            CurrentState = GameStates.ENDGAME
        }
        else if (CurrentState === GameStates.ENDGAME) {
            await sleep(25200000);
            CurrentState = GameStates.WAITING
        }
    }
}


main();


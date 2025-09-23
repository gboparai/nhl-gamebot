import config from "../config.json";
import {
  fetchGameLanding,
  fetchBoxscore,
  fetchPlayByPlay,
  fetchNHLScores,
  fetchGameCenterRightRail
} from "./api/nhl";
import { GameDetails, fetchGameDetails } from "./api/scoutingTheRefs";
import {
  Game,
  GameLanding,
  NHLScores,
  Team,
} from "./types";
import { send } from "./social/socialHandler";
import {
  convertUTCToLocalTime,
  getCurrentDateEasternTime,
  ordinalSuffixOf,
  goalEmojis,
  thumbsDownEmojis,
  starEmojis,
  groupedList,
  getLastName,
  sleep
} from "./utils";
import moment from "moment";
import { dailyfaceoffLines } from "./api/dailyFaceoff";
import preGameImage from "./graphic/preGame";
import intermissionImage from "./graphic/intermission";
import postGameImage from "./graphic/postGame";
import gameImage from "./graphic/game";
import { teamHashtag } from "./social/utils";
import { LineScore } from "./graphic/utils";



/**
 * Represents the possible states of a game.
 */
enum GameStates {
  WAITING = "WAITING",
  PREGAME = "PREGAME",
  INGAME = "INGAME",
  POSTGAME = "POSTGAME",
  POSTGAMETHREESTARS = "POSTGAMETHREESTARS",
  POSTGAMEVID = "POSTGAMEVID",
  ENDGAME = "ENDGAME",
}


let currentState: GameStates = GameStates.WAITING;
let currentGame: Game | undefined;
let prefTeam: Team | undefined;
let oppTeam: Team | undefined;
let hasSentIntermission: boolean = false;
let lastEventID: number = 0;
let sentEvents: number[] = [];

/**
 * Handles the waiting state of the game.
 * This function fetches NHL scores, determines the current game, and sets the preferred and opponent teams.
 * If there is a current game, it calculates the sleep time and waits until the game starts.
 * If there is no current game, it waits for 7 hours before checking again.
 */
const handleWaitingState = async () => {
  console.log(`[${new Date().toISOString()}] Entering WAITING state`);
  
  
  try {
    console.log(`[${new Date().toISOString()}] Fetching NHL scores for ${getCurrentDateEasternTime()}`);
    const nhlScores: NHLScores = await fetchNHLScores(
      getCurrentDateEasternTime(),
    );
    

    
    currentGame = nhlScores.games.find(
      (game) =>
        game.awayTeam.abbrev === config.app.script.team ||
        game.homeTeam.abbrev === config.app.script.team,
    );

    if (currentGame !== undefined) {
      console.log(`[${new Date().toISOString()}] Found game: ${currentGame.awayTeam.abbrev} @ ${currentGame.homeTeam.abbrev} at ${currentGame.startTimeUTC}`);
      
      prefTeam =
        currentGame.awayTeam.abbrev === config.app.script.team
          ? currentGame.awayTeam
          : currentGame.homeTeam;
      oppTeam =
        currentGame.awayTeam.abbrev === config.app.script.team
          ? currentGame.homeTeam
          : currentGame.awayTeam;
          

      
      const sleepTime = new Date(currentGame.startTimeUTC);
      sleepTime.setHours(sleepTime.getHours() - 1);
      const sleepDuration = sleepTime.getTime() - Date.now();
      
      console.log(`[${new Date().toISOString()}] Sleeping for ${Math.round(sleepDuration / 60000)} minutes until pregame (${sleepTime.toISOString()})`);
      
      await sleep(sleepDuration);
      currentState = GameStates.PREGAME;
      console.log(`[${new Date().toISOString()}] Transitioning to PREGAME state`);
    } else {
      console.log(`[${new Date().toISOString()}] No game found for ${config.app.script.team}, sleeping for 7 hours`);
      
      
      await sleep(25200000);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in WAITING state:`, error);
   
  }
};

/**
 * Handles the pregame state of the game.
 * Fetches game landing, boxscore, team summaries, referee details, and performs pregame actions.
 * @returns {Promise<void>} A promise that resolves when the pregame state is handled.
 */
const handlePregameState = async () => {
  console.log(`[${new Date().toISOString()}] Entering PREGAME state`);

  if (currentGame !== undefined) {
    try {
      console.log(`[${new Date().toISOString()}] Fetching game center right rail data`);
      const rightRail = await fetchGameCenterRightRail(String(currentGame!.id));

      // Extract team season stats from right rail data
      const homeTeamStats = rightRail.teamSeasonStats?.homeTeam;
      const awayTeamStats = rightRail.teamSeasonStats?.awayTeam;
      
      // Fetch game landing data as fallback for team records
      let homeTeamRecord = currentGame.homeTeam.record;
      let awayTeamRecord = currentGame.awayTeam.record;
      
      if (!homeTeamRecord || !awayTeamRecord) {
        console.log(`[${new Date().toISOString()}] Team records not available in NHL scores, fetching from game landing`);
        try {
          const gameLanding = await fetchGameLanding(String(currentGame!.id));
          homeTeamRecord = homeTeamRecord || gameLanding.homeTeam.record || "";
          awayTeamRecord = awayTeamRecord || gameLanding.awayTeam.record || "";
        } catch (error) {
          console.warn(`[${new Date().toISOString()}] Could not fetch game landing for team records:`, error);
          homeTeamRecord = homeTeamRecord || "";
          awayTeamRecord = awayTeamRecord || "";
        }
      }
      

      console.log(`[${new Date().toISOString()}] Fetching referee details for ${config.app.script.teamName}`);
      const refereeDetails = await fetchGameDetails(config.app.script.teamName);


      //TODO:change to use function
      const msUntilStart = new Date(currentGame!.startTimeUTC).getTime() - Date.now();
      if (refereeDetails?.confirmed === false && msUntilStart > 30 * 60 * 1000) {
        console.log(`[${new Date().toISOString()}] Referee details not confirmed, sleeping for ${config.app.script.pregame_sleep_time}ms`);
        await sleep(config.app.script.pregame_sleep_time);
      } else {
        console.log(`[${new Date().toISOString()}] Referee details confirmed, proceeding with pregame activities`);

        const formattedTime12Hr = convertUTCToLocalTime(
          currentGame.startTimeUTC,
          config.app.script.timeZone,
        );

        console.log(`[${new Date().toISOString()}] Generating pregame image`);
        await preGameImage({
          homeTeam: currentGame.homeTeam.name.default,
          awayTeam: currentGame.awayTeam.name.default,
          homeHashtag: teamHashtag(currentGame.homeTeam.name.default) || "",
          awayHashtag: teamHashtag(currentGame.awayTeam.name.default) || "",
          venue: currentGame.venue.default,
          date: moment(currentGame.startTimeUTC).format("MMMM D"),
          time: formattedTime12Hr,
          homeLine1:
           homeTeamRecord, // Use record from NHL scores endpoint or game landing fallback
          homeLine2: "",
          awayLine1:
            awayTeamRecord, // Use record from NHL scores endpoint or game landing fallback
          awayLine2: "",
        });

        console.log(`[${new Date().toISOString()}] Sending pregame announcement`);
        send(
          `Tune in tonight when the ${prefTeam?.name.default} take on the ${oppTeam?.name.default} at ${currentGame.venue.default}.
                  \n\n🕢 ${formattedTime12Hr}\n📺 ${currentGame.tvBroadcasts.map((broadcast) => broadcast.network).join(", ")}`,
          currentGame,
          [`./temp/preGame.png`],
        );

        console.log(`[${new Date().toISOString()}] Generating game stats image`);
        await gameImage({
          shots: {
            pref: homeTeamStats?.goalsForPerGamePlayed || 0, // Using goals for per game as closest equivalent to shots
            opp: awayTeamStats?.goalsForPerGamePlayed || 0,
          },
          pentaltyKillPercentage: {
            pref: homeTeamStats?.pkPctg || 0,
            opp: awayTeamStats?.pkPctg || 0,
          },
          powerPlayPercentage: {
            pref: homeTeamStats?.ppPctg || 0,
            opp: awayTeamStats?.ppPctg || 0,
          },
          goalsAgainstPerGame: {
            pref: homeTeamStats?.goalsAgainstPerGamePlayed || 0,
            opp: awayTeamStats?.goalsAgainstPerGamePlayed || 0,
          },
          goalsForPerGame: {
            pref: homeTeamStats?.goalsForPerGamePlayed || 0,
            opp: awayTeamStats?.goalsForPerGamePlayed || 0,
          },
          faceoffPercentage: {
            pref: homeTeamStats?.faceoffWinningPctg || 0,
            opp: awayTeamStats?.faceoffWinningPctg || 0,
          },
        });

        send(
          `🔥 Get ready for an epic showdown! Tonight, it's the ${prefTeam?.name.default} going head-to-head with the ${oppTeam?.name.default} at ${currentGame.venue.default}. You won’t want to miss a second of the action! `,
          currentGame,
          [`./temp/game.png`],
        );

        const dfLines = await dailyfaceoffLines(prefTeam?.name.default || "");
        if (dfLines.confirmed) {
          console.log(`[${new Date().toISOString()}] Daily Faceoff lines last updated ${dfLines.lastUpdate}`);
          send(
            `Projected lines for the ${prefTeam?.name.default} (via @DailyFaceoff)
                    \n\n${groupedList(
                      dfLines.forwards.map((player) => getLastName(player)),
                      3,
                    )}\n${groupedList(
                      dfLines.defense.map((player) => getLastName(player)),
                      2,
                    )}\n${groupedList(
                      dfLines.goalies.map((player) => getLastName(player)),
                      1,
                    )}`,
            currentGame,
          );
        }

        console.log(`[${new Date().toISOString()}] Fetching Daily Faceoff lines for ${oppTeam?.name.default}`);
        const dfLinesOpps = await dailyfaceoffLines(oppTeam?.name.default || "");
        if (dfLinesOpps.confirmed) {
          console.log(`[${new Date().toISOString()}] Daily Faceoff lines confirmed for ${oppTeam?.name.default}`);
          send(
            `Projected lines for the ${oppTeam?.name.default} (via @DailyFaceoff)
                    \n\n${groupedList(
                      dfLinesOpps.forwards.map((player) => getLastName(player)),
                      3,
                    )}\n${groupedList(
                      dfLinesOpps.defense.map((player) => getLastName(player)),
                      2,
                    )}\n${groupedList(
                      dfLinesOpps.goalies.map((player) => getLastName(player)),
                      1,
                    )}`,
            currentGame,
          );
        } else {
          console.log(`[${new Date().toISOString()}] Daily Faceoff lines not confirmed for ${oppTeam?.name.default}`);
        }

        console.log(`[${new Date().toISOString()}] Re-fetching referee details`);
        const refereeDetails: GameDetails | undefined = await fetchGameDetails(
          config.app.script.teamName,
        );
        if (refereeDetails?.confirmed) {
          console.log(`[${new Date().toISOString()}] Referee details confirmed, sending officials info`);
          const referees = refereeDetails.referees
            .map((referee) => `R: ${referee.name} (P/GM: ${referee.penaltygame})`)
            .join("\n");
          const linesmens = refereeDetails.linesmens
            .map((linesman) => `L: ${linesman.name}`)
            .join("\n");

          send(
            `The officials (via @ScoutingTheRefs)
                    \n\n${referees}\n${linesmens}
                    `,
            currentGame,
          );
        } else {
          console.log(`[${new Date().toISOString()}] Referee details not confirmed in second fetch`);
        }

        const sleepTime = new Date(currentGame.startTimeUTC);
        const sleepDuration = sleepTime.getTime() - Date.now();
        console.log(`[${new Date().toISOString()}] Sleeping for ${Math.round(sleepDuration / 60000)} minutes until game starts (${sleepTime.toISOString()})`);

        await sleep(sleepDuration);
        sentEvents = [];
        currentState = GameStates.INGAME;
        console.log(`[${new Date().toISOString()}] Transitioning to INGAME state`);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in PREGAME state:`, error);
      await sleep(300000); // Sleep 5 minutes on error
    }
  }
};

/**
 * Handles the in-game state of the NHL game.
 * Fetches NHL scores, play-by-play data, and boxscore data.
 * Sends messages for goals, penalties, and period starts.
 * Handles intermission state and game end state.
 */
const handleInGameState = async () => {
  console.log(`[${new Date().toISOString()}] In INGAME state, fetching current game data`);
  
  try {
    const nhlScores: NHLScores = await fetchNHLScores(
      getCurrentDateEasternTime(),
    );
    currentGame = nhlScores.games.find(
      (game) =>
        game.awayTeam.abbrev === config.app.script.team ||
        game.homeTeam.abbrev === config.app.script.team,
    );
    
    if (!currentGame) {
      console.error(`[${new Date().toISOString()}] Current game not found in NHL scores`);
     
      return;
    }
    
    prefTeam =
      currentGame?.awayTeam.abbrev === config.app.script.team
        ? currentGame.awayTeam
        : currentGame?.homeTeam;
    oppTeam =
      currentGame?.awayTeam.abbrev === config.app.script.team
        ? currentGame.homeTeam
        : currentGame?.awayTeam;
        
    console.log(`[${new Date().toISOString()}] Fetching play-by-play data for game ${currentGame.id}`);
    const playByPlay = await fetchPlayByPlay(String(currentGame!.id));
    
    if (playByPlay.clock.inIntermission) {
      console.log(`[${new Date().toISOString()}] Game is in intermission`);
      if (!hasSentIntermission) {
        console.log(`[${new Date().toISOString()}] Sending intermission report`);
        hasSentIntermission = true;
        
        const boxscore = await fetchBoxscore(String(currentGame?.id));
        const gameLanding = await fetchGameLanding(String(currentGame?.id));
        const rightRailInfo = await fetchGameCenterRightRail(String(currentGame?.id));
        
       
        
        const pims = rightRailInfo?.teamGameStats?.find((team) => team.category === 'pim');
        const hits = rightRailInfo?.teamGameStats?.find((team) => team.category === 'hits');
        const faceoffWinningPctg = rightRailInfo?.teamGameStats?.find((team) => team.category === 'faceoffWinningPctg');
        const blockedShots = rightRailInfo?.teamGameStats?.find((team) => team.category === 'blockedShots');
        const giveaways = rightRailInfo?.teamGameStats?.find((team) => team.category === 'giveaways');
        const takeaways = rightRailInfo?.teamGameStats?.find((team) => team.category === 'takeaways');
        const powerPlay = rightRailInfo?.teamGameStats?.find((team) => team.category === 'powerPlay');
        const powerPlayPctg = rightRailInfo?.teamGameStats?.find((team) => team.category === 'powerPlayPctg');
        const lineScores = transformGameLandingToLineScores(gameLanding);
        console.log(`[${new Date().toISOString()}] Generating intermission image`);

        //TypeError: Cannot read properties of undefined (reading 'totals')
        await intermissionImage({
          pref: {
            team: prefTeam?.name.default || "",
            score: boxscore.homeTeam.score,
            lineScores: lineScores.homeLineScores,
          },
          opp: {
            team: oppTeam?.name.default || "",
            score: boxscore.awayTeam.score,
            lineScores: lineScores.awayLineScores,
          },
          shots: {
            pref: boxscore.homeTeam.sog,
            opp: boxscore.awayTeam.sog,
          },

          blockedShots: {
            pref: Number(blockedShots?.homeValue) || 0,
            opp: Number(blockedShots?.awayValue) || 0,
          },
          penalties: {
            pref: Number(pims?.homeValue) || 0,
            opp: Number(pims?.awayValue) || 0,
          },
          hits: {
            pref: Number(hits?.homeValue) || 0,
            opp: Number(hits?.awayValue) || 0,
          },
          faceoffPercentage: {
            pref: Number(faceoffWinningPctg?.homeValue) || 0,
            opp:  Number(faceoffWinningPctg?.awayValue) || 0,
          },
          giveaways: {
            pref: Number(giveaways?.homeValue) || 0,
            opp: Number(giveaways?.awayValue) || 0,
          },
          takeaways: {
            pref: Number(takeaways?.homeValue) || 0,
            opp: Number(takeaways?.awayValue) || 0,
          },
          powerPlay: {
            pref: String(powerPlay?.homeValue) || "",
            opp: String(powerPlay?.awayValue) || "",
          },
          powerPlayPctg:{
            pref: Number(powerPlayPctg?.homeValue) || 0,
            opp: Number(powerPlayPctg?.awayValue) || 0,
          }
        });

        console.log(`[${new Date().toISOString()}] Sending intermission message`);
        send(
          `It's end of the ${ordinalSuffixOf(playByPlay?.displayPeriod || 0)} period at ${currentGame!.venue.default}
                      \n\n${currentGame?.homeTeam.name.default}: ${boxscore.homeTeam.score}\n${currentGame?.awayTeam.name.default}: ${boxscore.awayTeam.score}
                  `,
          currentGame!,
          [`./temp/intermission.png`],
        );
      }
      console.log(`[${new Date().toISOString()}] Sleeping for intermission duration: ${config.app.script.intermission_sleep_time}ms`);
      await sleep(config.app.script.intermission_sleep_time);
    } else {
      hasSentIntermission = false;
      if (playByPlay.plays.length > 0) {
        const plays = playByPlay.plays.filter(
          (play) =>
            play.sortOrder > lastEventID &&
            (play.typeDescKey === "goal" ||
              play.typeDescKey === "penalty" ||
              play.typeDescKey === "period-start" ||
              play.typeDescKey === "period-end" ||
              play.typeDescKey === "game-end") &&
            !sentEvents.includes(play.eventId),
        );
        
        if (plays.length > 0) {
          console.log(`[${new Date().toISOString()}] Found ${plays.length} new events to process`);
          
        }
        
        lastEventID = plays[plays.length - 1]?.sortOrder || lastEventID;
        plays.forEach((play) => {
          sentEvents.push(play.eventId);
          //TODO add type of goal
          if (play.typeDescKey === "goal") {
            console.log(`[${new Date().toISOString()}] Processing GOAL event: ${play.eventId}`);
            const scoringTeam =
              play.details?.eventOwnerTeamId === currentGame?.awayTeam.id
                ? currentGame?.awayTeam
                : currentGame?.homeTeam;
            const scoringTeamsScore =
              play.details?.eventOwnerTeamId === currentGame?.awayTeam.id
                ? play.details?.awayScore
                : play.details?.homeScore;
            const scoringPlayer = playByPlay?.rosterSpots.find(
              (player) => player.playerId === play.details?.scoringPlayerId,
            );

           

            let goalMessage = `${scoringTeam?.name.default} GOAL! ${goalEmojis(scoringTeamsScore || 0)}
                      \n ${scoringPlayer?.firstName.default} ${scoringPlayer?.lastName.default} (${play.details?.scoringPlayerTotal}) scores with ${play.timeRemaining} left in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.
                              \n${currentGame?.homeTeam.name.default}: ${play.details?.homeScore}\n${currentGame?.awayTeam.name.default}: ${play.details?.awayScore}`;

            if (scoringTeam?.id !== prefTeam?.id) {
              goalMessage = `${scoringTeam?.name.default} score ${thumbsDownEmojis(scoringTeamsScore || 0)} 
                          \n${scoringPlayer?.firstName.default} ${scoringPlayer?.lastName.default} (${play.details?.scoringPlayerTotal}) scores with ${play.timeRemaining} left in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.
                                  \n${currentGame?.homeTeam.name.default}: ${play.details?.homeScore}\n${currentGame?.awayTeam.name.default}: ${play.details?.awayScore}`;
            }

            send(goalMessage, currentGame!, undefined, true);
          }

          //TODO add type of penalty
          else if (play.typeDescKey === "penalty") {
            console.log(`[${new Date().toISOString()}] Processing PENALTY event: ${play.eventId}`);
            // Code for handling penalty
            const penaltyTeam =
              play.details?.eventOwnerTeamId === currentGame?.awayTeam.id
                ? currentGame?.awayTeam
                : currentGame?.homeTeam;
            const penaltyPlayer = playByPlay?.rosterSpots.find(
              (player) => player.playerId === play.details?.committedByPlayerId,
            );
            
          
            
            const penaltyMessage = `Penalty ${penaltyTeam?.name.default}
                          \n${penaltyPlayer?.firstName.default} ${penaltyPlayer?.lastName.default} ${play.details?.duration}:00 minutes with ${play.timeRemaining} to play in the ${ordinalSuffixOf(play.periodDescriptor.number)} period.`;
            send(penaltyMessage, currentGame!, undefined, true);
          } else if (play.typeDescKey === "period-start") {
            console.log(`[${new Date().toISOString()}] Processing PERIOD-START event: ${play.eventId}`);
          
            
            send(
              `It's time for the ${ordinalSuffixOf(playByPlay?.displayPeriod || 0)} period at ${currentGame!.venue.default}. let's go ${prefTeam?.name.default}!`,
              currentGame!
            );
          }
        });
      }
      console.log(`[${new Date().toISOString()}] Sleeping for live game duration: ${config.app.script.live_sleep_time}ms`);
      await sleep(config.app.script.live_sleep_time);
    }
    
    if (playByPlay.plays.some((play) => play.typeDescKey === "game-end")) {
      console.log(`[${new Date().toISOString()}] Game has ended, transitioning to POSTGAME state`);
     
      currentState = GameStates.POSTGAME;
      lastEventID = 0;
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in INGAME state:`, error);
   
    await sleep(config.app.script.live_sleep_time); // Use live sleep time on error
  }
};

/**
 * Handles the post-game state of the game.
 * Fetches the boxscore and play-by-play data for the current game,
 * determines the winning and losing teams based on the scores,
 * sends a message with the game result, and updates the current state to POSTGAMETHREESTARS.
 */
const handlePostGameState = async () => {
  console.log(`[${new Date().toISOString()}] Entering POSTGAME state`);
  
  
  try {
    console.log(`[${new Date().toISOString()}] Fetching post-game data`);
    const boxscore = await fetchBoxscore(String(currentGame!.id));

    const awayScore = boxscore.awayTeam.score;
    const homeScore = boxscore.homeTeam.score;
    let winningTeam = currentGame?.awayTeam.name.default;
    let losingTeam = currentGame?.homeTeam.name.default;

    if (homeScore > awayScore) {
      winningTeam = currentGame?.homeTeam.name.default;
      losingTeam = currentGame?.awayTeam.name.default;
    }
    
    console.log(`[${new Date().toISOString()}] Game result: ${winningTeam} defeats ${losingTeam} ${Math.max(homeScore, awayScore)}-${Math.min(homeScore, awayScore)}`);
    
    
    
    const gameLanding = await fetchGameLanding(String(currentGame?.id));
    const rightRailInfo = await fetchGameCenterRightRail(String(currentGame?.id));
    const pims = rightRailInfo?.teamGameStats?.find((team) => team.category === 'pim');
    const hits = rightRailInfo?.teamGameStats?.find((team) => team.category === 'hits');
    const faceoffWinningPctg = rightRailInfo?.teamGameStats?.find((team) => team.category === 'faceoffWinningPctg');
    const blockedShots = rightRailInfo?.teamGameStats?.find((team) => team.category === 'blockedShots');
    const giveaways = rightRailInfo?.teamGameStats?.find((team) => team.category === 'giveaways');
    const takeaways = rightRailInfo?.teamGameStats?.find((team) => team.category === 'takeaways');
    const powerPlay = rightRailInfo?.teamGameStats?.find((team) => team.category === 'powerPlay');
    const powerPlayPctg = rightRailInfo?.teamGameStats?.find((team) => team.category === 'powerPlayPctg');
    const lineScores = transformGameLandingToLineScores(gameLanding);
    
    console.log(`[${new Date().toISOString()}] Generating post-game image`);
    await postGameImage({
      pref: {
        team: prefTeam?.name.default || "",
        score: boxscore.homeTeam.score,
        lineScores: lineScores.homeLineScores,
      },
      opp: {
        team: oppTeam?.name.default || "",
        score: boxscore.awayTeam.score,
        lineScores: lineScores.awayLineScores,
      },
      shots: {
        pref: boxscore.homeTeam.sog,
        opp: boxscore.awayTeam.sog,
      },

      blockedShots: {
        pref: Number(blockedShots?.homeValue) || 0,
        opp: Number(blockedShots?.awayValue) || 0,
      },
      penalties: {
        pref: Number(pims?.homeValue) || 0,
        opp: Number(pims?.awayValue) || 0,
      },
      hits: {
        pref: Number(hits?.homeValue) || 0,
        opp: Number(hits?.awayValue) || 0,
      },
      faceoffPercentage: {
        pref: Number(faceoffWinningPctg?.homeValue) || 0,
        opp:  Number(faceoffWinningPctg?.awayValue) || 0,
      },
      giveaways: {
        pref: Number(giveaways?.homeValue) || 0,
        opp: Number(giveaways?.awayValue) || 0,
      },
      takeaways: {
        pref: Number(takeaways?.homeValue) || 0,
        opp: Number(takeaways?.awayValue) || 0,
      },
      powerPlay: {
        pref: String(powerPlay?.homeValue) || "",
        opp: String(powerPlay?.awayValue) || "",
      },
      powerPlayPctg:{
        pref: Number(powerPlayPctg?.homeValue) || 0,
        opp: Number(powerPlayPctg?.awayValue) || 0,
      }
    });

    console.log(`[${new Date().toISOString()}] Sending post-game message`);
    send(
      `The ${winningTeam} defeat the ${losingTeam} at ${currentGame!.venue.default}!
              \n${currentGame?.homeTeam.name.default}: ${boxscore.homeTeam.score}\n${currentGame?.awayTeam.name.default}: ${boxscore.awayTeam.score}
          `,
      currentGame!,
      [`./temp/postGame.png`],
    );

    currentState = GameStates.POSTGAMETHREESTARS;
    console.log(`[${new Date().toISOString()}] Transitioning to POSTGAMETHREESTARS state`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in POSTGAME state:`, error);
   
    currentState = GameStates.POSTGAMETHREESTARS; // Continue to next state even on error
  }
};

/**
 * Handles the post-game three stars state.
 * Fetches the game landing page and sends a message with the three stars if available.
 * Updates the current state to GameStates.POSTGAMEVID.
 * If the three stars are not available, it waits for 60 seconds before proceeding.
 */
const handlePostGameThreeStarsState = async () => {
  console.log(`[${new Date().toISOString()}] Entering POSTGAMETHREESTARS state`);
  
  
  try {
    const gameLanding = await fetchGameLanding(String(currentGame!.id));
    if (
      gameLanding?.summary.threeStars !== undefined &&
      gameLanding?.summary.threeStars.length > 0
    ) {
      console.log(`[${new Date().toISOString()}] Three stars available, sending message`);
      //TODO add full name and team abbreviation
      const threeStars = gameLanding.summary.threeStars
        .map((star) => `${starEmojis(star.star)}: ${star.name}`)
        .join("\n");
        
      
      
      send(
        `Tonight's Three Stars
              \n\n${threeStars}`,
        currentGame!,
      );
      currentState = GameStates.POSTGAMEVID;
      console.log(`[${new Date().toISOString()}] Transitioning to POSTGAMEVID state`);
    } else {
      console.log(`[${new Date().toISOString()}] Three stars not available yet, waiting 60 seconds`);
      await sleep(60000);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in POSTGAMETHREESTARS state:`, error);
    
    currentState = GameStates.POSTGAMEVID; // Continue to next state even on error
  }
};

/**
 * Handles the post-game video state.
 * Fetches the boxscore for the current game and sends the game recap video URL if available.
 * If no video is available, it waits for 60 seconds before transitioning to the ENDGAME state.
 */
const handlePostGameVideoState = async () => {
  console.log(`[${new Date().toISOString()}] Entering POSTGAMEVID state`);
  
  
  try {
    const rightRail = await fetchGameCenterRightRail(String(currentGame!.id));
    const boxscore = await fetchBoxscore(String(currentGame!.id));
    
    // Note: gameVideo is no longer available in the new boxscore format
    // We could potentially get video information from another endpoint if needed
    const video = rightRail?.gameVideo?.threeMinRecap; 
    
    if (video) {
      console.log(`[${new Date().toISOString()}] Game recap video available: ${video}`);
      const videoUrl = `https://www.nhl.com/video/recap-${boxscore.awayTeam.commonName.default}-at-${boxscore.homeTeam.commonName.default}-${moment().format("M-D-YY")}-${video}`;
      
     
      
      send(
        `Check out the game recap for tonight's match between the ${currentGame?.homeTeam.name.default} and the ${currentGame?.awayTeam.name.default}:
              \n\n${videoUrl}`,
        currentGame!,
      );
    } else {
      console.log(`[${new Date().toISOString()}] Game recap video not available yet, waiting 60 seconds`);
      await sleep(60000);
    }
    currentState = GameStates.ENDGAME;
    console.log(`[${new Date().toISOString()}] Transitioning to ENDGAME state`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in POSTGAMEVID state:`, error);
   
    currentState = GameStates.ENDGAME; // Continue to next state even on error
  }
};

/**
 * Handles the end game state.
 * This function waits for a specific period of time and then sets the current state to "WAITING".
 * @returns {Promise<void>} A promise that resolves when the current state is set to "WAITING".
 */
const handleEndGameState = async () => {
  console.log(`[${new Date().toISOString()}] Entering ENDGAME state, sleeping for 7 hours`);
  
  
  try {
    await sleep(25200000); // 7 hours
    currentState = GameStates.WAITING;
    console.log(`[${new Date().toISOString()}] Transitioning back to WAITING state`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in ENDGAME state:`, error);
    
  }
};

/**
 * The main function that controls the game state transitions.
 * @returns A Promise that resolves to void.
 */
const main = async(): Promise<void> => {
  console.log(`[${new Date().toISOString()}] NHL GameBot started`);

  
  while (true) {
    try {
      console.log(`[${new Date().toISOString()}] Current state: ${currentState}`);
      
      if (currentState === GameStates.WAITING) {
        await handleWaitingState();
      } else if (
        currentState === GameStates.PREGAME &&
        currentGame !== undefined
      ) {
        await handlePregameState();
      } else if (currentState === GameStates.INGAME) {
        await handleInGameState();
      } else if (currentState === GameStates.POSTGAME) {
        await handlePostGameState();
      } else if (currentState === GameStates.POSTGAMETHREESTARS) {
        await handlePostGameThreeStarsState();
      } else if (currentState === GameStates.POSTGAMEVID) {
        await handlePostGameVideoState();
      } else if (currentState === GameStates.ENDGAME) {
        await handleEndGameState();
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Unhandled error in main loop:`, error);
     
      
      // Sleep for 5 minutes before retrying
      await sleep(300000);
    }
  }
};

/**
 * Transforms a GameLanding object into home and away LineScores.
 * @param gameLanding - The GameLanding object to transform.
 * @returns An object containing homeLineScores and awayLineScores.
 */
function transformGameLandingToLineScores(gameLanding: GameLanding): {
  homeLineScores: LineScore[];
  awayLineScores: LineScore[];
} {
  const homeLineScores: LineScore[] = [];
  const awayLineScores: LineScore[] = [];

  gameLanding.summary.scoring.forEach((periodGoal) => {
    periodGoal.goals.forEach((goal) => {
      const lineScore: LineScore = {
        time: `${periodGoal.periodDescriptor.number}:${goal.timeInPeriod}`,
        type: getGoalType(goal.situationCode),
        goalScorer: `${goal.firstName.default} ${goal.lastName.default}`,
        assists: goal.assists.map(assist => `${assist.firstName.default} ${assist.lastName.default}`),
      };

      if (goal.teamAbbrev.default === gameLanding.homeTeam.abbrev) {
        homeLineScores.push(lineScore);
      } else {
        awayLineScores.push(lineScore);
      }
    });
  });

  return { homeLineScores, awayLineScores };
}

/**
 * Determines the type of a goal based on the given situation code.
 * @param situationCode - The situation code representing the goal type.
 * @returns The type of the goal: 'ev' for even strength, 'pp' for power play, 'sh' for short-handed.
 */
function getGoalType(situationCode: string): 'ev' | 'pp' | 'sh' {
  switch (situationCode) {
    case 'ev':
      return 'ev';
    case 'pp':
      return 'pp';
    case 'sh':
      return 'sh';
    default:
      return 'ev'; // Default to even strength if unknown
  }
}

// Start the bot
console.log(`[${new Date().toISOString()}] Starting NHL GameBot...`);
main().catch((error) => {
  console.error(`[${new Date().toISOString()}] Fatal error in main function:`, error);

  process.exit(1);
});

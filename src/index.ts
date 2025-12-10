import config from "../config.json";
import {
  fetchGameLanding,
  fetchBoxscore,
  fetchPlayByPlay,
  fetchNHLScores,
  fetchGameCenterRightRail,
  fetchTeamSummaries
} from "./api/nhl";
import { GameDetails, fetchGameDetails } from "./api/scoutingTheRefs";
import {
  Game,
  NHLScores,
  Team,
} from "./types";
import { send } from "./social/socialHandler";
import {
  convertUTCToLocalTime,
  getCurrentDateLocalTime,
  goalEmojis,
  thumbsDownEmojis,
  starEmojis,
  groupedList,
  getLastName,
  sleep,
  formatPeriodLabel,
  transformGameLandingToLineScores,
  setDateOverride
} from "./utils";
import moment from "moment";
import { dailyfaceoffLines } from "./api/dailyFaceoff";
import preGameImage from "./graphic/preGame";
import intermissionImage from "./graphic/intermission";
import postGameImage from "./graphic/postGame";
import gameImage from "./graphic/game";
import { teamHashtag } from "./social/utils";
import { logger } from "./logger";


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
let sentEvents: number[] = [];

// Goal post tracking for highlight replies
interface GoalPostInfo {
  eventId: number;
  gameId: number;
  blueskyPost?: { uri: string; cid: string };
  threadsPost?: { postId: string };
  telegramPost?: { messageId: number };
  playerName: string;
  teamName: string;
  processed: boolean;
}

let goalPosts: GoalPostInfo[] = [];

// Setter functions for testing
function setCurrentState(state: GameStates) { currentState = state; }
function setCurrentGame(game: Game | undefined) { currentGame = game; }
function setPrefTeam(team: Team | undefined) { prefTeam = team; }
function setOppTeam(team: Team | undefined) { oppTeam = team; }
function setHasSentIntermission(sent: boolean) { hasSentIntermission = sent; }
function setSentEvents(events: number[]) { sentEvents = events; }
function setGoalPosts(posts: GoalPostInfo[]) { goalPosts = posts; }

/**
 * Checks for highlight URLs for stored goal posts and sends replies
 */
async function checkForHighlights(): Promise<void> {
  if (!currentGame ) {
      logger.info("No current game, skipping highlight check");
    return;
  }

  try {

    
    if (goalPosts.length === 0) {
      logger.info("No goal posts to check for highlights");
      return;
    }
    
    // Fetch latest play-by-play data to check for highlight URLs
    const playByPlay = await fetchPlayByPlay(String(currentGame.id));

    
    for (const goalPost of goalPosts) {
      logger.info(`Processing goalPost for ${goalPost.playerName} (eventId: ${goalPost.eventId}, processed: ${goalPost.processed})`);
      
      if (goalPost.processed) {
        logger.info(`Skipping already processed goalPost for ${goalPost.playerName}`);
        continue;
      }

      // Find the corresponding goal in the latest data
      const goal = playByPlay.plays.find(p => p.eventId === goalPost.eventId);
      logger.info(`Found goal in play-by-play:`, goal ? `Yes (eventId: ${goal.eventId})` : "No");

      if (goal) {
        logger.info(`Goal details for ${goalPost.playerName}:`, {
          eventId: goal.eventId,
          hasHighlightUrl: !!goal.details?.highlightClipSharingUrl,
          highlightUrl: goal.details?.highlightClipSharingUrl || "Not available yet"
        });

        if (goal.details?.highlightClipSharingUrl && goal.details?.highlightClipSharingUrl !== 'https://nhl.com/video/') {
          logger.info(`Found highlight URL for ${goalPost.playerName}: ${goal.details.highlightClipSharingUrl}`);
          
          // Send highlight reply using the centralized send function
          const highlightText = `HIGHLIGHT: ${goalPost.playerName} scores for the ${goalPost.teamName}!\n\n${goal.details.highlightClipSharingUrl}`;
          
          await send(
            highlightText,
            currentGame,
            undefined,
            true, // extended = true (don't send to Twitter)
            goalPost.blueskyPost, // Bluesky reply to original post
            goalPost.threadsPost, // Threads reply to original post
            goalPost.telegramPost, // Telegram reply to original post
          );
          
          // Mark as processed
          goalPost.processed = true;
          logger.info(`Sent highlight reply for ${goalPost.playerName}`);
        } 
      }
    }
  } catch (error) {
    logger.error("Error checking for highlights:", error);
  }
}

/**
 * Handles the waiting state of the game.
 * This function fetches NHL scores, determines the current game, and sets the preferred and opponent teams.
 * If there is a current game, it calculates the sleep time and waits until the game starts.
 * If there is no current game, it waits for 7 hours before checking again.
 */
const handleWaitingState = async () => {
  logger.info(`[${new Date().toISOString()}] Entering WAITING state`);
  
  
  try {
    logger.info(`[${new Date().toISOString()}] Fetching NHL scores for ${getCurrentDateLocalTime(config.app.script.timeZone)}`);
    const nhlScores: NHLScores = await fetchNHLScores(
      getCurrentDateLocalTime(config.app.script.timeZone),
    );
    

    
    currentGame = nhlScores.games.find(
      (game) =>
        game.awayTeam.abbrev === config.app.script.team ||
        game.homeTeam.abbrev === config.app.script.team,
    );

    if (currentGame !== undefined) {
      logger.info(`[${new Date().toISOString()}] Found game: ${currentGame.awayTeam.abbrev} @ ${currentGame.homeTeam.abbrev} at ${currentGame.startTimeUTC}`);
      
      prefTeam =
        currentGame.awayTeam.abbrev === config.app.script.team
          ? currentGame.awayTeam
          : currentGame.homeTeam;
      oppTeam =
        currentGame.awayTeam.abbrev === config.app.script.team
          ? currentGame.homeTeam
          : currentGame.awayTeam;
          

      
      const sleepTime = new Date(currentGame.startTimeUTC);
      sleepTime.setMinutes(sleepTime.getMinutes() - 30);
      const sleepDuration = sleepTime.getTime() - Date.now();

      logger.info(`[${new Date().toISOString()}] Sleeping for ${Math.round(sleepDuration / 60000)} minutes until pregame (${sleepTime.toISOString()})`);

      await sleep(sleepDuration);
      currentState = GameStates.PREGAME;
      logger.info(`[${new Date().toISOString()}] Transitioning to PREGAME state`);
    } else {
      logger.info(`[${new Date().toISOString()}] No game found for ${config.app.script.team}, sleeping for 7 hours`);
      
      
      await sleep(config.app.script.waiting_no_game_sleep_time ?? 25200000); // 7 hours
    }
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error in WAITING state:`, error);
   
  }
};

/**
 * Handles the pregame state of the game.
 * Fetches game landing, boxscore, team summaries, referee details, and performs pregame actions.
 * @returns {Promise<void>} A promise that resolves when the pregame state is handled.
 */
const handlePregameState = async () => {
  logger.info(`[${new Date().toISOString()}] Entering PREGAME state`);

  if (currentGame !== undefined) {
    try {
      logger.info(`[${new Date().toISOString()}] Fetching game center right rail data`);
      const rightRail = await fetchGameCenterRightRail(String(currentGame!.id));
      const teamSummaries = await fetchTeamSummaries();

      const homeTeamSummary = teamSummaries.data.find(
        (team) => team.teamId === currentGame!.homeTeam.id,
      );
      const awayTeamSummary = teamSummaries.data.find(
        (team) => team.teamId === currentGame!.awayTeam.id,
      );

      // Extract team season stats from right rail data
      const homeTeamStats = rightRail.teamSeasonStats?.homeTeam;
      const awayTeamStats = rightRail.teamSeasonStats?.awayTeam;
      
      // Fetch game landing data as fallback for team records
      let homeTeamRecord = currentGame.homeTeam.record;
      let awayTeamRecord = currentGame.awayTeam.record;
      
      if (!homeTeamRecord || !awayTeamRecord) {
        logger.info(`[${new Date().toISOString()}] Team records not available in NHL scores, fetching from game landing`);
        try {
          const gameLanding = await fetchGameLanding(String(currentGame!.id));
          homeTeamRecord = homeTeamRecord || gameLanding.homeTeam.record || "";
          awayTeamRecord = awayTeamRecord || gameLanding.awayTeam.record || "";
        } catch (error) {
          logger.warn(`[${new Date().toISOString()}] Could not fetch game landing for team records:`, error);
          homeTeamRecord = homeTeamRecord || "";
          awayTeamRecord = awayTeamRecord || "";
        }
      }
      

      logger.info(`[${new Date().toISOString()}] Fetching referee details for ${config.app.script.teamName}`);
      const refereeDetails = await fetchGameDetails(config.app.script.teamName);


      //TODO:change to use function
      const msUntilStart = new Date(currentGame!.startTimeUTC).getTime() - Date.now();
      if (refereeDetails?.confirmed === false && msUntilStart > 30 * 60 * 1000) {
        logger.info(`[${new Date().toISOString()}] Referee details not confirmed, sleeping for ${config.app.script.pregame_sleep_time}ms`);
        await sleep(config.app.script.pregame_sleep_time);
      } else {
        logger.info(`[${new Date().toISOString()}] Referee details confirmed, proceeding with pregame activities`);

        const formattedTime12Hr = convertUTCToLocalTime(
          currentGame.startTimeUTC,
          config.app.script.timeZone,
        );

        logger.info(`[${new Date().toISOString()}] Generating pregame image`);
        await preGameImage({
          homeTeam: currentGame.homeTeam.name.default,
          awayTeam: currentGame.awayTeam.name.default,
          homeHashtag: teamHashtag(currentGame.homeTeam.name.default) || "",
          awayHashtag: teamHashtag(currentGame.awayTeam.name.default) || "",
          venue: currentGame.venue.default,
          date: moment(currentGame.startTimeUTC).format("MMMM D"),
          time: formattedTime12Hr,
          homeLine1:
           homeTeamRecord, 
          homeLine2: `Season Series: ${rightRail.seasonSeriesWins.homeTeamWins}-${rightRail.seasonSeriesWins.awayTeamWins}`,
          awayLine1:
            awayTeamRecord, 
          awayLine2: `Season Series: ${rightRail.seasonSeriesWins.awayTeamWins}-${rightRail.seasonSeriesWins.homeTeamWins}`,
        });

        logger.info(`[${new Date().toISOString()}] Sending pregame announcement`);
        await send(
          `Tune in tonight when the ${prefTeam?.name.default} take on the ${oppTeam?.name.default} at ${currentGame.venue.default}.\n\n🕢 ${formattedTime12Hr}\n📺 ${currentGame.tvBroadcasts.map((broadcast) => broadcast.network).join(", ")}`,
          currentGame,
          [`./temp/preGame.png`],
        );

        logger.info(`[${new Date().toISOString()}] Generating game stats image`);
        await gameImage({
          home: {
            team: currentGame.homeTeam.name.default,
          },
          away: {
            team: currentGame.awayTeam.name.default,
          },
          shots: {
            home: homeTeamSummary?.shotsForPerGame || 0, // Using goals for per game as closest equivalent to shots
            away:  awayTeamSummary?.shotsForPerGame || 0,
          },
          shotsAgainst:{
            home: homeTeamSummary?.shotsAgainstPerGame || 0, // Using goals for per game as closest equivalent to shots
            away:  awayTeamSummary?.shotsAgainstPerGame || 0,
          },
          pentaltyKillPercentage: {
            home: homeTeamStats?.pkPctg || 0,
            away: awayTeamStats?.pkPctg || 0,
          },
          powerPlayPercentage: {
            home: homeTeamStats?.ppPctg || 0,
            away: awayTeamStats?.ppPctg || 0,
          },
          goalsAgainstPerGame: {
            home: homeTeamStats?.goalsAgainstPerGamePlayed || 0,
            away: awayTeamStats?.goalsAgainstPerGamePlayed || 0,
          },
          goalsForPerGame: {
            home: homeTeamStats?.goalsForPerGamePlayed || 0,
            away: awayTeamStats?.goalsForPerGamePlayed || 0,
          },
          faceoffPercentage: {
            home: homeTeamStats?.faceoffWinningPctg || 0,
            away: awayTeamStats?.faceoffWinningPctg || 0,
          },
        });

        await send(
          `🔥 Get ready for an epic showdown! Tonight, it's the ${prefTeam?.name.default} going head-to-head with the ${oppTeam?.name.default} at ${currentGame.venue.default}. You won’t want to miss a second of the action! `,
          currentGame,
          [`./temp/game.png`],
        );

        const dfLines = await dailyfaceoffLines(prefTeam?.name.default || "");
        if (dfLines.confirmed) {
          logger.info(`[${new Date().toISOString()}] Daily Faceoff lines last updated ${dfLines.lastUpdate}`);
          await send(
            `Projected lines for the ${prefTeam?.name.default} (via @DailyFaceoff)\n\n${groupedList(
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

        logger.info(`[${new Date().toISOString()}] Fetching Daily Faceoff lines for ${oppTeam?.name.default}`);
        const dfLinesOpps = await dailyfaceoffLines(oppTeam?.name.default || "");
        if (dfLinesOpps.confirmed) {
          logger.info(`[${new Date().toISOString()}] Daily Faceoff lines confirmed for ${oppTeam?.name.default}`);
          await send(
            `Projected lines for the ${oppTeam?.name.default} (via @DailyFaceoff)\n\n${groupedList(
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
          logger.info(`[${new Date().toISOString()}] Daily Faceoff lines not confirmed for ${oppTeam?.name.default}`);
        }

        logger.info(`[${new Date().toISOString()}] Re-fetching referee details`);
        const refereeDetails: GameDetails | undefined = await fetchGameDetails(
          config.app.script.teamName,
        );
        if (refereeDetails?.confirmed) {
          logger.info(`[${new Date().toISOString()}] Referee details confirmed, sending officials info`);
          const referees = refereeDetails.referees
            .map((referee) => `R: ${referee.name} (P/GM: ${referee.penaltygame})`)
            .join("\n");
          const linesmens = refereeDetails.linesmens
            .map((linesman) => `L: ${linesman.name}`)
            .join("\n");

          await send(
            `The officials (via @ScoutingTheRefs)\n\n${referees}\n${linesmens}`,
            currentGame,
          );
        } else {
          logger.info(`[${new Date().toISOString()}] Referee details not confirmed in second fetch`);
        }

        const sleepTime = new Date(currentGame.startTimeUTC);
        const sleepDuration = sleepTime.getTime() - Date.now();
        logger.info(`[${new Date().toISOString()}] Sleeping for ${Math.round(sleepDuration / 60000)} minutes until game starts (${sleepTime.toISOString()})`);

        await sleep(sleepDuration);
        sentEvents = [];
        goalPosts = []; // Reset goal posts for new game
        currentState = GameStates.INGAME;
        logger.info(`[${new Date().toISOString()}] Transitioning to INGAME state`);
      }
    } catch (error) {
      logger.error(`[${new Date().toISOString()}] Error in PREGAME state:`, error);
      await sleep(config.app.script.error_retry_sleep_time ?? 300000); // Sleep on error
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
  logger.info(`[${new Date().toISOString()}] In INGAME state, fetching current game data`);
  
  try {
    const nhlScores: NHLScores = await fetchNHLScores(
      getCurrentDateLocalTime(config.app.script.timeZone),
    );
    currentGame = nhlScores.games.find(
      (game) =>
        game.awayTeam.abbrev === config.app.script.team ||
        game.homeTeam.abbrev === config.app.script.team,
    );
    
    if (!currentGame) {
      logger.error(`[${new Date().toISOString()}] Current game not found in NHL scores`);
     
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
        

    const playByPlay = await fetchPlayByPlay(String(currentGame!.id));
    
    if (playByPlay.clock.inIntermission && hasSentIntermission) {
      logger.info(`[${new Date().toISOString()}] Game is in intermission`);
      await checkForHighlights();
      await sleep(config.app.script.intermission_sleep_time);
    } else {
      hasSentIntermission = false;
      if (playByPlay.plays.length > 0) {
        // Filter for relevant event types that haven't been sent yet
        
        const relevantPlays = playByPlay.plays.filter(
          (play) => {
            // Skip placeholder penalties that don't have proper details
            if (play.typeDescKey === "penalty" && (!play.details?.typeCode || play.details?.descKey === "minor" || (!play.details?.committedByPlayerId && !play.details?.servedByPlayerId))) {
              logger.info(`[${new Date().toISOString()}] Skipping placeholder penalty event ${play.eventId} (missing typeCode or minor)`,play);
              return false;
            }
            return (
              play.typeDescKey === "goal" ||
              play.typeDescKey === "penalty" ||
              play.typeDescKey === "period-start" ||
              play.typeDescKey === "period-end" ||
              (play.typeDescKey === "stoppage" && (play.details?.reason === "tv-timeout" || play.details?.secondaryReason === "tv-timeout"))||
              play.typeDescKey === "game-end"
            ) && !sentEvents.includes(play.eventId);
          }
        );
        
        // Sort by sortOrder to ensure chronological processing
        const sortedPlays = relevantPlays.sort((a, b) => a.sortOrder - b.sortOrder);
        
        if (sortedPlays.length > 0) {
          logger.info(`[${new Date().toISOString()}] Found ${sortedPlays.length} new events to process`);
          
          // Process each event in chronological order
          for (const play of sortedPlays) {
            logger.info(`[${new Date().toISOString()}] Processing ${play.typeDescKey.toUpperCase()} event: ${play.eventId} (sortOrder: ${play.sortOrder})`);
            
            try {
              if (play.typeDescKey === "goal") {
                logger.info('Play details:', play)
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

                // Get assist information
                const assists: string[] = [];
                if (play.details?.assist1PlayerId) {
                  const assist1Player = playByPlay?.rosterSpots.find(
                    (player) => player.playerId === play.details?.assist1PlayerId,
                  );
                  if (assist1Player) {
                    assists.push(`${assist1Player.firstName.default} ${assist1Player.lastName.default} (${play.details?.assist1PlayerTotal})`);
                  }
                }
                if (play.details?.assist2PlayerId) {
                  const assist2Player = playByPlay?.rosterSpots.find(
                    (player) => player.playerId === play.details?.assist2PlayerId,
                  );
                  if (assist2Player) {
                    assists.push(`${assist2Player.firstName.default} ${assist2Player.lastName.default} (${play.details?.assist2PlayerTotal})`);
                  }
                }

                const assistsText = assists.length > 0 ? `\nAssists: ${assists.join(', ')}` : '';

                const goalie = playByPlay?.rosterSpots.find(
                  (player) => player.playerId === play.details?.goalieInNetId,
                );

                let goalMessage = '';
                if(play.periodDescriptor.periodType === "SO"){
                   goalMessage = `🎯 SHOOTOUT GOAL! ${scoringTeam?.name.default} 🎯\n\n${scoringPlayer?.firstName.default} ${scoringPlayer?.lastName.default} scores on ${goalie?.firstName.default} ${goalie?.lastName.default}!`;
                  
                  if (scoringTeam?.id !== prefTeam?.id) {
                    goalMessage = `😞 ${scoringTeam?.name.default} scores in the shootout ${thumbsDownEmojis(1)}\n\n${scoringPlayer?.firstName.default} ${scoringPlayer?.lastName.default} beats ${goalie?.firstName.default} ${goalie?.lastName.default}.`;
                  }
                }
                else{
                  goalMessage = `${scoringTeam?.name.default} GOAL! ${goalEmojis(scoringTeamsScore || 0)}
                            \n${scoringPlayer?.firstName.default} ${scoringPlayer?.lastName.default} (${play.details?.scoringPlayerTotal}) scores with ${play.timeRemaining} left in the ${formatPeriodLabel(play.periodDescriptor.number, playByPlay.gameType)} period.${assistsText}
                                    \n${currentGame?.homeTeam.name.default}: ${play.details?.homeScore}\n${currentGame?.awayTeam.name.default}: ${play.details?.awayScore}`;

                  if (scoringTeam?.id !== prefTeam?.id) {
                    goalMessage = `${scoringTeam?.name.default} score ${thumbsDownEmojis(scoringTeamsScore || 0)} 
                                \n${scoringPlayer?.firstName.default} ${scoringPlayer?.lastName.default} (${play.details?.scoringPlayerTotal}) scores with ${play.timeRemaining} left in the ${formatPeriodLabel(play.periodDescriptor.number, playByPlay.gameType)} period.${assistsText}
                                        \n${currentGame?.homeTeam.name.default}: ${play.details?.homeScore}\n${currentGame?.awayTeam.name.default}: ${play.details?.awayScore}`;
                  }
                }

                const socialResponse = await send(goalMessage, currentGame!, undefined, true);
                
                // Store goal post info for potential highlight reply
                if (scoringPlayer && play.periodDescriptor.periodType !== "SO") {
                  goalPosts.push({
                    eventId: play.eventId,
                    gameId: currentGame!.id,
                    blueskyPost: socialResponse.blueskyPost,
                    threadsPost: socialResponse.threadsPost,
                    telegramPost: socialResponse.telegramPost,
                    playerName: `${scoringPlayer.firstName.default} ${scoringPlayer.lastName.default}`,
                    teamName: scoringTeam?.name.default || "",
                    processed: false
                  });
                  logger.info(`Stored goal post info for ${scoringPlayer.firstName.default} ${scoringPlayer.lastName.default} (event ${play.eventId})`);
                }
              }
              else if (play.typeDescKey === "penalty") {
                // Skip placeholder penalties (minor/major without details)
                const penaltyTeam = play.details?.eventOwnerTeamId === currentGame?.awayTeam.id
                  ? currentGame?.awayTeam
                  : currentGame?.homeTeam;

                  const drawnTeam = play.details?.eventOwnerTeamId !== currentGame?.awayTeam.id
                  ? currentGame?.awayTeam
                  : currentGame?.homeTeam;
                  
                const penaltyPlayer = playByPlay?.rosterSpots.find(
                  (player) => player.playerId === play.details?.committedByPlayerId || play.details?.servedByPlayerId,
                );
                
                // Get the player who drew the penalty (if any)
                const drawnByPlayer = play.details?.drawnByPlayerId 
                  ? playByPlay?.rosterSpots.find(
                      (player) => player.playerId === play.details?.drawnByPlayerId,
                    )
                  : null;
                
                // Format penalty type (convert from kebab-case to Title Case)
                const penaltyType = play.details?.descKey
                  ? play.details.descKey
                      .split('-')
                      .map(word => word.charAt(0) + word.slice(1))
                      .join(' ')
                  : '';
                                
                // Format drawn by text
                const drawnByText = drawnByPlayer 
                  ? ` (drawn by ${drawnByPlayer.firstName.default} ${drawnByPlayer.lastName.default})`
                  : '';
                
                let penaltyMessage = '';
                
                if (play.details?.typeCode === 'PS') {
                  // Penalty shot message
                  penaltyMessage = `Penalty Shot ${drawnTeam?.name.default}\n\n${drawnByPlayer?.firstName.default} ${drawnByPlayer?.lastName.default} awarded a penalty shot with ${play.timeRemaining} to play in the ${formatPeriodLabel(play.periodDescriptor.number, playByPlay.gameType)} period.`;
                } else {
                  // Regular penalty message
                  penaltyMessage = `Penalty ${penaltyTeam?.name.default}\n\n${penaltyPlayer?.firstName.default} ${penaltyPlayer?.lastName.default} ${play.details?.duration}:00 minutes${drawnByText} for ${penaltyType} with ${play.timeRemaining} to play in the ${formatPeriodLabel(play.periodDescriptor.number, playByPlay.gameType)} period.`;
                }
                
                logger.info(`[${new Date().toISOString()}] Sending penalty message:`, penaltyMessage);
                await send(penaltyMessage, currentGame!, undefined, true);
              } 
              else if (play.typeDescKey === "period-start") {
                // Include current score when announcing the start of a period.
                try {
                  const boxscoreNow = await fetchBoxscore(String(currentGame!.id));
                  const scoreText = `${currentGame?.homeTeam.name.default}: ${boxscoreNow.homeTeam.score || 0}\n${currentGame?.awayTeam.name.default}: ${boxscoreNow.awayTeam.score || 0}`;
                  logger.info('Play details:', play)
                  if(boxscoreNow.homeTeam.score !== undefined && boxscoreNow.awayTeam.score !== undefined){
                    await send(
                      `It's time for the ${formatPeriodLabel(play.periodDescriptor.number, boxscoreNow.gameType )} period at ${currentGame!.venue.default}. Let's go ${prefTeam?.name.default}!\n\n${scoreText}`,
                      currentGame!
                    );
                  } else {
                    throw new Error("Boxscore scores are undefined");
                  }
                } catch (err) {
                  // If fetching the boxscore fails, fall back to the original message without score.
                  logger.warn(`[${new Date().toISOString()}] Failed to fetch boxscore for period-start message:`, err);
                  await send(
                    `It's time for the ${formatPeriodLabel(play.periodDescriptor.number, playByPlay.gameType)} period at ${currentGame!.venue.default}. Let's go ${prefTeam?.name.default}!`,
                    currentGame!
                  );
                }
              }
              else if (play.typeDescKey === "period-end") {
                // Period-end always comes before game-end, so we need to wait to see if game-end follows
                logger.info(`[${new Date().toISOString()}] Period ${play.periodDescriptor.number} ended, waiting to check if game ends...`);
                
                // Wait a short time to see if game-end event appears
                await sleep(180000); // Wait 3 minutes
                
                // Re-fetch play-by-play to check for game-end
                const updatedPlayByPlay = await fetchPlayByPlay(String(currentGame!.id));
                const gameEndEvent = updatedPlayByPlay.plays.find((p) => p.typeDescKey === "game-end");
                
                if (!gameEndEvent) {
                  // No game-end event, this is a real intermission
                  logger.info(`[${new Date().toISOString()}] No game-end event found, sending intermission report for period ${play.periodDescriptor.number}`);
                  
                  try {
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
                    
                    logger.info(`[${new Date().toISOString()}] Generating intermission image for period ${play.periodDescriptor.number}`);
                    
                    await intermissionImage({
                      home: {
                        team: boxscore?.homeTeam.commonName.default || "",
                        score: boxscore.homeTeam.score,
                        lineScores: lineScores.homeLineScores,
                      },
                      away: {
                        team: boxscore?.awayTeam.commonName.default || "",
                        score: boxscore.awayTeam.score,
                        lineScores: lineScores.awayLineScores,
                      },
                      shots: {
                        home: boxscore.homeTeam.sog,
                        away: boxscore.awayTeam.sog,
                      },
                      blockedShots: {
                        home: Number(blockedShots?.homeValue) || 0,
                        away: Number(blockedShots?.awayValue) || 0,
                      },
                      penalties: {
                        home: Number(pims?.homeValue) || 0,
                        away: Number(pims?.awayValue) || 0,
                      },
                      hits: {
                        home: Number(hits?.homeValue) || 0,
                        away: Number(hits?.awayValue) || 0,
                      },
                      faceoffPercentage: {
                        home: Number(faceoffWinningPctg?.homeValue) || 0,
                        away: Number(faceoffWinningPctg?.awayValue) || 0,
                      },
                      giveaways: {
                        home: Number(giveaways?.homeValue) || 0,
                        away: Number(giveaways?.awayValue) || 0,
                      },
                      takeaways: {
                        home: Number(takeaways?.homeValue) || 0,
                        away: Number(takeaways?.awayValue) || 0,
                      },
                      powerPlay: {
                        home: String(powerPlay?.homeValue) || "",
                        away: String(powerPlay?.awayValue) || "",
                      },
                      powerPlayPctg: {
                        home: Number(powerPlayPctg?.homeValue) || 0,
                        away: Number(powerPlayPctg?.awayValue) || 0,
                      }
                    });
                    
                    await send(
                      `It's end of the ${formatPeriodLabel(play.periodDescriptor.number, playByPlay.gameType)} period at ${currentGame!.venue.default}\n\n${currentGame?.homeTeam.name.default}: ${boxscore.homeTeam.score}\n${currentGame?.awayTeam.name.default}: ${boxscore.awayTeam.score}`,
                      currentGame!,
                      [`./temp/intermission.png`],
                    );
                    
                  } catch (intermissionError) {
                    logger.error(`[${new Date().toISOString()}] Error sending period-end intermission report:`, intermissionError);
                  }
                  finally {
                    hasSentIntermission = true;
                  }
                } else {
                  logger.info(`[${new Date().toISOString()}] Game-end event found after period ${play.periodDescriptor.number}, skipping intermission report`);
                }
              }
              else if (play.typeDescKey === "stoppage" && (play.details?.reason === "tv-timeout" || play.details?.secondaryReason === "tv-timeout")) {
                const stoppageMessage = `Game Stoppage: TV Timeout with ${play.timeRemaining} remaining in the ${formatPeriodLabel(play.periodDescriptor.number, playByPlay.gameType)} period. \n\n${currentGame?.homeTeam.name.default}: ${currentGame?.homeTeam.score || 0}\n${currentGame?.awayTeam.name.default}: ${currentGame?.awayTeam.score || 0}`;
                await send(stoppageMessage, currentGame!, undefined, true);
              }
              
              // Only mark as sent AFTER successful processing
              sentEvents.push(play.eventId);
              logger.info(`[${new Date().toISOString()}] Successfully processed and marked ${play.typeDescKey} event ${play.eventId} as sent`);
              
            } catch (error) {
              logger.error(`[${new Date().toISOString()}] Error processing ${play.typeDescKey} event ${play.eventId}:`, error);
              // Don't add to sentEvents if there was an error - let it retry next time
            }
          }
        }
      }

      // Check for highlight URLs before sleeping
      await checkForHighlights();
      
      await sleep(config.app.script.live_sleep_time);
    }
    
    if (playByPlay.plays.some((play) => play.typeDescKey === "game-end")) {
      logger.info(`[${new Date().toISOString()}] Game has ended, transitioning to POSTGAME state`);
     
      currentState = GameStates.POSTGAME;
    }
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error in INGAME state:`, error);
   
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
  logger.info(`[${new Date().toISOString()}] Entering POSTGAME state`);
  
  
  try {
    logger.info(`[${new Date().toISOString()}] Fetching post-game data`);
    const boxscore = await fetchBoxscore(String(currentGame!.id));

    const awayScore = boxscore.awayTeam.score;
    const homeScore = boxscore.homeTeam.score;
    let winningTeam = currentGame?.awayTeam.name.default;
    let losingTeam = currentGame?.homeTeam.name.default;

    if (homeScore > awayScore) {
      winningTeam = currentGame?.homeTeam.name.default;
      losingTeam = currentGame?.awayTeam.name.default;
    }
    
    logger.info(`[${new Date().toISOString()}] Game result: ${winningTeam} defeats ${losingTeam} ${Math.max(homeScore, awayScore)}-${Math.min(homeScore, awayScore)}`);
    
    
    
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
    
    logger.info(`[${new Date().toISOString()}] Generating post-game image`);
    await postGameImage({
      home: {
        team: boxscore.homeTeam.commonName.default || "",
        score: boxscore.homeTeam.score,
        lineScores: lineScores.homeLineScores,
      },
      away: {
        team: boxscore.awayTeam.commonName.default || "",
        score: boxscore.awayTeam.score,
        lineScores: lineScores.awayLineScores,
      },
      shots: {
        home: boxscore.homeTeam.sog,
        away: boxscore.awayTeam.sog,
      },

      blockedShots: {
        home: Number(blockedShots?.homeValue) || 0,
        away: Number(blockedShots?.awayValue) || 0,
      },
      penalties: {
        home: Number(pims?.homeValue) || 0,
        away: Number(pims?.awayValue) || 0,
      },
      hits: {
        home: Number(hits?.homeValue) || 0,
        away: Number(hits?.awayValue) || 0,
      },
      faceoffPercentage: {
        home: Number(faceoffWinningPctg?.homeValue) || 0,
        away:  Number(faceoffWinningPctg?.awayValue) || 0,
      },
      giveaways: {
        home: Number(giveaways?.homeValue) || 0,
        away: Number(giveaways?.awayValue) || 0,
      },
      takeaways: {
        home: Number(takeaways?.homeValue) || 0,
        away: Number(takeaways?.awayValue) || 0,
      },
      powerPlay: {
        home: String(powerPlay?.homeValue) || "",
        away: String(powerPlay?.awayValue) || "",
      },
      powerPlayPctg:{
        home: Number(powerPlayPctg?.homeValue) || 0,
        away: Number(powerPlayPctg?.awayValue) || 0,
      }
      
    });

    logger.info(`[${new Date().toISOString()}] Sending post-game message`);
    await send(
      `The ${winningTeam} defeat the ${losingTeam} at ${currentGame!.venue.default}!\n\n${currentGame?.homeTeam.name.default}: ${boxscore.homeTeam.score}\n${currentGame?.awayTeam.name.default}: ${boxscore.awayTeam.score}`,
      currentGame!,
      [`./temp/postGame.png`],
    );

    currentState = GameStates.POSTGAMETHREESTARS;
    logger.info(`[${new Date().toISOString()}] Transitioning to POSTGAMETHREESTARS state`);
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error in POSTGAME state:`, error);
   
    currentState = GameStates.POSTGAMETHREESTARS; // Continue to next state even on error
  }
};

/**
 * Handles the post-game three stars state.
 * Fetches the game landing page and sends a message with the three stars if available.
 * Updates the current state to GameStates.POSTGAMEVID.
 * If the three stars are not available, it waits for 60 seconds before checking again, up to 20 times.
 * After 20 attempts, it transitions to the POSTGAMEVID state.
 */
const handlePostGameThreeStarsState = async () => {
  logger.info(`[${new Date().toISOString()}] Entering POSTGAMETHREESTARS state (attempt ${threeStarsRetryCount + 1}/20)`);
  
  try {
    const gameLanding = await fetchGameLanding(String(currentGame!.id));
    if (
      gameLanding?.summary.threeStars !== undefined &&
      gameLanding?.summary.threeStars.length > 0
    ) {
      logger.info(`[${new Date().toISOString()}] Three stars available, sending message`);
     
      const threeStars = gameLanding.summary.threeStars
        .map((star) => `${starEmojis(star.star)}: ${star.name.default}`)
        .join("\n");
        
      await send(
        `Tonight's Three Stars\n\n${threeStars}`,
        currentGame!,
      );
      
      // Reset retry counter and transition to video state
      threeStarsRetryCount = 0;
      currentState = GameStates.POSTGAMEVID;
      logger.info(`[${new Date().toISOString()}] Three stars found, transitioning to POSTGAMEVID state`);
    } else {
      threeStarsRetryCount++;
      if (threeStarsRetryCount >= 20) {
        logger.info(`[${new Date().toISOString()}] Three stars not available after 20 attempts, transitioning to POSTGAMEVID state`);
        threeStarsRetryCount = 0; // Reset for next game
        currentState = GameStates.POSTGAMEVID;
      } else {
        logger.info(`[${new Date().toISOString()}] Three stars not available yet, waiting 60 seconds (attempt ${threeStarsRetryCount}/20)`);
        await checkForHighlights();
        await sleep(config.app.script.three_stars_retry_sleep_time ?? 60000);
      }
    }
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error in POSTGAMETHREESTARS state:`, error);
    threeStarsRetryCount = 0; // Reset on error
    currentState = GameStates.POSTGAMEVID; // Continue to next state even on error
  }
};

// Add retry counters for post-game states
let videoRetryCount = 0;
let threeStarsRetryCount = 0;

/**
 * Handles the post-game video state.
 * Fetches the boxscore for the current game and sends the game recap video URL if available.
 * If no video is available, it waits for 60 seconds before checking again, up to 60 times.
 * After 60 attempts, it transitions to the ENDGAME state.
 */
const handlePostGameVideoState = async () => {
  logger.info(`[${new Date().toISOString()}] Entering POSTGAMEVID state (attempt ${videoRetryCount + 1}/60)`);
  
  try {
    const rightRail = await fetchGameCenterRightRail(String(currentGame!.id));
    const boxscore = await fetchBoxscore(String(currentGame!.id));
    
    // Check for both condensed game and recap video
    const condensedVideo = rightRail?.gameVideo?.condensedGame;
    const recapVideo = rightRail?.gameVideo?.threeMinRecap;
    
    logger.info(`[${new Date().toISOString()}] Video status - Condensed: ${condensedVideo || 'None'}, Recap: ${recapVideo || 'None'}`);
    
    // Check if both videos are available or if we've reached the retry limit
    const bothVideosAvailable = condensedVideo && recapVideo;
    
    if (bothVideosAvailable) {
      logger.info(`[${new Date().toISOString()}] Both videos available, sending both`);
      
      const awayTeamAbbrev = boxscore.awayTeam.abbrev.toLowerCase();
      const homeTeamAbbrev = boxscore.homeTeam.abbrev.toLowerCase();
      
      // Send condensed game
      const condensedUrl = `https://www.nhl.com/video/topic/condensed-game/${awayTeamAbbrev}-at-${homeTeamAbbrev}-condensed-game-${condensedVideo}`;
      await send(
        `Check out the condensed game of tonight's match between the ${currentGame?.homeTeam.name.default} and the ${currentGame?.awayTeam.name.default}:\n\n${condensedUrl}`,
        currentGame!,
      );
      
      // Send recap video
      const recapUrl = `https://www.nhl.com/video/topic/game-recaps/${awayTeamAbbrev}-at-${homeTeamAbbrev}-recap-${recapVideo}`;
      await send(
        `Check out the recap of tonight's match between the ${currentGame?.homeTeam.name.default} and the ${currentGame?.awayTeam.name.default}:\n\n${recapUrl}`,
        currentGame!,
      );
      
      // Reset retry counter and transition to endgame
      videoRetryCount = 0;
      currentState = GameStates.ENDGAME;
      logger.info(`[${new Date().toISOString()}] Both videos found and sent, transitioning to ENDGAME state`);
    } else if (videoRetryCount >= 60) {
      logger.info(`[${new Date().toISOString()}] Maximum retry attempts reached. Sending available videos if any.`);
      
      const awayTeamAbbrev = boxscore.awayTeam.abbrev.toLowerCase();
      const homeTeamAbbrev = boxscore.homeTeam.abbrev.toLowerCase();
      
      // Send whatever videos are available
      if (condensedVideo) {
        const condensedUrl = `https://www.nhl.com/video/topic/condensed-game/${awayTeamAbbrev}-at-${homeTeamAbbrev}-condensed-game-${condensedVideo}`;
        await send(
          `Check out the condensed game of tonight's match between the ${currentGame?.homeTeam.name.default} and the ${currentGame?.awayTeam.name.default}:\n\n${condensedUrl}`,
          currentGame!,
        );
      }
      
      if (recapVideo) {
        const recapUrl = `https://www.nhl.com/video/topic/game-recaps/${awayTeamAbbrev}-at-${homeTeamAbbrev}-recap-${recapVideo}`;
        await send(
          `Check out the recap of tonight's match between the ${currentGame?.homeTeam.name.default} and the ${currentGame?.awayTeam.name.default}:\n\n${recapUrl}`,
          currentGame!,
        );
      }
      
      videoRetryCount = 0; // Reset for next game
      currentState = GameStates.ENDGAME;
      logger.info(`[${new Date().toISOString()}] Sent available videos after max retries, transitioning to ENDGAME state`);
    } else {
      videoRetryCount++;
      logger.info(`[${new Date().toISOString()}] Waiting for both videos, attempt ${videoRetryCount}/60`);
      await checkForHighlights();
      await sleep(config.app.script.video_retry_sleep_time ?? 60000);
    }
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error in POSTGAMEVID state:`, error);
    videoRetryCount = 0; // Reset on error
    currentState = GameStates.ENDGAME; // Continue to next state even on error
  }
};

/**
 * Handles the end game state.
 * This function calculates sleep time until 2 AM the next day (local time) to prevent processing the same game twice.
 * @returns {Promise<void>} A promise that resolves when the current state is set to "WAITING".
 */
const handleEndGameState = async () => {
  logger.info(`[${new Date().toISOString()}] Entering ENDGAME state, calculating sleep until 2 AM next day`);
  
  try {
    // Get current time in the configured timezone
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1); // Move to next day
    tomorrow.setHours(2, 0, 0, 0); // Set to 2:00 AM
    
    // Calculate milliseconds until 2 AM tomorrow
    let sleepDuration = tomorrow.getTime() - now.getTime();
    
    // If somehow we're already past 2 AM and the calculation is negative, sleep until 2 AM today
    if (sleepDuration < 0) {
      const today2AM = new Date(now);
      today2AM.setHours(2, 0, 0, 0);
      sleepDuration = today2AM.getTime() - now.getTime();
      
      // If still negative, we're between midnight and 2 AM, so sleep until 2 AM tomorrow
      if (sleepDuration < 0) {
        sleepDuration = tomorrow.getTime() - now.getTime();
      }
    }
    
    const hoursUntil2AM = (sleepDuration / (1000 * 60 * 60)).toFixed(1);
    logger.info(`[${new Date().toISOString()}] Sleeping for ${hoursUntil2AM} hours until 2 AM (${tomorrow.toISOString()})`);
    
    await sleep(sleepDuration);
    currentState = GameStates.WAITING;
    logger.info(`[${new Date().toISOString()}] Woke up at 2 AM, transitioning back to WAITING state`);
  } catch (error) {
    logger.error(`[${new Date().toISOString()}] Error in ENDGAME state:`, error);
    // Fall back to default sleep time on error
    await sleep(config.app.script.endgame_sleep_time ?? 25200000);
    currentState = GameStates.WAITING;
  }
};

/**
 * The main function that controls the game state transitions.
 * @param replayDate - Optional date in "YYYY-MM-DD" format to run the bot as if it were that date. Used for testing and replays.
 * @returns A Promise that resolves to void.
 */
const main = async(replayDate?: string): Promise<void> => {
  // Set date override if provided
  if (replayDate) {
    setDateOverride(replayDate);
    logger.info(`[${new Date().toISOString()}] NHL GameBot started in REPLAY MODE for date: ${replayDate}`);
  } else {
    logger.info(`[${new Date().toISOString()}] NHL GameBot started`);
  }

  
  while (true) {
    try {
      logger.info(`[${new Date().toISOString()}] Current state: ${currentState}`);
      
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
      logger.error(`[${new Date().toISOString()}] Unhandled error in main loop:`, error);
     
      
      // Sleep before retrying
      await sleep(config.app.script.main_loop_error_sleep_time ?? 300000);
    }
  }
};

// Start the bot

logger.info(`[${new Date().toISOString()}] Starting NHL GameBot...`);
main().catch((error) => {
  logger.error(`[${new Date().toISOString()}] Fatal error in main function:`, error);
  process.exit(1);
});

// Export internal state and handlers for testing
export {
  GameStates,
  currentState,
  currentGame,
  prefTeam,
  oppTeam,
  hasSentIntermission,
  sentEvents,
  goalPosts,
  setCurrentState,
  setCurrentGame,
  setPrefTeam,
  setOppTeam,
  setHasSentIntermission,
  setSentEvents,
  setGoalPosts,
  checkForHighlights,
  handleWaitingState,
  handlePregameState,
  handleInGameState,
  handlePostGameState,
  handlePostGameThreeStarsState,
  handlePostGameVideoState,
  handleEndGameState,
  main
};

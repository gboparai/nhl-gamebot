import config from "../config.json";
import {
  fetchTeamSummaries,
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
import { teamHashtag } from "./social/twitter";
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
  const nhlScores: NHLScores = await fetchNHLScores(
    getCurrentDateEasternTime(),
  );
  currentGame = nhlScores.games.find(
    (game) =>
      game.awayTeam.abbrev === config.app.script.team ||
      game.homeTeam.abbrev === config.app.script.team,
  );

  if (currentGame !== undefined) {
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

    await sleep(sleepTime.getTime() - Date.now());
    currentState = GameStates.PREGAME;
  } else {
    await sleep(25200000);
  }
};

/**
 * Handles the pregame state of the game.
 * Fetches game landing, boxscore, team summaries, referee details, and performs pregame actions.
 * @returns {Promise<void>} A promise that resolves when the pregame state is handled.
 */
const handlePregameState = async () => {
  if (currentGame !== undefined) {
    const teamSummaries = await fetchTeamSummaries();
    const homeTeamSummary = teamSummaries.data.find(
      (team) => team.teamId === currentGame!.homeTeam.id,
    );
    const awayTeamSummary = teamSummaries.data.find(
      (team) => team.teamId === currentGame!.awayTeam.id,
    );
    const refereeDetails = await fetchGameDetails(config.app.script.teamName);

    if (refereeDetails.confirmed === false) {
      await sleep(config.app.script.pregame_sleep_time);
    } else {
      const formattedTime12Hr = convertUTCToLocalTime(
        currentGame.startTimeUTC,
        config.app.script.timeZone,
      );
      await preGameImage({
        homeTeam: currentGame.homeTeam.name.default,
        awayTeam: currentGame.awayTeam.name.default,
        homeHashtag: teamHashtag(currentGame.homeTeam.name.default) || "",
        awayHashtag: teamHashtag(currentGame.awayTeam.name.default) || "",
        venue: currentGame.venue.default,
        date: moment(currentGame.startTimeUTC).format("MMMM D"),
        time: formattedTime12Hr,
        homeLine1:
          currentGame.gameType === 3
            ? currentGame.homeTeam.record || ""
            : `${homeTeamSummary?.wins}-${homeTeamSummary?.losses}-${homeTeamSummary?.otLosses}`,
        homeLine2: "",
        awayLine1:
          currentGame.gameType === 3
            ? currentGame.awayTeam.record || ""
            : `${awayTeamSummary?.wins}-${awayTeamSummary?.losses}-${awayTeamSummary?.otLosses}`,
        awayLine2: "",
      });

      send(
        `Tune in tonight when the ${prefTeam?.name.default} take on the ${oppTeam?.name.default} at ${currentGame.venue.default}.
                \n\n🕢 ${formattedTime12Hr}\n📺 ${currentGame.tvBroadcasts.map((broadcast) => broadcast.network).join(", ")}`,
        currentGame,
        [`./temp/preGame.png`],
      );
      await gameImage({
        shots: {
          pref: homeTeamSummary?.shotsForPerGame || 0,
          opp: awayTeamSummary?.shotsForPerGame || 0,
        },
        pentaltyKillPercentage: {
          pref: homeTeamSummary?.penaltyKillPct || 0,
          opp: awayTeamSummary?.penaltyKillPct || 0,
        },
        powerPlayPercentage: {
          pref: homeTeamSummary?.powerPlayPct || 0,
          opp: awayTeamSummary?.powerPlayPct || 0,
        },
        goalsAgainstPerGame: {
          pref: homeTeamSummary?.goalsAgainstPerGame || 0,
          opp: awayTeamSummary?.goalsAgainstPerGame || 0,
        },
        goalsForPerGame: {
          pref: homeTeamSummary?.goalsForPerGame || 0,
          opp: awayTeamSummary?.goalsForPerGame || 0,
        },
        faceoffPercentage: {
          pref: homeTeamSummary?.faceoffWinPct || 0,
          opp: awayTeamSummary?.faceoffWinPct || 0,
        },
      })
      send(
       `🔥 Get ready for an epic showdown! Tonight, it's the ${prefTeam?.name.default} going head-to-head with the ${oppTeam?.name.default} at ${currentGame.venue.default}. You won’t want to miss a second of the action! `,
        currentGame,
        [`./temp/game.png`],
      );
      const dfLines = await dailyfaceoffLines(prefTeam?.name.default || "");
      if (dfLines.confirmed) {
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
    
      const dfLinesOpps = await dailyfaceoffLines(oppTeam?.name.default || "");
      if (dfLinesOpps.confirmed) {
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
      }

      const refereeDetails: GameDetails | undefined = await fetchGameDetails(
        config.app.script.teamName,
      );
      if (refereeDetails?.confirmed) {
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
      }

      const sleepTime = new Date(currentGame.startTimeUTC);
      await sleep(sleepTime.getTime() - Date.now());
      sentEvents = [];
      currentState = GameStates.INGAME;
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
  const nhlScores: NHLScores = await fetchNHLScores(
    getCurrentDateEasternTime(),
  );
  currentGame = nhlScores.games.find(
    (game) =>
      game.awayTeam.abbrev === config.app.script.team ||
      game.homeTeam.abbrev === config.app.script.team,
  );
  prefTeam =
    currentGame?.awayTeam.abbrev === config.app.script.team
      ? currentGame.awayTeam
      : currentGame?.homeTeam;
  oppTeam =
    currentGame?.awayTeam.abbrev === config.app.script.team
      ? currentGame.homeTeam
      : currentGame?.awayTeam;
  const playByPlay = await fetchPlayByPlay(String(currentGame!.id));
  if (playByPlay.clock.inIntermission) {
    if (!hasSentIntermission) {
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
      
      await intermissionImage({
        pref: {
          team: prefTeam?.name.default || "",
          score: boxscore.summary.linescore.totals.home,
          lineScores: lineScores.homeLineScores,
        },
        opp: {
          team: oppTeam?.name.default || "",
          score: boxscore.summary.linescore.totals.away,
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

      send(
        `It's end of the ${ordinalSuffixOf(playByPlay?.displayPeriod || 0)} period at ${currentGame!.venue.default}
                    \n\n${currentGame?.homeTeam.name.default}: ${boxscore.summary.linescore.totals.home}\n${currentGame?.awayTeam.name.default}: ${boxscore.summary.linescore.totals.away}
                `,
        currentGame!,
        [`./temp/intermission.png`],
      );
    }
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
      lastEventID = plays[plays.length - 1]?.sortOrder || lastEventID;
      plays.forEach((play) => {
        sentEvents.push(play.eventId);
        //TODO add type of goal
        if (play.typeDescKey === "goal") {
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

          send(goalMessage, currentGame!);
        }

        //TODO add type of penalty
        else if (play.typeDescKey === "penalty") {
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
          send(penaltyMessage, currentGame!);
        } else if (play.typeDescKey === "period-start") {
          send(
            `It's time for the ${ordinalSuffixOf(playByPlay?.displayPeriod || 0)} period at ${currentGame!.venue.default}. let's go ${prefTeam?.name.default}!`,
            currentGame!,
          );
        }
      });
    }
    await sleep(config.app.script.live_sleep_time);
  }
  if (playByPlay.plays.some((play) => play.typeDescKey === "game-end")) {
    currentState = GameStates.POSTGAME;
    lastEventID = 0;
  }
};

/**
 * Handles the post-game state of the game.
 * Fetches the boxscore and play-by-play data for the current game,
 * determines the winning and losing teams based on the scores,
 * sends a message with the game result, and updates the current state to POSTGAMETHREESTARS.
 */
const handlePostGameState = async () => {
  const boxscore = await fetchBoxscore(String(currentGame!.id));

  const awayScore = boxscore.summary.linescore.totals.away;
  const homeScore = boxscore.summary.linescore.totals.home;
  let winningTeam = currentGame?.awayTeam.name.default;
  let losingTeam = currentGame?.homeTeam.name.default;

  if (homeScore > awayScore) {
    winningTeam = currentGame?.homeTeam.name.default;
    losingTeam = currentGame?.awayTeam.name.default;
  }
  
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
  
  await postGameImage({
    pref: {
      team: prefTeam?.name.default || "",
      score: boxscore.summary.linescore.totals.home,
      lineScores: lineScores.homeLineScores,
    },
    opp: {
      team: oppTeam?.name.default || "",
      score: boxscore.summary.linescore.totals.away,
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

  send(
    `The ${winningTeam} defeat the ${losingTeam} at ${currentGame!.venue.default}!
            \n${currentGame?.homeTeam.name.default}: ${boxscore.summary.linescore.totals.home}\n${currentGame?.awayTeam.name.default}: ${boxscore.summary.linescore.totals.away}
        `,
    currentGame!,
    [`./temp/postGame.png`],
  );

  currentState = GameStates.POSTGAMETHREESTARS;
};

/**
 * Handles the post-game three stars state.
 * Fetches the game landing page and sends a message with the three stars if available.
 * Updates the current state to GameStates.POSTGAMEVID.
 * If the three stars are not available, it waits for 60 seconds before proceeding.
 */
const handlePostGameThreeStarsState = async () => {
  const gameLanding = await fetchGameLanding(String(currentGame!.id));
  if (
    gameLanding?.summary.threeStars !== undefined &&
    gameLanding?.summary.threeStars.length > 0
  ) {
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
  } else {
    await sleep(60000);
  }
};

/**
 * Handles the post-game video state.
 * Fetches the boxscore for the current game and sends the game recap video URL if available.
 * If no video is available, it waits for 60 seconds before transitioning to the ENDGAME state.
 */
const handlePostGameVideoState = async () => {
  const boxscore = await fetchBoxscore(String(currentGame!.id));
  const video = boxscore?.gameVideo?.threeMinRecap;
  if (video) {
    const videoUrl = `https://www.nhl.com/video/recap-${boxscore.awayTeam.name.default}-at-${boxscore.homeTeam.name.default}-${moment().format("M-D-YY")}-${video}`;
    send(
      `Check out the game recap for tonight's match between the ${currentGame?.homeTeam.name.default} and the ${currentGame?.awayTeam.name.default}:
            \n\n${videoUrl}`,
      currentGame!,
    );
  } else {
    await sleep(60000);
  }
  currentState = GameStates.ENDGAME;
};

/**
 * Handles the end game state.
 * This function waits for a specific period of time and then sets the current state to "WAITING".
 * @returns {Promise<void>} A promise that resolves when the current state is set to "WAITING".
 */
const handleEndGameState = async () => {
  await sleep(25200000);
  currentState = GameStates.WAITING;
};

/**
 * The main function that controls the game state transitions.
 * @returns A Promise that resolves to void.
 */
const main = async(): Promise<void> => {
  while (true) {
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


main();

import { createCanvas } from "canvas";
import path from "path";
import {
  addText,
  addImageAsBackground,
  saveCanvasImage,
  loadCustomFont,
  drawStackedHorizontalBarGraph,
  addSquareWithGoals,
  addTeamLogo,
  LineScore,
  calculatePercentage,
  getTeamColor,
} from "./utils";

/**
 * Represents the parameters for a post-game report.
 */
export type PostGameParams = {
  home: {
    team: string;
    score: number;
    lineScores: LineScore[];
  };
  away: {
    team: string;
    score: number;
    lineScores: LineScore[];
  };
  shots: {
    home: number;
    away: number;
  };
  blockedShots: {
    home: number;
    away: number;
  };
  penalties: {
    home: number;
    away: number;
  };
  hits: {
    home: number;
    away: number;
  };
  faceoffPercentage: {
    home: number;
    away: number;
  };
  giveaways: {
    home: number;
    away: number;
  };
  takeaways: {
    home: number;
    away: number;
  };
  powerPlay: {
    home: string;
    away:  string;
  };
  powerPlayPctg: {
    home: number;
    away: number;
  };
};



/**
 * Renders the post-game report graphic.
 * @param params - The game parameters for the post-game report.
 * @returns A promise that resolves when the post-game graphic is rendered.
 */
export default async function postGame(
  params: PostGameParams,
): Promise<void> {
  const canvas = createCanvas(800, 600);

  await loadCustomFont(
    {
      fontPath: path.join(process.cwd(), "assets/fonts/Roboto-Bold.ttf"),
      family: "RobotoBold",
    },
    canvas,
  );

  await loadCustomFont(
    {
      fontPath: path.join(process.cwd(), "assets/fonts/Roboto-Regular.ttf"),
      family: "RobotoRegular",
    },
    canvas,
  );

  const ctx = canvas.getContext("2d");
  await addImageAsBackground(
    ctx,
    canvas,
    "./assets/images/BG2022-Gameday-ScoreReport.png",
  );

  addText(ctx, {
    text: "END OF GAME RECAP",
    x: canvas.width / 2,
    y: 70,
    font: "48px RobotoBold",
    color: "white",
    textAlign: "center",
  });

  const barLength = 540;
  const segment1Color = getTeamColor(params.home.team ||'');
  const segment2Color = getTeamColor(params.away.team ||'');

  const barGraphOptions = {
    x: 40,
    y: 120,
    height: 50,

    bars: [
      {
        overallLabel: "Shots",
        segments: [
          {
            value: calculatePercentage(params.shots.home, params.shots.home + params.shots.away) * barLength,
            label: String(params.shots.home),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.shots.away, params.shots.home + params.shots.away) * barLength,
            label: String(params.shots.away),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Faceoff Percentage",
        segments: [
          {
            value: calculatePercentage(params.faceoffPercentage.home, params.faceoffPercentage.home + params.faceoffPercentage.away) * barLength,
            label: `${(params.faceoffPercentage.home*100).toFixed(2)}%`,
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.faceoffPercentage.away, params.faceoffPercentage.home + params.faceoffPercentage.away) * barLength,
            label:`${(params.faceoffPercentage.away*100).toFixed(2)}%`,
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Power Play",
        segments: [
          {
            value: calculatePercentage(params.powerPlayPctg.home, params.powerPlayPctg.home + params.powerPlayPctg.away) * barLength,
            label: params.powerPlay.home,
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.powerPlayPctg.away, params.powerPlayPctg.home + params.powerPlayPctg.away) * barLength,
            label: params.powerPlay.away,
            color: segment2Color,
          },
        ],
      },
      
      {
        overallLabel: "Penalties Minutes",
        segments: [
          {
            value: calculatePercentage(params.penalties.home, params.penalties.home + params.penalties.away) * barLength,
            label: String(params.penalties.home),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.penalties.away, params.penalties.home + params.penalties.away) * barLength,
            label: String(params.penalties.away),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Hits",
        segments: [
          {
            value: calculatePercentage(params.hits.home, params.hits.home + params.hits.away) * barLength,
            label: String(params.hits.home),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.hits.away, params.hits.home + params.hits.away) * barLength,
            label: String(params.hits.away),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Blocked Shots",
        segments: [
          {
            value: calculatePercentage(params.blockedShots.home, params.blockedShots.home + params.blockedShots.away) * barLength,
            label: String(params.blockedShots.home),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.blockedShots.away, params.blockedShots.home + params.blockedShots.away) * barLength,
            label: String(params.blockedShots.away),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Giveaways",
        segments: [
          {
            value: calculatePercentage(params.giveaways.home, params.giveaways.home + params.giveaways.away) * barLength,
            label: String(params.giveaways.home),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.giveaways.away, params.giveaways.home + params.giveaways.away) * barLength,
            label: String(params.giveaways.away),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Takeaways",
        segments: [
          {
            value: calculatePercentage(params.takeaways.home, params.takeaways.home + params.takeaways.away) * barLength,
            label: String(params.takeaways.home),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.takeaways.away, params.takeaways.home + params.takeaways.away) * barLength,
            label: String(params.takeaways.away),
            color: segment2Color,
          },
        ],
      },
    ],
    overallLabelWidth: 200,
    labelColor: "#ffffff",
    barSpacing: 20,
  };

  await drawStackedHorizontalBarGraph(ctx, barGraphOptions);

  const logoWidth = 120;
  const logoHeight = 80;
  const logoSpacing = 60;
  const textSpacing = 0;

  await addTeamLogo(ctx, {
    teamName: params.home.team,
    x: 810,
    y: 120,
    width: logoWidth,
    height: logoHeight,
  });
  
  addText(ctx, {
    text: String(params.home.score),
    x: 810 + logoWidth + textSpacing,
    y: 165,
    font: "72px RobotoBold",
    color: "white",
    textAlign: "left",
  });

  await addTeamLogo(ctx, {
    teamName: params.away.team,
    x: 810 + logoSpacing + logoWidth + textSpacing,
    y: 120,
    width: logoWidth,
    height: logoHeight,
  });

  addText(ctx, {
    text: String(params.away.score),
    x: 810 + logoSpacing + logoWidth * 2 + textSpacing * 2,
    y: 165,
    font: "72px RobotoBold",
    color: "white",
    textAlign: "left",
  });

  addSquareWithGoals(ctx, {
    x: 810,
    y: 225,
    xPadding: 10,
    yPadding: 20,
    width: 360,
    lineItems: params.home.lineScores.map((lineScore) => {
      if (lineScore.assists.length > 0) {
        return `[${lineScore.time}] ${lineScore.goalScorer} (${lineScore.assists.join(", ")})`;
      } else {
        return `[${lineScore.time}] ${lineScore.goalScorer} (unassisted)`;
      }
    }),
    height: 205,
    transparency: 0.25,
  });

  addSquareWithGoals(ctx, {
    x: 810,
    y: 440,
    xPadding: 10,
    yPadding: 20,
    width: 360,
    lineItems: params.away.lineScores.map((lineScore) => {
      if (lineScore.assists.length > 0) {
        return `[${lineScore.time}] - ${lineScore.goalScorer} (${lineScore.assists.join(", ")})`;
      } else {
        return `[${lineScore.time}] - ${lineScore.goalScorer} (unassisted)`;
      }
    }),
    height: 205,
    transparency: 0.25,
  });

  await saveCanvasImage(canvas, "./temp/postGame.png");
}
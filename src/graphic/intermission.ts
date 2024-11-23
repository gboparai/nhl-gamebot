import { createCanvas } from "canvas";
import {
  addText,
  addImageAsBackground,
  saveCanvasImage,
  loadCustomFont,
  drawStackedHorizontalBarGraph,
  addSquareWithGoals,
  addTeamLogo,
  LineScore,
  calculatePercentage
} from "./utils";

/**
 * Represents the parameters for an intermission game.
 */
export type IntermissionGameParams = {
  pref: {
    team: string;
    score: number;
    lineScores: LineScore[];
  };
  opp: {
    team: string;
    score: number;
    lineScores: LineScore[];
  };
  shots: {
    pref: number;
    opp: number;
  };
  blockedShots: {
    pref: number;
    opp: number;
  };
  penalties: {
    pref: number;
    opp: number;
  };
  hits: {
    pref: number;
    opp: number;
  };
  faceoffPercentage: {
    pref: number;
    opp: number;
  };
  giveaways: {
    pref: number;
    opp: number;
  };
  takeaways: {
    pref: number;
    opp: number;
  };
  powerPlay: {
    pref: string;
    opp:  string;
  };
  powerPlayPctg: {
    pref: number;
    opp: number;
  };
};



/**
 * Renders the intermission report graphic.
 * @param params - The game parameters for the intermission report.
 * @returns A promise that resolves when the intermission graphic is rendered.
 */
export default async function intermission(
  params: IntermissionGameParams,
): Promise<void> {
  const canvas = createCanvas(800, 600);

  await loadCustomFont(
    {
      fontPath: "./assets/fonts/Roboto-Bold.ttf",
      family: "RobotoBold",
    },
    canvas,
  );

  await loadCustomFont(
    {
      fontPath: "./assets/fonts/Roboto-Regular.ttf",
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
    text: "INTERMISSION REPORT",
    x: canvas.width / 2,
    y: 70,
    font: "48px RobotoBold",
    color: "white",
    textAlign: "center",
  });

  const barLength = 540;
  const segment1Color = "rgba(0, 132, 61, 0.75)";
  const segment2Color = "rgba(0, 32, 91, 0.75)";

  const barGraphOptions = {
    x: 40,
    y: 120,
    height: 50,

    bars: [
      {
        overallLabel: "Shots",
        segments: [
          {
            value: calculatePercentage(params.shots.pref, params.shots.pref + params.shots.opp) * barLength,
            label: String(params.shots.pref),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.shots.opp, params.shots.pref + params.shots.opp) * barLength,
            label: String(params.shots.opp),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Faceoff Percentage",
        segments: [
          {
            value: calculatePercentage(params.faceoffPercentage.pref, params.faceoffPercentage.pref + params.faceoffPercentage.opp) * barLength,
            label: `${(params.faceoffPercentage.pref*100).toFixed(2)}%`,
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.faceoffPercentage.opp, params.faceoffPercentage.pref + params.faceoffPercentage.opp) * barLength,
            label:`${(params.faceoffPercentage.opp*100).toFixed(2)}%`,
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Power Play",
        segments: [
          {
            value: calculatePercentage(params.powerPlayPctg.pref, params.powerPlayPctg.pref + params.powerPlayPctg.opp) * barLength,
            label: params.powerPlay.pref,
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.powerPlayPctg.opp, params.powerPlayPctg.pref + params.powerPlayPctg.opp) * barLength,
            label: params.powerPlay.opp,
            color: segment2Color,
          },
        ],
      },
      
      {
        overallLabel: "Penalties Minutes",
        segments: [
          {
            value: calculatePercentage(params.penalties.pref, params.penalties.pref + params.penalties.opp) * barLength,
            label: String(params.penalties.pref),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.penalties.opp, params.penalties.pref + params.penalties.opp) * barLength,
            label: String(params.penalties.opp),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Hits",
        segments: [
          {
            value: calculatePercentage(params.hits.pref, params.hits.pref + params.hits.opp) * barLength,
            label: String(params.hits.pref),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.hits.opp, params.hits.pref + params.hits.opp) * barLength,
            label: String(params.hits.opp),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Blocked Shots",
        segments: [
          {
            value: calculatePercentage(params.blockedShots.pref, params.blockedShots.pref + params.blockedShots.opp) * barLength,
            label: String(params.blockedShots.pref),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.blockedShots.opp, params.blockedShots.pref + params.blockedShots.opp) * barLength,
            label: String(params.blockedShots.opp),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Giveaways",
        segments: [
          {
            value: calculatePercentage(params.giveaways.pref, params.giveaways.pref + params.giveaways.opp) * barLength,
            label: String(params.giveaways.pref),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.giveaways.opp, params.giveaways.pref + params.giveaways.opp) * barLength,
            label: String(params.giveaways.opp),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Takeaways",
        segments: [
          {
            value: calculatePercentage(params.takeaways.pref, params.takeaways.pref + params.takeaways.opp) * barLength,
            label: String(params.takeaways.pref),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.takeaways.opp, params.takeaways.pref + params.takeaways.opp) * barLength,
            label: String(params.takeaways.opp),
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
    teamName: params.pref.team,
    x: 810,
    y: 120,
    width: logoWidth,
    height: logoHeight,
  });

  addText(ctx, {
    text: String(params.pref.score),
    x: 810 + logoWidth + textSpacing,
    y: 165,
    font: "72px RobotoBold",
    color: "white",
    textAlign: "left",
  });

  await addTeamLogo(ctx, {
    teamName: params.opp.team,
    x: 810 + logoSpacing + logoWidth + textSpacing,
    y: 120,
    width: logoWidth,
    height: logoHeight,
  });

  addText(ctx, {
    text: String(params.opp.score),
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
    lineItems: params.pref.lineScores.map((lineScore) => {
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
    lineItems: params.opp.lineScores.map((lineScore) => {
      if (lineScore.assists.length > 0) {
        return `[${lineScore.time}] - ${lineScore.goalScorer} (${lineScore.assists.join(", ")})`;
      } else {
        return `[${lineScore.time}] - ${lineScore.goalScorer} (unassisted)`;
      }
    }),
    height: 205,
    transparency: 0.25,
  });

  await saveCanvasImage(canvas, "./temp/intermission.png");
}
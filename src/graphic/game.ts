import { createCanvas } from "canvas";
import path from "path";
import {
  addText,
  addImageAsBackground,
  saveCanvasImage,
  loadCustomFont,
  drawStackedHorizontalBarGraph,
  calculatePercentage,
  getTeamColor,
} from "./utils";

export type GameImageParams = {
  home: {
    team: string;
  };
  away: {
    team: string;
  };
  shots: {
    home: number;
    away: number;
  };
  shotsAgainst: {
    home: number;
    away: number;
  };
  goalsForPerGame: {
    home: number;
    away: number;
  };
  goalsAgainstPerGame: {
    home: number;
    away: number;
  };
  powerPlayPercentage: {
    home: number;
    away: number;
  };
  pentaltyKillPercentage: {
    home: number;
    away: number;
  };
  faceoffPercentage: {
    home: number;
    away: number;
  };
};


export default async function createGameImage(params: GameImageParams): Promise<void> {
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
    text: "MATCHUP REPORT",
    x: canvas.width / 2,
    y: 70,
    font: "48px RobotoBold",
    color: "white",
    textAlign: "center",
  });

  const barLength = 700;
  const segment1Color = getTeamColor(params.home.team);
  const segment2Color = getTeamColor(params.away.team);

  const barGraphOptions = {
    x: 140,
    y: 120,
    height: 50,

    bars: [
      {
        overallLabel: "Shots For Per Game",
        segments: [
          {
            value: calculatePercentage(params.shots.home, params.shots.home + params.shots.away) * barLength,
            label: String(params.shots.home.toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.shots.away, params.shots.home + params.shots.away) * barLength,
            label: String(params.shots.away.toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Shots Against Per Game",
        segments: [
          {
            value: calculatePercentage(params.shotsAgainst.home, params.shotsAgainst.home + params.shotsAgainst.away) * barLength,
            label: String(params.shotsAgainst.home.toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.shotsAgainst.away, params.shotsAgainst.home + params.shotsAgainst.away) * barLength,
            label: String(params.shotsAgainst.away.toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Power Play Percentage",
        segments: [
          {
            value: calculatePercentage(params.powerPlayPercentage.home, params.powerPlayPercentage.home + params.powerPlayPercentage.away) * barLength,
            label: String((params.powerPlayPercentage.home*100).toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.powerPlayPercentage.away, params.powerPlayPercentage.home + params.powerPlayPercentage.away) * barLength,
            label: String((params.powerPlayPercentage.away*100).toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Penalty Kill Percentage",
        segments: [
          {
            value: calculatePercentage(params.pentaltyKillPercentage.home, params.pentaltyKillPercentage.home + params.pentaltyKillPercentage.away) * barLength,
            label: String((params.pentaltyKillPercentage.home*100).toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.pentaltyKillPercentage.away, params.pentaltyKillPercentage.home + params.pentaltyKillPercentage.away) * barLength,
            label: String((params.pentaltyKillPercentage.away*100).toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Goals For Per Game",
        segments: [
          {
            value: calculatePercentage(params.goalsForPerGame.home, params.goalsForPerGame.home + params.goalsForPerGame.away) * barLength,
            label: String(params.goalsForPerGame.home.toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.goalsForPerGame.away, params.goalsForPerGame.home + params.goalsForPerGame.away) * barLength,
            label: String(params.goalsForPerGame.away.toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Goals Against Per Game",
        segments: [
          {
            value: calculatePercentage(params.goalsAgainstPerGame.home, params.goalsAgainstPerGame.home + params.goalsAgainstPerGame.away) * barLength,
            label: String(params.goalsAgainstPerGame.home.toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.goalsAgainstPerGame.away, params.goalsAgainstPerGame.home + params.goalsAgainstPerGame.away) * barLength,
            label: String(params.goalsAgainstPerGame.away.toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Faceoff Percentage",
        segments: [
          {
            value: calculatePercentage(params.faceoffPercentage.home, params.faceoffPercentage.home + params.faceoffPercentage.away) * barLength,
            label: String((params.faceoffPercentage.home*100).toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.faceoffPercentage.away, params.faceoffPercentage.home + params.faceoffPercentage.away) * barLength,
            label: String((params.faceoffPercentage.away*100).toFixed(2)),
            color: segment2Color,
          },
        ],
      },
    ],
    overallLabelWidth: 250,
    labelColor: "#ffffff",
    barSpacing: 20,
  };

  await drawStackedHorizontalBarGraph(ctx, barGraphOptions);
  await saveCanvasImage(canvas, "./temp/game.png");
}
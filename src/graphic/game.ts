import { createCanvas } from "canvas";
import {
  addText,
  addImageAsBackground,
  saveCanvasImage,
  loadCustomFont,
  drawStackedHorizontalBarGraph,
  calculatePercentage,
} from "./utils";

export type GameImageParams = {
  shots: {
    pref: number;
    opp: number;
  };
  goalsForPerGame: {
    pref: number;
    opp: number;
  };
  goalsAgainstPerGame: {
    pref: number;
    opp: number;
  };
  powerPlayPercentage: {
    pref: number;
    opp: number;
  };
  pentaltyKillPercentage: {
    pref: number;
    opp: number;
  };
  faceoffPercentage: {
    pref: number;
    opp: number;
  };
};


export default async function createGameImage(params: GameImageParams): Promise<void> {
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
    text: "MATCHUP REPORT",
    x: canvas.width / 2,
    y: 70,
    font: "48px RobotoBold",
    color: "white",
    textAlign: "center",
  });

  const barLength = 700;
  const segment1Color = "rgba(0, 132, 61, 0.75)";
  const segment2Color = "rgba(0, 32, 91, 0.75)";

  const barGraphOptions = {
    x: 140,
    y: 120,
    height: 50,

    bars: [
      {
        overallLabel: "Shots",
        segments: [
          {
            value: calculatePercentage(params.shots.pref, params.shots.pref + params.shots.opp) * barLength,
            label: String(params.shots.pref.toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.shots.opp, params.shots.pref + params.shots.opp) * barLength,
            label: String(params.shots.opp.toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Power Play Percentage",
        segments: [
          {
            value: calculatePercentage(params.powerPlayPercentage.pref, params.powerPlayPercentage.pref + params.powerPlayPercentage.opp) * barLength,
            label: String((params.powerPlayPercentage.pref*100).toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.powerPlayPercentage.opp, params.powerPlayPercentage.pref + params.powerPlayPercentage.opp) * barLength,
            label: String((params.powerPlayPercentage.opp*100).toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Penalty Kill Percentage",
        segments: [
          {
            value: calculatePercentage(params.pentaltyKillPercentage.pref, params.pentaltyKillPercentage.pref + params.pentaltyKillPercentage.opp) * barLength,
            label: String((params.pentaltyKillPercentage.pref*100).toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.pentaltyKillPercentage.opp, params.pentaltyKillPercentage.pref + params.pentaltyKillPercentage.opp) * barLength,
            label: String((params.pentaltyKillPercentage.opp*100).toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Goals For Per Game",
        segments: [
          {
            value: calculatePercentage(params.goalsForPerGame.pref, params.goalsForPerGame.pref + params.goalsForPerGame.opp) * barLength,
            label: String(params.goalsForPerGame.pref.toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.goalsForPerGame.opp, params.goalsForPerGame.pref + params.goalsForPerGame.opp) * barLength,
            label: String(params.goalsForPerGame.opp.toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Goals Against Per Game",
        segments: [
          {
            value: calculatePercentage(params.goalsAgainstPerGame.pref, params.goalsAgainstPerGame.pref + params.goalsAgainstPerGame.opp) * barLength,
            label: String(params.goalsAgainstPerGame.pref.toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.goalsAgainstPerGame.opp, params.goalsAgainstPerGame.pref + params.goalsAgainstPerGame.opp) * barLength,
            label: String(params.goalsAgainstPerGame.opp.toFixed(2)),
            color: segment2Color,
          },
        ],
      },
      {
        overallLabel: "Faceoff Percentage",
        segments: [
          {
            value: calculatePercentage(params.faceoffPercentage.pref, params.faceoffPercentage.pref + params.faceoffPercentage.opp) * barLength,
            label: String((params.faceoffPercentage.pref*100).toFixed(2)),
            color: segment1Color,
          },
          {
            value: calculatePercentage(params.faceoffPercentage.opp, params.faceoffPercentage.pref + params.faceoffPercentage.opp) * barLength,
            label: String((params.faceoffPercentage.opp*100).toFixed(2)),
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
  await saveCanvasImage(canvas, "./temp/game.png");
}
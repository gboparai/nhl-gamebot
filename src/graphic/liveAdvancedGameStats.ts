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
import { LiveAdvancedGameStats } from "../types";

export type LiveAdvancedGameStatsImageParams = {
  title: string;
  outputPath: string;
  home: {
    team: string;
    stats: LiveAdvancedGameStats;
  };
  away: {
    team: string;
    stats: LiveAdvancedGameStats;
  };
};

function metricLabel(value: number, decimals = 0): string {
  return value.toFixed(decimals);
}

export default async function createLiveAdvancedGameStatsImage(
  params: LiveAdvancedGameStatsImageParams,
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
    text: params.title,
    x: canvas.width / 2,
    y: 70,
    font: "48px RobotoBold",
    color: "white",
    textAlign: "center",
  });

  // Derive bar dimensions from canvas size so everything stays centred.
  // Background image sets the real canvas.width at runtime (typically 1200px).
  const labelWidth = 270;
  const sideMargin = 80;
  const barLength = canvas.width - sideMargin * 2 - labelWidth;
  const homeColor = getTeamColor(params.home.team);
  const awayColor = getTeamColor(params.away.team);

  const makeBar = (
    overallLabel: string,
    homeValue: number,
    awayValue: number,
    decimals = 0,
  ) => ({
    overallLabel,
    segments: [
      {
        value: calculatePercentage(homeValue, homeValue + awayValue) * barLength,
        label: metricLabel(homeValue, decimals),
        color: homeColor,
      },
      {
        value: calculatePercentage(awayValue, homeValue + awayValue) * barLength,
        label: metricLabel(awayValue, decimals),
        color: awayColor,
      },
    ],
  });

  const barGraphOptions = {
    x: sideMargin,
    y: 110,
    height: 38,
    bars: [
      makeBar("xG", params.home.stats.xg, params.away.stats.xg, 3),
      makeBar("xG 5v5", params.home.stats.xg_5v5, params.away.stats.xg_5v5, 3),
      makeBar("Corsi", params.home.stats.corsi, params.away.stats.corsi),
      makeBar("Corsi 5v5", params.home.stats.corsi_5v5, params.away.stats.corsi_5v5),
      makeBar("Fenwick", params.home.stats.fenwick, params.away.stats.fenwick),
      makeBar("Fenwick 5v5", params.home.stats.fenwick_5v5, params.away.stats.fenwick_5v5),
      makeBar("High Danger Chances", params.home.stats.hd_chances, params.away.stats.hd_chances),
      makeBar("High Danger Chances 5v5", params.home.stats.hd_chances_5v5, params.away.stats.hd_chances_5v5),
      makeBar("Scoring Chances", params.home.stats.scoring_chances, params.away.stats.scoring_chances),
      makeBar("Scoring Chances 5v5", params.home.stats.scoring_chances_5v5, params.away.stats.scoring_chances_5v5),
      makeBar("Slot Chances", params.home.stats.slot_chances, params.away.stats.slot_chances),
      makeBar("Slot Chances 5v5", params.home.stats.slot_chances_5v5, params.away.stats.slot_chances_5v5),
    ],
    overallLabelWidth: labelWidth,
    labelColor: "#ffffff",
    barSpacing: 6,
  };

  await drawStackedHorizontalBarGraph(ctx, barGraphOptions);
  await saveCanvasImage(canvas, params.outputPath);
}

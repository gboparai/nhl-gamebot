import * as fs from "fs";
import path from "path";
import preGameImage from "../src/graphic/preGame";
import intermissionImage from "../src/graphic/intermission";
import postGameImage from "../src/graphic/postGame";
import gameImage from "../src/graphic/game";
import liveAdvancedGameStatsImage from "../src/graphic/liveAdvancedGameStats";
import { LineScore } from "../src/graphic/utils";

const tempDir = path.join(process.cwd(), "temp");

function resetTemp(outputFilename: string) {
  if (fs.existsSync(tempDir)) {
    for (const entry of fs.readdirSync(tempDir)) {
      fs.rmSync(path.join(tempDir, entry), { force: true, recursive: true });
    }
  } else {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  return path.join(tempDir, outputFilename);
}

describe("Graphics Generation Tests", () => {

  test("should generate preGame image", async () => {
    const outputPath = resetTemp("preGame.png");
    const params = {
      homeTeam: "Canucks",
      awayTeam: "Flames",
      homeHashtag: "#Canucks",
      awayHashtag: "#Flames",
      venue: "Rogers Arena",
      date: "October 1",
      time: "7:00 PM",
      homeLine1: "12-8-3",
      homeLine2: "Season Series: 2-1-0",
      awayLine1: "10-10-2",
      awayLine2: "Season Series: 1-2-0",
    };
    await expect(preGameImage(params)).resolves.toBeUndefined();
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test("should generate intermission image", async () => {
    const outputPath = resetTemp("intermission.png");
    const params = {
      home: {
        team: "Canucks",
        score: 2,
        lineScores: [
          { time: "5:23", type: "ev", goalScorer: "Elias Pettersson", assists: ["Quinn Hughes", "Brock Boeser"] },
          { time: "14:17", type: "pp", goalScorer: "J.T. Miller", assists: ["Quinn Hughes"] },
        ] as LineScore[],
      },
      away: {
        team: "Flames",
        score: 1,
        lineScores: [
          { time: "8:42", type: "ev", goalScorer: "Nazem Kadri", assists: ["Jonathan Huberdeau", "Rasmus Andersson"] },
        ] as LineScore[],
      },
      shots: { home: 18, away: 14 },
      blockedShots: { home: 8, away: 6 },
      penalties: { home: 2, away: 3 },
      hits: { home: 16, away: 19 },
      faceoffPercentage: { home: 0.52, away: 0.48 },
      giveaways: { home: 3, away: 5 },
      takeaways: { home: 4, away: 2 },
      powerPlay: { home: "1/2", away: "0/1" },
      powerPlayPctg: { home: 0.50, away: 0 },
    };
    await expect(intermissionImage(params)).resolves.toBeUndefined();
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test("should generate postGame image", async () => {
    const outputPath = resetTemp("postGame.png");
    const params = {
      home: {
        team: "Canucks",
        score: 4,
        lineScores: [
          { time: "5:23", type: "ev", goalScorer: "Elias Pettersson", assists: ["Quinn Hughes", "Brock Boeser"] },
          { time: "14:17", type: "pp", goalScorer: "J.T. Miller", assists: ["Quinn Hughes"] },
          { time: "3:08", type: "ev", goalScorer: "Conor Garland", assists: ["Pius Suter"] },
          { time: "16:55", type: "en", goalScorer: "Brock Boeser", assists: [] },
        ] as LineScore[],
      },
      away: {
        team: "Flames",
        score: 2,
        lineScores: [
          { time: "8:42", type: "ev", goalScorer: "Nazem Kadri", assists: ["Jonathan Huberdeau", "Rasmus Andersson"] },
          { time: "11:29", type: "pp", goalScorer: "Elias Lindholm", assists: ["Tyler Toffoli", "Noah Hanifin"] },
        ] as LineScore[],
      },
      shots: { home: 32, away: 28 },
      blockedShots: { home: 12, away: 10 },
      penalties: { home: 4, away: 5 },
      hits: { home: 24, away: 28 },
      faceoffPercentage: { home: 0.53, away: 0.47 },
      giveaways: { home: 5, away: 7 },
      takeaways: { home: 6, away: 4 },
      powerPlay: { home: "2/4", away: "1/3" },
      powerPlayPctg: { home: 0.50, away: 0.333 },
    };
    await expect(postGameImage(params)).resolves.toBeUndefined();
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test("should generate game image", async () => {
    const outputPath = resetTemp("game.png");
    const params = {
      home: { team: "Canucks" },
      away: { team: "Flames" },
      shots: { home: 31.2, away: 29.8 },
      shotsAgainst: { home: 29.5, away: 30.7 },
      goalsForPerGame: { home: 3.1, away: 2.9 },
      goalsAgainstPerGame: { home: 2.8, away: 3.2 },
      powerPlayPercentage: { home: 0.224, away: 0.187 },
      pentaltyKillPercentage: { home: 0.813, away: 0.785 },
      faceoffPercentage: { home: 0.512, away: 0.488 },
    };
    await expect(gameImage(params)).resolves.toBeUndefined();
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test("should generate live advanced stats preview images", async () => {
    const balancedOutputPath = resetTemp("live-advanced-stats-preview-balanced.png");

    await expect(liveAdvancedGameStatsImage({
      title: "INTERMISSION ADVANCED STATS",
      outputPath: balancedOutputPath,
      home: {
        team: "WPG",
        stats: {
          xg: 1.64,
          xg_5v5: 0.998,
          corsi: 47,
          corsi_5v5: 40,
          fenwick: 40,
          fenwick_5v5: 33,
          hd_chances: 10,
          hd_chances_5v5: 6,
          scoring_chances: 24,
          scoring_chances_5v5: 19,
          slot_chances: 3,
          slot_chances_5v5: 2,
        },
      },
      away: {
        team: "COL",
        stats: {
          xg: 3.604,
          xg_5v5: 2.959,
          corsi: 70,
          corsi_5v5: 51,
          fenwick: 46,
          fenwick_5v5: 33,
          hd_chances: 20,
          hd_chances_5v5: 15,
          scoring_chances: 39,
          scoring_chances_5v5: 29,
          slot_chances: 13,
          slot_chances_5v5: 10,
        },
      },
    })).resolves.toBeUndefined();
    expect(fs.existsSync(balancedOutputPath)).toBe(true);

    const lopsidedOutputPath = resetTemp("live-advanced-stats-preview-lopsided.png");

    await expect(liveAdvancedGameStatsImage({
      title: "END OF GAME ADVANCED STATS",
      outputPath: lopsidedOutputPath,
      home: {
        team: "TOR",
        stats: {
          xg: 0.72,
          xg_5v5: 0.41,
          corsi: 28,
          corsi_5v5: 19,
          fenwick: 21,
          fenwick_5v5: 14,
          hd_chances: 4,
          hd_chances_5v5: 2,
          scoring_chances: 11,
          scoring_chances_5v5: 7,
          slot_chances: 1,
          slot_chances_5v5: 1,
        },
      },
      away: {
        team: "EDM",
        stats: {
          xg: 4.85,
          xg_5v5: 3.67,
          corsi: 81,
          corsi_5v5: 63,
          fenwick: 57,
          fenwick_5v5: 44,
          hd_chances: 23,
          hd_chances_5v5: 17,
          scoring_chances: 45,
          scoring_chances_5v5: 34,
          slot_chances: 16,
          slot_chances_5v5: 12,
        },
      },
    })).resolves.toBeUndefined();
    expect(fs.existsSync(lopsidedOutputPath)).toBe(true);
  });
});
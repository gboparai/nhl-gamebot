import * as fs from "fs";
import path from "path";
import preGameImage from "../src/graphic/preGame";
import intermissionImage from "../src/graphic/intermission";
import postGameImage from "../src/graphic/postGame";
import gameImage from "../src/graphic/game";
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
});
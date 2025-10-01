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
      pref: {
        team: "Canucks",
        score: 2,
        lineScores: [
          { time: "5:23", type: "ev", goalScorer: "Elias Pettersson", assists: ["Quinn Hughes", "Brock Boeser"] },
          { time: "14:17", type: "pp", goalScorer: "J.T. Miller", assists: ["Quinn Hughes"] },
        ] as LineScore[],
      },
      opp: {
        team: "Flames",
        score: 1,
        lineScores: [
          { time: "8:42", type: "ev", goalScorer: "Nazem Kadri", assists: ["Jonathan Huberdeau", "Rasmus Andersson"] },
        ] as LineScore[],
      },
      shots: { pref: 18, opp: 14 },
      blockedShots: { pref: 8, opp: 6 },
      penalties: { pref: 2, opp: 3 },
      hits: { pref: 16, opp: 19 },
      faceoffPercentage: { pref: 0.52, opp: 0.48 },
      giveaways: { pref: 3, opp: 5 },
      takeaways: { pref: 4, opp: 2 },
      powerPlay: { pref: "1/2", opp: "0/1" },
      powerPlayPctg: { pref: 0.50, opp: 0 },
    };
    await expect(intermissionImage(params)).resolves.toBeUndefined();
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test("should generate postGame image", async () => {
    const outputPath = resetTemp("postGame.png");
    const params = {
      pref: {
        team: "Canucks",
        score: 4,
        lineScores: [
          { time: "5:23", type: "ev", goalScorer: "Elias Pettersson", assists: ["Quinn Hughes", "Brock Boeser"] },
          { time: "14:17", type: "pp", goalScorer: "J.T. Miller", assists: ["Quinn Hughes"] },
          { time: "3:08", type: "ev", goalScorer: "Conor Garland", assists: ["Pius Suter"] },
          { time: "16:55", type: "en", goalScorer: "Brock Boeser", assists: [] },
        ] as LineScore[],
      },
      opp: {
        team: "Flames",
        score: 2,
        lineScores: [
          { time: "8:42", type: "ev", goalScorer: "Nazem Kadri", assists: ["Jonathan Huberdeau", "Rasmus Andersson"] },
          { time: "11:29", type: "pp", goalScorer: "Elias Lindholm", assists: ["Tyler Toffoli", "Noah Hanifin"] },
        ] as LineScore[],
      },
      shots: { pref: 32, opp: 28 },
      blockedShots: { pref: 12, opp: 10 },
      penalties: { pref: 4, opp: 5 },
      hits: { pref: 24, opp: 28 },
      faceoffPercentage: { pref: 0.53, opp: 0.47 },
      giveaways: { pref: 5, opp: 7 },
      takeaways: { pref: 6, opp: 4 },
      powerPlay: { pref: "2/4", opp: "1/3" },
      powerPlayPctg: { pref: 0.50, opp: 0.333 },
    };
    await expect(postGameImage(params)).resolves.toBeUndefined();
    expect(fs.existsSync(outputPath)).toBe(true);
  });

  test("should generate game image", async () => {
    const outputPath = resetTemp("game.png");
    const params = {
      pref: { team: "Canucks" },
      opp: { team: "Flames" },
      shots: { pref: 31.2, opp: 29.8 },
      shotsAgainst: { pref: 29.5, opp: 30.7 },
      goalsForPerGame: { pref: 3.1, opp: 2.9 },
      goalsAgainstPerGame: { pref: 2.8, opp: 3.2 },
      powerPlayPercentage: { pref: 0.224, opp: 0.187 },
      pentaltyKillPercentage: { pref: 0.813, opp: 0.785 },
      faceoffPercentage: { pref: 0.512, opp: 0.488 },
    };
    await expect(gameImage(params)).resolves.toBeUndefined();
    expect(fs.existsSync(outputPath)).toBe(true);
  });
});
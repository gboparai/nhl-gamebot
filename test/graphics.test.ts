import preGameImage from "../src/graphic/preGame";
import intermissionImage from "../src/graphic/intermission";
import postGameImage from "../src/graphic/postGame";
import gameImage from "../src/graphic/game";
import { LineScore } from "../src/graphic/utils";

describe("Graphics Generation Tests", () => {
  test("should generate preGame image", async () => {
    const params = {
      homeTeam: "Canucks",
      awayTeam: "Flames",
      homeHashtag: "#Canucks",
      awayHashtag: "#Flames",
      venue: "Rogers Arena",
      date: "October 1",
      time: "7:00 PM",
      homeLine1: "5-2-1",
      homeLine2: "Season Series: 2-1",
      awayLine1: "3-4-0",
      awayLine2: "Season Series: 1-2",
    };
    await expect(preGameImage(params)).resolves.toBeUndefined();
  });

  test("should generate intermission image", async () => {
    const params = {
      pref: {
        team: "Canucks",
        score: 2,
        lineScores: [
          { time: "1:10", type: "ev", goalScorer: "Brad Marchand", assists: ["Patrice Bergeron"] },
        ] as LineScore[],
      },
      opp: {
        team: "Flames",
        score: 1,
        lineScores: [
          { time: "2:05", type: "pp", goalScorer: "Auston Matthews", assists: [] },
        ] as LineScore[],
      },
      shots: { pref: 15, opp: 12 },
      blockedShots: { pref: 5, opp: 3 },
      penalties: { pref: 4, opp: 6 },
      hits: { pref: 20, opp: 18 },
      faceoffPercentage: { pref: 55, opp: 45 },
      giveaways: { pref: 2, opp: 4 },
      takeaways: { pref: 3, opp: 1 },
      powerPlay: { pref: "1/3", opp: "0/2" },
      powerPlayPctg: { pref: 33.3, opp: 0 },
    };
    await expect(intermissionImage(params)).resolves.toBeUndefined();
  });

  test("should generate postGame image", async () => {
    const params = {
      pref: {
        team: "Canucks",
        score: 3,
        lineScores: [
          { time: "1:10", type: "ev", goalScorer: "Brad Marchand", assists: ["Patrice Bergeron"] },
          { time: "2:20", type: "pp", goalScorer: "David Pastrnak", assists: ["Charlie McAvoy"] },
        ] as LineScore[],
      },
      opp: {
        team: "Flames",
        score: 2,
        lineScores: [
          { time: "1:30", type: "sh", goalScorer: "Auston Matthews", assists: [] },
        ] as LineScore[],
      },
      shots: { pref: 25, opp: 22 },
      blockedShots: { pref: 7, opp: 5 },
      penalties: { pref: 6, opp: 8 },
      hits: { pref: 30, opp: 25 },
      faceoffPercentage: { pref: 60, opp: 40 },
      giveaways: { pref: 3, opp: 5 },
      takeaways: { pref: 4, opp: 2 },
      powerPlay: { pref: "2/4", opp: "1/3" },
      powerPlayPctg: { pref: 50, opp: 33.3 },
    };
    await expect(postGameImage(params)).resolves.toBeUndefined();
  });

  test("should generate game image", async () => {
    const params = {
      pref: { team: "Canucks" },
      opp: { team: "Flames" },
      shots: { pref: 30, opp: 28 },
      shotsAgainst: { pref: 25, opp: 27 },
      goalsForPerGame: { pref: 3.2, opp: 2.8 },
      goalsAgainstPerGame: { pref: 2.5, opp: 3.0 },
      powerPlayPercentage: { pref: 25, opp: 20 },
      pentaltyKillPercentage: { pref: 80, opp: 75 },
      faceoffPercentage: { pref: 52, opp: 48 },
    };
    await expect(gameImage(params)).resolves.toBeUndefined();
  });
});

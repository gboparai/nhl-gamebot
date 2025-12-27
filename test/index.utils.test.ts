import {
  ordinalSuffixOf,
  getCurrentDateLocalTime,
  goalEmojis,
  thumbsDownEmojis,
  starEmojis,
  convertdescKeyToWords,
  convertUTCToLocalTime,
  getLastName,
  groupedList,
  splitArray,
  sleep,
  formatPeriodLabel,
  formatPeriodTime,
  transformGameLandingToLineScores,
} from "../src/utils";
import type { GameLanding } from "../src/types";

const runWithFakeTimers = async (
  testFn: () => void | Promise<void>,
  options?: Parameters<typeof jest.useFakeTimers>[0],
) => {
  jest.useFakeTimers(options);
  try {
    await testFn();
  } finally {
    jest.useRealTimers();
  }
};

describe("src/utils", () => {
  test("ordinalSuffixOf returns proper suffixes", () => {
    expect(ordinalSuffixOf(1)).toBe("1st");
    expect(ordinalSuffixOf(2)).toBe("2nd");
    expect(ordinalSuffixOf(3)).toBe("3rd");
    expect(ordinalSuffixOf(4)).toBe("4th");
    expect(ordinalSuffixOf(11)).toBe("11th");
    expect(ordinalSuffixOf(12)).toBe("12th");
    expect(ordinalSuffixOf(13)).toBe("13th");
    expect(ordinalSuffixOf(21)).toBe("21st");
  });

  test("getCurrentDateEasternTime uses fixed -4 offset", async () => {
    await runWithFakeTimers(() => {
      const mockNow = new Date("2024-07-01T12:00:00Z");
      jest.setSystemTime(mockNow);
      expect(getCurrentDateLocalTime("America/Los_Angeles")).toBe("2024-07-01");
    });
  });

  test("goalEmojis repeats goal light", () => {
    expect(goalEmojis(3)).toBe("🚨🚨🚨");
  });

  test("thumbsDownEmojis repeats thumbs down", () => {
    expect(thumbsDownEmojis(2)).toBe("👎🏻👎🏻");
  });

  test("starEmojis returns empty string when count is zero", () => {
    expect(starEmojis(0)).toBe("");
  });

  test("convertdescKeyToWords replaces hyphens with spaces", () => {
    expect(convertdescKeyToWords("penalty-shot"))
      .toBe("penalty shot");
  });

  test("convertUTCToLocalTime converts to supplied timezone", () => {
    const result = convertUTCToLocalTime(
      "2024-01-15T15:00:00Z",
      "America/New_York",
    );
    expect(result).toBe("10:00 AM");
  });

  test("getLastName returns everything after first name", () => {
    expect(getLastName(" Patrice  Bergeron ")).toBe("Bergeron");
    expect(getLastName("Jean Luc Picard")).toBe("Luc Picard");
    expect(getLastName("Mononym")).toBe("");
  });

  test("splitArray chunks array by size", () => {
    expect(splitArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test("groupedList formats chunked array rows", () => {
    const grouped = groupedList(["A", "B", "C", "D"], 2);
    expect(grouped).toBe("A B\nC D\n");
  });

  test("sleep resolves after requested duration", async () => {
    await runWithFakeTimers(async () => {
      const promise = sleep(500);
      jest.advanceTimersByTime(500);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  test("formatPeriodLabel handles regulation and overtime", () => {
    expect(formatPeriodLabel(1, 2)).toBe("1st");
    expect(formatPeriodLabel(2, 2)).toBe("2nd");
    expect(formatPeriodLabel(3, 2)).toBe("3rd");
    expect(formatPeriodLabel(4, 2)).toBe("OT");
    expect(formatPeriodLabel(5, 2)).toBe("SO");
    expect(formatPeriodLabel(5, 1)).toBe("2OT");
  });

  test("formatPeriodTime pads compact times", () => {
    expect(formatPeriodTime(1, "12:34", 2)).toBe("1st – 12:34");
    expect(formatPeriodTime(4, "754", 2)).toBe("OT – 07:54");
  });

  test("transformGameLandingToLineScores builds home and away line scores", () => {
    const gameLanding = {
      homeTeam: { abbrev: "VAN" },
      awayTeam: { abbrev: "CGY" },
      summary: {
        scoring: [
          {
            periodDescriptor: { number: 1, periodType: "REG" },
            goals: [
              {
                timeInPeriod: "05:32",
                situationCode: "pp",
                firstName: { default: "Elias" },
                lastName: { default: "Pettersson" },
                assists: [
                  {
                    firstName: { default: "Quinn" },
                    lastName: { default: "Hughes" },
                  },
                ],
                teamAbbrev: { default: "VAN" },
              },
            ],
          },
          {
            periodDescriptor: { number: 5, periodType: "OT" },
            goals: [
              {
                timeInPeriod: "1001",
                situationCode: "xyz",
                firstName: { default: "Jonathan" },
                lastName: { default: "Huberdeau" },
                assists: [],
                teamAbbrev: { default: "CGY" },
              },
            ],
          },
        ],
      },
    } as unknown as GameLanding;

    const { homeLineScores, awayLineScores } = transformGameLandingToLineScores(gameLanding);

    expect(homeLineScores).toEqual([
      {
        time: "1st – 05:32",
        type: "pp",
        goalScorer: "Elias Pettersson",
        assists: ["Quinn Hughes"],
      },
    ]);

    expect(awayLineScores).toEqual([
      {
        time: "2OT – 10:01",
        type: "ev",
        goalScorer: "Jonathan Huberdeau",
        assists: [],
      },
    ]);
  });
});

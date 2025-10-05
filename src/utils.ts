import moment from "moment-timezone";
import { GameLanding } from "./types";
import { LineScore } from "./graphic/utils";

/**
 * Global date override for testing and replay functionality.
 * When set, this date will be used instead of the current date.
 */
let dateOverride: string | undefined = undefined;

/**
 * Sets a date override for testing or replay purposes.
 * @param date - The date to use in "YYYY-MM-DD" format, or undefined to clear the override.
 */
export function setDateOverride(date: string | undefined): void {
  dateOverride = date;
}

/**
 * Gets the current date override value.
 * @returns The overridden date or undefined if not set.
 */
export function getDateOverride(): string | undefined {
  return dateOverride;
}

/**
 * Returns the ordinal suffix of a given number.
 *
 * @param i - The number to get the ordinal suffix for.
 * @returns The ordinal suffix as a string.
 */
export function ordinalSuffixOf(i: number): string {
  const j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) {
    return `${i}st`;
  }
  if (j === 2 && k !== 12) {
    return `${i}nd`;
  }
  if (j === 3 && k !== 13) {
    return `${i}rd`;
  }
  return `${i}th`;
}

/**
 * Gets the current date in the specified time zone.
 * If a date override is set, it returns that date instead.
 * @param timeZone - The time zone to use (e.g., "America/New_York", "America/Los_Angeles")
 * @returns The formatted date string in "YYYY-MM-DD" format.
 */
export function getCurrentDateLocalTime(timeZone: string) {
  // If date override is set, return it directly
  if (dateOverride) {
    return dateOverride;
  }
  // Get current date and time in the specified time zone using moment-timezone
  return moment().tz(timeZone).format("YYYY-MM-DD");
}

/**
 * Generates a string of goal emojis based on the given number.
 *
 * @param num - The number of goal emojis to generate.
 * @returns A string of goal emojis.
 */
export function goalEmojis(num: number): string {
  let emojis = "";
  for (let i = 0; i < num; i++) {
    emojis += "🚨";
  }
  return emojis;
}

/**
 * Generates a string of thumbs down emojis.
 *
 * @param num - The number of thumbs down emojis to generate.
 * @returns A string of thumbs down emojis.
 */
export function thumbsDownEmojis(num: number): string {
  let emojis = "";
  for (let i = 0; i < num; i++) {
    emojis += "👎🏻";
  }
  return emojis;
}

/**
 * Generates a string of star emojis based on the given number.
 *
 * @param num - The number of star emojis to generate.
 * @returns A string of star emojis.
 */
export function starEmojis(num: number): string {
  let emojis = "";
  for (let i = 0; i < num; i++) {
    emojis += "⭐️";
  }
  return emojis;
}

/**
 * Converts a string with hyphens to words by replacing hyphens with spaces.
 *
 * @param str - The string to convert.
 * @returns The converted string.
 */
export function convertdescKeyToWords(str: string): string {
  return str.split("-").join(" ");
}

/**
 * Converts a UTC date and time string to the local time in the specified time zone.
 * @param utcDateTimeString The UTC date and time string to convert.
 * @param timeZone The time zone to convert the date and time to.
 * @returns The converted local time in the format 'h:mm A'.
 */
export function convertUTCToLocalTime(
  utcDateTimeString: string,
  timeZone: string,
): string {
  return moment.utc(utcDateTimeString).tz(timeZone).format("h:mm A");
}

/**
 * Retrieves the last name from a full name.
 *
 * @param fullName - The full name from which to extract the last name.
 * @returns The last name extracted from the full name.
 */
export function getLastName(fullName: string): string {
  // Split the full name into an array of words
  const nameParts = fullName.trim().split(" ");

  // Concatenate all parts except the last one to form the last name
  const lastName = nameParts.slice(1).join(" ").trim();

  return lastName;
}

/**
 * Groups the elements of an array into subarrays of a specified length and returns a string representation of the grouped elements.
 *
 * @param arr - The array to be grouped.
 * @param length - The length of each subarray.
 * @returns A string representation of the grouped elements.
 */
export function groupedList(arr: unknown[], length: number): string {
  const chunkedArray = splitArray(arr, length);
  let str = "";
  chunkedArray.forEach((chunk) => {
    str += `${chunk.join(" ")}\n`;
  });
  return str;
}

/**
 * Splits an array into smaller chunks of a specified size.
 *
 * @param array - The array to be split.
 * @param chunkSize - The size of each chunk.
 * @returns An array of smaller chunks.
 */
export function splitArray(array: unknown[], chunkSize: number) {
  const chunkedArray = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunkedArray.push(array.slice(i, i + chunkSize));
  }
  return chunkedArray;
}


/**
 * Pauses the execution for the specified number of milliseconds.
 * @param milliseconds - The number of milliseconds to sleep.
 * @returns A Promise that resolves after the specified number of milliseconds.
 */
export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * Formats a period number into a human-readable string that properly handles overtime.
 * @param period - The period number (1-3 for regulation, 4+ for overtime)
 * @returns A formatted period string (e.g., "1st", "2nd", "3rd", "OT", "2OT", etc.)
 */
export function formatPeriodLabel(period: number): string {
  if (period === 1) return "1st";
  if (period === 2) return "2nd";
  if (period === 3) return "3rd";
  if (period === 4) return "OT";
  return `${period - 3}OT`; // e.g. 5 → "2OT", 6 → "3OT"
}


/**
 * Transforms a GameLanding object into home and away LineScores.
 * @param gameLanding - The GameLanding object to transform.
 * @returns An object containing homeLineScores and awayLineScores.
 */

export function formatPeriodTime(period: number, rawTime: string): string {
  let [minutes, seconds] = rawTime.split(":");
  if (!seconds) {
    // Handle compact format like "754"
    rawTime = rawTime.padStart(4, "0");
    minutes = rawTime.slice(0, -2);
    seconds = rawTime.slice(-2);
  }
  return `${formatPeriodLabel(period)} – ${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
}


/**
 * Transforms a GameLanding object into arrays of LineScores for both home and away teams.
 * Each LineScore contains the time, type, goal scorer, and assists for each goal.
 * @param gameLanding - The GameLanding object to transform.
 * @returns An object with homeLineScores and awayLineScores arrays.
 */
export function transformGameLandingToLineScores(gameLanding: GameLanding): {
  homeLineScores: LineScore[];
  awayLineScores: LineScore[];
} {
  const homeLineScores: LineScore[] = [];
  const awayLineScores: LineScore[] = [];

  gameLanding.summary.scoring.forEach((periodGoal) => {
    periodGoal.goals.forEach((goal) => {
      const lineScore: LineScore = {
        time: formatPeriodTime(periodGoal.periodDescriptor.number, goal.timeInPeriod),
        type: getGoalType(goal.situationCode),
        goalScorer: `${goal.firstName.default} ${goal.lastName.default}`,
        assists: goal.assists.map(
          (assist) => `${assist.firstName.default} ${assist.lastName.default}`
        ),
      };

      if (goal.teamAbbrev.default === gameLanding.homeTeam.abbrev) {
        homeLineScores.push(lineScore);
      } else {
        awayLineScores.push(lineScore);
      }
    });
  });

  return { homeLineScores, awayLineScores };
}

/**
 * Determines the type of a goal based on the given situation code.
 * @param situationCode - The situation code representing the goal type.
 * @returns The type of the goal: 'ev' for even strength, 'pp' for power play, 'sh' for short-handed.
 */
function getGoalType(situationCode: string): 'ev' | 'pp' | 'sh' {
  switch (situationCode) {
    case 'ev':
      return 'ev';
    case 'pp':
      return 'pp';
    case 'sh':
      return 'sh';
    default:
      return 'ev'; // Default to even strength if unknown
  }
}
import moment from 'moment-timezone';

/**
 * Returns the ordinal suffix of a given number.
 * 
 * @param i - The number to get the ordinal suffix for.
 * @returns The ordinal suffix as a string.
 */
export function ordinalSuffixOf(i: number): string {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

/**
 * Gets the current date in Eastern Time Zone (EST/EDT).
 * @returns The formatted date string in "YYYY-MM-DD" format.
 */
export function getCurrentDateEasternTime() {
    // Get current date and time in UTC
    const currentDateUTC = new Date();

    // Get the offset for Eastern Time Zone (EST/EDT)
    const easternOffset = -4; // Eastern Standard Time (EST) is UTC-5, but Eastern Daylight Time (EDT) is UTC-4

    // Calculate the milliseconds offset for the Eastern Time Zone
    const easternOffsetMilliseconds = easternOffset * 60 * 60 * 1000;

    // Adjust the current date by adding the Eastern Time Zone offset
    const currentDateEastern = new Date(currentDateUTC.getTime() + easternOffsetMilliseconds);

    // Format the date as "YYYY-MM-DD"
    const year = currentDateEastern.getFullYear();
    const month = String(currentDateEastern.getMonth() + 1).padStart(2, '0');
    const day = String(currentDateEastern.getDate()).padStart(2, '0');

    // Return the formatted date string
    return `${year}-${month}-${day}`;
}


/**
 * Generates a string of goal emojis based on the given number.
 * 
 * @param num - The number of goal emojis to generate.
 * @returns A string of goal emojis.
 */
export function goalEmojis(num: number): string {
    let emojis = '';
    for (let i = 0; i < num; i++) {
        emojis += '🚨';
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
    let emojis = '';
    for (let i = 0; i < num; i++) {
        emojis += '👎🏻';
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
    let emojis = '';
    for (let i = 0; i < num; i++) {
        emojis += '⭐️';
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
    return str
        .split('-')
        .join(' ');
}

/**
 * Converts a UTC date and time string to the local time in the specified time zone.
 * @param utcDateTimeString The UTC date and time string to convert.
 * @param timeZone The time zone to convert the date and time to.
 * @returns The converted local time in the format 'h:mm A'.
 */
export function convertUTCToLocalTime(utcDateTimeString: string, timeZone: string): string {
    return moment.utc(utcDateTimeString).tz(timeZone).format('h:mm A');
}
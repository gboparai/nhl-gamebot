import { Game } from "../types";
import { logObjectToFile } from "../logger";

/**
 * Determines if an error should trigger a retry.
 * @param error - The error object.
 * @returns True if the error indicates a temporary failure.
 */
export function shouldRetry(error: unknown): boolean {
  const errorMessage = (error as Error).message?.toLowerCase() || '';
  
  // Retry on network errors, rate limits, and temporary server errors
  return errorMessage.includes('network') ||
         errorMessage.includes('timeout') ||
         errorMessage.includes('rate limit') ||
         errorMessage.includes('502') ||
         errorMessage.includes('503') ||
         errorMessage.includes('504') ||
         errorMessage.includes('websocket');
}

/**
 * Determines the MIME type based on file extension.
 * @param filePath - The path to the file.
 * @returns The MIME type string.
 */
export function getMimeType(filePath: string): string {
  const extension = filePath.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

/**
 * Generic retry function for social media operations.
 * @param operation - The operation to retry.
 * @param retries - Number of retry attempts.
 * @param delay - Delay between retries in milliseconds.
 * @param context - Context for logging (e.g., "twitter", "bluesky", "discord").
 * @param content - Content being posted for logging purposes.
 * @returns A promise that resolves when the operation succeeds or retries are exhausted.
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 5000,
  context: string,
  content?: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (content) {
      logObjectToFile(`failed-${context}-post`, content);
    }
    logObjectToFile(`${context}-error`, error as string);

    // Retry logic for temporary failures
    if (retries > 0 && shouldRetry(error)) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay, context, content);
    } else {
      console.error(`Failed to execute ${context} operation:`, error);
      throw error;
    }
  }
}

/**
 * Generates hashtags for a game post.
 * @param game - The game object containing information about the game.
 * @param teamHashtagFunction - Function to get team-specific hashtags.
 * @param format - Format for the hashtags ("twitter" or "bluesky").
 * @returns A string containing the generated hashtags.
 */
export function generateGameHashtags(
  game: Game,
  teamHashtagFunction: (teamName: string) => string,
  format: "twitter" | "bluesky" = "twitter"
): string {
  const homeHashtag = teamHashtagFunction(game.homeTeam.name.default);
  const awayHashtag = teamHashtagFunction(game.awayTeam.name.default);
  
  const prefix = format === "bluesky" ? "#" : "#";
  const gameHashtag = `${prefix}${game.awayTeam.abbrev.toUpperCase()}vs${game.homeTeam.abbrev.toUpperCase()}`;
  
  if (format === "bluesky") {
    return `\n\n${gameHashtag} ${homeHashtag} ${awayHashtag}`;
  } else {
    return `\n\n${gameHashtag}  ${homeHashtag} ${awayHashtag}`;
  }
}

/**
 * Validates media file paths and filters out invalid ones.
 * @param media - Array of media file paths.
 * @returns Array of valid media file paths.
 */
export function validateMediaPaths(media: string[]): string[] {
  const fs = require('fs');
  return media.filter(mediaPath => {
    try {
      return fs.existsSync(mediaPath);
    } catch (error) {
      console.error(`Invalid media path: ${mediaPath}`, error);
      return false;
    }
  });
}

/**
 * Retrieves the hashtag associated with a given NHL team.
 * @param team - The name of the NHL team.
 * @returns The hashtag associated with the team.
 */
export function teamHashtag(team: string) {
  const TEAM_HASH_TAGS = {
    Ducks: "#FlyTogether",
    Coyotes: "#Yotes",
    Bruins: "#NHLBruins",
    Sabres: "#LetsGoBuffalo",
    Flames: "#Flames",
    Hurricanes: "#LetsGoCanes",
    Blackhawks: "#Blackhawks",
    Avalanche: "#GoAvsGo",
    "Blue Jackets": "#CBJ",
    Stars: "#GoStars",
    "Red Wings": "#LGRW",
    Oilers: "#LetsGoOilers",
    Panthers: "#FLAPanthers",
    Kings: "#GoKingsGo",
    Wild: "#MNWild",
    Canadiens: "#GoHabsGo",
    Predators: "#Preds",
    Devils: "#NJDevils",
    Islanders: "#Isles",
    Rangers: "#NYR",
    Senators: "#GoSensGo",
    Flyers: "#AnytimeAnywhere",
    Penguins: "#LetsGoPens",
    Sharks: "#SJSharks",
    Kraken: "#SeaKraken",
    Blues: "#STLBlues",
    Lightning: "#GoBolts",
    "Maple Leafs": "#LeafsForever",
    Canucks: "#Canucks",
    "Golden Knights": "#VegasBorn",
    Capitals: "#ALLCAPS",
    Jets: "#GoJetsGo",
  };

  return TEAM_HASH_TAGS[team as keyof typeof TEAM_HASH_TAGS];
}

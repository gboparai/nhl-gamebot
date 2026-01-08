import { lookup } from "mime-types";
import { Game } from "../types";
import { logger } from "../logger";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

// Set ffmpeg path from the bundled installer
ffmpeg.setFfmpegPath(ffmpegPath.path);

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
export function getMimeType(filePath: string): string | undefined {
  const mimeType = lookup(filePath);
  return (typeof mimeType === "string" ? mimeType : null) ?? undefined;
}

/**
 * Converts a GIF file to MP4 format using ffmpeg.
 * @param gifPath - Path to the input GIF file
 * @param outputPath - Optional path for output MP4 (defaults to same name with .mp4 extension)
 * @returns Promise that resolves to the path of the created MP4 file
 */
export async function convertGifToMp4(gifPath: string, outputPath?: string): Promise<string> {
  if (!fs.existsSync(gifPath)) {
    throw new Error(`GIF file not found: ${gifPath}`);
  }

  const mp4Path = outputPath || gifPath.replace(/\.gif$/i, '.mp4');
  
  // Remove output file if it already exists
  if (fs.existsSync(mp4Path)) {
    fs.unlinkSync(mp4Path);
  }

  return new Promise((resolve, reject) => {
    ffmpeg(gifPath)
      .outputOptions([
        '-movflags +faststart',       // Optimize for web streaming
        '-pix_fmt yuv420p',            // Ensure compatibility with most players
        '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
        '-c:v libx264',                // Use H.264 codec
        '-preset fast',                // Balance between speed and compression
        '-crf 23'                      // Quality (lower = better quality, 23 is default)
      ])
      .output(mp4Path)
      .on('start', (commandLine) => {
        logger.debug(`Starting GIF to MP4 conversion: ${commandLine}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          logger.debug(`Conversion progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        if (!fs.existsSync(mp4Path)) {
          reject(new Error(`Failed to create MP4 file: ${mp4Path}`));
          return;
        }
        logger.info(`Successfully converted GIF to MP4: ${mp4Path}`);
        resolve(mp4Path);
      })
      .on('error', (error) => {
        logger.error(`Error converting GIF to MP4: ${error.message}`);
        reject(new Error(`Failed to convert GIF to MP4: ${error.message}`));
      })
      .run();
  });
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
      logger.debug(`Failed ${context} post content`, content);
    }
    logger.error(`${context} operation error`, error);

    // Retry logic for temporary failures
    if (retries > 0 && shouldRetry(error)) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay, context, content);
    } else {
      logger.error(`Failed to execute ${context} operation`, error);
      throw error;
    }
  }
}

/**
 * Generates hashtags for a game post.
 * @param game - The game object containing information about the game.
 * @param teamHashtagFunction - Function to get team-specific hashtags.
 * @param format - Format for the hashtags ("twitter", "bluesky", or "threads").
 * @returns A string containing the generated hashtags.
 */
export function generateGameHashtags(
  game: Game,
  teamHashtagFunction: (teamName: string) => string,
  format: "twitter" | "bluesky" | "threads" = "twitter"
): string {
  const homeHashtag = teamHashtagFunction(game.homeTeam.name.default);
  const awayHashtag = teamHashtagFunction(game.awayTeam.name.default);
  
  const prefix = format === "bluesky" ? "#" : "#";
  const gameHashtag = `${prefix}${game.awayTeam.abbrev.toUpperCase()}vs${game.homeTeam.abbrev.toUpperCase()}`;
  
  if (format === "bluesky" || format === "threads") {
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
      logger.error(`Invalid media path: ${mediaPath}`, error);
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
    Mammoth: "#GoMammoth",
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

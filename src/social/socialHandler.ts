import { sendTweet, uploadMedia } from "./twitter";
import { sendBlueskyPost } from "./bluesky";
import { sendDiscordMessage } from "./discord";
import { sendTelegramMessage } from "./telegram";
import { sendThreadsPost } from "./threads";
import config from "../../config.json";
import { Game, Config } from "../types";
import { logger } from "../logger";
import fs from "fs";

const typedConfig = config as Config;

/**
 * Sends a message to all active social platforms.
 * @param text - The text content of social media.
 * @param game - Optional game object for hashtags.
 * @param media - An optional array of media file paths to attach to the tweet.
 * @param extended - If true, prevents sending to Twitter (for extended/in-game messages).
 * @param blueskyReplyTo - Optional Bluesky post to reply to (only affects Bluesky).
 * @param threadsReplyTo - Optional Threads post to reply to (only affects Threads).
 * @param telegramReplyTo - Optional Telegram message to reply to (only affects Telegram).
 * @returns A promise that resolves when the message is sent, with post info if sent.
 */
export async function send(
  text: string,
  game?: Game,
  media?: string[],
  extended?: boolean,
  blueskyReplyTo?: { uri: string; cid: string },
  threadsReplyTo?: { postId: string },
  telegramReplyTo?: { messageId: number },
): Promise<{ blueskyPost?: { uri: string; cid: string }; threadsPost?: { postId: string }; telegramPost?: { messageId: number } }> {
  // Send to Twitter if active and not an extended message or reply
  if (typedConfig.twitter.isActive && !extended && !blueskyReplyTo && !threadsReplyTo && !telegramReplyTo) {
    try {
      const mediaIds = media
        ? await Promise.all(media.map(uploadMedia))
        : undefined;
      await sendTweet(text, game, mediaIds);
    } catch (error) {
      logger.error("Failed to send tweet", error);
      // Don't throw error to prevent application crash
    }
  }

  // Send to Bluesky if active
  let blueskyPost: { uri: string; cid: string } | undefined;
  if (typedConfig.bluesky.isActive) {
    try {
      blueskyPost = await sendBlueskyPost(text, game, media, 3, blueskyReplyTo);
    } catch (error) {
      logger.error("Failed to send Bluesky post", error);
      // Don't throw error to prevent application crash
    }
  }

  // Send to Threads if active
  let threadsPost: { postId: string } | undefined;
  if (typedConfig.threads.isActive) {
    try {
      threadsPost = await sendThreadsPost(text, game, media, 3, threadsReplyTo);
    } catch (error) {
      logger.error("Failed to send Threads post", error);
      // Don't throw error to prevent application crash
    }
  }

  // Send to Discord if active
  if (typedConfig.discord.isActive) {
    try {
      await sendDiscordMessage(text, game, media);
    } catch (error) {
      logger.error("Failed to send Discord message", error);
      // Don't throw error to prevent application crash
    }
  }

  // Send to Telegram if active
  let telegramPost: { messageId: number } | undefined;
  if (typedConfig.telegram.isActive) {
    try {
      telegramPost = await sendTelegramMessage(text, game, media, 3, telegramReplyTo);
    } catch (error) {
      logger.error("Failed to send Telegram message", error);
      // Don't throw error to prevent application crash
    }
  }

  if (typedConfig.fileOutput.isActive) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        text,
        game: game ? {
          id: game.id,
          awayTeam: game.awayTeam.abbrev,
          homeTeam: game.homeTeam.abbrev,
        } : undefined,
        media,
        extended,
        blueskyReplyTo,
        threadsReplyTo,
        telegramReplyTo,
      };
      const logLine = `${JSON.stringify(logEntry)}\n`;
      fs.appendFileSync(typedConfig.fileOutput.filePath, logLine);
    } catch (error) {
      logger.error("Failed to log message to file", error);
      // Don't throw error to prevent application crash
    }
  }

  return { blueskyPost, threadsPost, telegramPost };
}

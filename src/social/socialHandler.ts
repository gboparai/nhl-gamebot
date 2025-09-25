import { sendTweet, uploadMedia } from "./twitter";
import { sendBlueskyPost } from "./bluesky";
import { sendDiscordMessage } from "./discord";
import config from "../../config.json";
import { Game, Config } from "../types";

const typedConfig = config as Config;

/**
 * Sends a tweet with optional media attachments.
 * @param text - The text content of social media.
 * @param game - Optional game object for hashtags.
 * @param media - An optional array of media file paths to attach to the tweet.
 * @param extended - If true, prevents sending to Twitter (for extended/in-game messages).
 * @returns A promise that resolves when the tweet is sent.
 */
export async function send(
  text: string,
  game?: Game,
  media?: string[],
  extended?: boolean,
): Promise<void> {
  // Send to Twitter if active and not an extended message
  if (typedConfig.twitter.isActive && !extended) {
    const mediaIds = media
      ? await Promise.all(media.map(uploadMedia))
      : undefined;
    await sendTweet(text, game, mediaIds);
  }

  // Send to Bluesky if active (always send regardless of extended flag)
  if (typedConfig.bluesky.isActive) {
    try {
      await sendBlueskyPost(text, game, media);
    } catch (error) {
      console.error("Failed to send Bluesky post:", error);
      // Don't throw error to prevent application crash
    }
  }

  // Send to Discord if active (always send regardless of extended flag)
  if (typedConfig.discord.isActive) {
    try {
      await sendDiscordMessage(text, game, media);
    } catch (error) {
      console.error("Failed to send Discord message:", error);
      // Don't throw error to prevent application crash
    }
  }

}

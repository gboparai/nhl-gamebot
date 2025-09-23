import { sendTweet, uploadMedia } from "./twitter";
import { sendBlueskyPost } from "./bluesky";
import config from "../../config.json";
import { Game, Config } from "../types";

const typedConfig = config as Config;

/**
 * Sends a tweet with optional media attachments.
 * @param text - The text content of social media.
 * @param media - An optional array of media file paths to attach to the tweet.
 * @returns A promise that resolves when the tweet is sent.
 */
export async function send(
  text: string,
  game?: Game,
  media?: string[],
): Promise<void> {
  // Send to Twitter if active
  if (typedConfig.twitter.isActive) {
    const mediaIds = media
      ? await Promise.all(media.map(uploadMedia))
      : undefined;
    await sendTweet(text, game, mediaIds);
  }

  // Send to Bluesky if active
  if (typedConfig.bluesky.isActive) {
    await sendBlueskyPost(text, game, media);
  }
}

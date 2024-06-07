import { sendTweet, uploadMedia } from "./twitter";
import config from "../../config.json";
import { Game } from "../types";

/**
 * Sends a tweet with optional media attachments.
 * @param text - The text content of social media.
 * @param media - An optional array of media file paths to attach to the tweet.
 * @returns A promise that resolves when the tweet is sent.
 */
export async function send(text: string, game?: Game, media?: string[]): Promise<void> {
    if (config.twitter.isActive) {
        const mediaIds = media ? await Promise.all(media.map(uploadMedia)) : undefined;
        await sendTweet(text, game, mediaIds);
    }
}
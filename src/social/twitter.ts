import { Game } from "../types";
import config from "../../config.json";
import { TwitterApi, TUploadableMedia } from "twitter-api-v2";
import { logObjectToFile } from "../logger";
import {  generateGameHashtags, teamHashtag } from "./utils";

const twitter = new TwitterApi({
  appKey: config.twitter.appKey,
  appSecret: config.twitter.appSecret,
  accessToken: config.twitter.accessToken,
  accessSecret: config.twitter.accessSecret,
});
/**
 * Sends a tweet using the Twitter API.
 * @param tweet - The content of the tweet.
 * @param media - The media to be attached to the tweet. It can be a single media ID or an array of media IDs.
 * @returns A Promise that resolves when the tweet is sent successfully, or rejects with an error if there's a problem.
 */
export async function sendTweet(
  tweet: string,
  game?: Game,
  media?: string[],
  retries: number = 3,
): Promise<void> {
  const operation = async () => {
    if (media && media.length > 0) {
      await twitter.v2.tweet(game? tweet+ getHashtags(game): tweet, {
        media: {
          media_ids: media,
        },
      });
    } else {
      if (game) {
        await twitter.v2.tweet(tweet + getHashtags(game));
      } else {
        await twitter.v2.tweet(tweet);
      }
    }
  };

  try {
    await operation();
  } catch (error: unknown) {
    logObjectToFile("failed-tweet", tweet);
    logObjectToFile("twitter-error", error as string);

    if ((error as Error).message.includes("403") && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await sendTweet(tweet, game, media, retries - 1);
    } else {
      throw error;
    }
  }
}

/**
 * Uploads media to Twitter.
 * @param media - The media to upload.
 * @returns A Promise that resolves to the media ID of the uploaded media, or an empty string if there's an error.
 */
export async function uploadMedia(media: TUploadableMedia): Promise<string> {
  try {
    const mediaData = await twitter.v1.uploadMedia(media, {}, true);
    return mediaData.media_id_string;
  } catch (error: unknown) {
    console.error("Error uploading media:", (error as Error).message as string);
    return "";
  }
}

/**
 * Generates hashtags for a game.
 *
 * @param game - The game object containing information about the game.
 * @returns A string containing the generated hashtags.
 */
function getHashtags(game: Game) {
  return generateGameHashtags(game, teamHashtag, "twitter");
}



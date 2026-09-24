import config from "../../config.json";
import { TwitterApi } from "twitter-api-v2";
import { logger } from "../logger";
import { generateGameHashtags, teamHashtag } from "./utils";
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
export async function sendTweet(tweet, game, media, retries = 3, replyTo) {
    let tweetId;
    const operation = async () => {
        const tweetOptions = {};
        if (media && media.length > 0) {
            tweetOptions.media = { media_ids: media };
        }
        if (replyTo) {
            tweetOptions.reply = { in_reply_to_tweet_id: replyTo };
        }
        const result = await twitter.v2.tweet(game ? tweet + getHashtags(game) : tweet, Object.keys(tweetOptions).length > 0 ? tweetOptions : undefined);
        tweetId = result.data.id;
    };
    try {
        await operation();
        return tweetId;
    }
    catch (error) {
        logger.error(`Failed to send tweet: ${tweet}`);
        logger.error(`Twitter API error: ${error.message}`);
        if (error.message.includes("403") && retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return await sendTweet(tweet, game, media, retries - 1, replyTo);
        }
        else {
            throw error;
        }
    }
}
/**
 * Uploads media to Twitter.
 * @param media - The media to upload.
 * @returns A Promise that resolves to the media ID of the uploaded media, or an empty string if there's an error.
 */
export async function uploadMedia(media) {
    try {
        const mediaData = await twitter.v1.uploadMedia(media, {}, true);
        return mediaData.media_id_string;
    }
    catch (error) {
        logger.error("Error uploading media:", error.message);
        return "";
    }
}
/**
 * Generates hashtags for a game.
 *
 * @param game - The game object containing information about the game.
 * @returns A string containing the generated hashtags.
 */
function getHashtags(game) {
    return generateGameHashtags(game, teamHashtag, "twitter");
}

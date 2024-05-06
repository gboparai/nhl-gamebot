
import config from "../../config.json";
import TwitterApi, { TUploadableMedia } from "twitter-api-v2";

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
export async function sendTweet(tweet: string, media?: string[]): Promise<void> {
    try {
        if (media && media.length > 0) {
            await twitter.v2.tweet(tweet, {
                media: {
                    media_ids: media
                }
            });
        } else {

            await twitter.v2.tweet(tweet);
        }
    } catch (error: any) {
        console.error("Error sending tweet:", error.message as string);
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
    } catch (error: any) {
        console.error("Error uploading media:", error.message as string);
        return "";
    }
}

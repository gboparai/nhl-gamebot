
import { Game } from "../types";
import config from "../../config.json";
import TwitterApi, { TUploadableMedia } from "twitter-api-v2";
import { logObjectToFile } from "../logger";

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
export async function sendTweet(tweet: string, game: Game, media?: string[],): Promise<void> {
    try {
        if (media && media.length > 0) {
            await twitter.v2.tweet(tweet, {
                media: {
                    media_ids: media
                }
            });
        } else {

            await twitter.v2.tweet(tweet + getHashtags(game));
        }
    } catch (error: any) {
        logObjectToFile("failed-tweet", tweet);
        logObjectToFile("twitter-error", error);
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

/**
 * Generates hashtags for a game.
 * 
 * @param game - The game object containing information about the game.
 * @returns A string containing the generated hashtags.
 */
function getHashtags(game: Game) {
    const homeHashtag = teamHashtag(game.homeTeam.name.default);
    const awayHashtag = teamHashtag(game.awayTeam.name.default);
    return `\n\n#${game.homeTeam.abbrev.toLocaleUpperCase()}vs${game.awayTeam.abbrev.toLocaleUpperCase()}  ${homeHashtag} ${awayHashtag}`;
}

/**
 * Retrieves the hashtag associated with a given NHL team.
 * @param team - The name of the NHL team.
 * @returns The hashtag associated with the team.
 */
function teamHashtag(team: string) {
    const teamHashtags = {
        "Ducks": "#FlyTogether",
        "Coyotes": "#Yotes",
        "Bruins": "#NHLBruins",
        "Sabres": "#LetsGoBuffalo",
        "Flames": "#Flames",
        "Hurricanes": "#LetsGoCanes",
        "Blackhawks": "#Blackhawks",
        "Avalanche": "#GoAvsGo",
        "Blue Jackets": "#CBJ",
        "Stars": "#GoStars",
        "Red Wings": "#LGRW",
        "Oilers": "#LetsGoOilers",
        "Panthers": "#FLAPanthers",
        "Kings": "#GoKingsGo",
        "Wild": "#MNWild",
        "Canadiens": "#GoHabsGo",
        "Predators": "#Preds",
        "Devils": "#NJDevils",
        "Islanders": "#Isles",
        "Rangers": "#NYR",
        "Senators": "#GoSensGo",
        "Flyers": "#AnytimeAnywhere",
        "Penguins": "#LetsGoPens",
        "Sharks": "#SJSharks",
        "Kraken": "#SeaKraken",
        "Blues": "#STLBlues",
        "Lightning": "#GoBolts",
        "Maple Leafs": "#LeafsForever",
        "Canucks": "#Canucks",
        "Golden Knights": "#VegasBorn",
        "Capitals": "#ALLCAPS",
        "Jets": "#GoJetsGo",
    };

    return teamHashtags[team as keyof typeof teamHashtags];
}
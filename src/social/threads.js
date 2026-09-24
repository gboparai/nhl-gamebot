import ThreadsAPI from 'threads-api';
import config from '../../config.json';
import { logger } from '../logger';
import { retryOperation, generateGameHashtags, teamHashtag } from './utils';
const typedConfig = config;
let api = null;
/**
 * Initialize and authenticate the Threads client
 */
async function initializeClient() {
    if (!api) {
        try {
            api = new ThreadsAPI.ThreadsAPI({
                username: typedConfig.threads.username,
                password: typedConfig.threads.password,
                deviceID: typedConfig.threads.deviceId,
            });
        }
        catch (error) {
            logger.error('Threads initialization error:', {
                message: error.message,
                stack: error.stack,
                details: error.response?.data,
            });
            throw new Error('Failed to initialize Threads client');
        }
    }
}
/**
 * Sends a post to Threads with optional media and reply context.
 * @param text - The text content of the post.
 * @param game - Optional game object for hashtags.
 * @param media - Optional array of media file paths to attach. Threads only supports one image.
 * @param retries - Number of retry attempts.
 * @param replyTo - Optional post to reply to.
 * @returns A promise that resolves with the new post's ID.
 */
export async function sendThreadsPost(text, game, media, retries = 3, replyTo) {
    let postId;
    const operation = async () => {
        await initializeClient();
        if (!api) {
            throw new Error('Threads client not initialized');
        }
        let postText = text;
        if (game) {
            postText += getThreadsHashtags(game);
        }
        const options = { text: postText };
        if (replyTo?.postId) {
            options.parentPostID = replyTo.postId;
        }
        // Check for a URL in the text to include as a preview
        const urlRegex = /(https?:\/\/[^\s]+)/;
        const urlMatch = text.match(urlRegex);
        if (urlMatch) {
            options.url = urlMatch[0];
        }
        if (media && media.length > 0) {
            // threads-api supports a single image path
            options.image = media[0];
        }
        // Add topics/hashtags
        let topics = [];
        if (typedConfig.threads.topic) {
            topics.push(typedConfig.threads.topic);
        }
        if (game) {
            topics = [...topics];
        }
        if (topics.length > 0) {
            options.topics = topics;
        }
        const result = await api.publish(options);
        if (result) {
            postId = result;
        }
        else {
            throw new Error('Failed to get post ID from Threads response');
        }
    };
    await retryOperation(operation, retries, 5000, 'threads', text);
    if (postId) {
        return { postId };
    }
    return undefined;
}
/**
 * Generates hashtags for a Threads post.
 * @param game - The game object containing information about the game.
 * @returns A string containing the generated hashtags.
 */
function getThreadsHashtags(game) {
    return generateGameHashtags(game, teamHashtag, 'threads');
}

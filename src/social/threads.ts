import ThreadsAPI from 'threads-api';
import { Config, Game } from '../types';
import config from '../../config.json';
import { logger } from '../logger';
import { retryOperation, generateGameHashtags, teamHashtag } from './utils';

const typedConfig = config as Config;

let api: ThreadsAPI.ThreadsAPI | null = null;

/**
 * Initialize and authenticate the Threads client
 */
async function initializeClient(): Promise<void> {
  if (!api) {
    try {
      api = new ThreadsAPI.ThreadsAPI({
        username: typedConfig.threads.username,
        password: typedConfig.threads.password,
        deviceID: typedConfig.threads.deviceId,
      });
    } catch (error: any) {
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
export async function sendThreadsPost(
  text: string,
  game?: Game,
  media?: string[],
  retries: number = 3,
  replyTo?: { postId: string },
): Promise<{ postId: string } | undefined> {
  let postId: string | undefined;

  const operation = async () => {
    await initializeClient();
    if (!api) {
      throw new Error('Threads client not initialized');
    }

    let postText = text;
    if (game) {
      postText += getThreadsHashtags(game);
    }

    const options: {
      text: string;
      parentPostID?: string;
      image?: string;
      url?: string;
      topics?: string[];
    } = { text: postText };

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
    let topics: string[] = [];
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
    } else {
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
function getThreadsHashtags(game: Game): string {
  return generateGameHashtags(game, teamHashtag, 'threads');
}

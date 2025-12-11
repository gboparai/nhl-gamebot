import  ThreadsAPI  from 'threads-api';
import { Config } from '../types';
import config from '../../config.json';
import { logger } from '../logger';
import { retryOperation } from './utils';

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
            deviceID: typedConfig.threads.deviceId
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
 * @param media - Optional array of media file paths to attach. Threads only supports one image.
 * @param retries - Number of retry attempts.
 * @param replyTo - Optional post to reply to.
 * @returns A promise that resolves with the new post's ID.
 */
export async function sendThreadsPost(
  text: string,
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

    const options: { text: string; reply_to_id?: string; image?: string } = { text };

    if (replyTo?.postId) {
      options.reply_to_id = replyTo.postId;
    }

    if (media && media.length > 0) {
      // threads-api supports a single image path
      options.image = media[0];
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

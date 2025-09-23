import { BskyAgent, RichText } from "@atproto/api";
import { Game, Config } from "../types";
import config from "../../config.json";
import { logObjectToFile } from "../logger";
import { teamHashtag } from "./twitter";

const typedConfig = config as Config;

let agent: BskyAgent | null = null;

/**
 * Initialize and authenticate the Bluesky agent
 */
async function initializeAgent(): Promise<void> {
  if (!agent) {
    agent = new BskyAgent({
      service: "https://bsky.social",
    });

    try {
      await agent.login({
        identifier: typedConfig.bluesky.identifier,
        password: typedConfig.bluesky.password,
      });
    } catch (error) {
      logObjectToFile("bluesky-auth-error", error as string);
      throw new Error("Failed to authenticate with Bluesky");
    }
  }
}

/**
 * Sends a post to Bluesky with optional media attachments.
 * @param text - The text content of the post.
 * @param game - Optional game object for hashtags.
 * @param media - Optional array of media file paths to attach to the post.
 * @param retries - Number of retry attempts.
 * @returns A promise that resolves when the post is sent.
 */
export async function sendBlueskyPost(
  text: string,
  game?: Game,
  media?: string[],
  retries: number = 3,
): Promise<void> {
  try {
    await initializeAgent();
    
    if (!agent) {
      throw new Error("Bluesky agent not initialized");
    }

    let postText = text;
    
    // Add hashtags if game is provided and no media (to avoid duplicate hashtags)
    if (game && (!media || media.length === 0)) {
      postText += getBlueskyHashtags(game);
    }

    // Create RichText to properly handle hashtags and links
    const richText = new RichText({ text: postText });
    await richText.detectFacets(agent);

    const postData: any = {
      text: richText.text,
      facets: richText.facets,
    };

    // Handle media uploads if provided
    if (media && media.length > 0) {
      const uploadedMedia = await Promise.all(
        media.map(async (mediaPath) => {
          try {
            return await uploadBlueskyMedia(mediaPath);
          } catch (error) {
            console.error(`Failed to upload media ${mediaPath}:`, error);
            return null;
          }
        })
      );

      const validMedia = uploadedMedia.filter(m => m !== null);
      if (validMedia.length > 0) {
        postData.embed = {
          $type: "app.bsky.embed.images",
          images: validMedia,
        };
      }
    }

    await agent.post(postData);
    
  } catch (error: unknown) {
    logObjectToFile("failed-bluesky-post", text);
    logObjectToFile("bluesky-error", error as string);

    // Retry logic for temporary failures
    if (retries > 0 && shouldRetry(error)) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await sendBlueskyPost(text, game, media, retries - 1);
    } else {
      console.error("Failed to send Bluesky post:", error);
    }
  }
}

/**
 * Uploads media to Bluesky.
 * @param mediaPath - The path to the media file.
 * @returns A promise that resolves to the uploaded media object.
 */
export async function uploadBlueskyMedia(mediaPath: string): Promise<any> {
  try {
    await initializeAgent();
    
    if (!agent) {
      throw new Error("Bluesky agent not initialized");
    }

    const fs = await import('fs');
    const mediaData = fs.readFileSync(mediaPath);
    
    // Convert Buffer to Uint8Array for Bluesky API
    const uint8Array = new Uint8Array(mediaData);
    
    // Determine MIME type based on file extension
    const mimeType = getMimeType(mediaPath);
    
    const uploadResponse = await agent.uploadBlob(uint8Array, {
      encoding: mimeType,
    });

    return {
      alt: "Game graphic", // You can customize this alt text
      image: uploadResponse.data.blob,
    };
    
  } catch (error: unknown) {
    console.error("Error uploading media to Bluesky:", (error as Error).message);
    throw error;
  }
}

/**
 * Generates hashtags for a Bluesky post.
 * Note: Bluesky handles hashtags differently - they are part of the text and detected by facets.
 * @param game - The game object containing information about the game.
 * @returns A string containing the generated hashtags.
 */
function getBlueskyHashtags(game: Game): string {
  const homeHashtag = teamHashtag(game.homeTeam.name.default);
  const awayHashtag = teamHashtag(game.awayTeam.name.default);
  return `\n\n#${game.awayTeam.abbrev.toUpperCase()}vs${game.homeTeam.abbrev.toUpperCase()} ${homeHashtag} ${awayHashtag} #NHL #Hockey`;
}

/**
 * Determines the MIME type based on file extension.
 * @param filePath - The path to the file.
 * @returns The MIME type string.
 */
function getMimeType(filePath: string): string {
  const extension = filePath.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

/**
 * Determines if an error should trigger a retry.
 * @param error - The error object.
 * @returns True if the error indicates a temporary failure.
 */
function shouldRetry(error: unknown): boolean {
  const errorMessage = (error as Error).message?.toLowerCase() || '';
  
  // Retry on network errors, rate limits, and temporary server errors
  return errorMessage.includes('network') ||
         errorMessage.includes('timeout') ||
         errorMessage.includes('rate limit') ||
         errorMessage.includes('502') ||
         errorMessage.includes('503') ||
         errorMessage.includes('504');
}

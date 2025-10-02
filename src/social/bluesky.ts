import { BskyAgent, RichText } from "@atproto/api";
import { Game, Config } from "../types";
import config from "../../config.json";
import { getMimeType, retryOperation, generateGameHashtags, teamHashtag } from "./utils";
import axios from "axios";

const typedConfig = config as Config;

let agent: BskyAgent | null = null;

/**
 * Fetches metadata (title, description, and thumbnail) from a URL
 * @param url - The URL to fetch metadata from
 * @returns Object containing title, description, and thumbnail
 */
async function fetchUrlMetadata(url: string): Promise<{ title: string; description: string; thumb?: any }> {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = response.data;
    
    // Extract title from <title> tag or Open Graph title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = ogTitleMatch ? ogTitleMatch[1].trim() : (titleMatch ? titleMatch[1].trim() : "NHL Highlight");
    
    // Extract description from Open Graph description or meta description tag
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["'][^>]*>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                     html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
    let description = ogDescMatch ? ogDescMatch[1].trim() : (descMatch ? descMatch[1].trim() : "NHL Video Highlight");
    
    // Extract thumbnail from Open Graph image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);
    let thumbnailUrl = ogImageMatch ? ogImageMatch[1].trim() : null;
    
    // Clean up strings - remove extra whitespace and decode HTML entities
    title = title.replace(/\s+/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    description = description.replace(/\s+/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    
    let thumb = undefined;
    if (thumbnailUrl) {
      try {
        // Make thumbnail URL absolute if it's relative
        if (thumbnailUrl.startsWith('//')) {
          thumbnailUrl = 'https:' + thumbnailUrl;
        } else if (thumbnailUrl.startsWith('/')) {
          const urlObj = new URL(url);
          thumbnailUrl = `${urlObj.protocol}//${urlObj.host}${thumbnailUrl}`;
        }
        
        // Fetch and upload the thumbnail to Bluesky
        const thumbResponse = await axios.get(thumbnailUrl, {
          responseType: 'arraybuffer',
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (agent) {
          const thumbBuffer = Buffer.from(thumbResponse.data);
          const thumbUint8Array = new Uint8Array(thumbBuffer);
          const mimeType = thumbResponse.headers['content-type'] || 'image/jpeg';
          
          const uploadResponse = await agent.uploadBlob(thumbUint8Array, {
            encoding: mimeType,
          });
          
          thumb = uploadResponse.data.blob;
        }
      } catch (thumbError) {
        console.warn(`Failed to fetch/upload thumbnail from ${thumbnailUrl}:`, thumbError);
      }
    }
    
    return { title, description, thumb };
  } catch (error) {
    console.warn(`Failed to fetch metadata for ${url}:`, error);
    // Fallback to default values
    return { 
      title: "NHL Highlight",
      description: "NHL Video Highlight"
    };
  }
}

/**
 * Initialize and authenticate the Bluesky agent
 */
async function initializeAgent(): Promise<void> {
  // Check if we already have an authenticated agent
  if (agent && agent.session?.accessJwt) {
    try {
      // Test if the session is still valid
      await agent.getProfile({ actor: agent.session.did });
      return; // Agent is still valid, no need to re-authenticate
    } catch (error) {
      console.log("Bluesky session expired, re-authenticating...");
    }
  }

  // Create a new agent
  agent = new BskyAgent({
    service: "https://bsky.social",
  });

  try {
    await agent.login({
      identifier: typedConfig.bluesky.identifier,
      password: typedConfig.bluesky.password,
    });
    console.log("Bluesky agent authenticated successfully");
  } catch (error) {
    throw new Error("Failed to authenticate with Bluesky");
  }
}

/**
 * Sends a post to Bluesky with optional media attachments.
 * @param text - The text content of the post.
 * @param game - Optional game object for hashtags.
 * @param media - Optional array of media file paths to attach to the post.
 * @param retries - Number of retry attempts.
 * @param replyTo - Optional post to reply to.
 * @returns A promise that resolves with post info when the post is sent.
 */
export async function sendBlueskyPost(
  text: string,
  game?: Game,
  media?: string[],
  retries: number = 3,
  replyTo?: { uri: string; cid: string },
): Promise<{ uri: string; cid: string }> {
  const operation = async () => {
    await initializeAgent();
    
    if (!agent) {
      throw new Error("Bluesky agent not initialized");
    }

    let postText = text;
    
    if (game) {
      postText += getBlueskyHashtags(game);
    }

    // Create RichText to properly handle hashtags and links
    const richText = new RichText({ text: postText });
    await richText.detectFacets(agent);

    const postData: any = {
      text: richText.text,
      facets: richText.facets,
    };

    // Add reply information if this is a reply
    if (replyTo) {
      postData.reply = {
        root: replyTo,
        parent: replyTo,
      };
    }

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

    // If there are no image embeds but the post text contains an external URL,
    // include an external embed so Bluesky will generate a URL preview.
    // Prefer the first URL found in the text.
    if (!postData.embed) {
      const urlMatch = richText.text.match(/https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/i);
      if (urlMatch) {
        const externalUrl = urlMatch[0];
        
        // Fetch the title and description from the URL
        const urlMetadata = await fetchUrlMetadata(externalUrl);
        
        postData.embed = {
          $type: "app.bsky.embed.external",
          external: {
            uri: externalUrl,
            title: urlMetadata.title,
            description: urlMetadata.description,
            thumb: urlMetadata.thumb,
          },
        };
      }
    }

    const response = await agent.post(postData);
    return { uri: response.uri, cid: response.cid };
  };

  return await retryOperation(operation, retries, 5000, "bluesky", text);
}


/**
 * Uploads media to Bluesky.
 * @param mediaPath - The path to the media file.
 * @returns A promise that resolves to the uploaded media object.
 */
export async function uploadBlueskyMedia(mediaPath: string): Promise<any> {
  try {
    // Ensure we have an authenticated agent
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
    
    let uploadResponse;
    try {
      uploadResponse = await agent.uploadBlob(uint8Array, {
        encoding: mimeType,
      });
    } catch (uploadError: any) {
      // If upload fails due to auth, try re-authenticating once
      if (uploadError?.message?.includes('Authentication') || uploadError?.status === 401) {
        console.log("Authentication failed during upload, re-authenticating...");
        agent = null; // Force re-authentication
        await initializeAgent();
        
        uploadResponse = await agent!.uploadBlob(uint8Array, {
          encoding: mimeType,
        });
      } else {
        throw uploadError;
      }
    }

    return {
      alt: "Game graphic",
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
  return generateGameHashtags(game, teamHashtag, "bluesky");
}



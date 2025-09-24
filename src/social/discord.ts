import { Client, GatewayIntentBits, TextChannel, AttachmentBuilder } from "discord.js";
import { Game, Config } from "../types";
import config from "../../config.json";
import { logObjectToFile } from "../logger";
import { retryOperation } from "./utils";

const typedConfig = config as Config;

let client: Client | null = null;
let isReady = false;

/**
 * Initialize and authenticate the Discord client
 */
async function initializeClient(): Promise<void> {
  if (!client) {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    client.once('ready', () => {
      console.log(`Discord bot logged in as ${client?.user?.tag}!`);
      isReady = true;
    });

    client.on('error', (error) => {
      console.error('Discord client error:', error);
      logObjectToFile("discord-error", error.message);
    });

    try {
      await client.login(typedConfig.discord.botToken);
      
      // Wait for the client to be ready
      while (!isReady) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      logObjectToFile("discord-auth-error", error as string);
      throw new Error("Failed to authenticate with Discord");
    }
  }
}

/**
 * Sends a message to Discord with optional media attachments.
 * @param text - The text content of the message.
 * @param game - Optional game object (not used for hashtags in Discord).
 * @param media - Optional array of media file paths to attach to the message.
 * @param retries - Number of retry attempts.
 * @returns A promise that resolves when the message is sent.
 */
export async function sendDiscordMessage(
  text: string,
  game?: Game,
  media?: string[],
  retries: number = 3,
): Promise<void> {
  const operation = async () => {
    await initializeClient();
    
    if (!client || !isReady) {
      throw new Error("Discord client not initialized or ready");
    }

    const channel = await client.channels.fetch(typedConfig.discord.channelId) as TextChannel;
    
    if (!channel) {
      throw new Error(`Discord channel ${typedConfig.discord.channelId} not found`);
    }

    const messageOptions: any = {
      content: text,
    };

    // Handle media attachments if provided
    if (media && media.length > 0) {
      const attachments = await Promise.all(
        media.map(async (mediaPath) => {
          try {
            return new AttachmentBuilder(mediaPath);
          } catch (error) {
            console.error(`Failed to create attachment for ${mediaPath}:`, error);
            return null;
          }
        })
      );

      const validAttachments = attachments.filter(a => a !== null);
      if (validAttachments.length > 0) {
        messageOptions.files = validAttachments;
      }
    }

    await channel.send(messageOptions);
   
  };

  await retryOperation(operation, retries, 5000, "discord", text);
}


/**
 * Gracefully shutdown the Discord client
 */
export async function shutdownDiscord(): Promise<void> {
  if (client) {
    await client.destroy();
    client = null;
    isReady = false;
  }
}

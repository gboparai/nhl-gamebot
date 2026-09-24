import { Client, GatewayIntentBits, AttachmentBuilder } from "discord.js";
import config from "../../config.json";
import { logger } from "../logger";
import { retryOperation } from "./utils";
const typedConfig = config;
let client = null;
let isReady = false;
/**
 * Initialize and authenticate the Discord client
 */
async function initializeClient() {
    if (!client || !isReady) {
        // If client exists but not ready, destroy it first
        if (client) {
            try {
                client.destroy();
            }
            catch (error) {
                logger.warn("Error destroying existing Discord client:", error);
            }
        }
        client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });
        isReady = false;
        // Set up event handlers
        client.once('ready', () => {
            logger.info(`Discord bot logged in as ${client?.user?.tag}!`);
            isReady = true;
        });
        client.on('error', (error) => {
            logger.error('Discord client error:', error);
            isReady = false;
        });
        client.on('disconnect', () => {
            logger.warn('Discord client disconnected');
            isReady = false;
        });
        try {
            await client.login(typedConfig.discord.botToken);
            // Wait for the client to be ready with timeout
            const timeout = 10000; // 10 seconds
            const startTime = Date.now();
            while (!isReady && (Date.now() - startTime) < timeout) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (!isReady) {
                throw new Error("Discord client failed to become ready within timeout");
            }
        }
        catch (error) {
            logger.error("Discord authentication error:", error);
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
export async function sendDiscordMessage(text, game, media, retries = 3) {
    const operation = async () => {
        await initializeClient();
        if (!client || !isReady) {
            throw new Error("Discord client not initialized or ready");
        }
        const channel = await client.channels.fetch(typedConfig.discord.channelId);
        if (!channel) {
            throw new Error(`Discord channel ${typedConfig.discord.channelId} not found`);
        }
        const messageOptions = {
            content: text,
        };
        // Handle media attachments if provided
        if (media && media.length > 0) {
            const attachments = await Promise.all(media.map(async (mediaPath) => {
                try {
                    return new AttachmentBuilder(mediaPath);
                }
                catch (error) {
                    logger.error(`Failed to create attachment for ${mediaPath}:`, error);
                    return null;
                }
            }));
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
export async function shutdownDiscord() {
    if (client) {
        await client.destroy();
        client = null;
        isReady = false;
    }
}

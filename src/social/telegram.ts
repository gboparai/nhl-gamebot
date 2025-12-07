import TelegramBot from "node-telegram-bot-api";
import { Game, Config } from "../types";
import config from "../../config.json";
import { logger } from "../logger";
import { retryOperation } from "./utils";

const typedConfig = config as Config;

let bot: TelegramBot | null = null;

/**
 * Initialize the Telegram bot
 */
async function initializeBot(): Promise<void> {
  if (!bot) {
    try {
      bot = new TelegramBot(typedConfig.telegram.botToken);
      // No need to wait for a 'ready' event like with Discord.
      // The bot is ready to use after the constructor returns.
      logger.info(`Telegram bot initialized.`);
    } catch (error) {
      logger.error("Telegram initialization error:", error);
      throw new Error("Failed to initialize Telegram bot");
    }
  }
}

/**
 * Sends a message to Telegram with optional media attachments.
 * @param text - The text content of the message.
 * @param game - Optional game object (not used for hashtags in Telegram).
 * @param media - Optional array of media file paths to attach to the message.
 * @param retries - Number of retry attempts.
 * @returns A promise that resolves when the message is sent.
 */
export async function sendTelegramMessage(
  text: string,
  game?: Game,
  media?: string[],
  retries: number = 3,
): Promise<void> {
  const operation = async () => {
    await initializeBot();
    
    if (!bot) {
      throw new Error("Telegram bot not initialized");
    }

    const chatId = typedConfig.telegram.chatId;

    // Handle media attachments if provided
    if (media && media.length > 0) {
        const mediaGroup: ReadonlyArray<TelegramBot.InputMedia> = media.map((mediaPath, index) => {
            const mediaObj: TelegramBot.InputMedia = {
                type: 'photo',
                media: mediaPath,
                caption: index === 0 ? text : '',
            };
            return mediaObj;
        });
        await bot.sendMediaGroup(chatId, mediaGroup);
    } else {
        await bot.sendMessage(chatId, text);
    }
  };

  await retryOperation(operation, retries, 5000, "telegram", text);
}

/**
 * Gracefully shutdown the Telegram bot
 */
export async function shutdownTelegram(): Promise<void> {
    if (bot) {
        // The node-telegram-bot-api library doesn't require a specific shutdown method
        // for the bot itself, but we can nullify the instance.
        bot = null;
        logger.info("Telegram bot instance cleared.");
    }
}

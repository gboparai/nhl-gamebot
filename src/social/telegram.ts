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
 * Sends a message to Telegram with optional media attachments and reply context.
 * @param text - The text content of the message.
 * @param game - Optional game object (not used for hashtags in Telegram).
 * @param media - Optional array of media file paths to attach to the message.
 * @param retries - Number of retry attempts.
 * @param telegramReplyTo - Optional message to reply to (only affects Telegram).
 * @returns A promise that resolves with the new message's ID.
 */
export async function sendTelegramMessage(
  text: string,
  game?: Game,
  media?: string[],
  retries: number = 3,
  telegramReplyTo?: { messageId: number },
): Promise<{ messageId: number } | undefined> {
  let messageId: number | undefined;

  const operation = async () => {
    await initializeBot();
    
    if (!bot) {
      throw new Error("Telegram bot not initialized");
    }

    const chatId = typedConfig.telegram.chatId;
    const messageOptions: TelegramBot.SendMessageOptions = {};

    if (telegramReplyTo?.messageId) {
      messageOptions.reply_to_message_id = telegramReplyTo.messageId;
    }

    // Handle media attachments if provided
    if (media && media.length > 0) {
        // Check if media contains GIF files
        const hasGif = media.some(path => path.toLowerCase().endsWith('.gif'));
        
        if (hasGif && media.length === 1) {
          // Send single GIF as animation with reply support
          const gifPath = media[0];
          const animationOptions: TelegramBot.SendAnimationOptions = {
            caption: text,
          };
          
          if (telegramReplyTo?.messageId) {
            animationOptions.reply_to_message_id = telegramReplyTo.messageId;
          }
          
          const sentMessage = await bot.sendAnimation(chatId, gifPath, animationOptions);
          messageId = sentMessage.message_id;
        } else {
          // Handle photos or mixed media
          const mediaGroup: ReadonlyArray<TelegramBot.InputMedia> = media.map((mediaPath, index) => {
  
              const mediaObj: TelegramBot.InputMedia = {
                  type: 'photo',
                  media: mediaPath,
                  caption: index === 0 ? text : '',
              };
              return mediaObj;
          });
          
          if (telegramReplyTo?.messageId) {
            // If replying and media, send text as reply, then media separately
            const sentMessage = await bot.sendMessage(chatId, text, messageOptions);
            messageId = sentMessage.message_id;
            await bot.sendMediaGroup(chatId, mediaGroup); // Media group sent without direct reply
          } else {
            const sentMessage = await bot.sendMediaGroup(chatId, mediaGroup);
            if (sentMessage && sentMessage.length > 0) {
              messageId = sentMessage[0].message_id; // Get message_id from the first media item
            }
          }
        }
    } else {
        const sentMessage = await bot.sendMessage(chatId, text, messageOptions);
        messageId = sentMessage.message_id;
    }
  };

  await retryOperation(operation, retries, 5000, "telegram", text);

  if (messageId) {
    return { messageId };
  }
  return undefined;
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

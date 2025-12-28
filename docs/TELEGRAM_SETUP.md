# Telegram Bot Setup Guide

This guide will walk you through the process of setting up a Telegram bot and obtaining the necessary credentials to integrate it with the NHL Game Bot.

## 1. Create a New Telegram Bot

1.  **Start a chat with BotFather:** Open Telegram and search for the user `@BotFather`. This is the official bot for creating and managing other bots.
2.  **Create a new bot:** Send the `/newbot` command to BotFather.
3.  **Choose a name and username:**
    *   BotFather will ask for a name for your bot. This is the display name that users will see.
    *   Next, it will ask for a username. This username must be unique and end in `bot` (e.g., `MyNhlGameBot`).
4.  **Copy the bot token:** Once you've chosen a username, BotFather will provide you with a bot token. This token is essential for authenticating your bot, so keep it safe and private.

    You will need this token for the `botToken` field in your `config.json` file.

## 2. Obtain the Chat ID

1.  **Find your bot:** Search for your newly created bot in Telegram using its username.
2.  **Start the bot:** Click the "Start" button to initiate a conversation with your bot.
3.  **Send a message:** Send any message to your bot (e.g., `/start`).
4.  **Retrieve the Chat ID:** There are a few ways to get the Chat ID:
    *   **Using another bot:** Search for a bot like `@userinfobot`, start it, and it will tell you your user ID. This ID is your chat ID for private messages with the bot.
    *   **Using the Telegram API:** You can also get the chat ID by sending a request to the Telegram API. Open the following URL in your browser, replacing `YOUR_BOT_TOKEN` with the token you obtained from BotFather:

        ```
        https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
        ```

        Look for the `chat` object in the JSON response. The `id` field within this object is your Chat ID.

    You will need this ID for the `chatId` field in your `config.json` file.

## 3. Configure the NHL Game Bot

1.  **Open `config.json`:** Locate the `config.json` file in the root directory of your NHL Game Bot project.
2.  **Add the Telegram configuration:** Add the following section to your `config.json` file, replacing the placeholder values with your actual bot token and chat ID:

    ```json
    "telegram": {
      "isActive": true,
      "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
      "chatId": "YOUR_TELEGRAM_CHAT_ID"
    }
    ```

3.  **Set `isActive` to `true`:** To enable the Telegram integration, make sure the `isActive` property is set to `true`.

4.  **Restart the bot:** If the NHL Game Bot is already running, restart it to apply the new configuration.

Your bot should now be able to send game updates to your specified Telegram chat.

# Discord Integration Setup

This guide explains how to set up Discord integration for the NHL GameBot.

## Prerequisites

1. A Discord server where you want the bot to post
2. A Discord bot application and token

## Configuration

### Step 1: Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "NHL GameBot")
3. Go to the "Bot" section in the left sidebar
4. Click "Add Bot"
5. Under the "Token" section, click "Copy" to copy your bot token
6. **Important**: Keep this token secret and never share it publicly

### Step 2: Get Channel and Guild IDs

1. Enable Developer Mode in Discord:

   - Go to User Settings (gear icon)
   - Advanced → Enable "Developer Mode"

2. Get your Guild (Server) ID:

   - Right-click on your server name
   - Click "Copy Server ID"

3. Get your Channel ID:
   - Right-click on the channel where you want the bot to post
   - Click "Copy Channel ID"

### Step 3: Invite Bot to Your Server

1. In the Discord Developer Portal, go to "OAuth2" → "URL Generator"
2. Select these scopes:
   - `bot`
3. Select these bot permissions:
   - `Send Messages`
   - `Attach Files`
   - `Embed Links`
   - `Read Message History`
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### Step 4: Update Configuration

In your `config.json` file, update the Discord section:

```json
{
  "discord": {
    "botToken": "your-bot-token-here",
    "channelId": "your-channel-id-here",
    "guildId": "your-guild-id-here",
    "isActive": false
  }
}
```

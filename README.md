# NHL GameBot

An automated bot for posting NHL game updates to social media platforms.

## Features

- 🐦 **Twitter Integration**: Post game updates, scores, and media to Twitter
- 🦋 **Bluesky Integration**: Cross-post to Bluesky with proper hashtag handling
- 💬 **Discord Integration**: Send game updates and graphics to Discord channels
- 🏒 **Game Tracking**: Automatic game detection and updates
- 🖼️ **Media Support**: Automatic graphic generation and posting
- 🎥 **Automatic Video Posting**: Detect and post highlight videos automatically
- ⚡ **Real-time Updates**: Live game monitoring and posting

## Social Media Platforms

### Twitter

Traditional Twitter API integration with media upload support.
Limited Posting due to 17 post per 24 hours limit

### Bluesky

Bluesky integration with:

- Proper hashtag detection using AT Protocol facets
- Rich text support
- Media upload capabilities

### Discord

Discord integration with:

- Channel posting capabilities
- Rich text support using Markdown
- Ability to send messages to specific channels using the `channelId` configuration option


## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure your social media credentials in `config.json`
4. Start the bot: `npm start`

## Configuration

See the following documentation for detailed setup:

- [App Setup Guide](./docs/APP_SETUP.md)
- [Bluesky Setup Guide](./docs/BLUESKY_SETUP.md)
- [Discord Setup Guide](./docs/DISCORD_SETUP.md)
- [Twitter Setup Guide](./docs/TWITTER_SETUP.md)

## Development

- `npm start` - Run the bot
- `npm test` - Run tests

## License

See [LICENSE.md](LICENSE.md) for details.

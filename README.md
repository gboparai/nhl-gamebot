# NHL GameBot

An automated bot for posting NHL game updates to social media platforms.

## Features

- 🐦 **Twitter Integration**: Post game updates, scores, and media to Twitter
- 🦋 **Bluesky Integration**: Cross-post to Bluesky with proper hashtag handling
- 🏒 **Game Tracking**: Automatic game detection and updates
- 📊 **Statistics**: Integration with various hockey statistics services
- 🖼️ **Media Support**: Automatic graphic generation and posting
- ⚡ **Real-time Updates**: Live game monitoring and posting

## Social Media Platforms

### Twitter

Traditional Twitter API integration with media upload support.

### Bluesky

Full Bluesky integration with:

- Proper hashtag detection using AT Protocol facets
- Rich text support
- Media upload capabilities
- **⚠️ Warning**: Special handling for text containing hashtags due to platform differences

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure your social media credentials in `config.json`
4. Build the project: `npm run build`
5. Start the bot: `npm start`

## Configuration

See the following documentation for detailed setup:

- [Bluesky Setup Guide](./docs/BLUESKY_SETUP.md)
- [Bluesky Hashtag Examples](./docs/BLUESKY_HASHTAG_EXAMPLES.md)

## Development

- `npm start` - Run the bot
- `npm run build` - Build TypeScript
- `npm test` - Run tests

## License

See [LICENSE.md](LICENSE.md) for details.

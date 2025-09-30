# Bluesky Integration Setup

This guide explains how to set up Bluesky integration for the NHL GameBot.

## Prerequisites

1. A Bluesky account
2. An app password generated from Bluesky

## Configuration

### Step 1: Generate an App Password

1. Go to your Bluesky account settings
2. Navigate to "Privacy and Security" → "App Passwords"
3. Click "Add App Password"
4. Give it a name (e.g., "NHL GameBot")
5. Copy the generated password (you won't be able to see it again)

### Step 2: Update Configuration

In your `config.json` file, update the Bluesky section:

```json
{
  "bluesky": {
    "identifier": "your-handle.bsky.social", // Your Bluesky handle
    "password": "your-app-password-here", // The app password you generated
    "handle": "@your-handle.bsky.social", // Your display handle
    "isActive": true // Set to true to enable Bluesky posting
  }
}
```

### Media Support

Bluesky supports:

- Images (JPEG, PNG, GIF, WebP)
- Up to 4 images per post
- Alt text for accessibility

### Error Handling

The Bluesky integration includes:

- Automatic retry logic for network failures
- Comprehensive error logging
- Graceful degradation if Bluesky is unavailable


## Troubleshooting

### Authentication Errors

- Verify your handle and app password are correct
- Ensure you're using an app password, not your account password
- Check that your Bluesky account is in good standing

### Media Upload Errors

- Ensure image files exist and are readable
- Check file size limits (Bluesky has specific limits)
- Verify supported image formats (JPEG, PNG, GIF, WebP)

### Text Length Issues

- Bluesky has a 300-character limit
- Consider shortening text or splitting into multiple posts
- Be mindful of hashtag character count

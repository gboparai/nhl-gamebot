# Twitter Integration Setup

This guide explains how to set up Twitter (X) integration for the NHL GameBot.

## Prerequisites

1. A Twitter/X account
2. Access to Twitter Developer Portal
3. An approved Developer account with Elevated access

## Configuration

### Step 1: Create a Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign in with your Twitter account
3. Apply for a Developer account
4. Complete the application process (explain your use case)
5. Wait for approval (usually takes a few hours to a few days)

### Step 2: Create a Twitter App

1. Once approved, go to the [Developer Portal Dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create Project" or "Create App"
3. Fill in the required information:
   - App name (e.g., "NHL GameBot")
   - Description of your app
   - Website URL (can be a GitHub repo)
4. Click "Create"

### Step 4: Generate API Keys and Tokens

1. Go to your app in the Developer Portal
2. Navigate to "Keys and tokens" tab
3. Generate the following credentials:

   **API Key and Secret:**
   - Click "Regenerate" under "Consumer Keys"
   - Copy the **API Key** (this is your `appKey`)
   - Copy the **API Key Secret** (this is your `appSecret`)

   **Access Token and Secret:**
   - Scroll down to "Authentication Tokens"
   - Click "Generate" under "Access Token and Secret"
   - Make sure permissions are set to **"Read and Write"**
   - Copy the **Access Token** (this is your `accessToken`)
   - Copy the **Access Token Secret** (this is your `accessSecret`)

### Step 5: Update Configuration

In your `config.json` file, update the Twitter section:

```json
{
  "twitter": {
    "appKey": "your-api-key-here",
    "appSecret": "your-api-key-secret-here",
    "accessToken": "your-access-token-here",
    "accessSecret": "your-access-token-secret-here",
    "isActive": true
  }
}
```

### Step 6: Set App Permissions

1. In Developer Portal, go to your app settings
2. Navigate to "User authentication settings"
3. Click "Set up"
4. Select "Read and write" permissions
5. Save changes

## Features

### Media Support

Twitter supports:
- Images (JPEG, PNG, GIF, WebP)
- Up to 4 images per tweet
- Alt text for accessibility
- Videos (MP4, MOV)

### Character Limits

- Standard tweets: 280 characters
- With media: Character count includes media URL (approximately 23 characters)





### Rate Limiting

**Error: "Rate limit exceeded"**
- Twitter has posting limits 17 requests / 24 hours for free tier

### Media Upload Errors

- Ensure image files exist and are readable
- Check file size limits:
  - Images: 5MB max
  - GIFs: 15MB max
  - Videos: 512MB max
- Verify supported formats (JPEG, PNG, GIF, WebP, MP4, MOV)



## API Version

This integration uses **Twitter API v2** with the `twitter-api-v2` npm package.



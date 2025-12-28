# Threads Setup Guide

This guide will walk you through the process of setting up the NHL Game Bot to post on Threads.

## 1. Prerequisites

*   An active Instagram account that is enabled for Threads.
*   Your Instagram username and password.

## 2. Configure the NHL Game Bot

1.  **Open `config.json`:** Locate the `config.json` file in the root directory of your NHL Game Bot project.
2.  **Add the Threads configuration:** Add the following section to your `config.json` file, replacing the placeholder values with your Instagram username and password:

    ```json
    "threads": {
      "isActive": true,
      "username": "YOUR_INSTAGRAM_USERNAME",
      "password": "YOUR_INSTAGRAM_PASSWORD"
    }
    ```

3.  **Set `isActive` to `true`:** To enable the Threads integration, make sure the `isActive` property is set to `true`.

4.  **Restart the bot:** If the NHL Game Bot is already running, restart it to apply the new configuration.

Your bot should now be able to post game updates to your Threads account.

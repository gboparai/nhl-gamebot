# NHL GameBot App Setup

This guide explains how to configure the `app` section in your `config.json` for NHL GameBot.

## Example Configuration

```
"app": {
    "script": {
        "team": "VAN", // Team abbreviation (e.g., VAN for Vancouver Canucks)
        "teamName": "Vancouver Canucks", // Full team name
        "timeZone": "America/Los_Angeles", // Time zone for scheduling
        "preview_sleep_time": 1800000, // Time (ms) to wait before preview
        "pregame_sleep_time": 60000, // Time (ms) to wait before pregame
        "live_sleep_time": 5000, // Time (ms) between live updates
        "intermission_sleep_time": 60000, // Time (ms) during intermission
        "final_sleep_time": 10000, // Time (ms) after game ends
        "no_game_sleep_time": 25200000, // Time (ms) when no game is scheduled
        "error_sleep_time": 300000, // Time (ms) to wait after error
        "video_retry_sleep_time": 60000, // Time (ms) to retry video fetch
        "endgame_sleep_time": 25200000, // Time (ms) after endgame
        "waiting_no_game_sleep_time": 25200000, // Time (ms) waiting for next game
        "error_retry_sleep_time": 300000, // Time (ms) to retry after error
        "three_stars_retry_sleep_time": 60000, // Time (ms) to retry three stars fetch
        "main_loop_error_sleep_time": 300000 // Time (ms) to wait after main loop error
    },
    "services": {
        "dailyfaceoff": true, // Enable Daily Faceoff integration
        "scoutingTheRefs": true // Enable Scouting The Refs integration
    },
    "log_file_name": "logfile.log", // Log file name
    "debug": true // Enable debug mode
}
```

## Field Descriptions

### script

- **team**: NHL team abbreviation (e.g., "VAN", "TOR").
- **teamName**: Full team name for display.
- **timeZone**: Time zone for scheduling game updates.
- **preview_sleep_time**: Milliseconds to wait before preview updates.
- **pregame_sleep_time**: Milliseconds to wait before pregame updates.
- **live_sleep_time**: Milliseconds between live game updates.
- **intermission_sleep_time**: Milliseconds to wait during intermission.
- **final_sleep_time**: Milliseconds to wait after game ends.
- **no_game_sleep_time**: Milliseconds to wait when no game is scheduled.
- **error_sleep_time**: Milliseconds to wait after encountering an error.
- **video_retry_sleep_time**: Milliseconds to wait before retrying video fetch.
- **endgame_sleep_time**: Milliseconds to wait after endgame.
- **waiting_no_game_sleep_time**: Milliseconds to wait for next game.
- **error_retry_sleep_time**: Milliseconds to wait before retrying after error.
- **three_stars_retry_sleep_time**: Milliseconds to wait before retrying three stars fetch.
- **main_loop_error_sleep_time**: Milliseconds to wait after main loop error.

### services

- **dailyfaceoff**: Enable/disable Daily Faceoff stats.
- **scoutingTheRefs**: Enable/disable Scouting The Refs.

### log_file_name

- Name of the log file for app output.

### debug

- Enable debug mode for verbose logging.

## Setup Steps

1. Copy `config.template.json` to `config.json`.
2. Edit the `app` section as shown above to match your team and preferences.
3. Save and start the bot with `npm start`.

For more details, see the main [README.md](./README.md) and platform-specific setup guides in the `docs/` folder.

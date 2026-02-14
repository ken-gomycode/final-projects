# Slack Bot

A Slack bot built with [Bolt for JavaScript](https://slack.dev/bolt-js) that responds to messages, handles slash commands, and logs channel messages.

## Features

- **Message logging** — Logs every message (timestamp, user, channel, text) to the console via the Events API
- **Greeting response** — Replies with a mention when someone says "hello"
- **Slash command** — Responds to `/hello` with a personalized greeting

## Slack App Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App** > **From scratch**
2. Name the app and select your workspace

### Enable Socket Mode

3. Go to **Settings > Socket Mode** and toggle it on
4. Create an app-level token with the `connections:write` scope — save this as `SLACK_APP_TOKEN`

### Set Bot Scopes

5. Go to **Features > OAuth & Permissions > Scopes > Bot Token Scopes** and add:
   - `chat:write`
   - `channels:history`
   - `commands`

### Create the Slash Command

6. Go to **Features > Slash Commands** and click **Create New Command**
   - Command: `/hello`
   - Description: `Say hello`

### Subscribe to Events

7. Go to **Features > Event Subscriptions** and toggle on
8. Under **Subscribe to bot events**, add:
   - `message.channels`

### Install the App

9. Go to **Settings > Install App** and click **Install to Workspace**
10. Copy the **Bot User OAuth Token** — save this as `SLACK_BOT_TOKEN`
11. Copy the **Signing Secret** from **Settings > Basic Information** — save this as `SLACK_SIGNING_SECRET`

## Local Setup

```bash
cd slack-bot
npm install
cp .env.example .env
# Edit .env with your tokens
npm start
```

## Testing

1. **Invite the bot** to a channel: `/invite @YourBotName`
2. **Message logging** — Send any message in the channel and check the terminal for log output
3. **Greeting** — Type "hello" in the channel — the bot should reply with a mention
4. **Slash command** — Type `/hello` — the bot should respond with a greeting

## Troubleshooting

- **`not_authed` error** — Check that `SLACK_BOT_TOKEN` starts with `xoxb-`
- **No message events** — Make sure `message.channels` is subscribed and the bot is invited to the channel
- **`/hello` not working** — Verify the slash command is created in the Slack app config and `commands` scope is added
- **Socket Mode errors** — Check that `SLACK_APP_TOKEN` starts with `xapp-` and Socket Mode is enabled

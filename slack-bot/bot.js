require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Log all messages received via the Events API
app.message(async ({ message }) => {
  console.log(
    `[${new Date(message.ts * 1000).toISOString()}] ` +
    `User: ${message.user} | Channel: ${message.channel} | ` +
    `Text: ${message.text}`
  );
});

// Respond to messages containing "hello"
app.message(/hello/i, async ({ message, say }) => {
  await say(`Hey there <@${message.user}>!`);
});

// Handle the /hello slash command
app.command('/hello', async ({ command, ack, respond }) => {
  await ack();
  await respond(`Hello <@${command.user_id}>! Thanks for using /hello.`);
});

(async () => {
  await app.start();
  console.log('Slack bot is running in Socket Mode');
})();

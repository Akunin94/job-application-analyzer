import { app } from './app.js';
import { createBot } from './bot.js';
import { env } from './config/env.js';
import { initSentry } from './config/sentry.js';

initSentry();

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});

if (env.TELEGRAM_BOT_TOKEN) {
  const bot = createBot();
  void bot.start();
  console.log('[Bot] Telegram bot started (long polling)');
}

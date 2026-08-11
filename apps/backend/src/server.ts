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

  // bot.start() only settles when polling stops. Leaving it unhandled meant a
  // polling failure — most often a 409 because another instance (a deploy, or a
  // second `pnpm dev`) holds the same token — became an unhandled rejection and
  // took the whole API process down with it, killing any in-flight SSE stream.
  bot.start().catch((err: unknown) => {
    console.error('[Bot] Telegram polling stopped; the API keeps running.', err);
  });

  console.log('[Bot] Telegram bot started (long polling)');
}

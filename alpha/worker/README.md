# Titan Alpha — Telegram worker

Hourly worker that posts newly-discovered airdrops to the Telegram channel
[@titanx_wallet](https://t.me/titanx_wallet) using Cerebras `gpt-oss-120b`.

It pulls the live, scored, link-validated feed from the Alpha API
(`/api/opportunities`), so it reuses the same scraping + scoring + dead-link
filtering as the website. Only **new** airdrops (not posted before) are sent.

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) → get the bot token.
2. Add the bot as an **admin** of the `@titanx_wallet` channel (needs "Post messages").
3. Set env vars:

```
CEREBRAS_API_KEY=...        # same key as Titan Alpha
TELEGRAM_BOT_TOKEN=...       # from BotFather
TELEGRAM_CHAT_ID=@titanx_wallet
TELEGRAM_THREAD_ID=4         # optional — only for forum/topic channels
WORKER_MODEL=gpt-oss-120b    # optional
POST_LIMIT=3                 # optional — max posts per hour
```

## Run

```bash
node worker/telegramBot.mjs --dry     # preview posts, no send
node worker/telegramBot.mjs --once    # one real run
node worker/telegramBot.mjs --loop    # run forever, hourly
```

## Production (VPS)

Runs as its own container `titan-alpha-worker` on the `coolify` network with the
same bind-mount as `titan-alpha`, command `node worker/telegramBot.mjs --loop`.
Dedupe state is kept in `worker/.posted.json` (gitignored).

#!/usr/bin/env node
// Titan Alpha — Telegram airdrop worker.
// Hourly: pulls the live, scored, link-validated feed from the Alpha API, finds NEW
// airdrops, writes a short post with Cerebras gpt-oss-120b, and posts to the Telegram channel.
//
// Env:
//   CEREBRAS_API_KEY   (required) — same key as Titan Alpha
//   CEREBRAS_BASE_URL  (optional) — defaults to Cerebras chat completions
//   WORKER_MODEL       (optional) — defaults to gpt-oss-120b
//   TELEGRAM_BOT_TOKEN (required) — from @BotFather; bot must be admin of the channel
//   TELEGRAM_CHAT_ID   (required) — e.g. @titanx_wallet
//   TELEGRAM_THREAD_ID (optional) — forum topic id (e.g. 4)
//   ALPHA_API          (optional) — defaults to https://alpha.titanwallet.net/api/opportunities
//   POST_LIMIT         (optional) — max posts per run (default 3)
//   STATE_FILE         (optional) — dedupe state path (default ./worker/.posted.json)
// Flags: --loop (run forever, hourly), --once (single run, default), --dry (no Telegram send)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const CEREBRAS_BASE = process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1/chat/completions';
const MODEL = process.env.WORKER_MODEL || 'gpt-oss-120b';
const ALPHA_API = process.env.ALPHA_API || 'https://alpha.titanwallet.net/api/opportunities';
const STATE_FILE = process.env.STATE_FILE || new URL('./.posted.json', import.meta.url).pathname;
const POST_LIMIT = Number(process.env.POST_LIMIT || 3);
const INTERVAL_MS = 60 * 60 * 1000; // hourly

const DRY = process.argv.includes('--dry');
const LOOP = process.argv.includes('--loop');

function log(...a) { console.log(new Date().toISOString(), ...a); }

function loadState() {
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch { return { posted: [] }; }
}
function saveState(state) {
  try {
    mkdirSync(dirname(STATE_FILE), { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) { log('state save failed:', e.message); }
}

async function fetchFeed() {
  const res = await fetch(ALPHA_API, { headers: { 'User-Agent': 'titan-alpha-worker' } });
  if (!res.ok) throw new Error(`Alpha API HTTP ${res.status}`);
  const json = await res.json();
  return Array.isArray(json.opportunities) ? json.opportunities : [];
}

async function writePost(op) {
  const key = process.env.CEREBRAS_API_KEY?.trim();
  const link = op.url || (op.twitter ? `https://x.com/${op.twitter}` : 'https://alpha.titanwallet.net');
  const facts = {
    name: op.name,
    ecosystem: op.ecosystem,
    category: op.category,
    status: op.airdropStatus,
    aiScore: op.aiScore,
    securityScore: op.securityScore,
    riskLevel: op.riskLevel,
    requirements: op.requirements,
    summary: op.aiSummary,
  };
  const system = `You write punchy, factual Telegram posts for "Titan Alpha", a Web3 airdrop intelligence channel.
Rules: 4-6 short lines. Start with a relevant emoji + project name. Include AI Score, Security Score, risk, and 1-line why-it-matters. No hype words like "guaranteed" or "moon". No financial advice. Output PLAIN TEXT ONLY (no markdown asterisks). Keep under 480 characters. Do NOT invent facts beyond the data given.`;
  const user = `Write the post for this airdrop. Data: ${JSON.stringify(facts)}`;

  try {
    const res = await fetch(CEREBRAS_BASE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.6, max_tokens: 2000 }),
    });
    const j = await res.json();
    const text = j.choices?.[0]?.message?.content?.trim();
    if (text) return { text, link };
  } catch (e) { log('LLM failed for', op.name, e.message); }

  // Fallback (no LLM): deterministic template.
  const text = `🪂 ${op.name} (${op.ecosystem})\nStatus: ${op.airdropStatus}\nAI Score: ${op.aiScore} · Security: ${op.securityScore} · ${op.riskLevel} risk\n${op.aiSummary}`;
  return { text, link };
}

async function sendTelegram(text, link, projectX) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const threadId = process.env.TELEGRAM_THREAD_ID?.trim();
  if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required');

  const buttons = [[{ text: '🔎 Verify on Titan X-Ray', url: 'https://xray.titanwallet.net' }, { text: '🚀 Open project', url: link }]];
  if (projectX) buttons.push([{ text: `Follow @${projectX}`, url: `https://x.com/${projectX}` }]);
  buttons.push([{ text: '📡 More on Titan Alpha', url: 'https://alpha.titanwallet.net' }]);

  const body = {
    chat_id: chatId,
    text,
    disable_web_page_preview: false,
    reply_markup: { inline_keyboard: buttons },
  };
  if (threadId) body.message_thread_id = Number(threadId);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(`Telegram error: ${JSON.stringify(j).slice(0, 200)}`);
  return j.result?.message_id;
}

async function runOnce() {
  const state = loadState();
  const posted = new Set(state.posted || []);
  let feed = [];
  try { feed = await fetchFeed(); } catch (e) { log('feed fetch failed:', e.message); return; }

  // New = not posted before. Prefer confirmed/claim-live & highest AI score.
  const fresh = feed
    .filter((op) => !posted.has(op.name.toLowerCase()))
    .sort((a, b) => {
      const rank = (x) => (x.statusKind === 'claim-live' ? 3 : x.statusKind === 'confirmed' ? 2 : x.statusKind === 'ongoing' ? 1 : 0);
      return rank(b) - rank(a) || b.aiScore - a.aiScore;
    })
    .slice(0, POST_LIMIT);

  if (!fresh.length) { log('no new airdrops'); return; }

  for (const op of fresh) {
    const { text, link } = await writePost(op);
    if (DRY) {
      log('DRY post:', op.name, '\n', text, '\nlink:', link);
    } else {
      try {
        const id = await sendTelegram(text, link, op.twitter);
        log('posted', op.name, 'message_id', id);
      } catch (e) {
        log('post failed', op.name, e.message);
        continue; // don't mark as posted if send failed
      }
    }
    posted.add(op.name.toLowerCase());
  }

  state.posted = [...posted].slice(-500); // cap state size
  state.lastRun = new Date().toISOString();
  saveState(state);
  log('run complete');
}

async function main() {
  await runOnce();
  if (LOOP) {
    log(`looping every ${INTERVAL_MS / 60000} min`);
    setInterval(() => { runOnce().catch((e) => log('run error:', e.message)); }, INTERVAL_MS);
  }
}

main().catch((e) => { log('fatal:', e.message); process.exit(1); });

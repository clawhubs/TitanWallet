import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fetchAirdropsIo, resolveOfficial } from './airdropsIo';
import type { Opportunity, OpportunityCategory, RiskLevel, YieldPotential } from './types';

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_ITEMS = 30;   // displayed opportunities
const POOL = 60;        // candidate pool before link validation
let cache: { at: number; data: Opportunity[] } | null = null;

/** Runs async tasks with bounded concurrency (polite to upstreams, avoids blocks). */
async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { await fn(items[idx]); } catch { /* ignore */ }
    }
  });
  await Promise.all(workers);
}

/* ----------------------------- DefiLlama source ---------------------------- */

interface LlamaProtocol {
  name: string;
  symbol?: string;
  logo?: string;
  url?: string;
  description?: string;
  twitter?: string;
  gecko_id?: string | null;
  category?: string;
  chains?: string[];
  tvl?: number;
  change_7d?: number;
  listedAt?: number;
  audits?: string | number;
}

const AIRDROP_CATEGORIES = new Set([
  'Dexes', 'Dexs', 'DEX Aggregator', 'Lending', 'Liquid Staking', 'Liquid Restaking',
  'Restaking', 'Yield', 'Yield Aggregator', 'Yield Lottery', 'Derivatives', 'Options',
  'Perps', 'CDP', 'Farm', 'Services', 'Bridge', 'Launchpad', 'Prediction Market',
  'Basis Trading', 'Leveraged Farming', 'RWA', 'NFT Marketplace', 'Synthetics',
  'Liquidity manager', 'Options Vault', 'Staking Pool', 'Decentralized Stablecoin',
]);
const BLOCKED_CATEGORIES = new Set(['CEX', 'Chain', 'Bridge Aggregator', 'Treasury Manager']);
const NEW_WINDOW_SEC = 120 * 24 * 60 * 60;

function hasNoToken(p: LlamaProtocol): boolean {
  return (!p.gecko_id || p.gecko_id === null) && (p.symbol === '-' || !p.symbol);
}

function cleanTwitter(t?: string): string | undefined {
  if (!t) return undefined;
  const h = t.replace(/^@/, '').replace(/^https?:\/\/(x|twitter)\.com\//i, '').split(/[/?]/)[0].trim();
  return h && h.toLowerCase() !== 'none' ? h : undefined;
}

/** Normalized seed shared by both sources before AI scoring. */
interface Seed {
  name: string;
  ecosystem: string;
  category: string;
  logo?: string;
  url?: string;          // official project site (resolved for airdrops.io)
  detailUrl?: string;    // internal: airdrops.io page used only to resolve official link
  twitter?: string;
  tvl?: number;
  about?: string;
  momentum?: number;
  audits?: number;
  tokenStatus: 'none' | 'live';
  statusKind: Opportunity['statusKind'];
  airdropStatus: string;
  popularity?: number;
  requirements?: string[];
  isNew: boolean;
  sourceType: Opportunity['sourceType'];
  source: string;
  preScore: number; // pre-AI ranking signal
}

async function fetchDefiLlamaSeeds(): Promise<Seed[]> {
  const res = await fetch('https://api.llama.fi/protocols', { cache: 'no-store' });
  if (!res.ok) throw new Error(`DefiLlama HTTP ${res.status}`);
  const all: LlamaProtocol[] = await res.json();
  const nowSec = Math.floor(Date.now() / 1000);

  const filtered = all.filter((p) =>
    p.category && !BLOCKED_CATEGORIES.has(p.category) && AIRDROP_CATEGORIES.has(p.category) &&
    hasNoToken(p) &&
    typeof p.tvl === 'number' && p.tvl > 500_000 && p.tvl < 3_000_000_000 &&
    Array.isArray(p.chains) && p.chains.length > 0,
  );

  return filtered.map((p) => {
    const isNew = (nowSec - (p.listedAt || 0)) < NEW_WINDOW_SEC;
    const momentum = Math.round(p.change_7d || 0);
    return {
      name: p.name,
      ecosystem: p.chains?.[0] || 'Multi-chain',
      category: p.category || 'DeFi',
      logo: p.logo,
      url: p.url,
      twitter: cleanTwitter(p.twitter),
      tvl: p.tvl,
      about: (p.description || '').slice(0, 180),
      momentum,
      audits: Number(p.audits) || 0,
      tokenStatus: 'none' as const,
      statusKind: 'pre-token' as const,
      airdropStatus: isNew ? 'New · pre-token, farming live' : 'Pre-token · farming live',
      isNew,
      sourceType: 'defillama' as const,
      source: `DefiLlama · ${momentum >= 0 ? '+' : ''}${momentum}% 7d TVL`,
      preScore: (isNew ? 40 : 0) + Math.max(-15, Math.min(35, momentum)) + (p.tvl && p.tvl < 80_000_000 ? 10 : 5),
    };
  });
}

async function fetchAirdropsIoSeeds(): Promise<Seed[]> {
  const items = await fetchAirdropsIo();
  return items.map((a) => {
    const statusLabel = a.status === 'claim-live' ? 'Claim live' : a.status === 'confirmed' ? 'Confirmed · ongoing' : 'Ongoing';
    return {
      name: a.name,
      ecosystem: a.category ? a.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Web3',
      category: a.category || 'airdrop',
      logo: a.logo,
      detailUrl: a.url, // resolved to official link later; we never link to airdrops.io
      about: `${statusLabel} airdrop${a.requirements.length ? `, requires ${a.requirements.join(', ')}` : ''}.`,
      tokenStatus: 'none' as const,
      statusKind: a.status,
      airdropStatus: a.status === 'claim-live' ? 'Claim live now' : a.status === 'confirmed' ? 'Confirmed · ongoing' : 'Ongoing',
      popularity: a.popularity,
      requirements: a.requirements,
      isNew: a.isNew,
      sourceType: 'airdrops.io' as const,
      source: 'airdrops.io',
      preScore: (a.isNew ? 35 : 0) + Math.min(45, a.popularity) + (a.status === 'claim-live' ? 25 : a.status === 'confirmed' ? 15 : 0),
    };
  });
}

/* --------------------------- Deterministic scoring -------------------------- */
// Scores come from REAL signals (TVL, audits, status, popularity, momentum), not an
// LLM guess — so they're stable, defensible, and never collapse to identical values.

function clampCat(v: unknown): OpportunityCategory {
  const s = String(v).toLowerCase();
  return (['airdrop', 'testnet', 'ecosystem', 'incentive', 'points', 'rewards'] as string[]).includes(s) ? (s as OpportunityCategory) : 'airdrop';
}
function clampScore(v: unknown, fallback = 70): number { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback; }

/** Risk derived from the security score so the badge never contradicts the displayed score. */
function deriveRisk(securityScore: number, statusKind: Opportunity['statusKind']): RiskLevel {
  let r: RiskLevel = securityScore >= 80 ? 'low' : securityScore >= 60 ? 'medium' : 'high';
  if (statusKind === 'pre-token' && r === 'low') r = 'medium';
  return r;
}

function formatUsd(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

interface ComputedScore {
  aiScore: number;
  securityScore: number;
  yieldPotential: YieldPotential;
  category: OpportunityCategory;
  ecosystem: string;
  aiSummary: string;
}

/** Security: how battle-tested / trustworthy (TVL, audits, status, community heat). */
function computeSecurity(s: Seed): number {
  if (s.sourceType === 'defillama') {
    let sec = 50;
    const tvl = s.tvl || 0;
    if (tvl >= 1e9) sec += 30;
    else if (tvl >= 2.5e8) sec += 24;
    else if (tvl >= 5e7) sec += 17;
    else if (tvl >= 1e7) sec += 10;
    else sec += 4;
    if ((s.audits || 0) >= 2) sec += 10; else if ((s.audits || 0) === 1) sec += 6;
    return clampScore(sec);
  }
  // airdrops.io: no TVL — use vetting status + community popularity.
  let sec = 50;
  if (s.statusKind === 'confirmed' || s.statusKind === 'claim-live') sec += 15;
  else if (s.statusKind === 'ongoing') sec += 6;
  sec += Math.min(22, Math.round((s.popularity || 0) / 6)); // temp 132+ -> +22
  return clampScore(sec);
}

/** AI Score: airdrop/alpha potential (status, hype, momentum, freshness). */
function computeAi(s: Seed): number {
  let ai = 50;
  if (s.statusKind === 'claim-live') ai += 24;
  else if (s.statusKind === 'confirmed') ai += 16;
  else if (s.statusKind === 'ongoing') ai += 9;
  else ai += 6; // pre-token
  ai += Math.min(20, Math.round((s.popularity || 0) / 7));        // airdrops.io heat
  ai += Math.max(-6, Math.min(12, Math.round((s.momentum || 0) / 3))); // DefiLlama TVL momentum
  const tvl = s.tvl || 0;
  if (tvl >= 1e8) ai += 6; else if (tvl >= 1e7) ai += 3;
  if (s.isNew) ai += 4;
  return clampScore(ai);
}

function computeScores(s: Seed): ComputedScore {
  const securityScore = computeSecurity(s);
  const aiScore = computeAi(s);
  const yieldPotential: YieldPotential = aiScore >= 80 ? 'high' : aiScore >= 62 ? 'medium' : 'low';
  const tvlTxt = s.tvl ? ` ($${formatUsd(s.tvl)} TVL)` : '';
  const popTxt = s.popularity ? `, ${s.popularity}° trending` : '';
  const reqTxt = s.requirements && s.requirements.length ? ` Tasks: ${s.requirements.join(', ')}.` : '';
  const aiSummary = s.sourceType === 'airdrops.io'
    ? `${s.airdropStatus} on ${s.ecosystem}${popTxt}.${reqTxt} Early participation may qualify for rewards.`
    : `No token yet — ${s.ecosystem} ${s.category}${tvlTxt}. Early users may qualify for a future airdrop.`;
  return { aiScore, securityScore, yieldPotential, category: clampCat('airdrop'), ecosystem: s.ecosystem, aiSummary };
}

/* --------------------------------- Engine ---------------------------------- */

const CHECK_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

/** Returns false on dead/blocked links (network error, 4xx except 429, 5xx). */
async function linkAlive(url?: string): Promise<boolean> {
  if (!url) return false;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': CHECK_UA, Accept: 'text/html,application/xhtml+xml,*/*' },
      signal: ctrl.signal,
    });
    if (res.status === 429) return true;            // transient rate-limit, keep
    return res.status >= 200 && res.status < 400;   // only 2xx/3xx are usable
  } catch {
    return false; // network error / DNS failure / timeout / connection refused
  } finally {
    clearTimeout(t);
  }
}

// Referral/exchange-invite hosts that are unreliable or region-locked — fall back to the project's X.
const LINK_DENYLIST = [
  'invite.kraken.com', 'kraken.com', 'accounts.binance.com', 'binance.com/en/register',
  'coinbase.com/join', 'bybit.com/invite', 'okx.com', 'partner.', 'refer.',
];
function isDenied(url?: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const full = (u.hostname + u.pathname).toLowerCase();
    return LINK_DENYLIST.some((d) => full.includes(d));
  } catch { return false; }
}

/* ------------------- Persistent per-token analysis store ------------------- */
// Each token is analysed ONCE (scores + summary + resolved link) the first time it
// appears, then reused — so scores never drift on refresh. Only the live status,
// popularity, and link-health are kept fresh.

interface AnalysisRecord {
  aiScore: number;
  securityScore: number;
  yieldPotential: YieldPotential;
  aiSummary: string;
  category: OpportunityCategory;
  ecosystem: string;
  url?: string;
  twitter?: string;
  firstSeen: string;
  lastValidated: number;
}

const STORE_PATH = join(process.cwd(), '.data', 'alpha-analysis.json');
const REVALIDATE_MS = 6 * 60 * 60 * 1000; // re-check a known link's health every 6h
let store: Record<string, AnalysisRecord> | null = null;

function keyOf(name: string): string { return name.toLowerCase().trim(); }
function loadStore(): Record<string, AnalysisRecord> {
  if (!store) {
    try { store = JSON.parse(readFileSync(STORE_PATH, 'utf8')); } catch { store = {}; }
  }
  return store!;
}
function persistStore(): void {
  try { mkdirSync(dirname(STORE_PATH), { recursive: true }); writeFileSync(STORE_PATH, JSON.stringify(store)); } catch { /* ignore */ }
}

export async function getOpportunities(force = false): Promise<Opportunity[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  const [llamaRes, airdropsRes] = await Promise.allSettled([fetchDefiLlamaSeeds(), fetchAirdropsIoSeeds()]);
  const llama = llamaRes.status === 'fulfilled' ? llamaRes.value : [];
  const airdrops = airdropsRes.status === 'fulfilled' ? airdropsRes.value : [];

  // Merge + dedupe by name (prefer the higher preScore entry).
  const byName = new Map<string, Seed>();
  for (const s of [...airdrops, ...llama]) {
    const k = keyOf(s.name);
    const existing = byName.get(k);
    if (!existing || s.preScore > existing.preScore) byName.set(k, s);
  }
  const seeds = [...byName.values()].sort((a, b) => b.preScore - a.preScore).slice(0, POOL);
  if (!seeds.length) return cache?.data || [];

  const db = loadStore();
  const now = Date.now();
  const fresh = seeds.filter((s) => !db[keyOf(s.name)]); // never analysed before

  // --- NEW tokens only: resolve official link, validate, then analyse once ---
  await mapLimit(fresh.filter((s) => s.sourceType === 'airdrops.io' && s.detailUrl), 5, async (seed) => {
    const { officialUrl, twitter } = await resolveOfficial(seed.detailUrl!);
    if (officialUrl) seed.url = officialUrl;
    if (twitter) seed.twitter = twitter;
  });
  await mapLimit(fresh.filter((s) => s.url), 8, async (seed) => {
    if (isDenied(seed.url) || !(await linkAlive(seed.url))) seed.url = undefined;
  });
  const freshUsable = fresh.filter((s) => s.url || s.twitter);

  for (const seed of freshUsable) {
    const s = computeScores(seed);
    db[keyOf(seed.name)] = {
      aiScore: s.aiScore,
      securityScore: s.securityScore,
      yieldPotential: s.yieldPotential,
      aiSummary: s.aiSummary,
      category: s.category,
      ecosystem: s.ecosystem,
      url: seed.url,
      twitter: seed.twitter,
      firstSeen: new Date().toISOString(),
      lastValidated: now,
    };
  }

  // --- KNOWN tokens: reuse stored analysis; only re-check link health every 6h ---
  await mapLimit(seeds.filter((s) => db[keyOf(s.name)] && (now - db[keyOf(s.name)].lastValidated) > REVALIDATE_MS), 8, async (seed) => {
    const rec = db[keyOf(seed.name)];
    if (rec.url && (isDenied(rec.url) || !(await linkAlive(rec.url)))) rec.url = undefined;
    rec.lastValidated = now;
  });

  persistStore();

  // --- Assemble: frozen analysis numbers + live status/popularity/link ---
  const data: Opportunity[] = seeds
    .map((seed) => ({ seed, rec: db[keyOf(seed.name)] }))
    .filter(({ rec }) => rec && (rec.url || rec.twitter))
    .slice(0, MAX_ITEMS)
    .map(({ seed, rec }, i) => ({
      id: `${keyOf(seed.name).replace(/[^a-z0-9]+/g, '-')}-${i}`,
      name: seed.name,
      ecosystem: rec.ecosystem || seed.ecosystem,
      category: rec.category,
      logo: seed.logo,
      url: rec.url,
      twitter: rec.twitter || seed.twitter,
      tvl: seed.tvl,
      tokenStatus: seed.tokenStatus,
      airdropStatus: seed.airdropStatus,   // live
      statusKind: seed.statusKind,         // live
      popularity: seed.popularity,         // live
      requirements: seed.requirements,
      isNew: seed.isNew,
      aiScore: rec.aiScore,                // frozen at first analysis
      securityScore: rec.securityScore,    // frozen
      riskLevel: deriveRisk(rec.securityScore, seed.statusKind),
      yieldPotential: rec.yieldPotential,  // frozen
      aiSummary: rec.aiSummary,            // frozen
      narrative: { whyItMatters: '', opportunity: '', risk: '', recommendedAction: '', confidence: rec.aiScore },
      source: seed.source,
      sourceType: seed.sourceType,
      updatedAt: rec.firstSeen,
    }))
    .sort((a, b) => b.aiScore - a.aiScore);

  cache = { at: Date.now(), data };
  return data;
}

export { formatUsd };

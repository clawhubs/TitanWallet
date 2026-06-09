import { glmJson, hasCerebras } from './cerebras';
import { fetchAirdropsIo, resolveOfficial } from './airdropsIo';
import type { Opportunity, OpportunityCategory, RiskLevel, YieldPotential } from './types';

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_ITEMS = 18;
let cache: { at: number; data: Opportunity[] } | null = null;

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

/* ------------------------------- AI scoring -------------------------------- */

interface GlmScore {
  name: string;
  category: OpportunityCategory;
  ecosystem: string;
  aiScore: number;
  securityScore: number;
  riskLevel: RiskLevel;
  yieldPotential: YieldPotential;
  aiSummary: string;
}

function clampRisk(v: unknown): RiskLevel { const s = String(v).toLowerCase(); return s === 'high' || s === 'medium' || s === 'low' ? (s as RiskLevel) : 'medium'; }
function clampYield(v: unknown): YieldPotential { const s = String(v).toLowerCase(); return s === 'high' || s === 'medium' || s === 'low' ? (s as YieldPotential) : 'medium'; }
function clampCat(v: unknown): OpportunityCategory {
  const s = String(v).toLowerCase();
  return (['airdrop', 'testnet', 'ecosystem', 'incentive', 'points', 'rewards'] as string[]).includes(s) ? (s as OpportunityCategory) : 'airdrop';
}
function clampScore(v: unknown, fallback = 70): number { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback; }

async function scoreWithGlm(seeds: Seed[]): Promise<GlmScore[]> {
  const compact = seeds.map((s) => ({
    name: s.name,
    source: s.sourceType,
    category: s.category,
    ecosystem: s.ecosystem,
    status: s.airdropStatus,
    tvlUsd: s.tvl ? Math.round(s.tvl) : undefined,
    change7dPct: s.momentum,
    popularity: s.popularity,
    requirements: s.requirements,
    about: s.about,
  }));
  const system = `You are Titan Alpha, an AI Web3 airdrop-intelligence engine.
The projects below are live airdrop / points / incentive opportunities (from DefiLlama pre-token protocols and the airdrops.io tracker).
Judge each project's airdrop/alpha potential realistically and without hype.
Return ONLY JSON: {"items":[{name, category (airdrop|testnet|points|incentive|ecosystem|rewards), ecosystem, aiScore (0-100, higher=stronger airdrop potential), securityScore (0-100, higher=safer), riskLevel (low|medium|high), yieldPotential (low|medium|high), aiSummary (<=20 words, the airdrop angle)}]}. Keep name identical to input.`;
  const user = JSON.stringify({ projects: compact, instruction: 'Score every project. One item per input project.' });
  const out = await glmJson<{ items: GlmScore[] }>(system, user, 4000);
  return Array.isArray(out.items) ? out.items : [];
}

function heuristicScore(s: Seed): GlmScore {
  const base = clampScore(58 + Math.round(s.preScore / 3));
  return {
    name: s.name,
    category: 'airdrop',
    ecosystem: s.ecosystem,
    aiScore: base,
    securityScore: clampScore(s.sourceType === 'defillama' && (s.tvl || 0) > 50_000_000 ? 80 : 68),
    riskLevel: base >= 78 ? 'low' : base >= 60 ? 'medium' : 'high',
    yieldPotential: s.preScore > 45 ? 'high' : s.preScore > 20 ? 'medium' : 'low',
    aiSummary: s.sourceType === 'airdrops.io'
      ? `${s.airdropStatus} airdrop in ${s.ecosystem}. Early participation may qualify for rewards.`
      : `No token yet. ${s.category} on ${s.ecosystem} — early users may qualify for a future airdrop.`,
  };
}

function formatUsd(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

/* --------------------------------- Engine ---------------------------------- */

export async function getOpportunities(force = false): Promise<Opportunity[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  const [llamaRes, airdropsRes] = await Promise.allSettled([fetchDefiLlamaSeeds(), fetchAirdropsIoSeeds()]);
  const llama = llamaRes.status === 'fulfilled' ? llamaRes.value : [];
  const airdrops = airdropsRes.status === 'fulfilled' ? airdropsRes.value : [];

  // Merge + dedupe by name (prefer the higher preScore entry).
  const byName = new Map<string, Seed>();
  for (const s of [...airdrops, ...llama]) {
    const key = s.name.toLowerCase().trim();
    const existing = byName.get(key);
    if (!existing || s.preScore > existing.preScore) byName.set(key, s);
  }
  const seeds = [...byName.values()].sort((a, b) => b.preScore - a.preScore).slice(0, MAX_ITEMS);

  if (!seeds.length) return cache?.data || [];

  // Resolve official project links for airdrops.io items (so we never link to airdrops.io).
  await Promise.allSettled(seeds.map(async (seed) => {
    if (seed.sourceType === 'airdrops.io' && seed.detailUrl) {
      const { officialUrl, twitter } = await resolveOfficial(seed.detailUrl);
      if (officialUrl) seed.url = officialUrl;
      if (twitter) seed.twitter = twitter;
    }
  }));

  let scores: GlmScore[] = [];
  if (hasCerebras()) {
    try { scores = await scoreWithGlm(seeds); } catch { scores = []; }
  }
  const scoreByName = new Map(scores.map((s) => [s.name, s]));

  const data: Opportunity[] = seeds.map((seed, i) => {
    const s = scoreByName.get(seed.name) || heuristicScore(seed);
    return {
      id: `${seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
      name: seed.name,
      ecosystem: s.ecosystem || seed.ecosystem,
      category: clampCat(s.category),
      logo: seed.logo,
      url: seed.url,
      twitter: seed.twitter,
      tvl: seed.tvl,
      tokenStatus: seed.tokenStatus,
      airdropStatus: seed.airdropStatus,
      statusKind: seed.statusKind,
      popularity: seed.popularity,
      requirements: seed.requirements,
      isNew: seed.isNew,
      aiScore: clampScore(s.aiScore),
      securityScore: clampScore(s.securityScore),
      riskLevel: clampRisk(s.riskLevel),
      yieldPotential: clampYield(s.yieldPotential),
      aiSummary: s.aiSummary || heuristicScore(seed).aiSummary,
      narrative: { whyItMatters: '', opportunity: '', risk: '', recommendedAction: '', confidence: clampScore(s.aiScore) },
      source: seed.source,
      sourceType: seed.sourceType,
      updatedAt: new Date().toISOString(),
    };
  }).sort((a, b) => b.aiScore - a.aiScore);

  cache = { at: Date.now(), data };
  return data;
}

export { formatUsd };

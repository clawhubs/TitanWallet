import { glmJson, hasCerebras } from './cerebras';
import type { Opportunity, OpportunityCategory, RiskLevel, YieldPotential } from './types';

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: { at: number; data: Opportunity[] } | null = null;

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
  change_1d?: number;
  change_7d?: number;
  listedAt?: number;
}

// DeFi categories that realistically run airdrop / points / incentive programs.
const AIRDROP_CATEGORIES = new Set([
  'Dexes', 'Dexs', 'DEX Aggregator', 'Lending', 'Liquid Staking', 'Liquid Restaking',
  'Restaking', 'Yield', 'Yield Aggregator', 'Yield Lottery', 'Derivatives', 'Options',
  'Perps', 'CDP', 'Farm', 'Services', 'Bridge', 'Launchpad', 'Prediction Market',
  'Basis Trading', 'Leveraged Farming', 'RWA', 'NFT Marketplace', 'Synthetics',
  'Liquidity manager', 'Options Vault', 'Staking Pool', 'Decentralized Stablecoin',
]);

// Never surface these — not airdrop opportunities.
const BLOCKED_CATEGORIES = new Set(['CEX', 'Chain', 'Bridge Aggregator', 'Treasury Manager']);

const NEW_WINDOW_SEC = 120 * 24 * 60 * 60; // listed within ~120 days = "new"

function hasNoToken(p: LlamaProtocol): boolean {
  return (!p.gecko_id || p.gecko_id === null) && (p.symbol === '-' || !p.symbol);
}

async function fetchCandidates(limit = 12): Promise<LlamaProtocol[]> {
  const res = await fetch('https://api.llama.fi/protocols', { cache: 'no-store' });
  if (!res.ok) throw new Error(`DefiLlama HTTP ${res.status}`);
  const all: LlamaProtocol[] = await res.json();
  const nowSec = Math.floor(Date.now() / 1000);

  const filtered = all.filter((p) =>
    p.category &&
    !BLOCKED_CATEGORIES.has(p.category) &&
    AIRDROP_CATEGORIES.has(p.category) &&
    hasNoToken(p) && // no token yet => genuine airdrop-farming candidate
    typeof p.tvl === 'number' && p.tvl > 500_000 && p.tvl < 3_000_000_000 &&
    Array.isArray(p.chains) && p.chains.length > 0,
  );

  // Rank: freshly listed first, then by 7d momentum, then TVL.
  filtered.sort((a, b) => {
    const aNew = (nowSec - (a.listedAt || 0)) < NEW_WINDOW_SEC ? 1 : 0;
    const bNew = (nowSec - (b.listedAt || 0)) < NEW_WINDOW_SEC ? 1 : 0;
    if (aNew !== bNew) return bNew - aNew;
    return (b.change_7d || 0) - (a.change_7d || 0) || (b.tvl || 0) - (a.tvl || 0);
  });

  const seen = new Set<string>();
  const out: LlamaProtocol[] = [];
  for (const p of filtered) {
    if (seen.has(p.name)) continue;
    seen.add(p.name);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

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

async function scoreWithGlm(candidates: LlamaProtocol[]): Promise<GlmScore[]> {
  const compact = candidates.map((p) => ({
    name: p.name,
    category: p.category,
    chains: p.chains?.slice(0, 4),
    tvlUsd: Math.round(p.tvl || 0),
    change7dPct: Math.round(p.change_7d || 0),
    hasToken: false,
    about: (p.description || '').slice(0, 180),
  }));
  const system = `You are Titan Alpha, an AI Web3 airdrop-intelligence engine.
Every project below has NO token yet — they are live protocols that may reward early users with a future airdrop, points, or incentives.
Judge each project's airdrop/alpha potential realistically and without hype.
Return ONLY JSON: {"items":[{name, category (airdrop|testnet|points|incentive|ecosystem|rewards), ecosystem (main chain), aiScore (0-100, higher=stronger airdrop potential), securityScore (0-100, higher=safer), riskLevel (low|medium|high), yieldPotential (low|medium|high), aiSummary (<=20 words, explain the airdrop angle)}]}. Keep name identical to input.`;
  const user = JSON.stringify({ projects: compact, instruction: 'Score every project for airdrop potential. One item per input project.' });
  const out = await glmJson<{ items: GlmScore[] }>(system, user, 2800);
  return Array.isArray(out.items) ? out.items : [];
}

function heuristicScore(p: LlamaProtocol): GlmScore {
  const momentum = p.change_7d || 0;
  const ai = clampScore(64 + Math.max(-15, Math.min(28, momentum)) + (p.tvl && p.tvl < 80_000_000 ? 8 : 0));
  return {
    name: p.name,
    category: 'airdrop',
    ecosystem: p.chains?.[0] || 'Multi-chain',
    aiScore: ai,
    securityScore: clampScore(p.tvl && p.tvl > 50_000_000 ? 80 : 66),
    riskLevel: momentum > 30 ? 'high' : 'medium',
    yieldPotential: momentum > 15 ? 'high' : 'medium',
    aiSummary: `No token yet. ${p.category || 'DeFi'} on ${p.chains?.[0] || 'multi-chain'} with $${formatUsd(p.tvl || 0)} TVL — early users may qualify for a future airdrop.`,
  };
}

function formatUsd(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

function cleanTwitter(t?: string): string | undefined {
  if (!t) return undefined;
  const h = t.replace(/^@/, '').replace(/^https?:\/\/(x|twitter)\.com\//i, '').split(/[/?]/)[0].trim();
  return h && h.toLowerCase() !== 'none' ? h : undefined;
}

export async function getOpportunities(force = false): Promise<Opportunity[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  let candidates: LlamaProtocol[] = [];
  try {
    candidates = await fetchCandidates(12);
  } catch {
    candidates = [];
  }
  if (!candidates.length) {
    return cache?.data || [];
  }

  let scores: GlmScore[] = [];
  if (hasCerebras()) {
    try { scores = await scoreWithGlm(candidates); } catch { scores = []; }
  }
  const scoreByName = new Map(scores.map((s) => [s.name, s]));
  const nowSec = Math.floor(Date.now() / 1000);

  const data: Opportunity[] = candidates.map((p, i) => {
    const s = scoreByName.get(p.name) || heuristicScore(p);
    const isNew = (nowSec - (p.listedAt || 0)) < NEW_WINDOW_SEC;
    const momentum = Math.round(p.change_7d || 0);
    return {
      id: `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
      name: p.name,
      ecosystem: s.ecosystem || p.chains?.[0] || 'Multi-chain',
      category: clampCat(s.category),
      logo: p.logo,
      url: p.url,
      twitter: cleanTwitter(p.twitter),
      tvl: p.tvl,
      tokenStatus: 'none' as const,
      airdropStatus: isNew ? 'New · pre-token, farming live' : 'Pre-token · farming live',
      isNew,
      aiScore: clampScore(s.aiScore),
      securityScore: clampScore(s.securityScore),
      riskLevel: clampRisk(s.riskLevel),
      yieldPotential: clampYield(s.yieldPotential),
      aiSummary: s.aiSummary || heuristicScore(p).aiSummary,
      narrative: {
        whyItMatters: '', opportunity: '', risk: '', recommendedAction: '', confidence: clampScore(s.aiScore),
      },
      source: `DefiLlama · ${momentum >= 0 ? '+' : ''}${momentum}% 7d TVL`,
      updatedAt: new Date().toISOString(),
    };
  }).sort((a, b) => b.aiScore - a.aiScore);

  cache = { at: Date.now(), data };
  return data;
}

export { formatUsd };

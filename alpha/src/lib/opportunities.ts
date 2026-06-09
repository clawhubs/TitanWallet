import { glmJson, hasCerebras } from './cerebras';
import type { Opportunity, OpportunityCategory, RiskLevel, YieldPotential } from './types';

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: { at: number; data: Opportunity[] } | null = null;

interface LlamaProtocol {
  name: string;
  logo?: string;
  url?: string;
  category?: string;
  chains?: string[];
  tvl?: number;
  change_1d?: number;
  change_7d?: number;
}

const INTERESTING = new Set(['Dexes', 'Lending', 'Liquid Staking', 'Liquid Restaking', 'Restaking', 'Bridge', 'Yield', 'Derivatives', 'CDP', 'Farm', 'Services', 'RWA']);

async function fetchCandidates(limit = 12): Promise<LlamaProtocol[]> {
  const res = await fetch('https://api.llama.fi/protocols', { cache: 'no-store' });
  if (!res.ok) throw new Error(`DefiLlama HTTP ${res.status}`);
  const all: LlamaProtocol[] = await res.json();
  const filtered = all.filter((p) =>
    p.category && INTERESTING.has(p.category) &&
    typeof p.tvl === 'number' && p.tvl > 1_000_000 && p.tvl < 6_000_000_000 &&
    Array.isArray(p.chains) && p.chains.length > 0,
  );
  // Rank by recent momentum (7d change), then TVL — surfaces rising "alpha".
  filtered.sort((a, b) => (b.change_7d || 0) - (a.change_7d || 0) || (b.tvl || 0) - (a.tvl || 0));
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
  return (['airdrop', 'testnet', 'ecosystem', 'incentive', 'points', 'rewards'] as string[]).includes(s) ? (s as OpportunityCategory) : 'ecosystem';
}
function clampScore(v: unknown, fallback = 70): number { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback; }

async function scoreWithGlm(candidates: LlamaProtocol[]): Promise<GlmScore[]> {
  const compact = candidates.map((p) => ({
    name: p.name,
    category: p.category,
    chains: p.chains,
    tvlUsd: Math.round(p.tvl || 0),
    change7dPct: Math.round(p.change_7d || 0),
  }));
  const system = `You are Titan Alpha, an AI Web3 opportunity-intelligence engine.
For each project, judge its potential as an early "alpha" opportunity (airdrop / points / incentive / ecosystem growth).
Be realistic and non-hype. Return ONLY JSON: {"items":[{name, category (airdrop|testnet|ecosystem|incentive|points|rewards), ecosystem, aiScore (0-100, higher=stronger opportunity), securityScore (0-100, higher=safer), riskLevel (low|medium|high), yieldPotential (low|medium|high), aiSummary (<=22 words)}]}. Keep the name identical to input.`;
  const user = JSON.stringify({ projects: compact, instruction: 'Score every project. Return one item per input project.' });
  const out = await glmJson<{ items: GlmScore[] }>(system, user, 2600);
  return Array.isArray(out.items) ? out.items : [];
}

function heuristicScore(p: LlamaProtocol): GlmScore {
  const momentum = p.change_7d || 0;
  const ai = clampScore(60 + Math.max(-20, Math.min(30, momentum)) + (p.tvl && p.tvl < 100_000_000 ? 8 : 0));
  return {
    name: p.name,
    category: 'ecosystem',
    ecosystem: p.chains?.[0] || 'Multi-chain',
    aiScore: ai,
    securityScore: clampScore(p.tvl && p.tvl > 50_000_000 ? 82 : 68),
    riskLevel: momentum > 25 ? 'high' : momentum < -10 ? 'high' : 'medium',
    yieldPotential: momentum > 15 ? 'high' : 'medium',
    aiSummary: `${p.category || 'DeFi'} on ${p.chains?.[0] || 'multi-chain'} with $${formatUsd(p.tvl || 0)} TVL and ${momentum >= 0 ? '+' : ''}${Math.round(momentum)}% 7d momentum.`,
  };
}

function formatUsd(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
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

  const data: Opportunity[] = candidates.map((p, i) => {
    const s = scoreByName.get(p.name) || heuristicScore(p);
    return {
      id: `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
      name: p.name,
      ecosystem: s.ecosystem || p.chains?.[0] || 'Multi-chain',
      category: clampCat(s.category),
      logo: p.logo,
      url: p.url,
      tvl: p.tvl,
      aiScore: clampScore(s.aiScore),
      securityScore: clampScore(s.securityScore),
      riskLevel: clampRisk(s.riskLevel),
      yieldPotential: clampYield(s.yieldPotential),
      aiSummary: s.aiSummary || heuristicScore(p).aiSummary,
      narrative: {
        whyItMatters: '', opportunity: '', risk: '', recommendedAction: '', confidence: clampScore(s.aiScore),
      },
      source: 'DefiLlama + GLM-4.7',
      updatedAt: new Date().toISOString(),
    };
  }).sort((a, b) => b.aiScore - a.aiScore);

  cache = { at: Date.now(), data };
  return data;
}

export { formatUsd };

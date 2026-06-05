import type { ChainInfo } from '@/data/chains';
import { findKnownDrainer } from '@/data/drainers';
import type { RiskAssessment, RiskLevel, TokenApproval } from '@/types/scanner';
import { createHash } from 'node:crypto';

const GOPLUS_BASE = 'https://api.gopluslabs.io';

// Chain IDs supported by the GoPlus token-approval security API.
// Anything not listed here falls back to the explorer/RPC scan path.
const GOPLUS_SUPPORTED_CHAIN_IDS = new Set<number>([
  1, 10, 25, 56, 100, 128, 137, 204, 250, 321, 324,
  8453, 42161, 43114, 59144, 534352, 5000, 81457, 169,
]);

export function isGoPlusSupported(chainId: number): boolean {
  return GOPLUS_SUPPORTED_CHAIN_IDS.has(chainId);
}

// --- Access token handling -------------------------------------------------
// GoPlus issues a short-lived token (≈2h) signed from APP_KEY + APP_SECRET.
// We generate it on demand and cache it. Falls back to public (unauthenticated)
// access when no credentials are configured.
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getGoPlusAccessToken(): Promise<string | null> {
  const staticToken = process.env.GOPLUS_ACCESS_TOKEN?.trim();
  if (staticToken) {
    return staticToken.startsWith('Bearer ') ? staticToken : `Bearer ${staticToken}`;
  }

  const appKey = process.env.GOPLUS_APP_KEY?.trim();
  const appSecret = process.env.GOPLUS_APP_SECRET?.trim();
  if (!appKey || !appSecret) return null;

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  const time = Math.floor(now / 1000);
  const sign = createHash('sha1').update(`${appKey}${time}${appSecret}`).digest('hex');

  try {
    const response = await fetch(`${GOPLUS_BASE}/api/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ app_key: appKey, time, sign }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.code !== 1 || !data.result?.access_token) return null;

    // GoPlus returns the token already prefixed with "Bearer ".
    const token: string = data.result.access_token;
    const expiresInMs = (Number(data.result.expires_in) || 3600) * 1000;
    tokenCache = { token, expiresAt: now + expiresInMs };
    return token;
  } catch {
    return null;
  }
}

interface GoPlusAddressInfo {
  contract_name?: string | null;
  tag?: string | null;
  is_contract?: number;
  is_open_source?: number;
  doubt_list?: number;
  trust_list?: number;
  malicious_behavior?: string[];
}

interface GoPlusApprovedItem {
  approved_contract: string;
  approved_amount: string;
  approved_time?: number;
  hash?: string;
  initial_approval_hash?: string;
  address_info?: GoPlusAddressInfo;
}

interface GoPlusTokenEntry {
  token_address: string;
  chain_id: string;
  token_name?: string;
  token_symbol?: string;
  decimals?: number;
  balance?: string;
  is_open_source?: number;
  malicious_address?: number;
  malicious_behavior?: string[];
  approved_list?: GoPlusApprovedItem[];
}

export interface GoPlusScanResult {
  approvals: TokenApproval[];
  riskAssessments: RiskAssessment[];
}

/**
 * Fetches ERC-20 token approvals (and GoPlus risk intel) for an address on a chain.
 * Read-only HTTP, no gas. Returns null on failure so the caller can fall back to RPC.
 */
export async function fetchGoPlusApprovals(address: string, chain: ChainInfo): Promise<GoPlusScanResult | null> {
  if (!isGoPlusSupported(chain.chainId)) return null;

  const url = `${GOPLUS_BASE}/api/v2/token_approval_security/${chain.chainId}?addresses=${address.toLowerCase()}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = await getGoPlusAccessToken();
  if (token) headers.Authorization = token;

  let payload: { code?: number; message?: string; result?: GoPlusTokenEntry[] };
  try {
    const response = await fetch(url, { headers, next: { revalidate: 30 } });
    if (!response.ok) return null;
    payload = await response.json();
  } catch {
    return null;
  }

  if (payload.code !== 1 || !Array.isArray(payload.result)) return null;

  const approvals: TokenApproval[] = [];
  const riskAssessments: RiskAssessment[] = [];

  payload.result.forEach((entry, entryIndex) => {
    const symbol = entry.token_symbol || 'TOKEN';
    const decimals = typeof entry.decimals === 'number' ? entry.decimals : 18;
    const tokenMalicious = entry.malicious_address === 1 || (entry.malicious_behavior?.length ?? 0) > 0;

    (entry.approved_list || []).forEach((item, itemIndex) => {
      const info = item.address_info || {};
      const spender = item.approved_contract;
      const isUnlimited = /unlimited/i.test(item.approved_amount || '');
      const id = `${chain.chainId}-goplus-${entry.token_address}-${spender}-${entryIndex}-${itemIndex}`;

      const approval: TokenApproval = {
        id,
        chainId: chain.chainId,
        chainName: chain.name,
        token: entry.token_address,
        tokenName: entry.token_name || symbol,
        tokenSymbol: symbol,
        tokenDecimals: decimals,
        spender,
        spenderLabel: info.contract_name || info.tag || spender,
        allowance: isUnlimited ? `Unlimited ${symbol}` : `${item.approved_amount} ${symbol}`,
        rawAllowance: item.approved_amount,
        type: 'ERC-20',
        txHash: item.hash || item.initial_approval_hash || '',
        blockNumber: 0,
        timestamp: item.approved_time || 0,
        isVerified: info.is_open_source === 1 && info.trust_list === 1,
        explorerUrl: item.hash ? `${chain.explorerUrl}/tx/${item.hash}` : `${chain.explorerUrl}/address/${spender}`,
      };

      approvals.push(approval);
      riskAssessments.push(assessGoPlusRisk(approval, entry, item, tokenMalicious));
    });
  });

  return { approvals, riskAssessments };
}

function assessGoPlusRisk(
  approval: TokenApproval,
  entry: GoPlusTokenEntry,
  item: GoPlusApprovedItem,
  tokenMalicious: boolean,
): RiskAssessment {
  const info = item.address_info || {};
  const reasons: string[] = [];
  const flags: string[] = [];
  let score = 100;

  const drainer = findKnownDrainer(approval.spender, approval.chainId);
  if (drainer) {
    score -= 55;
    flags.push('known_drainer');
    reasons.push(`Spender matches known ${drainer.type} report: ${drainer.name}.`);
  }

  const spenderBehaviors = info.malicious_behavior || [];
  if (spenderBehaviors.length) {
    score -= 55;
    flags.push('malicious_spender');
    reasons.push(`GoPlus flagged the spender for: ${spenderBehaviors.join(', ')}.`);
  }

  if (tokenMalicious) {
    score -= 35;
    flags.push('malicious_token');
    const behaviors = entry.malicious_behavior?.length ? ` (${entry.malicious_behavior.join(', ')})` : '';
    reasons.push(`GoPlus flagged the token contract as risky${behaviors}.`);
  }

  if (info.doubt_list === 1) {
    score -= 35;
    flags.push('doubt_list');
    reasons.push('Spender appears on the GoPlus suspicious (doubt) list.');
  }

  const unlimited = /unlimited/i.test(approval.allowance);
  if (unlimited && info.trust_list !== 1) {
    score -= 15;
    flags.push('unlimited_allowance');
    reasons.push('Unlimited allowance lets the spender move this token until revoked.');
  }

  if (info.is_open_source === 0) {
    score -= 15;
    flags.push('unverified_contract');
    reasons.push('Spender contract source is not verified/open-source.');
  }

  if (info.trust_list === 1) {
    score = Math.max(score, 85);
    flags.push('trusted_spender');
    reasons.push('Spender is on the GoPlus trusted list.');
  }

  score = Math.max(0, Math.min(100, score));
  const riskLevel: RiskLevel = score < 35 ? 'critical' : score < 55 ? 'high' : score < 80 ? 'medium' : 'low';

  if (!reasons.length) {
    reasons.push('Approval to a contract with no known risk flags from GoPlus.');
    flags.push('limited_or_low_risk');
  }

  return { approvalId: approval.id, riskLevel, score, reasons, flags };
}

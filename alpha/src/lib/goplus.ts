// GoPlus security layer for Titan Alpha (token/address risk on submissions).
import { createHash } from 'node:crypto';

const BASE = 'https://api.gopluslabs.io';
let tokenCache: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string | null> {
  const appKey = process.env.GOPLUS_APP_KEY?.trim();
  const appSecret = process.env.GOPLUS_APP_SECRET?.trim();
  if (!appKey || !appSecret) return null;

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.token;

  const time = Math.floor(now / 1000);
  const sign = createHash('sha1').update(`${appKey}${time}${appSecret}`).digest('hex');
  try {
    const res = await fetch(`${BASE}/api/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ app_key: appKey, time, sign }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 1 || !data.result?.access_token) return null;
    const token: string = data.result.access_token;
    tokenCache = { token, expiresAt: now + (Number(data.result.expires_in) || 3600) * 1000 };
    return token;
  } catch {
    return null;
  }
}

export interface GoPlusTokenRisk {
  ok: boolean;
  securityScore: number;
  flags: string[];
}

/** Token security check for a deployed token on a given chain id. */
export async function checkTokenSecurity(chainId: number, address: string): Promise<GoPlusTokenRisk | null> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = await accessToken();
  if (token) headers.Authorization = token;

  try {
    const url = `${BASE}/api/v1/token_security/${chainId}?contract_addresses=${address.toLowerCase()}`;
    const res = await fetch(url, { headers, next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 1) return null;
    const info = data.result?.[address.toLowerCase()];
    if (!info) return { ok: true, securityScore: 60, flags: ['No GoPlus data for this token yet.'] };

    const flags: string[] = [];
    let score = 100;
    const bad = (cond: boolean, penalty: number, msg: string) => { if (cond) { score -= penalty; flags.push(msg); } };
    bad(info.is_honeypot === '1', 60, 'Honeypot detected');
    bad(info.is_open_source === '0', 20, 'Contract not open-source / unverified');
    bad(info.is_proxy === '1', 8, 'Upgradeable proxy contract');
    bad(info.is_mintable === '1', 12, 'Token is mintable');
    bad(info.owner_change_balance === '1', 25, 'Owner can change balances');
    bad(info.hidden_owner === '1', 25, 'Hidden owner');
    bad(info.can_take_back_ownership === '1', 20, 'Ownership can be taken back');
    bad(info.selfdestruct === '1', 30, 'Self-destruct present');
    bad(info.transfer_pausable === '1', 12, 'Transfers can be paused');
    bad(info.is_blacklisted === '1', 10, 'Blacklist function present');
    bad(Number(info.buy_tax || 0) > 0.1, 10, 'High buy tax');
    bad(Number(info.sell_tax || 0) > 0.1, 12, 'High sell tax');

    return { ok: true, securityScore: Math.max(0, Math.min(100, score)), flags: flags.length ? flags : ['No major GoPlus red flags.'] };
  } catch {
    return null;
  }
}

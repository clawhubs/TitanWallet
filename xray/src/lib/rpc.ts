import { CHAINS, type ChainInfo } from '@/data/chains';
import { withTimeout } from './rateLimiter';

let rpcCounter = 1;

export function getSupportedRpcChains(): ChainInfo[] {
  return CHAINS.filter((chain) => Boolean(getRpcUrl(chain)));
}

export function getRpcUrl(chain: ChainInfo): string | null {
  if (chain.rpcEnv && process.env[chain.rpcEnv]) {
    return process.env[chain.rpcEnv] || null;
  }
  return chain.rpcUrl || null;
}

export async function rpcCall<T>(chain: ChainInfo, method: string, params: unknown[], timeoutMs = 3000): Promise<T> {
  const rpcUrl = getRpcUrl(chain);
  if (!rpcUrl) throw new Error(`${chain.name} has no RPC URL configured.`);

  const response = await withTimeout(
    fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: rpcCounter++,
        method,
        params,
      }),
    }),
    timeoutMs,
    `${chain.name} RPC`
  );

  if (!response.ok) {
    throw new Error(`${chain.name} RPC returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || `${chain.name} RPC error.`);
  }
  return payload.result as T;
}

export function formatNativeBalance(weiHexOrDecimal: string, symbol: string) {
  const wei = weiHexOrDecimal.startsWith('0x') ? BigInt(weiHexOrDecimal) : BigInt(weiHexOrDecimal || '0');
  const divisor = 10n ** 18n;
  const whole = wei / divisor;
  const fraction = wei % divisor;
  const trimmedFraction = fraction.toString().padStart(18, '0').slice(0, 4).replace(/0+$/, '');
  return `${whole.toString()}${trimmedFraction ? `.${trimmedFraction}` : ''} ${symbol}`;
}

export function toTopicAddress(address: string) {
  return `0x${address.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
}

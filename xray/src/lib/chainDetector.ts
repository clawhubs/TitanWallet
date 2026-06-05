import { getSupportedRpcChains, rpcCall, formatNativeBalance } from './rpc';
import { runWithConcurrency } from './rateLimiter';
import type { DetectedChain } from '@/types/scanner';

const cache = new Map<string, { expiresAt: number; value: DetectedChain[] }>();
const CACHE_MS = 60_000;

export function isValidEvmAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export async function detectChains(address: string): Promise<DetectedChain[]> {
  const normalized = address.toLowerCase();
  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const chains = getSupportedRpcChains().filter((chain) => chain.category === 'popular' || chain.category === 'layer2').slice(0, 14);
  const results = await runWithConcurrency(chains, 10, async (chain) => {
    try {
      const balanceHex = await rpcCall<string>(chain, 'eth_getBalance', [address, 'latest'], 3000);
      const balance = BigInt(balanceHex || '0x0');
      if (balance <= 0n) return null;
      const nativeSymbol = chain.nativeSymbol || chain.shortName;
      return {
        chainId: chain.chainId,
        chainName: chain.name,
        chainShortName: chain.shortName,
        nativeSymbol,
        nativeBalance: balance.toString(),
        nativeBalanceFormatted: formatNativeBalance(balance.toString(), nativeSymbol),
        hasActivity: true,
        explorerUrl: chain.explorerUrl,
      } satisfies DetectedChain;
    } catch {
      return null;
    }
  });

  const detected = results.filter(Boolean) as DetectedChain[];
  cache.set(normalized, { expiresAt: Date.now() + CACHE_MS, value: detected });
  return detected;
}

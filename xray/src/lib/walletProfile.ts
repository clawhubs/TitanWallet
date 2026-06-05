import type { ChainInfo } from '@/data/chains';
import type { WalletChainProfile } from '@/types/scanner';
import { formatNativeBalance, rpcCall } from './rpc';

/**
 * Gathers a lightweight, read-only on-chain footprint for an address on a single chain.
 * Uses only standard JSON-RPC calls (eth_getBalance, eth_getTransactionCount, eth_getCode),
 * so it works on every EVM chain without an explorer API key and never costs gas.
 */
export async function fetchWalletChainProfile(address: string, chain: ChainInfo): Promise<WalletChainProfile> {
  const symbol = chain.nativeSymbol || chain.shortName;

  const [balanceResult, nonceResult, codeResult] = await Promise.allSettled([
    rpcCall<string>(chain, 'eth_getBalance', [address, 'latest'], 2500),
    rpcCall<string>(chain, 'eth_getTransactionCount', [address, 'latest'], 2500),
    rpcCall<string>(chain, 'eth_getCode', [address, 'latest'], 2500),
  ]);

  const nativeBalanceRaw = balanceResult.status === 'fulfilled' ? (balanceResult.value || '0x0') : '0x0';
  const txCount = nonceResult.status === 'fulfilled' ? safeHexToNumber(nonceResult.value) : 0;
  const code = codeResult.status === 'fulfilled' ? (codeResult.value || '0x') : '0x';

  const balanceWei = hexToBigInt(nativeBalanceRaw);
  const hasNativeBalance = balanceWei > 0n;
  const isContract = code !== '0x' && code !== '0x0' && code.length > 2;

  return {
    chainId: chain.chainId,
    nativeSymbol: symbol,
    nativeBalanceRaw,
    nativeBalanceFormatted: formatNativeBalance(nativeBalanceRaw, symbol),
    hasNativeBalance,
    txCount,
    isContract,
    hasActivity: txCount > 0 || hasNativeBalance || isContract,
  };
}

function hexToBigInt(value: string): bigint {
  try {
    return value.startsWith('0x') ? BigInt(value) : BigInt(value || '0');
  } catch {
    return 0n;
  }
}

function safeHexToNumber(value: string): number {
  try {
    return Number(hexToBigInt(value));
  } catch {
    return 0;
  }
}

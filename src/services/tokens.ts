import type { Network, Token } from '../types';
import { formatEther } from 'ethers';
import { buildNativeTokenFromBalance, getNativeBalance, getTokenMetadata as readOnchainTokenMetadata } from './blockchain';

const FALLBACK_METADATA: Record<string, { name: string; symbol: string; decimals: number }> = {
  ['0xc02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2'.toLowerCase()]: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
  },
  ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'.toLowerCase()]: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
  },
  ['0x514910771AF9Ca656af840dff83E8264EcF986CA'.toLowerCase()]: {
    name: 'Chainlink',
    symbol: 'LINK',
    decimals: 18,
  },
};

export async function detectTokens(input: {
  walletAddress?: string | null;
  network: Network;
}) {
  if (!input.walletAddress) {
    return [];
  }

  const detected: Token[] = [];

  try {
    const nativeBalance = await getNativeBalance(input.walletAddress, input.network.rpcUrl);
    detected.push(
      buildNativeTokenFromBalance({
        network: input.network,
        balance: Number.parseFloat(formatEther(nativeBalance)).toFixed(4),
      }),
    );
  } catch {
    return [];
  }

  return detected;
}

export async function getTokenMetadata(contractAddress: string, network: Network) {
  const normalized = contractAddress.trim();

  try {
    return await readOnchainTokenMetadata(normalized, network);
  } catch {
    const fallback = FALLBACK_METADATA[normalized.toLowerCase()];
    if (fallback) {
      return {
        ...fallback,
        contractAddress: normalized,
      };
    }

    return {
      name: 'Custom Token',
      symbol: 'TOKEN',
      decimals: 18,
      contractAddress: normalized,
    };
  }
}

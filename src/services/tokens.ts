import type { Network, Token } from '../types';
import { formatEther } from 'ethers';
import {
  buildNativeTokenFromBalance,
  getNativeBalance,
  getTokenBalance,
  getTokenMetadata as readOnchainTokenMetadata,
} from './blockchain';
import { getPopularTokensForNetwork } from '../data/mockTokens';
import { buildMarketPriceRequestFromDefinition, fetchMarketPrices } from './marketPrices';

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
  const popularNetworkTokens = getPopularTokensForNetwork(input.network.id);
  const nativeTokenDefinition = popularNetworkTokens.find((token) => token.isNative);
  const marketPrices = input.network.isTestnet
    ? {}
    : await fetchMarketPrices(
      popularNetworkTokens.map((token) => buildMarketPriceRequestFromDefinition(token, input.network.name)),
    ).catch(() => ({}));
  const nativeMarketPrice = nativeTokenDefinition ? marketPrices[nativeTokenDefinition.id] : null;

  try {
    const nativeBalance = await getNativeBalance(input.walletAddress, input.network.rpcUrl);
    detected.push(
      buildNativeTokenFromBalance({
        network: input.network,
        balance: Number.parseFloat(formatEther(nativeBalance)).toFixed(4),
        balanceUSD:
          Number.parseFloat(formatEther(nativeBalance)) * (nativeMarketPrice?.price || nativeTokenDefinition?.price || 0),
        price: nativeMarketPrice?.price || nativeTokenDefinition?.price,
        change24h: nativeMarketPrice?.change24h ?? nativeTokenDefinition?.change24h,
        icon: nativeTokenDefinition?.icon,
        logoUrl: nativeTokenDefinition?.logoUrl,
        name: nativeTokenDefinition?.name,
      }),
    );
  } catch {
    return [];
  }

  const erc20Candidates = popularNetworkTokens.filter((token) => token.contractAddress && typeof token.decimals === 'number');

  const balances = await Promise.all(
    erc20Candidates.map(async (token): Promise<Token | null> => {
      try {
        const balance = await getTokenBalance({
          walletAddress: input.walletAddress!,
          contractAddress: token.contractAddress!,
          decimals: token.decimals!,
          rpcUrl: input.network.rpcUrl,
        });
        const normalizedBalance = Number.parseFloat(balance);

        if (!Number.isFinite(normalizedBalance) || normalizedBalance <= 0) {
          return null;
        }

        const marketPrice = marketPrices[token.id];
        const price = marketPrice?.price || token.price;

        return {
          id: token.id,
          symbol: token.symbol,
          name: token.name,
          balance: normalizedBalance.toFixed(token.decimals === 6 ? 2 : 4),
          balanceUSD: normalizedBalance * price,
          price,
          change24h: marketPrice?.change24h ?? token.change24h,
          icon: token.icon,
          logoUrl: token.logoUrl,
          network: input.network.name,
          source: 'detected' as const,
          contractAddress: token.contractAddress,
        };
      } catch {
        return null;
      }
    }),
  );

  detected.push(...balances.filter((token): token is Token => token !== null));

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

import type { PopularTokenDefinition } from '../data/mockTokens';
import type { Network, Token } from '../types';

export interface MarketPrice {
  price: number;
  change24h: number | null;
  source: string;
  confidence: number | null;
  updatedAt: string;
}

export type MarketPriceMap = Record<string, MarketPrice>;

interface MarketPriceTokenRequest {
  id: string;
  symbol: string;
  name?: string;
  network?: string;
  networkId?: string;
  contractAddress?: string;
}

export async function fetchMarketPrices(tokens: MarketPriceTokenRequest[]): Promise<MarketPriceMap> {
  const uniqueTokens = dedupePriceRequests(tokens);
  if (!uniqueTokens.length) {
    return {};
  }

  const response = await fetch('/api/consumer-auth/market-prices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tokens: uniqueTokens }),
  });

  if (!response.ok) {
    throw new Error('Failed to load live market prices.');
  }

  const payload = await response.json();
  return payload?.prices || {};
}

export function buildMarketPriceRequestFromToken(token: Token, networkId?: string): MarketPriceTokenRequest {
  return {
    id: token.id,
    symbol: token.symbol,
    name: token.name,
    network: token.network,
    networkId,
    contractAddress: token.contractAddress,
  };
}

export function buildMarketPriceRequestFromDefinition(
  token: PopularTokenDefinition,
  networkName: string,
): MarketPriceTokenRequest {
  return {
    id: token.id,
    symbol: token.symbol,
    name: token.name,
    network: networkName,
    networkId: token.networkId,
    contractAddress: token.contractAddress,
  };
}

export function buildNativeMarketPriceRequest(network: Network): MarketPriceTokenRequest {
  return {
    id: `${network.id}:native`,
    symbol: network.symbol,
    name: network.name,
    network: network.name,
    networkId: network.id,
  };
}

export function applyMarketPriceToToken(token: Token, marketPrice?: MarketPrice): Token {
  if (!marketPrice || !Number.isFinite(marketPrice.price) || marketPrice.price <= 0) {
    return token;
  }

  const balance = Number.parseFloat(token.balance || '0');
  return {
    ...token,
    price: marketPrice.price,
    change24h: typeof marketPrice.change24h === 'number' ? marketPrice.change24h : token.change24h,
    balanceUSD: Number.isFinite(balance) ? balance * marketPrice.price : token.balanceUSD,
  };
}

function dedupePriceRequests(tokens: MarketPriceTokenRequest[]) {
  const seen = new Set<string>();
  const uniqueTokens: MarketPriceTokenRequest[] = [];

  tokens.forEach((token) => {
    if (!token.id || !token.symbol) {
      return;
    }

    const key = [
      token.id,
      token.symbol,
      token.networkId || token.network || '',
      token.contractAddress || '',
    ].join(':').toLowerCase();

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    uniqueTokens.push(token);
  });

  return uniqueTokens;
}

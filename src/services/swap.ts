import type { Network, Token } from '../types';

export interface SwapRoute {
  provider: 'Uniswap' | 'Oku Trade';
  supported: boolean;
  url: string | null;
  reason?: string;
}

const UNISWAP_CHAIN_MAP: Record<string, string> = {
  ethereum: 'mainnet',
  arbitrum: 'arbitrum',
  base: 'base',
  polygon: 'polygon',
  sepolia: 'sepolia',
};

export function buildSwapUrl(input: {
  network: Network;
  fromToken: Token;
  toToken: Token;
  amount: string;
}): SwapRoute {
  if (input.network.id === '0g-mainnet') {
    const url = new URL('https://oku.trade/swap-zerog');
    if (input.fromToken.contractAddress) {
      url.searchParams.set('inputCurrency', input.fromToken.contractAddress);
    } else {
      url.searchParams.set('inputSymbol', input.fromToken.symbol);
    }
    if (input.toToken.contractAddress) {
      url.searchParams.set('outputCurrency', input.toToken.contractAddress);
    } else {
      url.searchParams.set('outputSymbol', input.toToken.symbol);
    }
    if (input.amount) {
      url.searchParams.set('exactAmount', input.amount);
    }

    return {
      provider: 'Oku Trade',
      supported: true,
      url: url.toString(),
    };
  }

  if (input.network.id === '0g-galileo') {
    return {
      provider: 'Oku Trade',
      supported: false,
      url: null,
      reason: 'No verified live swap UI was confirmed for 0G Galileo testnet, so TITAN blocks redirect instead of sending you to an unverified venue.',
    };
  }

  const chain = UNISWAP_CHAIN_MAP[input.network.id];
  if (!chain) {
    return {
      provider: 'Uniswap',
      supported: false,
      url: null,
      reason: `No swap route is configured yet for ${input.network.name}.`,
    };
  }

  const url = new URL('https://app.uniswap.org/swap');
  url.searchParams.set('chain', chain);
  url.searchParams.set('inputCurrency', input.fromToken.contractAddress || 'NATIVE');
  url.searchParams.set('outputCurrency', input.toToken.contractAddress || 'NATIVE');
  if (input.amount) {
    url.searchParams.set('exactAmount', input.amount);
    url.searchParams.set('exactField', 'input');
  }

  return {
    provider: 'Uniswap',
    supported: true,
    url: url.toString(),
  };
}

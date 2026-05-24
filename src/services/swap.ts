import type { Network, Token } from '../types';

export interface SwapRoute {
  provider: 'Uniswap' | 'Oku Trade' | 'Camelot' | 'Euclid Testnet';
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
    const url = new URL('https://testnet.euclidswap.io/swap');
    if (input.amount) {
      url.searchParams.set('amount', input.amount);
    }
    url.searchParams.set('from', input.fromToken.contractAddress || input.fromToken.symbol);
    url.searchParams.set('to', input.toToken.contractAddress || input.toToken.symbol);

    return {
      provider: 'Euclid Testnet',
      supported: true,
      url: url.toString(),
    };
  }

  if (input.network.id === 'arbitrum-sepolia') {
    const url = new URL('https://app.camelot.exchange/');
    url.searchParams.set('chainId', String(input.network.chainId));
    url.searchParams.set('swap', 'v3');
    if (input.fromToken.contractAddress) {
      url.searchParams.set('token1', input.fromToken.contractAddress);
    }
    if (input.toToken.contractAddress) {
      url.searchParams.set('token2', input.toToken.contractAddress);
    }

    return {
      provider: 'Camelot',
      supported: true,
      url: url.toString(),
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

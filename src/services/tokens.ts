import type { Network, Token } from '../types';
import { getTokenMetadata as readOnchainTokenMetadata } from './blockchain';

const TOKEN_CATALOG: Record<string, Token[]> = {
  ethereum: [
    {
      id: 'eth-weth',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      balance: '1.2040',
      balanceUSD: 3612,
      price: 3000,
      change24h: 1.92,
      icon: 'W',
      logoUrl: 'https://assets.coingecko.com/coins/images/2518/standard/weth.png',
      network: 'Ethereum',
      source: 'detected',
      contractAddress: '0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2',
    },
    {
      id: 'eth-usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '1250.00',
      balanceUSD: 1250,
      price: 1,
      change24h: 0.01,
      icon: 'U',
      logoUrl: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
      network: 'Ethereum',
      source: 'detected',
      contractAddress: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    {
      id: 'eth-link',
      symbol: 'LINK',
      name: 'Chainlink',
      balance: '45.00',
      balanceUSD: 675.9,
      price: 15.02,
      change24h: 3.45,
      icon: 'L',
      logoUrl: 'https://assets.coingecko.com/coins/images/877/standard/chainlink-new-logo.png',
      network: 'Ethereum',
      source: 'detected',
      contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    },
  ],
  '0g-mainnet': [
    {
      id: '0g-native',
      symbol: 'W0G',
      name: 'Wrapped 0G',
      balance: '420.00',
      balanceUSD: 207.73,
      price: 0.4946,
      change24h: 9.1,
      icon: '0',
      network: '0G Mainnet',
      source: 'detected',
    },
    {
      id: '0g-usdc.e',
      symbol: 'USDC.E',
      name: 'XSwap Bridged USDC',
      balance: '820.12',
      balanceUSD: 817,
      price: 0.9962,
      change24h: 0.2,
      icon: 'U',
      network: '0G Mainnet',
      source: 'detected',
    },
    {
      id: '0g-st0g',
      symbol: 'ST0G',
      name: 'Gimo Staked 0G',
      balance: '510.00',
      balanceUSD: 307.02,
      price: 0.602,
      change24h: 11.7,
      icon: 'S',
      network: '0G Mainnet',
      source: 'detected',
    },
  ],
  '0g-galileo': [
    {
      id: '0g-test-usdc',
      symbol: 'AUSDC',
      name: 'Galileo Test USDC',
      balance: '2500.00',
      balanceUSD: 0,
      price: 0,
      change24h: 0,
      icon: 'U',
      network: '0G Galileo Testnet',
      source: 'detected',
    },
    {
      id: '0g-test-0g',
      symbol: 'A0G',
      name: 'Galileo Test 0G',
      balance: '800.00',
      balanceUSD: 0,
      price: 0,
      change24h: 0,
      icon: '0',
      network: '0G Galileo Testnet',
      source: 'detected',
    },
  ],
  sepolia: [
    {
      id: 'sep-weth',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      balance: '5.00',
      balanceUSD: 0,
      price: 0,
      change24h: 0,
      icon: 'W',
      network: 'Sepolia',
      source: 'detected',
    },
  ],
};

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
  await new Promise((resolve) => window.setTimeout(resolve, 900));

  const detected = TOKEN_CATALOG[input.network.id] || TOKEN_CATALOG.ethereum || [];
  return detected.map((token) => ({
    ...token,
    network: input.network.name,
    source: 'detected' as const,
  }));
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

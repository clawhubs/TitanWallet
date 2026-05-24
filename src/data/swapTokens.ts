import type { Network, Token } from '../types';

const zeroValueToken = {
  balance: '0',
  balanceUSD: 0,
  price: 0,
  change24h: 0,
  source: 'default' as const,
};

const SWAP_TOKEN_PRESETS: Record<string, Token[]> = {
  ['0g-mainnet']: [
    {
      id: '0g-mainnet-native',
      symbol: '0G',
      name: '0G',
      icon: '0',
      network: '0G Mainnet',
      ...zeroValueToken,
    },
    {
      id: '0g-mainnet-usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      icon: 'U',
      network: '0G Mainnet',
      ...zeroValueToken,
    },
    {
      id: '0g-mainnet-weth',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      icon: 'W',
      network: '0G Mainnet',
      ...zeroValueToken,
    },
  ],
  ['0g-galileo']: [
    {
      id: '0g-galileo-native',
      symbol: '0G',
      name: '0G',
      icon: '0',
      network: '0G Galileo Testnet',
      ...zeroValueToken,
    },
    {
      id: '0g-galileo-usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      icon: 'U',
      network: '0G Galileo Testnet',
      ...zeroValueToken,
    },
  ],
  sepolia: [
    {
      id: 'sepolia-native',
      symbol: 'ETH',
      name: 'Ether',
      icon: 'E',
      network: 'Ethereum Sepolia',
      ...zeroValueToken,
    },
    {
      id: 'sepolia-usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      icon: 'U',
      network: 'Ethereum Sepolia',
      contractAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      ...zeroValueToken,
    },
  ],
  ['arbitrum-sepolia']: [
    {
      id: 'arbitrum-sepolia-native',
      symbol: 'ETH',
      name: 'Ether',
      icon: 'E',
      network: 'Arbitrum Sepolia',
      ...zeroValueToken,
    },
    {
      id: 'arbitrum-sepolia-usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      icon: 'U',
      network: 'Arbitrum Sepolia',
      contractAddress: '0xb893E3334D4Bd6C5ba8277Fd559e99Ed683A9FC7',
      ...zeroValueToken,
    },
    {
      id: 'arbitrum-sepolia-weth',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      icon: 'W',
      network: 'Arbitrum Sepolia',
      contractAddress: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
      ...zeroValueToken,
    },
  ],
};

function getTokenIdentity(token: Token) {
  return token.contractAddress?.toLowerCase() || `${token.network}:${token.symbol}`.toLowerCase();
}

export function getSwapTokensForNetwork(network: Network, walletTokens: Token[]) {
  const walletTokensOnNetwork = walletTokens.filter((token) => token.network === network.name);
  const presets = SWAP_TOKEN_PRESETS[network.id] || [];
  const merged = [...walletTokensOnNetwork, ...presets];

  const uniqueTokens = new Map<string, Token>();
  for (const token of merged) {
    uniqueTokens.set(getTokenIdentity(token), token);
  }

  const result = Array.from(uniqueTokens.values());
  const nativeIndex = result.findIndex((token) => !token.contractAddress && token.symbol === network.symbol);
  if (nativeIndex > 0) {
    const [nativeToken] = result.splice(nativeIndex, 1);
    result.unshift(nativeToken);
  }

  return result;
}

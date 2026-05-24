import type { Network } from '../types';

export const mockNetworks: Network[] = [
  {
    id: '0g-mainnet',
    name: '0G Mainnet',
    chainId: 16661,
    symbol: '0G',
    rpcUrl: 'https://evmrpc.0g.ai',
    explorerUrl: 'https://chainscan.0g.ai',
    isTestnet: false,
    isActive: true,
    isDefault: true,
  },
  {
    id: '0g-galileo',
    name: '0G Galileo Testnet',
    chainId: 16602,
    symbol: '0G',
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    explorerUrl: 'https://chainscan-galileo.0g.ai',
    isTestnet: true,
    isActive: false,
    isDefault: true,
  },
  {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    symbol: 'ETH',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    isActive: false,
    isDefault: true,
  },
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    symbol: 'ETH',
    rpcUrl: 'https://arbitrum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.arbiscan.io',
    isTestnet: true,
    isActive: false,
    isDefault: true,
  },
];

export const activeNetwork = mockNetworks[0];
export const builtInNetworkIds = new Set(mockNetworks.map((network) => network.id));

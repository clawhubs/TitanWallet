import type { PrivyClientConfig } from '@privy-io/react-auth';
import { defineChain } from 'viem';
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  bsc,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  sepolia,
} from 'viem/chains';

export const TITAN_PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID?.trim() || '';
export const TITAN_PRIVY_ENABLED = Boolean(TITAN_PRIVY_APP_ID);

export const zeroGMainnet = defineChain({
  id: 16661,
  name: '0G',
  network: '0g-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: '0G',
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Chainscan',
      url: 'https://chainscan.0g.ai',
    },
  },
});

export const zeroGGalileo = defineChain({
  id: 16602,
  name: '0G Galileo Testnet',
  network: '0g-galileo',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: '0G',
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc-testnet.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Galileo Chainscan',
      url: 'https://chainscan-galileo.0g.ai',
    },
  },
});

export const TITAN_PRIVY_SUPPORTED_CHAINS = [
  zeroGMainnet,
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  bsc,
  zeroGGalileo,
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
];

export const TITAN_PRIVY_CONFIG: PrivyClientConfig = {
  loginMethods: ['google', 'apple'],
  defaultChain: zeroGMainnet,
  supportedChains: TITAN_PRIVY_SUPPORTED_CHAINS,
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'off',
    },
    showWalletUIs: true,
  },
  appearance: {
    landingHeader: 'Continue to TITAN Wallet',
    loginMessage: 'Use Google or Apple to create a Privy-managed MPC wallet.',
  },
};

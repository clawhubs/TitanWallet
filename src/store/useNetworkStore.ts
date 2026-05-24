import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Network } from '../types';
import { mockNetworks } from '../data/mockNetworks';
import { TITAN_DEFAULT_ENVIRONMENT, type YieldBoostEnvironment } from '../config/api';

interface NetworkStore {
  activeNetwork: Network;
  networks: Network[];
  environment: YieldBoostEnvironment;
  setActiveNetwork: (network: Network) => void;
  addNetwork: (network: Network) => void;
  updateNetwork: (id: string, network: Partial<Network>) => void;
  removeNetwork: (id: string) => void;
  toggleEnvironment: () => void;
}

function getDefaultActiveNetwork() {
  return mockNetworks.find((network) => network.isActive) || mockNetworks[0];
}

function normalizeNetworks(networks: Network[], activeId: string) {
  return networks.map((network) => ({
    ...network,
    isActive: network.id === activeId,
  }));
}

export const useNetworkStore = create<NetworkStore>()(
  persist(
    (set) => ({
      activeNetwork: getDefaultActiveNetwork(),
      networks: mockNetworks,
      environment: TITAN_DEFAULT_ENVIRONMENT,
      setActiveNetwork: (network) =>
        set((state) => ({
          activeNetwork: network,
          networks: normalizeNetworks(state.networks, network.id),
        })),
      addNetwork: (network) =>
        set((state) => ({
          networks: [...state.networks, { ...network, isActive: false }],
        })),
      updateNetwork: (id, update) =>
        set((state) => {
          const networks = state.networks.map((network) =>
            network.id === id ? { ...network, ...update } : network,
          );
          const activeNetwork =
            state.activeNetwork.id === id
              ? networks.find((network) => network.id === id) || state.activeNetwork
              : state.activeNetwork;

          return {
            networks,
            activeNetwork,
          };
        }),
      removeNetwork: (id) =>
        set((state) => {
          const candidateNetworks = state.networks.filter((network) => network.id !== id);
          const fallbackNetwork = candidateNetworks[0] || getDefaultActiveNetwork();
          const nextActiveId =
            state.activeNetwork.id === id ? fallbackNetwork.id : state.activeNetwork.id;

          return {
            activeNetwork:
              candidateNetworks.find((network) => network.id === nextActiveId) || fallbackNetwork,
            networks: normalizeNetworks(candidateNetworks, nextActiveId),
          };
        }),
      toggleEnvironment: () =>
        set((state) => ({
          environment: state.environment === 'mainnet' ? 'testnet' : 'mainnet',
        })),
    }),
    {
      name: 'titan-wallet-network-store',
      partialize: (state) => ({
        activeNetwork: state.activeNetwork,
        networks: state.networks,
        environment: state.environment,
      }),
    },
  ),
);

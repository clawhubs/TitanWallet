import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Token } from '../types';
import { detectTokens } from '../services/tokens';
import { useNetworkStore } from './useNetworkStore';
import { useWalletStore } from './useWalletStore';

interface TokenStore {
  tokens: Token[];
  customTokens: Token[];
  isDetecting: boolean;
  addCustomToken: (token: Token) => void;
  removeToken: (id: string) => void;
  setTokens: (tokens: Token[]) => void;
  setDetecting: (value: boolean) => void;
  runAutoDetect: () => Promise<void>;
}

export const useTokenStore = create<TokenStore>()(
  persist(
    (set, get) => ({
      tokens: [],
      customTokens: [],
      isDetecting: false,
      addCustomToken: (token) =>
        set((state) => {
          const normalized = { ...token, source: 'custom' as const };
          return {
            customTokens: [...state.customTokens.filter((item) => item.id !== token.id), normalized],
            tokens: [...state.tokens.filter((item) => item.id !== token.id), normalized],
          };
        }),
      removeToken: (id) =>
        set((state) => ({
          customTokens: state.customTokens.filter((token) => token.id !== id),
          tokens: state.tokens.filter((token) => token.id !== id),
        })),
      setTokens: (tokens) => set({ tokens }),
      setDetecting: (value) => set({ isDetecting: value }),
      runAutoDetect: async () => {
        set({ isDetecting: true });
        try {
          const network = useNetworkStore.getState().activeNetwork;
          const walletAddress = useWalletStore.getState().address;
          const detected = await detectTokens({ walletAddress, network });
          const customTokens = get().customTokens;
          set({
            isDetecting: false,
            tokens: [...detected, ...customTokens],
          });
        } catch {
          set({
            isDetecting: false,
            tokens: [...get().customTokens],
          });
        }
      },
    }),
    {
      name: 'titan-wallet-token-store',
      version: 2,
      partialize: (state) => ({
        tokens: state.tokens,
        customTokens: state.customTokens,
      }),
      merge: (persistedState, currentState) => {
        const typedState = (persistedState || {}) as Partial<TokenStore>;
        const customTokens = typedState.customTokens || [];

        return {
          ...currentState,
          ...typedState,
          tokens: customTokens,
          customTokens,
        };
      },
    },
  ),
);

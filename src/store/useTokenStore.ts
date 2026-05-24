import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Token } from '../types';
import { detectTokens } from '../services/tokens';
import { useNetworkStore } from './useNetworkStore';
import { useWalletStore } from './useWalletStore';

interface TokenScopeState {
  tokens: Token[];
  customTokens: Token[];
}

interface TokenStore {
  tokens: Token[];
  customTokens: Token[];
  isDetecting: boolean;
  tokenScopes: Record<string, TokenScopeState>;
  addCustomToken: (token: Token) => void;
  removeToken: (id: string) => void;
  setTokens: (tokens: Token[]) => void;
  setDetecting: (value: boolean) => void;
  runAutoDetect: () => Promise<void>;
  syncWalletScope: () => void;
}

const EMPTY_SCOPE: TokenScopeState = {
  tokens: [],
  customTokens: [],
};

function getWalletScopeKey() {
  return useWalletStore.getState().address?.toLowerCase() || '';
}

export const useTokenStore = create<TokenStore>()(
  persist(
    (set, get) => ({
      tokens: [],
      customTokens: [],
      isDetecting: false,
      tokenScopes: {},
      addCustomToken: (token) =>
        set((state) => {
          const scopeKey = getWalletScopeKey();
          if (!scopeKey) {
            return state;
          }

          const normalized = { ...token, source: 'custom' as const };
          const currentScope = state.tokenScopes[scopeKey] || EMPTY_SCOPE;
          const customTokens = [...currentScope.customTokens.filter((item) => item.id !== token.id), normalized];
          const tokens = [...currentScope.tokens.filter((item) => item.id !== token.id), normalized];

          return {
            customTokens,
            tokens,
            tokenScopes: {
              ...state.tokenScopes,
              [scopeKey]: {
                customTokens,
                tokens,
              },
            },
          };
        }),
      removeToken: (id) =>
        set((state) => {
          const scopeKey = getWalletScopeKey();
          if (!scopeKey) {
            return state;
          }

          const currentScope = state.tokenScopes[scopeKey] || EMPTY_SCOPE;
          const customTokens = currentScope.customTokens.filter((token) => token.id !== id);
          const tokens = currentScope.tokens.filter((token) => token.id !== id);

          return {
            customTokens,
            tokens,
            tokenScopes: {
              ...state.tokenScopes,
              [scopeKey]: {
                customTokens,
                tokens,
              },
            },
          };
        }),
      setTokens: (tokens) =>
        set((state) => {
          const scopeKey = getWalletScopeKey();
          if (!scopeKey) {
            return {
              ...state,
              tokens: [],
              customTokens: [],
            };
          }

          const currentScope = state.tokenScopes[scopeKey] || EMPTY_SCOPE;
          const nextTokens = [...tokens];

          return {
            tokens: nextTokens,
            customTokens: currentScope.customTokens,
            tokenScopes: {
              ...state.tokenScopes,
              [scopeKey]: {
                customTokens: currentScope.customTokens,
                tokens: nextTokens,
              },
            },
          };
        }),
      setDetecting: (value) => set({ isDetecting: value }),
      runAutoDetect: async () => {
        set({ isDetecting: true });
        try {
          const network = useNetworkStore.getState().activeNetwork;
          const walletAddress = useWalletStore.getState().address;
          const detected = await detectTokens({ walletAddress, network });
          const scopeKey = getWalletScopeKey();
          const customTokens = scopeKey ? get().tokenScopes[scopeKey]?.customTokens || [] : [];
          const nextTokens = [...detected, ...customTokens];
          set({
            isDetecting: false,
            tokens: nextTokens,
            tokenScopes: scopeKey
              ? {
                  ...get().tokenScopes,
                  [scopeKey]: {
                    customTokens,
                    tokens: nextTokens,
                  },
                }
              : get().tokenScopes,
          });
        } catch {
          const scopeKey = getWalletScopeKey();
          const customTokens = scopeKey ? get().tokenScopes[scopeKey]?.customTokens || [] : [];
          set({
            isDetecting: false,
            tokens: [...customTokens],
            tokenScopes: scopeKey
              ? {
                  ...get().tokenScopes,
                  [scopeKey]: {
                    customTokens,
                    tokens: [...customTokens],
                  },
                }
              : get().tokenScopes,
          });
        }
      },
      syncWalletScope: () =>
        set((state) => {
          const scopeKey = getWalletScopeKey();
          if (!scopeKey) {
            return {
              tokens: [],
              customTokens: [],
            };
          }

          const scoped = state.tokenScopes[scopeKey] || EMPTY_SCOPE;
          return {
            tokens: scoped.tokens,
            customTokens: scoped.customTokens,
          };
        }),
    }),
    {
      name: 'titan-wallet-token-store',
      version: 3,
      storage: createJSONStorage(() => window.sessionStorage),
      partialize: (state) => ({
        tokenScopes: state.tokenScopes,
      }),
      merge: (persistedState, currentState) => {
        const typedState = (persistedState || {}) as Partial<TokenStore>;
        const tokenScopes = typedState.tokenScopes || {};
        const scopeKey = getWalletScopeKey();
        const scoped = scopeKey ? tokenScopes[scopeKey] || EMPTY_SCOPE : EMPTY_SCOPE;

        return {
          ...currentState,
          tokenScopes,
          tokens: scoped.tokens,
          customTokens: scoped.customTokens,
        };
      },
      migrate: (persistedState) => {
        const typedState = (persistedState || {}) as Partial<TokenStore> & {
          tokens?: Token[];
          customTokens?: Token[];
          tokenScopes?: Record<string, TokenScopeState>;
        };

        if (typedState.tokenScopes) {
          return typedState;
        }

        return {
          tokenScopes: {},
        };
      },
    },
  ),
);

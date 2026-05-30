import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WalletSessionInput {
  address: string;
  mnemonic: string | null;
  privateKey: string | null;
  walletName?: string;
  source?: WalletSource;
  authProvider?: WalletAuthProvider;
}

export type WalletSource = 'local' | 'privy' | 'managed' | 'google';
export type WalletAuthProvider = 'google' | 'apple' | null;

export interface WalletAccount {
  id: string;
  address: string;
  mnemonic: string | null;
  privateKey: string | null;
  walletName: string;
  source: WalletSource;
  authProvider: WalletAuthProvider;
  balanceETH: string;
  balanceUSD: number;
  createdAt: string;
  lastUsedAt: string;
}

interface WalletStore {
  accounts: WalletAccount[];
  activeAccountId: string | null;
  address: string | null;
  isConnected: boolean;
  balanceETH: string;
  balanceUSD: number;
  mnemonic: string | null;
  privateKey: string | null;
  walletName: string;
  walletSource: WalletSource | null;
  authProvider: WalletAuthProvider;
  connect: (wallet: WalletSessionInput) => void;
  switchAccount: (accountId: string) => void;
  removeAccount: (accountId: string) => void;
  removeAccountsBySource: (source: WalletSource) => void;
  disconnect: () => void;
  setBalance: (eth: string, usd: number) => void;
}

const initialState = {
  accounts: [] as WalletAccount[],
  activeAccountId: null,
  address: null,
  isConnected: false,
  balanceETH: '0.0',
  balanceUSD: 0,
  mnemonic: null,
  privateKey: null,
  walletName: 'TITAN Wallet',
  walletSource: null,
  authProvider: null,
};

const STORAGE_KEY = 'titan-wallet-session-store';

function canUseStorage(storageName: 'localStorage' | 'sessionStorage') {
  return typeof window !== 'undefined' && typeof window[storageName] !== 'undefined';
}

const walletSessionStorage = createJSONStorage(() => ({
  getItem(name: string) {
    if (canUseStorage('localStorage')) {
      const localValue = window.localStorage.getItem(name);
      if (localValue) {
        return localValue;
      }
    }

    if (canUseStorage('sessionStorage')) {
      const sessionValue = window.sessionStorage.getItem(name);
      if (sessionValue && canUseStorage('localStorage')) {
        window.localStorage.setItem(name, sessionValue);
      }
      return sessionValue;
    }

    return null;
  },
  setItem(name: string, value: string) {
    if (canUseStorage('localStorage')) {
      window.localStorage.setItem(name, value);
    }
    if (canUseStorage('sessionStorage')) {
      window.sessionStorage.setItem(name, value);
    }
  },
  removeItem(name: string) {
    if (canUseStorage('localStorage')) {
      window.localStorage.removeItem(name);
    }
    if (canUseStorage('sessionStorage')) {
      window.sessionStorage.removeItem(name);
    }
  },
}));

function normalizeWalletName(walletName?: string) {
  return walletName?.trim() || 'TITAN Wallet';
}

function getAccountId(address: string) {
  return address.toLowerCase();
}

function buildWalletAccount(
  wallet: WalletSessionInput,
  existing?: WalletAccount,
): WalletAccount {
  const timestamp = new Date().toISOString();

  return {
    id: existing?.id || getAccountId(wallet.address),
    address: wallet.address,
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    walletName: normalizeWalletName(wallet.walletName),
    source: wallet.source || existing?.source || 'local',
    authProvider: wallet.authProvider ?? existing?.authProvider ?? null,
    balanceETH: existing?.balanceETH || '0.0',
    balanceUSD: existing?.balanceUSD || 0,
    createdAt: existing?.createdAt || timestamp,
    lastUsedAt: timestamp,
  };
}

function buildActiveWalletState(account: WalletAccount) {
  return {
    activeAccountId: account.id,
    address: account.address,
    isConnected: true,
    balanceETH: account.balanceETH,
    balanceUSD: account.balanceUSD,
    mnemonic: account.mnemonic,
    privateKey: account.privateKey,
    walletName: account.walletName,
    walletSource: account.source,
    authProvider: account.authProvider,
  };
}

function extractLegacyAccount(state: Partial<WalletStore>) {
  if (!state.address) {
    return [];
  }

  return [
    buildWalletAccount({
      address: state.address,
      mnemonic: state.mnemonic || null,
      privateKey: state.privateKey || null,
      walletName: state.walletName,
      source: state.walletSource || 'local',
      authProvider: state.authProvider ?? null,
    }, {
      id: getAccountId(state.address),
      address: state.address,
      mnemonic: state.mnemonic || null,
      privateKey: state.privateKey || null,
      walletName: normalizeWalletName(state.walletName),
      source: state.walletSource || 'local',
      authProvider: state.authProvider ?? null,
      balanceETH: state.balanceETH || '0.0',
      balanceUSD: state.balanceUSD || 0,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    }),
  ];
}

function normalizePersistedAccounts(accounts: WalletAccount[] | undefined, legacyState: Partial<WalletStore>) {
  if (accounts?.length) {
    return accounts.map((account) => ({
      ...account,
      id: account.id || getAccountId(account.address),
      walletName: normalizeWalletName(account.walletName),
      source: account.source || 'local',
      authProvider: account.authProvider ?? null,
      balanceETH: account.balanceETH || '0.0',
      balanceUSD: account.balanceUSD || 0,
      createdAt: account.createdAt || new Date().toISOString(),
      lastUsedAt: account.lastUsedAt || account.createdAt || new Date().toISOString(),
    }));
  }

  return extractLegacyAccount(legacyState);
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      ...initialState,
      connect: (wallet) =>
        set((state) => {
          const accountId = getAccountId(wallet.address);
          const existing = state.accounts.find((account) => account.id === accountId);
          const nextAccount = buildWalletAccount(wallet, existing);
          const accounts = existing
            ? state.accounts.map((account) => (account.id === accountId ? nextAccount : account))
            : [nextAccount, ...state.accounts];

          return {
            ...state,
            accounts,
            ...buildActiveWalletState(nextAccount),
          };
        }),
      switchAccount: (accountId) =>
        set((state) => {
          const account = state.accounts.find((entry) => entry.id === accountId);
          if (!account) {
            return state;
          }

          const nextAccount = {
            ...account,
            lastUsedAt: new Date().toISOString(),
          };

          return {
            ...state,
            accounts: state.accounts.map((entry) => (entry.id === accountId ? nextAccount : entry)),
            ...buildActiveWalletState(nextAccount),
          };
        }),
      removeAccount: (accountId) =>
        set((state) => {
          const accounts = state.accounts.filter((account) => account.id !== accountId);
          if (!accounts.length) {
            return initialState;
          }

          if (state.activeAccountId === accountId) {
            const nextActiveAccount = accounts[0];
            return {
              ...state,
              accounts,
              ...buildActiveWalletState(nextActiveAccount),
            };
          }

          return {
            ...state,
            accounts,
          };
        }),
      removeAccountsBySource: (source) =>
        set((state) => {
          const accounts = state.accounts.filter((account) => account.source !== source);
          if (!accounts.length) {
            return initialState;
          }

          if (state.walletSource === source) {
            const nextActiveAccount = accounts[0];
            return {
              ...state,
              accounts,
              ...buildActiveWalletState(nextActiveAccount),
            };
          }

          return {
            ...state,
            accounts,
          };
        }),
      disconnect: () => set(initialState),
      setBalance: (eth, usd) =>
        set((state) => ({
          balanceETH: eth,
          balanceUSD: usd,
          accounts: state.accounts.map((account) =>
            account.id === state.activeAccountId
              ? {
                  ...account,
                  balanceETH: eth,
                  balanceUSD: usd,
                }
              : account,
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: walletSessionStorage,
      migrate: (persistedState, version) => {
        const typedState = (persistedState || {}) as Partial<WalletStore>;
        if (version >= 2) {
          return typedState;
        }

        const accounts = normalizePersistedAccounts(undefined, typedState);
        const activeAccount = accounts[0] || null;

        if (!activeAccount) {
          return typedState;
        }

        return {
          ...typedState,
          accounts,
          ...buildActiveWalletState(activeAccount),
        };
      },
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
        address: state.address,
        isConnected: state.isConnected,
        mnemonic: state.mnemonic,
        privateKey: state.privateKey,
        walletName: state.walletName,
        walletSource: state.walletSource,
        authProvider: state.authProvider,
        balanceETH: state.balanceETH,
        balanceUSD: state.balanceUSD,
      }),
      merge: (persistedState, currentState) => {
        const typedState = (persistedState || {}) as Partial<WalletStore>;
        const accounts = normalizePersistedAccounts(typedState.accounts, typedState);
        const fallbackAccount = accounts[0] || null;
        const activeAccount =
          accounts.find((account) => account.id === typedState.activeAccountId)
          || accounts.find((account) => account.address === typedState.address)
          || fallbackAccount;

        if (!activeAccount) {
          return {
            ...currentState,
          };
        }

        return {
          ...currentState,
          accounts,
          ...buildActiveWalletState(activeAccount),
        };
      },
    },
  ),
);

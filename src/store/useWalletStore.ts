import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WalletSessionInput {
  address: string;
  mnemonic: string | null;
  privateKey: string | null;
  walletName?: string;
}

interface WalletStore {
  address: string | null;
  isConnected: boolean;
  balanceETH: string;
  balanceUSD: number;
  mnemonic: string | null;
  privateKey: string | null;
  walletName: string;
  connect: (wallet: WalletSessionInput) => void;
  disconnect: () => void;
  setBalance: (eth: string, usd: number) => void;
}

const initialState = {
  address: null,
  isConnected: false,
  balanceETH: '0.0',
  balanceUSD: 0,
  mnemonic: null,
  privateKey: null,
  walletName: 'TITAN Wallet',
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

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      ...initialState,
      connect: (wallet) =>
        set({
          address: wallet.address,
          isConnected: true,
          mnemonic: wallet.mnemonic,
          privateKey: wallet.privateKey,
          walletName: wallet.walletName?.trim() || 'TITAN Wallet',
        }),
      disconnect: () => set(initialState),
      setBalance: (eth, usd) =>
        set({
          balanceETH: eth,
          balanceUSD: usd,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: walletSessionStorage,
      partialize: (state) => ({
        address: state.address,
        isConnected: state.isConnected,
        mnemonic: state.mnemonic,
        privateKey: state.privateKey,
        walletName: state.walletName,
        balanceETH: state.balanceETH,
        balanceUSD: state.balanceUSD,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...((persistedState || {}) as Partial<WalletStore>),
      }),
    },
  ),
);

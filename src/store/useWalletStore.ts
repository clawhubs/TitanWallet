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
      name: 'titan-wallet-session-store',
      version: 1,
      storage: createJSONStorage(() => window.sessionStorage),
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

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  PrivyProvider,
  getEmbeddedConnectedWallet,
  useCreateWallet,
  useExportWallet,
  useLoginWithOAuth,
  usePrivy,
  useSendTransaction,
  useSignMessage,
  useSignTransaction,
  useWallets,
  type ConnectedWallet,
  type EIP1193Provider,
} from '@privy-io/react-auth';
import type { TransactionRequest } from 'ethers';
import { TITAN_PRIVY_APP_ID, TITAN_PRIVY_CONFIG, TITAN_PRIVY_ENABLED } from '../../config/privy';

type SocialAuthProvider = 'google' | 'apple';

interface PrivyBridgeValue {
  enabled: boolean;
  ready: boolean;
  authenticated: boolean;
  walletAddress: string | null;
  walletName: string | null;
  authProvider: SocialAuthProvider | null;
  wallet: ConnectedWallet | null;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (transaction: TransactionRequest) => Promise<string>;
  sendTransaction: (input: { to: string; value: bigint; chainId: number }) => Promise<{ hash: string }>;
  getEthereumProvider: () => Promise<EIP1193Provider>;
  exportWallet: () => Promise<void>;
}

const noopAsync = async () => {};

const defaultPrivyBridgeValue: PrivyBridgeValue = {
  enabled: false,
  ready: false,
  authenticated: false,
  walletAddress: null,
  walletName: null,
  authProvider: null,
  wallet: null,
  loginWithGoogle: noopAsync,
  loginWithApple: noopAsync,
  logout: noopAsync,
  signMessage: async () => {
    throw new Error('Privy is not configured for this app.');
  },
  signTransaction: async () => {
    throw new Error('Privy is not configured for this app.');
  },
  sendTransaction: async () => {
    throw new Error('Privy is not configured for this app.');
  },
  getEthereumProvider: async () => {
    throw new Error('Privy is not configured for this app.');
  },
  exportWallet: noopAsync,
};

const PrivyBridgeContext = createContext<PrivyBridgeValue>(defaultPrivyBridgeValue);

function normalizeTransactionRequest(transaction: TransactionRequest) {
  return {
    to: typeof transaction.to === 'string' ? transaction.to : undefined,
    from: typeof transaction.from === 'string' ? transaction.from : undefined,
    nonce: transaction.nonce ?? undefined,
    gasLimit: transaction.gasLimit != null ? transaction.gasLimit.toString() : undefined,
    gasPrice: transaction.gasPrice != null ? transaction.gasPrice.toString() : undefined,
    data: typeof transaction.data === 'string' ? transaction.data : undefined,
    value: transaction.value != null ? transaction.value.toString() : undefined,
    chainId: transaction.chainId != null ? Number(transaction.chainId) : undefined,
    type: transaction.type ?? undefined,
    maxPriorityFeePerGas:
      transaction.maxPriorityFeePerGas != null ? transaction.maxPriorityFeePerGas.toString() : undefined,
    maxFeePerGas: transaction.maxFeePerGas != null ? transaction.maxFeePerGas.toString() : undefined,
  };
}

function getWalletDisplayName(input: {
  googleName?: string | null;
  googleEmail?: string | null;
  appleEmail?: string | null;
  fallbackEmail?: string | null;
}) {
  return (
    input.googleName?.trim()
    || input.googleEmail?.trim()
    || input.appleEmail?.trim()
    || input.fallbackEmail?.trim()
    || 'Privy Wallet'
  );
}

const PrivyBridgeRuntime: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready: privyReady, authenticated, user, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { initOAuth } = useLoginWithOAuth();
  const { createWallet } = useCreateWallet();
  const { exportWallet } = useExportWallet();
  const { signMessage } = useSignMessage();
  const { signTransaction } = useSignTransaction();
  const { sendTransaction } = useSendTransaction();
  const wallet = useMemo(() => getEmbeddedConnectedWallet(wallets) || wallets[0] || null, [wallets]);
  const createAttemptedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!privyReady || !walletsReady || !authenticated || !user) {
      return;
    }

    if (wallet || createAttemptedForUser.current === user.id) {
      return;
    }

    createAttemptedForUser.current = user.id;
    void createWallet().catch(() => {
      createAttemptedForUser.current = null;
    });
  }, [authenticated, createWallet, privyReady, user, wallet, walletsReady]);

  const authProvider: SocialAuthProvider | null = user?.google
    ? 'google'
    : user?.apple
      ? 'apple'
      : null;

  const walletName = user
    ? getWalletDisplayName({
        googleName: user.google?.name,
        googleEmail: user.google?.email,
        appleEmail: user.apple?.email,
        fallbackEmail: user.email?.address,
      })
    : null;

  const value = useMemo<PrivyBridgeValue>(() => ({
    enabled: true,
    ready: privyReady && walletsReady,
    authenticated,
    walletAddress: wallet?.address || null,
    walletName,
    authProvider,
    wallet,
    loginWithGoogle: () => initOAuth({ provider: 'google' }),
    loginWithApple: () => initOAuth({ provider: 'apple' }),
    logout,
    signMessage: async (message: string) => {
      if (!wallet) {
        throw new Error('No Privy wallet is connected yet.');
      }

      const result = await signMessage(
        { message },
        { address: wallet.address },
      );

      return result.signature;
    },
    signTransaction: async (transaction: TransactionRequest) => {
      if (!wallet) {
        throw new Error('No Privy wallet is connected yet.');
      }

      if (transaction.chainId) {
        await wallet.switchChain(Number(transaction.chainId));
      }

      const result = await signTransaction(
        normalizeTransactionRequest(transaction),
        { address: wallet.address },
      );

      return result.signature;
    },
    sendTransaction: async (input) => {
      if (!wallet) {
        throw new Error('No Privy wallet is connected yet.');
      }

      await wallet.switchChain(input.chainId);

      const result = await sendTransaction(
        {
          to: input.to,
          value: input.value,
          chainId: input.chainId,
        },
        { address: wallet.address },
      );

      return { hash: result.hash };
    },
    getEthereumProvider: async () => {
      if (!wallet) {
        throw new Error('No Privy wallet is connected yet.');
      }

      return wallet.getEthereumProvider();
    },
    exportWallet: async () => {
      if (!wallet) {
        throw new Error('No Privy wallet is connected yet.');
      }

      await exportWallet({ address: wallet.address });
    },
  }), [
    authProvider,
    authenticated,
    exportWallet,
    initOAuth,
    logout,
    privyReady,
    sendTransaction,
    signMessage,
    signTransaction,
    wallet,
    walletName,
    walletsReady,
  ]);

  return (
    <PrivyBridgeContext.Provider value={value}>
      {children}
    </PrivyBridgeContext.Provider>
  );
};

export const PrivyBridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!TITAN_PRIVY_ENABLED) {
    return (
      <PrivyBridgeContext.Provider value={defaultPrivyBridgeValue}>
        {children}
      </PrivyBridgeContext.Provider>
    );
  }

  return (
    <PrivyProvider appId={TITAN_PRIVY_APP_ID} config={TITAN_PRIVY_CONFIG}>
      <PrivyBridgeRuntime>{children}</PrivyBridgeRuntime>
    </PrivyProvider>
  );
};

export function usePrivyWalletBridge() {
  return useContext(PrivyBridgeContext);
}

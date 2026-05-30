import { useTitanManagedAuthBridge } from '../features/consumer-auth/TitanManagedAuthBridge';
import type { TransactionRequest } from 'ethers';
import { useWalletStore } from '../store/useWalletStore';
import { useNetworkStore } from '../store/useNetworkStore';
import {
  createNewWallet,
  getWalletFromPrivateKey,
  importFromSecret,
  sendNativeTransaction,
  signMessage,
  signTransaction,
  waitForTransactionReceipt,
} from '../services/wallet';

export function useWallet() {
  const accounts = useWalletStore((state) => state.accounts);
  const activeAccountId = useWalletStore((state) => state.activeAccountId);
  const address = useWalletStore((state) => state.address);
  const isConnected = useWalletStore((state) => state.isConnected);
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const privateKey = useWalletStore((state) => state.privateKey);
  const walletName = useWalletStore((state) => state.walletName);
  const walletSource = useWalletStore((state) => state.walletSource);
  const authProvider = useWalletStore((state) => state.authProvider);
  const connect = useWalletStore((state) => state.connect);
  const switchAccount = useWalletStore((state) => state.switchAccount);
  const removeAccount = useWalletStore((state) => state.removeAccount);
  const disconnect = useWalletStore((state) => state.disconnect);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const managedAuth = useTitanManagedAuthBridge();
  const authLane = managedAuth.enabled ? 'titan-managed' : 'none';

  function createWallet(name?: string) {
    const wallet = createNewWallet();
    connect({
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      privateKey: wallet.privateKey,
      walletName: name,
      source: 'local',
    });
    return wallet;
  }

  function importWallet(secret: string, name?: string) {
    const wallet = importFromSecret(secret);
    connect({
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      privateKey: wallet.privateKey,
      walletName: name,
      source: 'local',
    });
    return wallet;
  }

  async function linkWalletToGoogle(input: { walletName: string; address: string; mnemonic: string; privateKey: string }) {
    return managedAuth.linkWalletToGoogle(input);
  }

  async function renameGoogleLinkedWallet(walletName: string) {
    return managedAuth.renameLinkedWallet(walletName);
  }

  async function restoreWalletFromGoogle() {
    const wallet = await managedAuth.restoreWalletFromGoogle();
    connect({
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      privateKey: wallet.privateKey,
      walletName: wallet.walletName,
      source: 'google',
      authProvider: managedAuth.provider,
    });
    return wallet;
  }

  async function getSigner() {
    if (privateKey) {
      return getWalletFromPrivateKey(privateKey, activeNetwork.rpcUrl);
    }

    throw new Error('No local private key is available for this wallet session. Restore or create the wallet again before signing.');
  }

  async function signTextMessage(message: string) {
    if (privateKey) {
      return signMessage(message, privateKey);
    }

    throw new Error('No local private key is available for this wallet session. Restore or create the wallet again before signing.');
  }

  async function signTx(transaction: Parameters<typeof signTransaction>[0] | TransactionRequest) {
    if (privateKey) {
      return signTransaction(transaction, privateKey, activeNetwork.rpcUrl);
    }

    throw new Error('No local private key is available for this wallet session. Restore or create the wallet again before signing.');
  }

  async function sendNativeAsset(input: { to: string; amount: string }) {
    if (privateKey) {
      return sendNativeTransaction({
        to: input.to,
        amount: input.amount,
        privateKey,
        rpcUrl: activeNetwork.rpcUrl,
      });
    }

    throw new Error('No local private key is available for this wallet session. Restore or create the wallet again before sending.');
  }

  async function waitForTxReceipt(hash: string, timeoutMs?: number) {
    return waitForTransactionReceipt({
      hash,
      rpcUrl: activeNetwork.rpcUrl,
      timeoutMs,
    });
  }

  async function disconnectWallet() {
    if (walletSource === 'managed') {
      await managedAuth.logout();
    }

    if (walletSource === 'google') {
      await managedAuth.logout();
    }

    disconnect();
  }

  return {
    accounts,
    activeAccountId,
    address,
    isConnected,
    mnemonic,
    privateKey,
    walletName,
    walletSource,
    authProvider,
    activeNetwork,
    authLane,
    hasSocialLogin: authLane !== 'none',
    privyReady: managedAuth.ready,
    socialConfigReady: managedAuth.loginMethods.loaded,
    googleLoginEnabled: managedAuth.loginMethods.google,
    appleLoginEnabled: managedAuth.loginMethods.apple,
    socialAuthenticated: managedAuth.authenticated,
    socialUserName: managedAuth.userName,
    socialUserEmail: managedAuth.userEmail,
    socialProviderLabel: managedAuth.label,
    managedWalletReady: managedAuth.managedWalletReady,
    managedWalletMessage: managedAuth.managedWalletMessage,
    managedWalletSession: managedAuth.linkedWallet,
    socialProviderErrors: managedAuth.errors,
    createWallet,
    linkWalletToGoogle,
    renameGoogleLinkedWallet,
    restoreWalletFromGoogle,
    importWallet,
    loginWithGoogle: managedAuth.loginWithGoogle,
    loginWithApple: noopUnsupportedSocialLogin,
    exportManagedWallet: noopUnsupportedManagedExport,
    switchAccount,
    removeAccount,
    disconnectWallet,
    getSigner,
    signTextMessage,
    signTransaction: signTx,
    sendNativeAsset,
    waitForTxReceipt,
  };
}

function noopUnsupportedSocialLogin() {
  throw new Error('Apple login is not configured in the TITAN managed auth lane.');
}

async function noopUnsupportedManagedExport() {
  throw new Error('Managed wallet export is not exposed in this lane yet.');
}

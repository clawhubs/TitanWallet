import { useTitanManagedAuthBridge } from '../features/consumer-auth/TitanManagedAuthBridge';
import { BrowserProvider, parseEther, type TransactionRequest } from 'ethers';
import { usePrivyWalletBridge } from '../features/privy/PrivyBridge';
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
  const privy = usePrivyWalletBridge();
  const authLane = managedAuth.enabled ? 'titan-managed' : privy.enabled ? 'privy' : 'none';

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

    const provider = await privy.getEthereumProvider();
    const browserProvider = new BrowserProvider(provider, activeNetwork.chainId);
    return browserProvider.getSigner();
  }

  async function signTextMessage(message: string) {
    if (privateKey) {
      return signMessage(message, privateKey);
    }

    return privy.signMessage(message);
  }

  async function signTx(transaction: Parameters<typeof signTransaction>[0] | TransactionRequest) {
    if (privateKey) {
      return signTransaction(transaction, privateKey, activeNetwork.rpcUrl);
    }

    return privy.signTransaction({
      ...transaction,
      chainId: Number(transaction.chainId ?? activeNetwork.chainId),
    });
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

    const value = parseEther(input.amount || '0');
    const result = await privy.sendTransaction({
      to: input.to,
      value,
      chainId: activeNetwork.chainId,
    });

    return {
      hash: result.hash,
      from: privy.walletAddress || '',
      to: input.to,
      amount: input.amount,
      signedTransaction: null,
      nonce: null,
      chainId: activeNetwork.chainId,
      gasLimit: null,
    };
  }

  async function waitForTxReceipt(hash: string, timeoutMs?: number) {
    return waitForTransactionReceipt({
      hash,
      rpcUrl: activeNetwork.rpcUrl,
      timeoutMs,
    });
  }

  async function disconnectWallet() {
    if (walletSource === 'privy') {
      await privy.logout();
    }

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
    privyReady: authLane === 'titan-managed' ? managedAuth.ready : privy.ready,
    socialConfigReady: authLane === 'titan-managed' ? managedAuth.loginMethods.loaded : privy.loginMethods.loaded,
    googleLoginEnabled: authLane === 'titan-managed' ? managedAuth.loginMethods.google : privy.loginMethods.google,
    appleLoginEnabled: authLane === 'titan-managed' ? managedAuth.loginMethods.apple : privy.loginMethods.apple,
    socialAuthenticated: authLane === 'titan-managed' ? managedAuth.authenticated : privy.authenticated,
    socialUserName: authLane === 'titan-managed' ? managedAuth.userName : null,
    socialUserEmail: authLane === 'titan-managed' ? managedAuth.userEmail : null,
    socialProviderLabel: authLane === 'titan-managed' ? managedAuth.label : 'Privy',
    managedWalletReady: authLane === 'titan-managed' ? managedAuth.managedWalletReady : true,
    managedWalletMessage: authLane === 'titan-managed' ? managedAuth.managedWalletMessage : '',
    managedWalletSession: authLane === 'titan-managed' ? managedAuth.linkedWallet : null,
    socialProviderErrors: authLane === 'titan-managed' ? managedAuth.errors : [],
    createWallet,
    linkWalletToGoogle,
    restoreWalletFromGoogle,
    importWallet,
    loginWithGoogle: authLane === 'titan-managed' ? managedAuth.loginWithGoogle : privy.loginWithGoogle,
    loginWithApple: authLane === 'titan-managed' ? noopUnsupportedSocialLogin : privy.loginWithApple,
    exportManagedWallet: walletSource === 'privy' ? privy.exportWallet : noopUnsupportedManagedExport,
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

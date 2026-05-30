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
  const privy = usePrivyWalletBridge();

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
    hasSocialLogin: privy.enabled,
    privyReady: privy.ready,
    socialConfigReady: privy.loginMethods.loaded,
    googleLoginEnabled: privy.loginMethods.google,
    appleLoginEnabled: privy.loginMethods.apple,
    createWallet,
    importWallet,
    loginWithGoogle: privy.loginWithGoogle,
    loginWithApple: privy.loginWithApple,
    exportManagedWallet: privy.exportWallet,
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

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
  const address = useWalletStore((state) => state.address);
  const isConnected = useWalletStore((state) => state.isConnected);
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const privateKey = useWalletStore((state) => state.privateKey);
  const walletName = useWalletStore((state) => state.walletName);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);

  function createWallet(name?: string) {
    const wallet = createNewWallet();
    connect({
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      privateKey: wallet.privateKey,
      walletName: name,
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
    });
    return wallet;
  }

  function getSigner() {
    if (!privateKey) {
      throw new Error('No in-memory wallet is connected.');
    }

    return getWalletFromPrivateKey(privateKey, activeNetwork.rpcUrl);
  }

  async function signTextMessage(message: string) {
    if (!privateKey) {
      throw new Error('No in-memory wallet is connected.');
    }

    return signMessage(message, privateKey);
  }

  async function signTx(transaction: Parameters<typeof signTransaction>[0]) {
    if (!privateKey) {
      throw new Error('No in-memory wallet is connected.');
    }

    return signTransaction(transaction, privateKey, activeNetwork.rpcUrl);
  }

  async function sendNativeAsset(input: { to: string; amount: string }) {
    if (!privateKey) {
      throw new Error('No in-memory wallet is connected.');
    }

    return sendNativeTransaction({
      to: input.to,
      amount: input.amount,
      privateKey,
      rpcUrl: activeNetwork.rpcUrl,
    });
  }

  async function waitForTxReceipt(hash: string, timeoutMs?: number) {
    return waitForTransactionReceipt({
      hash,
      rpcUrl: activeNetwork.rpcUrl,
      timeoutMs,
    });
  }

  return {
    address,
    isConnected,
    mnemonic,
    privateKey,
    walletName,
    activeNetwork,
    createWallet,
    importWallet,
    disconnectWallet: disconnect,
    getSigner,
    signTextMessage,
    signTransaction: signTx,
    sendNativeAsset,
    waitForTxReceipt,
  };
}

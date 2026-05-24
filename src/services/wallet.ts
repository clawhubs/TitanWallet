import { JsonRpcProvider, Wallet, type TransactionRequest, formatEther } from 'ethers';

export interface WalletDetails {
  address: string;
  mnemonic: string;
  privateKey: string;
}

export function createNewWallet(): WalletDetails {
  const wallet = Wallet.createRandom();

  return {
    address: wallet.address,
    mnemonic: wallet.mnemonic?.phrase || '',
    privateKey: wallet.privateKey,
  };
}

export function importFromSecret(secret: string): WalletDetails {
  const normalized = secret.trim();
  const isPhrase = normalized.includes(' ');
  const wallet = isPhrase ? Wallet.fromPhrase(normalized) : new Wallet(normalized);

  return {
    address: wallet.address,
    mnemonic: isPhrase ? normalized : '',
    privateKey: wallet.privateKey,
  };
}

export function getWalletFromPrivateKey(privateKey: string, rpcUrl?: string) {
  const wallet = new Wallet(privateKey);
  if (!rpcUrl) {
    return wallet;
  }

  return wallet.connect(new JsonRpcProvider(rpcUrl));
}

export async function signMessage(message: string, privateKey: string) {
  const wallet = getWalletFromPrivateKey(privateKey);
  return wallet.signMessage(message);
}

export async function signTransaction(transaction: TransactionRequest, privateKey: string, rpcUrl?: string) {
  const wallet = getWalletFromPrivateKey(privateKey, rpcUrl);
  return wallet.signTransaction(transaction);
}

export async function getBalance(address: string, rpcUrl: string) {
  const provider = new JsonRpcProvider(rpcUrl);
  const balance = await provider.getBalance(address);
  return formatEther(balance);
}

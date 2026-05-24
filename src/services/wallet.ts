import { JsonRpcProvider, Wallet, formatEther, parseEther, type TransactionReceipt, type TransactionRequest } from 'ethers';

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

export async function sendNativeTransaction(input: {
  to: string;
  amount: string;
  privateKey: string;
  rpcUrl: string;
}) {
  const provider = new JsonRpcProvider(input.rpcUrl);
  const wallet = new Wallet(input.privateKey, provider);
  const value = parseEther(input.amount || '0');
  const transaction = await wallet.populateTransaction({
    to: input.to,
    value,
  });

  if (!transaction.gasLimit) {
    transaction.gasLimit = await provider.estimateGas({
      from: wallet.address,
      to: input.to,
      value,
    });
  }

  const signedTransaction = await wallet.signTransaction(transaction);
  const response = await provider.broadcastTransaction(signedTransaction);

  return {
    hash: response.hash,
    from: wallet.address,
    to: input.to,
    amount: input.amount,
    signedTransaction,
    nonce: transaction.nonce ?? null,
    chainId: Number(transaction.chainId ?? (await provider.getNetwork()).chainId),
    gasLimit: transaction.gasLimit?.toString() || null,
  };
}

export async function waitForTransactionReceipt(input: {
  hash: string;
  rpcUrl: string;
  confirmations?: number;
  timeoutMs?: number;
}): Promise<TransactionReceipt> {
  const provider = new JsonRpcProvider(input.rpcUrl);
  const receipt = await provider.waitForTransaction(
    input.hash,
    input.confirmations || 1,
    input.timeoutMs || 120000,
  );

  if (!receipt) {
    throw new Error('Transaction receipt did not arrive before the timeout.');
  }

  return receipt;
}

export async function getBalance(address: string, rpcUrl: string) {
  const provider = new JsonRpcProvider(rpcUrl);
  const balance = await provider.getBalance(address);
  return formatEther(balance);
}

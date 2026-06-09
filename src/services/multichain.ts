// Multi-chain wallet generation for TITAN Wallet (Solana + TON).
// Solana: random ed25519 keypair (address = base58 public key, secret = base58 64-byte key).
// TON: standard 24-word TON mnemonic -> WalletContractV4 (v4R2) address.

import { ed25519 } from '@noble/curves/ed25519';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { Mnemonic, getBytes } from 'ethers';
import { getAddressDecoder, getBase58Decoder } from '@solana/kit';

export interface SolanaWallet {
  chain: 'solana';
  address: string;       // base58 public key
  secretKey: string;     // base58-encoded 64-byte secret key (importable into Phantom)
}

export interface TonWallet {
  chain: 'ton';
  address: string;       // user-friendly, non-bounceable, url-safe
  mnemonic: string;      // 24-word TON mnemonic
}

const addressDecoder = getAddressDecoder();
const base58Decoder = getBase58Decoder();

/** Generates a fresh Solana wallet (ed25519 keypair). */
export function generateSolanaWallet(): SolanaWallet {
  const priv = new Uint8Array(32);
  crypto.getRandomValues(priv);
  const pub = ed25519.getPublicKey(priv);
  const secret = new Uint8Array(64);
  secret.set(priv, 0);
  secret.set(pub, 32);
  return {
    chain: 'solana',
    address: addressDecoder.decode(pub),
    secretKey: base58Decoder.decode(secret),
  };
}

/** Generates a fresh TON wallet (v4R2) with a standard 24-word TON mnemonic. */
export async function generateTonWallet(): Promise<TonWallet> {
  // Imported lazily so TON's Buffer-dependent code only loads when used.
  const [{ mnemonicNew, mnemonicToPrivateKey }, { WalletContractV4 }] = await Promise.all([
    import('@ton/crypto'),
    import('@ton/ton'),
  ]);
  const mnemonic = await mnemonicNew(); // 24 words
  const keyPair = await mnemonicToPrivateKey(mnemonic);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  const address = wallet.address.toString({ urlSafe: true, bounceable: false, testOnly: false });
  return {
    chain: 'ton',
    address,
    mnemonic: mnemonic.join(' '),
  };
}

/* ----------- Deterministic derivation from a wallet's BIP39 mnemonic ---------- */
// Lets an existing TITAN wallet expose Solana & TON addresses from the SAME seed
// phrase, so users have one backup across chains.

const ED25519_SEED_KEY = new TextEncoder().encode('ed25519 seed');

/** SLIP-0010 ed25519 derivation (all indices hardened). Returns the 32-byte private seed. */
function slip10Ed25519(seed: Uint8Array, path: number[]): Uint8Array {
  let I = hmac(sha512, ED25519_SEED_KEY, seed);
  let key = I.slice(0, 32);
  let chainCode = I.slice(32);
  for (const index of path) {
    const data = new Uint8Array(1 + 32 + 4);
    data[0] = 0x00;
    data.set(key, 1);
    new DataView(data.buffer).setUint32(33, (index | 0x80000000) >>> 0, false);
    I = hmac(sha512, chainCode, data);
    key = I.slice(0, 32);
    chainCode = I.slice(32);
  }
  return key;
}

function bip39Seed(mnemonic: string): Uint8Array {
  return getBytes(Mnemonic.fromPhrase(mnemonic.trim()).computeSeed());
}

/** Solana address from a BIP39 mnemonic (Phantom path m/44'/501'/0'/0'). */
export function deriveSolanaAddress(mnemonic: string): string {
  const seed = bip39Seed(mnemonic);
  const priv = slip10Ed25519(seed, [44, 501, 0, 0]);
  const pub = ed25519.getPublicKey(priv);
  return addressDecoder.decode(pub);
}

/** TON v4R2 address derived from a BIP39 mnemonic (TON coin type 607). Deterministic within TITAN. */
export async function deriveTonAddress(mnemonic: string): Promise<string> {
  const seed = bip39Seed(mnemonic);
  const priv = slip10Ed25519(seed, [44, 607, 0, 0]);
  const pub = ed25519.getPublicKey(priv);
  const { WalletContractV4 } = await import('@ton/ton');
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: globalThis.Buffer.from(pub) });
  return wallet.address.toString({ urlSafe: true, bounceable: false, testOnly: false });
}

/* ------------------------------ Native balances ----------------------------- */

/** Solana native balance (SOL) via JSON-RPC getBalance. */
export async function getSolanaBalance(addr: string, rpcUrl: string): Promise<string> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [addr] }),
  });
  const json = await res.json();
  const lamports = Number(json?.result?.value ?? 0);
  return (lamports / 1e9).toFixed(6);
}

/** TON native balance via toncenter getAddressBalance (nanoton -> TON). */
export async function getTonBalance(addr: string, rpcBase: string): Promise<string> {
  const url = `${rpcBase.replace(/\/$/, '')}/getAddressBalance?address=${encodeURIComponent(addr)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const json = await res.json();
  const nano = Number(json?.result ?? 0);
  return (nano / 1e9).toFixed(6);
}

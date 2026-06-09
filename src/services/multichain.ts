// Multi-chain wallet generation for TITAN Wallet (Solana + TON).
// Solana: random ed25519 keypair (address = base58 public key, secret = base58 64-byte key).
// TON: standard 24-word TON mnemonic -> WalletContractV4 (v4R2) address.

import { ed25519 } from '@noble/curves/ed25519';
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

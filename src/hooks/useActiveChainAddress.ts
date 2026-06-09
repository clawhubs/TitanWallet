import { useEffect, useState } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { deriveSolanaAddress, deriveTonAddress } from '../services/multichain';
import type { NetworkKind } from '../types';

interface ActiveChainAddress {
  address: string | null;
  kind: NetworkKind;
  deriving: boolean;
  error: string | null;
}

/**
 * Returns the wallet address for the currently-selected network.
 * EVM networks reuse the session address; Solana/TON are derived from the same
 * BIP39 mnemonic so the user keeps a single backup across chains.
 */
export function useActiveChainAddress(): ActiveChainAddress {
  const evmAddress = useWalletStore((state) => state.address);
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const kind = (useNetworkStore((state) => state.activeNetwork.kind) || 'evm') as NetworkKind;

  const [address, setAddress] = useState<string | null>(kind === 'evm' ? evmAddress : null);
  const [deriving, setDeriving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (kind === 'evm') {
      setAddress(evmAddress);
      setError(null);
      setDeriving(false);
      return;
    }

    if (!mnemonic) {
      setAddress(null);
      setError('This account has no recovery phrase, so a Solana/TON address can’t be derived. Create a wallet with a seed phrase to use these networks.');
      return;
    }

    setDeriving(true);
    setError(null);
    const run = async () => {
      try {
        const derived = kind === 'solana'
          ? deriveSolanaAddress(mnemonic)
          : await deriveTonAddress(mnemonic);
        if (!cancelled) setAddress(derived);
      } catch (e) {
        if (!cancelled) {
          setAddress(null);
          setError(e instanceof Error ? e.message : 'Failed to derive address.');
        }
      } finally {
        if (!cancelled) setDeriving(false);
      }
    };
    void run();

    return () => { cancelled = true; };
  }, [kind, evmAddress, mnemonic]);

  return { address, kind, deriving, error };
}

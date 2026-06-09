import { useEffect, useState } from 'react';
import { getBalance } from '../services/wallet';
import { getSolanaBalance, getTonBalance } from '../services/multichain';
import { useWalletStore } from '../store/useWalletStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { useActiveChainAddress } from './useActiveChainAddress';
import { buildNativeMarketPriceRequest, fetchMarketPrices } from '../services/marketPrices';

export function useBalance(pollMs = 15000) {
  const balanceETH = useWalletStore((state) => state.balanceETH);
  const balanceUSD = useWalletStore((state) => state.balanceUSD);
  const setBalance = useWalletStore((state) => state.setBalance);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const { address, kind } = useActiveChainAddress();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      return;
    }

    let disposed = false;

    const refresh = async () => {
      try {
        setIsLoading(true);
        const native = kind === 'solana'
          ? await getSolanaBalance(address, activeNetwork.rpcUrl)
          : kind === 'ton'
            ? await getTonBalance(address, activeNetwork.rpcUrl)
            : await getBalance(address, activeNetwork.rpcUrl);
        if (disposed) {
          return;
        }

        let nativePrice = 0;
        if (!activeNetwork.isTestnet) {
          try {
            const marketPrices = await fetchMarketPrices([buildNativeMarketPriceRequest(activeNetwork)]);
            nativePrice = marketPrices[`${activeNetwork.id}:native`]?.price || 0;
          } catch {
            nativePrice = 0;
          }
        }
        const usd = Number.parseFloat(native || '0') * nativePrice;
        setBalance(native, usd);
        setError(null);
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : 'Failed to load balance.');
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, pollMs);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [address, kind, activeNetwork, pollMs, setBalance]);

  return {
    balanceETH,
    balanceUSD,
    isLoading: address ? isLoading : false,
    error: address ? error : null,
  };
}

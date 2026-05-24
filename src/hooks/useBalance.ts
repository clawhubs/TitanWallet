import { useEffect, useState } from 'react';
import { getBalance } from '../services/wallet';
import { useWalletStore } from '../store/useWalletStore';
import { useNetworkStore } from '../store/useNetworkStore';

const NATIVE_USD_PRICE: Record<string, number> = {
  ETH: 3000,
  OETH: 0.18,
  '0G': 0.18,
  MATIC: 0.75,
  POL: 0.75,
};

export function useBalance(pollMs = 15000) {
  const address = useWalletStore((state) => state.address);
  const balanceETH = useWalletStore((state) => state.balanceETH);
  const balanceUSD = useWalletStore((state) => state.balanceUSD);
  const setBalance = useWalletStore((state) => state.setBalance);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      setError(null);
      return;
    }

    let disposed = false;

    const refresh = async () => {
      try {
        setIsLoading(true);
        const eth = await getBalance(address, activeNetwork.rpcUrl);
        if (disposed) {
          return;
        }

        const nativePrice = activeNetwork.isTestnet ? 0 : NATIVE_USD_PRICE[activeNetwork.symbol] || 0;
        const usd = Number.parseFloat(eth || '0') * nativePrice;
        setBalance(eth, usd);
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
  }, [address, activeNetwork.rpcUrl, activeNetwork.symbol, pollMs, setBalance]);

  return {
    balanceETH,
    balanceUSD,
    isLoading,
    error,
  };
}

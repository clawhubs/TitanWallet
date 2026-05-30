import React from 'react';
import { useWalletStore } from '../../store/useWalletStore';

const TrustBar: React.FC = () => {
  const accountsOpened = useWalletStore((state) => state.accounts.length);
  const walletOpenedValue = accountsOpened > 0 ? accountsOpened.toString() : 'Ready';

  return (
    <div className="w-full border-y border-titan-border bg-[#0A0D14] py-6 px-4">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-12 gap-y-6 animate-fade-in animate-delay-400">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span className="text-white font-mono font-bold text-lg sm:text-xl leading-none">9</span>
          <span className="text-titan-subtext text-[11px] font-semibold uppercase tracking-[0.15em] leading-none">Wallet Security Rails</span>
        </div>
        <div className="hidden sm:block w-px h-6 bg-titan-border" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span className="text-white font-mono font-bold text-lg sm:text-xl leading-none">7</span>
          <span className="text-titan-subtext text-[11px] font-semibold uppercase tracking-[0.15em] leading-none">Networks Supported</span>
        </div>
        <div className="hidden sm:block w-px h-6 bg-titan-border" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span className="text-white font-mono font-bold text-lg sm:text-xl leading-none">{walletOpenedValue}</span>
          <span className="text-titan-subtext text-[11px] font-semibold uppercase tracking-[0.15em] leading-none">Wallets Opened</span>
        </div>
        <div className="hidden sm:block w-px h-6 bg-titan-border" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span className="text-white font-mono font-bold text-lg sm:text-xl leading-none">2m</span>
          <span className="text-titan-subtext text-[11px] font-semibold uppercase tracking-[0.15em] leading-none">Setup Time</span>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;

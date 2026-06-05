'use client';

import { useState } from 'react';
import { Search, ShieldCheck, Lock, Eye, Radar } from 'lucide-react';
import { CHAINS } from '@/data/chains';

export default function HeroSection({ onScan }: { onScan: (address: string) => void }) {
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) onScan(address.trim());
  };

  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(var(--xray-accent-rgb), 0.08) 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--xray-border)] to-transparent" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(var(--xray-subtext) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--xray-border)] bg-[var(--xray-surface)] text-xs font-medium text-[var(--xray-subtext)] mb-6 animate-fade-in opacity-0-start">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--xray-success)] animate-pulse" />
          Real multi-chain scan - no wallet connection needed
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5 animate-slide-up opacity-0-start">
          Know Your Wallet&apos;s{' '}
          <span className="text-gradient-accent">True Health</span>
        </h1>

        <p className="text-base sm:text-lg text-[var(--xray-subtext)] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up opacity-0-start delay-100">
          Paste any EVM wallet address. TITAN X-Ray auto-detects active chains, scans token approvals, scores exposure, and adds Qwen AI guidance when configured.
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto animate-slide-up opacity-0-start delay-200">
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[var(--xray-accent)]/20 via-[var(--xray-accent)]/5 to-[var(--xray-accent)]/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
            <div className="relative flex items-center bg-[var(--xray-surface)] border border-[var(--xray-border)] rounded-2xl overflow-hidden transition-all duration-200 group-focus-within:border-[var(--xray-accent)]/40"
              style={{ boxShadow: 'var(--xray-shadow-md)' }}>
              <div className="pl-5 pr-2 text-[var(--xray-tertiary)]">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Paste wallet address (0x...)"
                className="flex-1 px-2 py-4.5 bg-transparent text-[var(--xray-text)] placeholder:text-[var(--xray-tertiary)] font-mono text-sm focus:outline-none"
                id="wallet-address-input"
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="submit"
                className="mr-2 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-semibold text-sm rounded-xl hover:brightness-110 transition-all duration-150 active:scale-[0.97] shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!address.trim()}
                id="scan-button"
              >
                <Radar size={15} />
                Detect
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 animate-fade-in opacity-0-start delay-400">
          {[
            { icon: <Eye size={14} />, text: 'Read-only RPC + explorer data' },
            { icon: <Lock size={14} />, text: 'No signatures or keys' },
            { icon: <ShieldCheck size={14} />, text: 'Qwen AI risk narrative' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-[var(--xray-subtext)]">
              <span className="text-[var(--xray-accent)]">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-12 animate-fade-in opacity-0-start delay-500">
          {[
            { value: 'Live', label: 'RPC Detection' },
            { value: 'Qwen', label: 'AI Analysis' },
            { value: `${CHAINS.filter((chain) => chain.rpcUrl).length}`, label: 'Fast RPC Chains' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-[var(--xray-text)]">{stat.value}</div>
              <div className="text-[11px] font-medium text-[var(--xray-subtext)] uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
        <div className="absolute inset-0 xray-hero-aurora opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--xray-border)] to-transparent" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(var(--xray-subtext) 1px, transparent 1px), linear-gradient(90deg, var(--xray-subtext) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 40%, transparent 100%)' }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full xray-eyebrow text-xs font-medium text-[var(--xray-text)] mb-6 animate-fade-in opacity-0-start">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--xray-success)] animate-pulse" />
          Real multi-chain scan · no wallet connection needed
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-[4.25rem] font-extrabold tracking-tight leading-[1.05] mb-5 animate-slide-up opacity-0-start">
          Know Your Wallet&apos;s{' '}
          <span className="text-gradient-accent">True Health</span>
        </h1>

        <p className="text-base sm:text-lg text-[var(--xray-subtext)] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up opacity-0-start delay-100">
          Paste any EVM wallet address. TITAN X-Ray auto-detects active chains, scans token approvals, scores exposure, and adds Qwen AI guidance when configured.
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto animate-slide-up opacity-0-start delay-200">
          <div className="relative flex items-center gap-2 p-2 rounded-2xl xray-search">
            <div className="flex flex-1 items-center rounded-xl xray-search-field pl-4 pr-2">
              <span className="text-[var(--xray-accent)]">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Paste wallet address (0x...)"
                className="flex-1 px-3 py-3.5 bg-transparent text-[var(--xray-text)] placeholder:text-[var(--xray-tertiary)] font-mono text-sm focus:outline-none"
                id="wallet-address-input"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-semibold text-sm rounded-xl hover:brightness-110 transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ boxShadow: '0 6px 18px -6px rgba(var(--xray-accent-rgb), 0.7)' }}
              disabled={!address.trim()}
              id="scan-button"
            >
              <Radar size={15} />
              Detect
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-8 animate-fade-in opacity-0-start delay-400">
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

        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto mt-12 animate-fade-in opacity-0-start delay-500">
          {[
            { value: 'Live', label: 'RPC Detection' },
            { value: 'Qwen3.7', badge: 'MAX', label: 'AI Analysis', featured: true },
            { value: `${CHAINS.filter((chain) => chain.rpcUrl).length}`, label: 'Fast RPC Chains' },
          ].map((stat, i) => (
            <div key={i} className={`xray-card px-3 py-4 text-center ${stat.featured ? 'xray-stat-featured' : ''}`}>
              <div className="flex flex-wrap items-center justify-center gap-1 leading-none">
                <span className="text-xl sm:text-2xl font-extrabold text-gradient-accent whitespace-nowrap">{stat.value}</span>
                {stat.badge && (
                  <span
                    className="text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-md bg-[rgba(78,205,196,0.18)] text-[var(--xray-accent)]"
                    style={{ WebkitTextFillColor: 'var(--xray-accent)' }}
                  >
                    {stat.badge}
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-[var(--xray-subtext)] uppercase tracking-wider mt-1.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

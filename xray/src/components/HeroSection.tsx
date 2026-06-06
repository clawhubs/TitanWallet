'use client';

import { useRef, useState } from 'react';
import { Search, ShieldCheck, Lock, Eye, Radar, Upload, Link2, Sparkles, Loader2 } from 'lucide-react';
import { CHAINS } from '@/data/chains';
import { readContractFile } from '@/lib/readContractFile';
import type { AuditInput } from './ContractAuditView';

const NETWORK_CHIPS = CHAINS.filter((chain) => chain.category === 'popular').slice(0, 8);
const RPC_CHAIN_COUNT = CHAINS.filter((chain) => chain.rpcUrl).length;

export default function HeroSection({ onScan, onAudit }: { onScan: (address: string) => void; onAudit: (input: AuditInput) => void }) {
  const [address, setAddress] = useState('');
  const [showGithub, setShowGithub] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) onScan(address.trim());
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');
    setReading(true);
    try {
      const { name, source } = await readContractFile(file);
      if (!source.trim()) throw new Error('File is empty.');
      onAudit({ source, sourceName: name });
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Could not read file.');
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submitGithub = (e: React.FormEvent) => {
    e.preventDefault();
    if (githubUrl.trim()) onAudit({ githubUrl: githubUrl.trim() });
  };

  return (
    <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(var(--xray-subtext) 1px, transparent 1px), linear-gradient(90deg, var(--xray-subtext) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, #000 35%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, #000 35%, transparent 100%)' }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full xray-eyebrow text-xs font-medium text-[var(--xray-text)] mb-7 animate-fade-in opacity-0-start">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--xray-success)] animate-pulse" />
          Real multi-chain scan · powered by Qwen AI
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.04] mb-5 animate-slide-up opacity-0-start">
          Defend Your Wallet with{' '}
          <span className="text-gradient-accent">AI</span>
        </h1>

        <p className="text-base sm:text-lg text-[var(--xray-subtext)] max-w-2xl mx-auto mb-9 leading-relaxed animate-slide-up opacity-0-start delay-100">
          Paste any EVM wallet address for a read-only health scan. TITAN X-Ray auto-detects active chains, surfaces risky token approvals, and adds Qwen AI guidance — in seconds.
        </p>

        {/* Scan bar — segmented pill */}
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto animate-slide-up opacity-0-start delay-200">
          <div className="relative flex items-center gap-2 p-1.5 rounded-2xl xray-search">
            <div className="hidden sm:flex items-center gap-2 pl-3 pr-3 py-2.5 text-sm font-semibold text-[var(--xray-subtext)] border-r border-[var(--xray-card-border)] whitespace-nowrap">
              <Radar size={16} className="text-[var(--xray-accent)]" />
              Auto-detect
            </div>
            <div className="flex flex-1 items-center pl-3 sm:pl-1 min-w-0">
              <Search size={18} className="text-[var(--xray-accent)] sm:hidden" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter wallet address (0x...)"
                className="flex-1 min-w-0 px-3 py-3 bg-transparent text-[var(--xray-text)] placeholder:text-[var(--xray-tertiary)] font-mono text-sm focus:outline-none"
                id="wallet-address-input"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-bold text-sm rounded-xl hover:brightness-110 transition-all duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ boxShadow: '0 6px 18px -6px rgba(var(--xray-accent-rgb), 0.7)' }}
              disabled={!address.trim()}
              id="scan-button"
            >
              <Radar size={15} />
              <span className="hidden sm:inline">Start Scan</span>
              <span className="sm:hidden">Scan</span>
            </button>
          </div>
        </form>

        {/* OR divider */}
        <div className="flex items-center justify-center gap-4 my-6 max-w-xs mx-auto animate-fade-in opacity-0-start delay-300">
          <span className="h-px flex-1 bg-[var(--xray-border)]" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--xray-tertiary)]">or</span>
          <span className="h-px flex-1 bg-[var(--xray-border)]" />
        </div>

        {/* Contract audit entry points */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in opacity-0-start delay-300">
          <input ref={fileRef} type="file" accept=".sol,.txt,.zip" className="hidden" onChange={handleFile} id="contract-file-input" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={reading}
            className="group relative flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--xray-card-border)] text-sm font-semibold text-[var(--xray-text)] hover:border-[var(--xray-accent)]/40 hover:text-[var(--xray-accent)] transition-all disabled:opacity-60"
            style={{ background: 'var(--xray-card-gradient)' }}
          >
            <span className="text-[var(--xray-accent)]">{reading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}</span>
            {reading ? 'Reading…' : 'Upload File (.sol/.zip)'}
          </button>
          <button
            type="button"
            onClick={() => setShowGithub((v) => !v)}
            className="group relative flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--xray-card-border)] text-sm font-semibold text-[var(--xray-text)] hover:border-[var(--xray-accent)]/40 hover:text-[var(--xray-accent)] transition-all"
            style={{ background: 'var(--xray-card-gradient)' }}
          >
            <span className="text-[var(--xray-accent)]"><Link2 size={15} /></span>
            Import GitHub Link
          </button>
        </div>

        {fileError && <p className="mt-3 text-xs text-[var(--xray-danger)]">{fileError}</p>}

        {showGithub && (
          <form onSubmit={submitGithub} className="mt-4 max-w-xl mx-auto flex items-center gap-2 p-1.5 rounded-2xl xray-search animate-slide-down">
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/blob/main/Contract.sol"
              className="flex-1 min-w-0 px-3 py-3 bg-transparent text-[var(--xray-text)] placeholder:text-[var(--xray-tertiary)] font-mono text-xs sm:text-sm focus:outline-none"
              id="github-url-input"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="submit"
              disabled={!githubUrl.trim()}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-bold text-sm rounded-xl hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-40 shrink-0"
            >
              Audit
            </button>
          </form>
        )}

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-9 animate-fade-in opacity-0-start delay-400">
          {[
            { icon: <Eye size={14} />, text: 'Read-only, no connection' },
            { icon: <Lock size={14} />, text: 'No signatures or keys' },
            { icon: <ShieldCheck size={14} />, text: 'Known-drainer detection' },
            { icon: <Sparkles size={14} />, text: 'Qwen AI narrative' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-[var(--xray-subtext)]">
              <span className="text-[var(--xray-accent)]">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 mt-14 animate-fade-in opacity-0-start delay-500">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { value: `${RPC_CHAIN_COUNT}+`, label: 'Fast RPC Chains' },
            { value: 'Qwen3.7', badge: 'MAX', label: 'AI Engine', featured: true },
            { value: 'Live', label: 'Risk Engine' },
            { value: '0', label: 'Keys Needed' },
          ].map((stat, i) => (
            <div key={i} className={`xray-card px-3 py-5 text-center ${stat.featured ? 'xray-stat-featured' : ''}`}>
              <div className="flex flex-wrap items-center justify-center gap-1 leading-none">
                <span className="text-2xl sm:text-3xl font-extrabold text-gradient-accent whitespace-nowrap">{stat.value}</span>
                {stat.badge && (
                  <span className="text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-md bg-[rgba(78,205,196,0.18)] text-[var(--xray-accent)]" style={{ WebkitTextFillColor: 'var(--xray-accent)' }}>
                    {stat.badge}
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-[var(--xray-subtext)] uppercase tracking-wider mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported networks */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 mt-12 text-center animate-fade-in opacity-0-start delay-600">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--xray-tertiary)] mb-4">Supported Networks</div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {NETWORK_CHIPS.map((chain) => (
            <span key={chain.chainId} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--xray-card-border)] bg-[var(--xray-card-gradient)] text-xs font-semibold text-[var(--xray-text)]" style={{ background: 'var(--xray-card-gradient)' }}>
              <span className="grid place-items-center w-4 h-4 rounded-full text-[9px]" style={{ color: chain.color }}>{chain.icon}</span>
              {chain.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { Radar, ArrowRight, Compass, ShieldCheck, Rocket } from 'lucide-react';

const STATS = [
  { value: 'Live', label: 'Opportunity Feed' },
  { value: '6', label: 'Sources Monitored' },
  { value: 'GLM-4.7', label: 'AI Engine', featured: true },
  { value: 'GoPlus', label: 'Security Layer' },
];

const FLOW = [
  { icon: <Compass size={15} />, label: 'Discover', note: 'Titan Alpha' },
  { icon: <ShieldCheck size={15} />, label: 'Verify', note: 'Titan X-Ray' },
  { icon: <Rocket size={15} />, label: 'Execute', note: 'TitanWallet' },
];

export default function AlphaHero() {
  return (
    <section className="relative pt-32 pb-12 sm:pt-40 sm:pb-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 xray-hero-aurora opacity-70" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(var(--xray-subtext) 1px, transparent 1px), linear-gradient(90deg, var(--xray-subtext) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, #000 35%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, #000 35%, transparent 100%)' }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full xray-eyebrow text-xs font-medium text-[var(--xray-text)] mb-7 animate-fade-in opacity-0-start">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--xray-success)] animate-pulse" />
          AI-powered Web3 intelligence · live now
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-[4.25rem] font-extrabold tracking-tight leading-[1.05] mb-5 animate-slide-up opacity-0-start">
          Discover Alpha
          <br />
          <span className="text-gradient-accent">Before Everyone Else</span>
        </h1>

        <p className="text-base sm:text-lg text-[var(--xray-subtext)] max-w-2xl mx-auto mb-9 leading-relaxed animate-slide-up opacity-0-start delay-100">
          AI continuously monitors Web3 ecosystems to discover, verify, score, and explain opportunities — airdrops, testnets, points, and incentive programs — before they become mainstream.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up opacity-0-start delay-200">
          <a href="#feed" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-bold text-sm rounded-xl hover:brightness-110 transition-all active:scale-[0.97]" style={{ boxShadow: '0 6px 18px -6px rgba(var(--xray-accent-rgb), 0.7)' }}>
            <Radar size={15} /> Explore the Alpha Feed
          </a>
          <a href="#submit" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--xray-card-border)] text-[var(--xray-text)] font-semibold text-sm hover:border-[var(--xray-accent)]/30 transition-all" style={{ background: 'var(--xray-card-gradient)' }}>
            Submit an Opportunity <ArrowRight size={15} />
          </a>
        </div>

        {/* Discover -> Verify -> Execute */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-9 animate-fade-in opacity-0-start delay-300">
          {FLOW.map((f, i) => (
            <div key={f.label} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--xray-card-border)]" style={{ background: 'var(--xray-card-gradient)' }}>
                <span className="text-[var(--xray-accent)]">{f.icon}</span>
                <div className="text-left leading-none">
                  <div className="text-xs font-bold text-[var(--xray-text)]">{f.label}</div>
                  <div className="text-[9px] text-[var(--xray-subtext)] mt-0.5">{f.note}</div>
                </div>
              </div>
              {i < FLOW.length - 1 && <ArrowRight size={14} className="text-[var(--xray-tertiary)] shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 mt-12 animate-fade-in opacity-0-start delay-400">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map((s, i) => (
            <div key={i} className={`xray-card px-3 py-5 text-center ${s.featured ? 'xray-stat-featured' : ''}`}>
              <div className="text-xl sm:text-2xl font-extrabold text-gradient-accent whitespace-nowrap">{s.value}</div>
              <div className="text-[10px] sm:text-[11px] font-medium text-[var(--xray-subtext)] uppercase tracking-wider mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { Compass, ShieldCheck, Rocket, Radar, Brain, Lock } from 'lucide-react';

const STATS = [
  { value: 'Live', label: 'Opportunity Feed' },
  { value: 'Pre-token', label: 'Airdrop Focus' },
  { value: 'GLM-4.7', label: 'AI Engine', featured: true },
  { value: 'On-chain', label: 'Live Data' },
];

const FLOW = [
  { icon: <Compass size={18} />, label: 'Discover', note: 'Titan Alpha', desc: 'AI finds pre-token protocols with airdrop potential.' },
  { icon: <ShieldCheck size={18} />, label: 'Verify', note: 'Titan X-Ray', desc: 'Check contracts and approvals for safety before you interact.' },
  { icon: <Rocket size={18} />, label: 'Execute', note: 'TitanWallet', desc: 'Farm and claim with a non-custodial, security-first wallet.' },
];

const WHY = [
  { icon: <Radar size={16} />, title: 'Always-on discovery', desc: 'Continuously ranks live protocols that have not launched a token yet.' },
  { icon: <Brain size={16} />, title: 'AI scoring & narrative', desc: 'GLM-4.7 explains why each opportunity matters, with risks and actions.' },
  { icon: <Lock size={16} />, title: 'Security-first', desc: 'Built into the Titan ecosystem so you can verify before you act.' },
];

export default function AlphaAbout() {
  return (
    <section className="py-16 sm:py-20 relative border-t border-[var(--xray-border)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full xray-eyebrow text-[10px] font-semibold text-[var(--xray-accent)] uppercase tracking-widest mb-4">
            How Titan Alpha works
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--xray-text)] tracking-tight">
            Discover → Verify → Execute
          </h2>
          <p className="mt-3 text-sm text-[var(--xray-subtext)] max-w-xl mx-auto leading-relaxed">
            Titan Alpha is the intelligence layer of the Titan ecosystem — connected to Titan X-Ray for security and TitanWallet for execution.
          </p>
        </div>

        {/* Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {FLOW.map((f) => (
            <div key={f.label} className="xray-card p-5">
              <div className="w-10 h-10 rounded-xl xray-icon-tile flex items-center justify-center mb-3 text-[var(--xray-accent)]">{f.icon}</div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-base font-bold text-[var(--xray-text)]">{f.label}</h3>
                <span className="text-[11px] font-semibold text-[var(--xray-accent)]">{f.note}</span>
              </div>
              <p className="mt-1.5 text-sm text-[var(--xray-subtext)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Why */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {WHY.map((w) => (
            <div key={w.title} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg xray-icon-tile flex items-center justify-center shrink-0 text-[var(--xray-accent)]">{w.icon}</div>
              <div>
                <h4 className="text-sm font-bold text-[var(--xray-text)]">{w.title}</h4>
                <p className="text-xs text-[var(--xray-subtext)] leading-relaxed mt-0.5">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
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

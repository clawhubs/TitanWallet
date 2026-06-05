'use client';

import { Shield, Eye, Zap, Brain, FileSearch, Lock } from 'lucide-react';

const FEATURES = [
  {
    icon: <Eye size={22} />,
    title: 'Read-Only Scan',
    desc: 'Paste any wallet address. We scan on-chain data without ever asking for your private keys or wallet connection.',
  },
  {
    icon: <FileSearch size={22} />,
    title: 'Deep Approval Analysis',
    desc: 'Detect unlimited token approvals, setApprovalForAll, and permissions granted to unverified or flagged contracts.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Known Drainer Detection',
    desc: 'Cross-reference every spender against a curated database of known drainer contracts and scam addresses.',
  },
  {
    icon: <Zap size={22} />,
    title: 'One-Click Revoke',
    desc: 'Revoke dangerous approvals directly from your wallet. Batch multiple revokes to save on gas fees.',
  },
  {
    icon: <Brain size={22} />,
    title: 'AI Security Advisor',
    desc: 'Get accurate, jargon-free explanations of every finding. Our AI never exaggerates — only real data, real risks.',
  },
  {
    icon: <Lock size={22} />,
    title: 'Privacy First',
    desc: 'We don\'t store, sell, or share your wallet address. No tracking, no accounts required. Just security.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--xray-border)] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--xray-border)] to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--xray-border)] bg-[var(--xray-surface)] text-[10px] font-semibold text-[var(--xray-accent)] uppercase tracking-widest mb-4">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--xray-text)] tracking-tight">
            Security Without the <span className="text-gradient-accent">Scary Tactics</span>
          </h2>
          <p className="mt-4 text-base text-[var(--xray-subtext)] max-w-xl mx-auto leading-relaxed">
            Honest analysis, transparent findings, and actionable steps — not fear-driven marketing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-[var(--xray-border)] bg-[var(--xray-surface)] hover:border-[var(--xray-accent)]/25 transition-all duration-300 opacity-0-start animate-slide-up"
              style={{ boxShadow: 'var(--xray-shadow-sm)', animationDelay: `${i * 80}ms` }}
            >
              <div className="w-11 h-11 rounded-xl bg-[rgba(78,205,196,0.08)] text-[var(--xray-accent)] flex items-center justify-center mb-4 group-hover:bg-[rgba(78,205,196,0.14)] transition-colors duration-300">
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-[var(--xray-text)] mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--xray-subtext)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

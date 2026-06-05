'use client';

import { Search, Shield, FileCheck, Zap } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: <Search size={20} />,
    title: 'Paste Your Address',
    desc: 'Enter any wallet address. No wallet connection, no sign-in. Completely read-only.',
  },
  {
    num: '02',
    icon: <FileCheck size={20} />,
    title: 'Instant Analysis',
    desc: 'We scan all token approvals, check against known drainers, and calculate your exposure in seconds.',
  },
  {
    num: '03',
    icon: <Shield size={20} />,
    title: 'Review Findings',
    desc: 'See your health score, risk-tagged approvals, and plain-language explanations of each finding.',
  },
  {
    num: '04',
    icon: <Zap size={20} />,
    title: 'Take Action',
    desc: 'Revoke risky approvals with one click. Batch operations available. You control everything.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full xray-eyebrow text-[10px] font-semibold text-[var(--xray-accent)] uppercase tracking-widest mb-4">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--xray-text)] tracking-tight">
            Four Steps to a <span className="text-gradient-accent">Safer Wallet</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={i} className="relative group opacity-0-start animate-slide-up" style={{ animationDelay: `${i * 120}ms` }}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-9 left-full h-px bg-gradient-to-r from-[var(--xray-accent)]/50 via-[var(--xray-accent)]/20 to-transparent z-0" style={{ width: 'calc(100% - 1.5rem)' }} />
              )}

              <div className="relative p-6 xray-card xray-card-interactive overflow-hidden">
                {/* Oversized ghost number for depth */}
                <span className="absolute -top-3 -right-1 text-7xl font-black leading-none text-[var(--xray-accent)]/[0.07] select-none pointer-events-none">{step.num}</span>
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl xray-icon-tile text-[var(--xray-accent)] flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-[var(--xray-accent)] tracking-[0.2em] uppercase">Step {step.num}</span>
                </div>
                <h3 className="relative text-base font-bold text-[var(--xray-text)] mb-2 tracking-tight">{step.title}</h3>
                <p className="relative text-sm text-[var(--xray-subtext)] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

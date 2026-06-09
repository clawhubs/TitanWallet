'use client';

import { useState } from 'react';
import { ShieldCheck, TrendingUp, Sparkles, ArrowUpRight, Coins } from 'lucide-react';
import type { Opportunity } from '@/lib/types';

const riskStyle: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: 'var(--xray-success)', bg: 'rgba(62,189,122,0.1)', label: 'Low Risk' },
  medium: { color: 'var(--xray-warning)', bg: 'rgba(212,148,58,0.1)', label: 'Medium Risk' },
  high: { color: 'var(--xray-danger)', bg: 'rgba(224,84,78,0.1)', label: 'High Risk' },
};

function scoreColor(s: number) {
  return s >= 80 ? 'var(--xray-success)' : s >= 55 ? 'var(--xray-warning)' : 'var(--xray-danger)';
}

function Logo({ op }: { op: Opportunity }) {
  const [broken, setBroken] = useState(false);
  if (op.logo && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={op.logo}
        alt={op.name}
        className="w-full h-full object-cover"
        onError={() => setBroken(true)}
      />
    );
  }
  return <span className="text-sm font-bold text-[var(--xray-accent)]">{op.name.slice(0, 2).toUpperCase()}</span>;
}

export default function OpportunityCard({ op, onOpen }: { op: Opportunity; onOpen: (op: Opportunity) => void }) {
  const risk = riskStyle[op.riskLevel] || riskStyle.medium;
  return (
    <button
      onClick={() => onOpen(op)}
      className="group relative p-5 text-left xray-card xray-card-interactive xray-card-accentbar flex flex-col"
    >
      {op.isNew && (
        <span className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--xray-accent)] text-white uppercase tracking-wide">New</span>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-[var(--xray-elevated)] flex items-center justify-center shrink-0 border border-[var(--xray-card-border)]">
          <Logo op={op} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-[var(--xray-text)] truncate">{op.name}</h3>
            <ArrowUpRight size={14} className="text-[var(--xray-tertiary)] group-hover:text-[var(--xray-accent)] transition-colors shrink-0" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--xray-elevated)] text-[var(--xray-subtext)]">{op.ecosystem}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[rgba(78,205,196,0.12)] text-[var(--xray-accent)] uppercase tracking-wide">{op.category}</span>
          </div>
        </div>
      </div>

      {/* Airdrop status */}
      <div className="inline-flex items-center gap-1.5 self-start text-[10px] font-semibold px-2 py-1 rounded-lg mb-3 bg-[rgba(78,205,196,0.1)] text-[var(--xray-accent)]">
        <Coins size={11} /> No token yet · airdrop potential
      </div>

      <p className="text-sm text-[var(--xray-subtext)] leading-relaxed mb-4 line-clamp-3 flex-1">{op.aiSummary}</p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl bg-[var(--xray-bg)]/40 border border-[var(--xray-card-border)] px-3 py-2">
          <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--xray-subtext)] uppercase tracking-wider"><Sparkles size={11} /> AI Score</div>
          <div className="text-xl font-extrabold" style={{ color: scoreColor(op.aiScore) }}>{op.aiScore}</div>
        </div>
        <div className="rounded-xl bg-[var(--xray-bg)]/40 border border-[var(--xray-card-border)] px-3 py-2">
          <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--xray-subtext)] uppercase tracking-wider"><ShieldCheck size={11} /> Security</div>
          <div className="text-xl font-extrabold" style={{ color: scoreColor(op.securityScore) }}>{op.securityScore}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: risk.bg, color: risk.color }}>{risk.label}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--xray-subtext)]">
          <TrendingUp size={12} className="text-[var(--xray-accent)]" /> {op.yieldPotential[0].toUpperCase() + op.yieldPotential.slice(1)} yield
        </span>
      </div>
    </button>
  );
}

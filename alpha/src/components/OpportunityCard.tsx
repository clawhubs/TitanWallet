'use client';

import { useState } from 'react';
import { ShieldCheck, TrendingUp, Sparkles, ArrowUpRight, Coins, Flame, Crown, CheckCircle2 } from 'lucide-react';
import type { Opportunity } from '@/lib/types';

const riskStyle: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: 'var(--xray-success)', bg: 'rgba(62,189,122,0.1)', label: 'Low Risk' },
  medium: { color: 'var(--xray-warning)', bg: 'rgba(212,148,58,0.1)', label: 'Medium Risk' },
  high: { color: 'var(--xray-danger)', bg: 'rgba(224,84,78,0.1)', label: 'High Risk' },
};

function scoreColor(s: number) {
  return s >= 80 ? 'var(--xray-success)' : s >= 55 ? 'var(--xray-warning)' : 'var(--xray-danger)';
}

function statusBadge(op: Opportunity) {
  switch (op.statusKind) {
    case 'claim-live': return { label: 'Claim live', color: 'var(--xray-success)', bg: 'rgba(62,189,122,0.12)' };
    case 'confirmed': return { label: 'Confirmed', color: 'var(--xray-success)', bg: 'rgba(62,189,122,0.1)' };
    case 'ongoing': return { label: 'Ongoing', color: 'var(--xray-accent)', bg: 'rgba(78,205,196,0.1)' };
    default: return { label: 'Potential', color: 'var(--xray-warning)', bg: 'rgba(212,148,58,0.12)' };
  }
}

function Logo({ op }: { op: Opportunity }) {
  const [broken, setBroken] = useState(false);
  if (op.logo && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={op.logo} alt={op.name} className="w-full h-full object-cover" onError={() => setBroken(true)} />
    );
  }
  return <span className="text-sm font-bold text-[var(--xray-accent)]">{op.name.slice(0, 2).toUpperCase()}</span>;
}

export default function OpportunityCard({ op, onOpen, premium }: { op: Opportunity; onOpen: (op: Opportunity) => void; premium?: boolean }) {
  const risk = riskStyle[op.riskLevel] || riskStyle.medium;
  const status = statusBadge(op);
  return (
    <button
      onClick={() => onOpen(op)}
      className="group relative p-5 text-left xray-card xray-card-interactive xray-card-accentbar flex flex-col"
    >
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {premium && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--xray-accent)] text-white uppercase tracking-wide"><Crown size={9} /> Premium</span>
        )}
        {op.isNew && !premium && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--xray-accent)] text-white uppercase tracking-wide">New</span>
        )}
      </div>

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

      {/* Status + popularity */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: status.bg, color: status.color }}>
          {op.statusKind === 'claim-live' || op.statusKind === 'confirmed' ? <CheckCircle2 size={11} /> : <Coins size={11} />} {status.label}
        </span>
        {typeof op.popularity === 'number' && op.popularity > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--xray-subtext)]"><Flame size={11} className="text-[var(--xray-warning)]" /> {op.popularity}°</span>
        )}
      </div>

      <p className="text-sm text-[var(--xray-subtext)] leading-relaxed mb-3 line-clamp-3 flex-1">{op.aiSummary}</p>

      {op.requirements && op.requirements.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {op.requirements.map((r) => (
            <span key={r} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--xray-elevated)] text-[var(--xray-subtext)] uppercase tracking-wide">{r}</span>
          ))}
        </div>
      )}

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
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--xray-tertiary)]">
          <TrendingUp size={11} className="text-[var(--xray-accent)]" /> {op.source}
        </span>
      </div>
    </button>
  );
}

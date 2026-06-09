'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles, Target, AlertTriangle, CheckCircle2, ShieldCheck, ExternalLink, Loader2, Coins, AtSign } from 'lucide-react';
import type { Opportunity } from '@/lib/types';

interface Narrative {
  whyItMatters: string;
  opportunity: string;
  risk: string;
  recommendedAction: string;
  confidence: number;
}

function ModalLogo({ op }: { op: Opportunity }) {
  const [broken, setBroken] = useState(false);
  if (op.logo && !broken) {
    return <img src={op.logo} alt={op.name} className="w-full h-full object-cover" onError={() => setBroken(true)} />; /* eslint-disable-line @next/next/no-img-element */
  }
  return <span className="text-sm font-bold text-[var(--xray-accent)]">{op.name.slice(0, 2).toUpperCase()}</span>;
}

export default function OpportunityModal({ op, onClose }: { op: Opportunity; onClose: () => void }) {
  const [n, setN] = useState<Narrative | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch('/api/opportunity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: op.name, ecosystem: op.ecosystem, category: op.category, aiSummary: op.aiSummary }),
    })
      .then((r) => r.json())
      .then((d) => { if (alive) { setN(d); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [op]);

  const rows = n ? [
    { icon: <Sparkles size={15} />, label: 'Why it matters', text: n.whyItMatters },
    { icon: <Target size={15} />, label: 'Opportunity', text: n.opportunity },
    { icon: <AlertTriangle size={15} />, label: 'Risk', text: n.risk },
  ] : [];

  const steps: string[] = op.statusKind === 'pre-token'
    ? [
        `Open ${op.name} and connect a fresh wallet.`,
        'Use the protocol genuinely — swap, deposit, or provide liquidity.',
        'Stay active over time. Early users are often rewarded if a token launches.',
      ]
    : [
        `Open the official ${op.name} site.`,
        op.requirements && op.requirements.length ? `Complete the tasks (${op.requirements.join(', ')}).` : 'Complete the listed tasks.',
        op.statusKind === 'claim-live' ? 'Claim your reward now while the claim is live.' : 'Stay active until the snapshot / distribution.',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-[var(--xray-surface)] border border-[var(--xray-border)] animate-scale-in" style={{ boxShadow: 'var(--xray-shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-[var(--xray-border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--xray-elevated)] flex items-center justify-center shrink-0">
              <ModalLogo op={op} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-[var(--xray-text)] truncate">{op.name}</h3>
              <p className="text-xs text-[var(--xray-subtext)]">{op.ecosystem} · {op.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--xray-tertiary)] hover:text-[var(--xray-text)] hover:bg-[var(--xray-elevated)]"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[['AI', op.aiScore], ['Security', op.securityScore], ['Confidence', n?.confidence ?? op.narrative.confidence]].map(([k, v]) => (
              <div key={k as string} className="rounded-xl border border-[var(--xray-card-border)] bg-[var(--xray-bg)]/40 px-3 py-2 text-center">
                <div className="text-lg font-extrabold text-gradient-accent">{v as number}</div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--xray-subtext)]">{k as string}</div>
              </div>
            ))}
          </div>

          {/* Airdrop status */}
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
            style={op.statusKind === 'pre-token'
              ? { borderColor: 'rgba(212,148,58,0.3)', background: 'rgba(212,148,58,0.08)' }
              : { borderColor: 'rgba(62,189,122,0.3)', background: 'rgba(62,189,122,0.08)' }}>
            <Coins size={16} className="shrink-0" style={{ color: op.statusKind === 'pre-token' ? 'var(--xray-warning)' : 'var(--xray-success)' }} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--xray-text)]">
                {op.statusKind === 'claim-live' ? 'Claim live now' : op.statusKind === 'pre-token' ? 'Potential airdrop · no token yet' : op.airdropStatus}
              </div>
              <div className="text-[11px] text-[var(--xray-subtext)]">
                {op.statusKind === 'pre-token'
                  ? 'No airdrop confirmed yet — early usage may qualify if a token launches.'
                  : `${op.requirements && op.requirements.length ? `Requires: ${op.requirements.join(', ')}.` : 'Complete the listed tasks.'}`}
              </div>
            </div>
          </div>

          {/* How to participate */}
          <div className="rounded-xl border border-[var(--xray-border)] bg-[var(--xray-bg)]/40 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--xray-accent)] mb-2">
              <CheckCircle2 size={14} /> How to participate
            </div>
            <ol className="space-y-1.5">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--xray-text)] leading-relaxed">
                  <span className="shrink-0 w-4 h-4 mt-0.5 rounded-full bg-[var(--xray-elevated)] text-[10px] font-bold text-[var(--xray-accent)] flex items-center justify-center">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--xray-subtext)]">
              <Loader2 size={16} className="animate-spin text-[var(--xray-accent)]" /> Generating AI analysis…
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.label} className="rounded-xl border border-[var(--xray-border)] bg-[var(--xray-bg)]/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--xray-accent)] mb-1">{r.icon} {r.label}</div>
                  <p className="text-sm text-[var(--xray-text)] leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            {op.url ? (
              <a href={op.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-bold text-sm hover:brightness-110 transition-all">
                {op.statusKind === 'claim-live' ? 'Claim now' : `Go to ${op.name}`} <ExternalLink size={15} />
              </a>
            ) : op.twitter ? (
              <a href={`https://x.com/${op.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-bold text-sm hover:brightness-110 transition-all">
                Follow {op.name} on X <AtSign size={15} />
              </a>
            ) : null}
            <div className="flex gap-2">
              <a href="https://xray.titanwallet.net" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--xray-card-border)] text-[var(--xray-text)] font-semibold text-sm hover:border-[var(--xray-accent)]/30 transition-all" style={{ background: 'var(--xray-card-gradient)' }}>
                <ShieldCheck size={15} /> Verify with X-Ray
              </a>
              {op.twitter && op.url && (
                <a href={`https://x.com/${op.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--xray-card-border)] text-[var(--xray-text)] font-semibold text-sm hover:border-[var(--xray-accent)]/30 transition-all" style={{ background: 'var(--xray-card-gradient)' }} aria-label="Project X account">
                  <AtSign size={14} />
                </a>
              )}
            </div>
          </div>
          <p className="text-[11px] text-[var(--xray-tertiary)] text-center">AI-generated, informational only. Not financial advice.{op.sourceType === 'airdrops.io' ? ' Listing data via airdrops.io.' : ''}</p>
        </div>
      </div>
    </div>
  );
}

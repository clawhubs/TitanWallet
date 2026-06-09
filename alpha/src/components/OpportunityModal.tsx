'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles, Target, AlertTriangle, CheckCircle2, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import type { Opportunity } from '@/lib/types';

interface Narrative {
  whyItMatters: string;
  opportunity: string;
  risk: string;
  recommendedAction: string;
  confidence: number;
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
    { icon: <CheckCircle2 size={15} />, label: 'Recommended action', text: n.recommendedAction },
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-[var(--xray-surface)] border border-[var(--xray-border)] animate-scale-in" style={{ boxShadow: 'var(--xray-shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-[var(--xray-border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--xray-elevated)] flex items-center justify-center shrink-0">
              {op.logo ? <img src={op.logo} alt={op.name} className="w-full h-full object-cover" /> /* eslint-disable-line @next/next/no-img-element */ : <span className="text-sm font-bold text-[var(--xray-accent)]">{op.name.slice(0, 2).toUpperCase()}</span>}
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

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <a href="https://xray.titanwallet.net" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-bold text-sm hover:brightness-110 transition-all">
              <ShieldCheck size={15} /> Verify with X-Ray
            </a>
            {op.url && (
              <a href={op.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--xray-card-border)] text-[var(--xray-text)] font-semibold text-sm hover:border-[var(--xray-accent)]/30 transition-all" style={{ background: 'var(--xray-card-gradient)' }}>
                Website <ExternalLink size={14} />
              </a>
            )}
          </div>
          <p className="text-[11px] text-[var(--xray-tertiary)] text-center">AI-generated, informational only. Not financial advice.</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldAlert, ShieldCheck, FileCode2, AlertTriangle, XCircle, CheckCircle2, Info, ArrowLeft, Sparkles } from 'lucide-react';
import type { ContractAuditResult, ContractFindingSeverity } from '@/types/scanner';

export interface AuditInput {
  source?: string;
  githubUrl?: string;
  sourceName?: string;
}

const sevConfig: Record<ContractFindingSeverity, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  critical: { color: 'var(--xray-danger)', bg: 'rgba(224,84,78,0.10)', label: 'Critical', icon: <XCircle size={14} /> },
  high: { color: 'var(--xray-danger)', bg: 'rgba(224,84,78,0.07)', label: 'High', icon: <AlertTriangle size={14} /> },
  medium: { color: 'var(--xray-warning)', bg: 'rgba(212,148,58,0.08)', label: 'Medium', icon: <AlertTriangle size={14} /> },
  low: { color: 'var(--xray-accent)', bg: 'rgba(78,205,196,0.08)', label: 'Low', icon: <Info size={14} /> },
  info: { color: 'var(--xray-subtext)', bg: 'rgba(120,140,160,0.08)', label: 'Info', icon: <Info size={14} /> },
};

export default function ContractAuditView({ input, onBack }: { input: AuditInput; onBack: () => void }) {
  const [result, setResult] = useState<ContractAuditResult | null>(null);
  const [error, setError] = useState('');
  const started = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch('/api/audit-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Audit failed.');
        setResult(payload as ContractAuditResult);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Audit failed.');
      }
    })();
    return () => { aliveRef.current = false; };
  }, [input]);

  const riskColor = (r: string) => r === 'critical' || r === 'high' ? 'var(--xray-danger)' : r === 'medium' ? 'var(--xray-warning)' : r === 'low' ? 'var(--xray-warning)' : 'var(--xray-success)';

  return (
    <section className="min-h-screen flex flex-col px-4 pt-24 pb-16">
      <div className="my-auto w-full max-w-3xl mx-auto">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-text)]">
          <ArrowLeft size={15} /> Back
        </button>

        {!result && !error && (
          <div className="xray-card p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl xray-icon-tile flex items-center justify-center mb-5">
              <FileCode2 className="text-[var(--xray-accent)]" size={26} />
            </div>
            <h2 className="text-lg font-bold text-[var(--xray-text)]">Auditing contract…</h2>
            <p className="mt-2 text-sm text-[var(--xray-subtext)]">Running static checks and Qwen AI review on the source.</p>
            <div className="mt-6 h-1 max-w-xs mx-auto rounded-full bg-[var(--xray-muted)] overflow-hidden scan-progress-bar">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)]" />
            </div>
          </div>
        )}

        {error && (
          <div className="xray-card p-8 text-center">
            <ShieldAlert className="mx-auto text-[var(--xray-warning)]" size={28} />
            <h2 className="mt-4 font-bold text-[var(--xray-text)]">Could not audit this contract</h2>
            <p className="mt-2 text-sm text-[var(--xray-subtext)] max-w-md mx-auto">{error}</p>
            <button onClick={onBack} className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--xray-accent)] border border-[var(--xray-accent)]/30 hover:bg-[rgba(78,205,196,0.06)]">Try another</button>
          </div>
        )}

        {result && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={15} className="text-[var(--xray-accent)]" />
              <h2 className="text-xl font-bold text-[var(--xray-text)]">Contract Audit</h2>
              <code className="ml-1 text-xs font-mono text-[var(--xray-accent)] truncate max-w-[200px]">{result.sourceName}</code>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[0.7fr_1.3fr] gap-4 mb-6">
              <div className="xray-card p-6 flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-extrabold" style={{ color: riskColor(result.overallRisk) }}>{result.score}</div>
                <div className="text-[10px] font-medium text-[var(--xray-subtext)] uppercase tracking-wider mt-1">/ 100 safety</div>
                <span className="mt-3 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide" style={{ background: `${riskColor(result.overallRisk)}1a`, color: riskColor(result.overallRisk) }}>
                  {result.overallRisk}
                </span>
              </div>
              <div className="xray-card p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--xray-subtext)] mb-2">AI Summary</div>
                <p className="text-sm leading-6 text-[var(--xray-text)]">{result.summary}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-[var(--xray-tertiary)]">
                  <ShieldCheck size={12} className="text-[var(--xray-accent)]" />
                  {result.provider === 'qwen3.7-max' ? `Reviewed by ${result.model}` : 'Static pattern scan'}
                </div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--xray-text)]">Findings</h3>
              <span className="text-xs text-[var(--xray-subtext)]">{result.findings.length} item(s)</span>
            </div>
            <div className="space-y-3">
              {result.findings.map((f, i) => {
                const c = sevConfig[f.severity];
                return (
                  <div key={i} className="xray-card p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold" style={{ background: c.bg, color: c.color }}>
                        {c.icon} {c.label}
                      </span>
                      <span className="text-sm font-semibold text-[var(--xray-text)]">{f.title}</span>
                    </div>
                    <p className="text-sm text-[var(--xray-subtext)] leading-relaxed">{f.detail}</p>
                    {f.recommendation && (
                      <p className="mt-2 flex gap-1.5 text-[13px] text-[var(--xray-subtext)]">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--xray-accent)]" />
                        <span>{f.recommendation}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-center text-[11px] text-[var(--xray-tertiary)] max-w-lg mx-auto leading-relaxed">
              Automated audit for informational purposes only — not a substitute for a professional audit. Always verify findings yourself.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

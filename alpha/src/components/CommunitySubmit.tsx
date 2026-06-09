'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, XCircle, ShieldCheck, Sparkles } from 'lucide-react';
import type { SubmissionResult } from '@/lib/types';

export default function CommunitySubmit() {
  const [form, setForm] = useState({ name: '', website: '', x: '', github: '', description: '', tokenAddress: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setResult(null); setSubmitting(true);
    try {
      const res = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Submission failed.');
      setResult(d as SubmissionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="submit" className="py-20 sm:py-24 relative border-t border-[var(--xray-border)]/60">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full xray-eyebrow text-[10px] font-semibold text-[var(--xray-accent)] uppercase tracking-widest mb-4">
            Community Submission
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--xray-text)] tracking-tight">Found alpha? <span className="text-gradient-accent">Submit it.</span></h2>
          <p className="mt-4 text-base text-[var(--xray-subtext)] leading-relaxed">Every submission runs through AI analysis and an automated security check before review.</p>
        </div>

        {result ? (
          <div className="xray-card p-6 text-center">
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${result.accepted ? 'xray-icon-tile' : 'bg-[rgba(224,84,78,0.12)]'}`}>
              {result.accepted ? <CheckCircle2 className="text-[var(--xray-accent)]" size={26} /> : <XCircle className="text-[var(--xray-danger)]" size={26} />}
            </div>
            <h3 className="text-lg font-bold text-[var(--xray-text)]">{result.accepted ? 'Submitted for review' : 'Not accepted'}</h3>
            <p className="mt-2 text-sm text-[var(--xray-subtext)] max-w-md mx-auto">{result.summary}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[rgba(78,205,196,0.12)] text-[var(--xray-accent)]"><Sparkles size={12} /> AI {result.aiScore}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--xray-elevated)] text-[var(--xray-subtext)]"><ShieldCheck size={12} /> Security {result.securityScore}</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--xray-elevated)] text-[var(--xray-subtext)] uppercase">{result.riskLevel} risk</span>
            </div>
            {result.notes.length > 0 && (
              <ul className="mt-4 text-left text-xs text-[var(--xray-subtext)] space-y-1 max-w-md mx-auto">
                {result.notes.slice(0, 6).map((n, i) => <li key={i}>• {n}</li>)}
              </ul>
            )}
            <button onClick={() => setResult(null)} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--xray-accent)] border border-[var(--xray-accent)]/30 hover:bg-[rgba(78,205,196,0.06)]">Submit another</button>
          </div>
        ) : (
          <form onSubmit={submit} className="xray-card p-6 space-y-4">
            <Field label="Project Name *" value={form.name} onChange={set('name')} placeholder="e.g. Monad" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Website" value={form.website} onChange={set('website')} placeholder="https://" />
              <Field label="X / Twitter" value={form.x} onChange={set('x')} placeholder="@handle" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="GitHub" value={form.github} onChange={set('github')} placeholder="github.com/org" />
              <Field label="Token address (optional)" value={form.tokenAddress} onChange={set('tokenAddress')} placeholder="0x… for security check" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--xray-subtext)] uppercase tracking-wider mb-1.5">Description *</label>
              <textarea value={form.description} onChange={set('description')} rows={4} placeholder="What is the opportunity and why is it alpha?" className="w-full rounded-xl border border-[var(--xray-card-border)] px-3 py-2.5 text-sm text-[var(--xray-text)] placeholder:text-[var(--xray-tertiary)] focus:outline-none focus:border-[var(--xray-accent)]/60" style={{ background: 'var(--xray-input-bg)' }} />
            </div>
            {error && <p className="text-xs text-[var(--xray-danger)]">{error}</p>}
            <button type="submit" disabled={submitting || !form.name.trim() || !form.description.trim()} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-bold text-sm rounded-xl hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? <><Loader2 size={15} className="animate-spin" /> Analyzing…</> : <><Send size={15} /> Submit for AI + Security Review</>}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--xray-subtext)] uppercase tracking-wider mb-1.5">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-xl border border-[var(--xray-card-border)] px-3 py-2.5 text-sm text-[var(--xray-text)] placeholder:text-[var(--xray-tertiary)] focus:outline-none focus:border-[var(--xray-accent)]/60" style={{ background: 'var(--xray-input-bg)' }} />
    </div>
  );
}

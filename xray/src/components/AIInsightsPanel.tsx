'use client';

import { Bot, CheckCircle2, Sparkles } from 'lucide-react';
import type { AIAnalysisResult } from '@/types/scanner';

export default function AIInsightsPanel({ analysis }: { analysis: AIAnalysisResult | null }) {
  return (
    <div className="rounded-2xl border border-[var(--xray-border)] bg-[var(--xray-surface)] p-5" style={{ boxShadow: 'var(--xray-shadow-sm)' }}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--xray-accent)]">
            <Sparkles size={14} /> AI Insights
          </div>
          <h3 className="mt-1 text-lg font-bold text-[var(--xray-text)]">Qwen risk analysis</h3>
        </div>
        <div className="rounded-xl border border-[var(--xray-accent)]/25 bg-[rgba(78,205,196,0.08)] p-2 text-[var(--xray-accent)]">
          <Bot size={18} />
        </div>
      </div>

      {analysis ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[var(--xray-subtext)]">{analysis.summary}</p>
          <div className="rounded-xl border border-[var(--xray-border)] bg-[var(--xray-bg)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--xray-subtext)]">Risk narrative</div>
            <p className="mt-2 text-sm leading-6 text-[var(--xray-text)]">{analysis.riskNarrative}</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--xray-subtext)]">Recommended next steps</div>
            <ul className="mt-2 space-y-2">
              {analysis.recommendations.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-[var(--xray-subtext)]">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[var(--xray-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--xray-border)] px-3 py-1 text-xs text-[var(--xray-subtext)]">Urgency: {analysis.urgencyLevel}</span>
            <span className="rounded-full border border-[var(--xray-accent)]/25 bg-[rgba(78,205,196,0.08)] px-3 py-1 text-xs text-[var(--xray-accent)]">
              Powered by {analysis.provider === 'qwen3.7-max' ? analysis.model : 'rules fallback'}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--xray-border)] p-6 text-sm text-[var(--xray-subtext)]">
          AI analysis is loading after the scan completes.
        </div>
      )}
    </div>
  );
}

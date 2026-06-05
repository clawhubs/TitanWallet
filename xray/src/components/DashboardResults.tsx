'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, ExternalLink, Copy, Info, Wallet } from 'lucide-react';
import AIInsightsPanel from './AIInsightsPanel';
import type { RiskLevel, TokenApproval, XRaySessionResult } from '@/types/scanner';

const riskConfig: Record<RiskLevel, { color: string; bg: string; label: string; icon: ReactNode }> = {
  critical: { color: 'var(--xray-danger)', bg: 'rgba(224,84,78,0.08)', label: 'Critical', icon: <XCircle size={14} /> },
  high: { color: 'var(--xray-danger)', bg: 'rgba(224,84,78,0.06)', label: 'High', icon: <AlertTriangle size={14} /> },
  medium: { color: 'var(--xray-warning)', bg: 'rgba(212,148,58,0.06)', label: 'Medium', icon: <AlertTriangle size={14} /> },
  low: { color: 'var(--xray-success)', bg: 'rgba(62,189,122,0.06)', label: 'Low', icon: <CheckCircle2 size={14} /> },
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--xray-success)' : score >= 50 ? 'var(--xray-warning)' : 'var(--xray-danger)';
  const label = score >= 80 ? 'Healthy' : score >= 50 ? 'Moderate Risk' : 'At Risk';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36 score-ring">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--xray-muted)" strokeWidth="8" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 8px ${color})` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold" style={{ color }}>{score}</span>
          <span className="text-[10px] font-medium text-[var(--xray-subtext)] uppercase tracking-wider">/100</span>
        </div>
      </div>
      <span className="mt-3 text-sm font-semibold" style={{ color }}>{label}</span>
      <span className="text-[11px] text-[var(--xray-subtext)] mt-0.5">Health Score</span>
    </div>
  );
}

function ApprovalRow({ approval, riskLevel, onWhyRisky }: { approval: TokenApproval; riskLevel: RiskLevel; onWhyRisky: (id: string) => void }) {
  const risk = riskConfig[riskLevel];
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--xray-border)] bg-[var(--xray-surface)] transition-all duration-200 hover:border-[var(--xray-accent)]/20"
      style={{ boxShadow: 'var(--xray-shadow-sm)' }}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: risk.bg, color: risk.color }}>
          {approval.tokenSymbol.slice(0, 4)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--xray-text)]">{approval.tokenSymbol}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[var(--xray-elevated)] text-[var(--xray-subtext)]">{approval.type}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[var(--xray-elevated)] text-[var(--xray-subtext)]">{approval.chainName}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-[var(--xray-subtext)] truncate max-w-[240px] font-mono">{approval.spenderLabel}</span>
            {approval.isVerified && <CheckCircle2 size={11} className="text-[var(--xray-success)] shrink-0" />}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right">
          <div className={`text-xs font-semibold ${approval.allowance.includes('Unlimited') || approval.allowance.includes('ApprovalForAll') ? 'text-[var(--xray-warning)]' : 'text-[var(--xray-subtext)]'}`}>
            {approval.allowance}
          </div>
          <a href={approval.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--xray-accent)] hover:underline">
            Explorer
          </a>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: risk.bg, color: risk.color }}>
          {risk.icon} {risk.label}
        </div>

        <button onClick={() => onWhyRisky(approval.id)}
          className="p-1.5 rounded-lg text-[var(--xray-tertiary)] hover:text-[var(--xray-accent)] hover:bg-[var(--xray-elevated)] transition-all" title="Why is this risky?">
          <Info size={15} />
        </button>
      </div>
    </div>
  );
}

export default function DashboardResults({ result, onReset }: { result: XRaySessionResult; onReset: () => void }) {
  const [showAll, setShowAll] = useState(false);
  const [whyRiskyId, setWhyRiskyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const chainResults = Object.values(result.scan.results);
  const [activeChain, setActiveChain] = useState<string>(chainResults[0] ? String(chainResults[0].chain.chainId) : 'all');

  const activeResults = activeChain === 'all' ? chainResults : chainResults.filter((chain) => String(chain.chain.chainId) === activeChain);
  const approvals = activeResults.flatMap((chain) => chain.approvals);
  const risks = activeResults.flatMap((chain) => chain.riskAssessments);
  const displayedApprovals = showAll ? approvals : approvals.slice(0, 5);
  const criticalCount = risks.filter((risk) => risk.riskLevel === 'critical' || risk.riskLevel === 'high').length;
  const unlimitedCount = approvals.filter((approval) => approval.allowance.includes('Unlimited') || approval.allowance.includes('ApprovalForAll')).length;
  const warnings = activeResults.flatMap((chain) => chain.warnings);
  const offchainOnly = activeResults.length > 0 && activeResults.every((chain) => chain.chain.approvalScanMode === 'offchain');
  const shortAddr = result.address.length > 16 ? `${result.address.slice(0, 10)}...${result.address.slice(-8)}` : result.address;
  const activeScore = activeResults.length
    ? Math.round(activeResults.reduce((sum, chain) => sum + chain.healthScore, 0) / activeResults.length)
    : result.scan.overallScore;

  const riskByApproval = useMemo(() => Object.fromEntries(risks.map((risk) => [risk.approvalId, risk])), [risks]);
  const whyRisk = whyRiskyId ? riskByApproval[whyRiskyId] : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(result.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-[var(--xray-text)]">Scan Results</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <code className="text-sm font-mono text-[var(--xray-accent)]">{shortAddr}</code>
              <button onClick={handleCopy} className="p-1 rounded text-[var(--xray-tertiary)] hover:text-[var(--xray-accent)] transition-colors">
                <Copy size={13} />
              </button>
              {copied && <span className="text-[10px] text-[var(--xray-success)]">Copied!</span>}
              <span className="text-xs text-[var(--xray-tertiary)]">· {chainResults.length} chain(s)</span>
            </div>
          </div>
          <button onClick={onReset} className="text-sm font-medium text-[var(--xray-subtext)] hover:text-[var(--xray-text)] px-4 py-2 rounded-xl border border-[var(--xray-border)] hover:border-[var(--xray-accent)]/30 transition-all">
            ← Scan Another
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveChain('all')} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${activeChain === 'all' ? 'border-[var(--xray-accent)]/40 bg-[rgba(78,205,196,0.08)] text-[var(--xray-accent)]' : 'border-[var(--xray-border)] text-[var(--xray-subtext)]'}`}>
            All chains
          </button>
          {chainResults.map((chain) => (
            <button key={chain.chain.chainId} onClick={() => setActiveChain(String(chain.chain.chainId))} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${activeChain === String(chain.chain.chainId) ? 'border-[var(--xray-accent)]/40 bg-[rgba(78,205,196,0.08)] text-[var(--xray-accent)]' : 'border-[var(--xray-border)] text-[var(--xray-subtext)]'}`}>
              {chain.chain.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-6 rounded-2xl border border-[var(--xray-border)] bg-[var(--xray-surface)] animate-slide-up opacity-0-start" style={{ boxShadow: 'var(--xray-shadow-md)' }}>
              <ScoreRing score={activeScore} />
            </div>

            <div className="p-5 rounded-2xl border border-[var(--xray-border)] bg-[var(--xray-surface)] animate-slide-up opacity-0-start delay-100" style={{ boxShadow: 'var(--xray-shadow-sm)' }}>
              <div className="text-xs font-medium text-[var(--xray-subtext)] uppercase tracking-wider mb-3">Summary</div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center"><span className="text-sm text-[var(--xray-subtext)]">Approvals</span><span className="text-sm font-bold text-[var(--xray-text)]">{approvals.length}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-[var(--xray-subtext)]">Unlimited</span><span className="text-sm font-bold text-[var(--xray-warning)]">{unlimitedCount}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-[var(--xray-subtext)]">High / Critical</span><span className="text-sm font-bold text-[var(--xray-danger)]">{criticalCount}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-[var(--xray-subtext)]">Scan time</span><span className="text-sm font-bold text-[var(--xray-text)]">{result.scan.scanDurationMs}ms</span></div>
              </div>
            </div>
          </div>

          <AIInsightsPanel analysis={result.ai} />
        </div>

        {warnings.length ? (
          <div className="mb-6 rounded-2xl border border-[rgba(212,148,58,0.25)] bg-[rgba(212,148,58,0.06)] p-4 text-sm leading-6 text-[var(--xray-warning)]">
            {warnings.slice(0, 3).map((warning) => <div key={warning}>• {warning}</div>)}
          </div>
        ) : null}

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--xray-text)]">Active Approvals</h3>
          <span className="text-xs font-medium text-[var(--xray-subtext)]">{approvals.length} found</span>
        </div>

        {approvals.length ? (
          <>
            <div className="space-y-3">
              {displayedApprovals.map((approval) => (
                <ApprovalRow key={approval.id} approval={approval} riskLevel={riskByApproval[approval.id]?.riskLevel || 'low'} onWhyRisky={setWhyRiskyId} />
              ))}
            </div>

            {approvals.length > 5 && (
              <button onClick={() => setShowAll(!showAll)} className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-[var(--xray-accent)] hover:bg-[rgba(78,205,196,0.06)] rounded-xl transition-all">
                {showAll ? <><ChevronUp size={16} /> Show Less</> : <><ChevronDown size={16} /> Show All ({approvals.length})</>}
              </button>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--xray-border)] p-8 text-center">
            <CheckCircle2 className="mx-auto text-[var(--xray-success)]" />
            <h3 className="mt-4 font-bold text-[var(--xray-text)]">No active approvals found</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--xray-subtext)]">
              {offchainOnly
                ? '0G uses TITAN off-chain visibility for this report. No block explorer approval API is required for this result.'
                : 'This scan did not find approval logs on the selected chains. If explorer API access is limited, connect explorer API keys in env and rescan for deeper coverage.'}
            </p>
          </div>
        )}

        {whyRiskyId && whyRisk && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={() => setWhyRiskyId(null)}>
            <div className="w-full max-w-md mx-4 p-6 rounded-2xl bg-[var(--xray-surface)] border border-[var(--xray-border)] animate-scale-in" style={{ boxShadow: 'var(--xray-shadow-lg)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-4">
                <Info size={18} className="text-[var(--xray-accent)]" />
                <h4 className="text-base font-bold text-[var(--xray-text)]">Why is this risky?</h4>
              </div>
              <div className="text-sm text-[var(--xray-subtext)] leading-relaxed space-y-3">
                <ul className="space-y-2 text-sm">
                  {whyRisk.reasons.map((reason) => (
                    <li key={reason} className="flex gap-2"><AlertTriangle size={14} className="text-[var(--xray-warning)] shrink-0 mt-0.5" /> <span>{reason}</span></li>
                  ))}
                </ul>
                <p className="text-[11px] text-[var(--xray-tertiary)] pt-2 border-t border-[var(--xray-border)]">
                  This is informational, not financial advice. Review the contract yourself before acting.
                </p>
              </div>
              <button onClick={() => setWhyRiskyId(null)} className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-[var(--xray-accent)] border border-[var(--xray-accent)]/30 hover:bg-[rgba(78,205,196,0.06)] transition-all">
                Got it
              </button>
            </div>
          </div>
        )}

        <div className="mt-12 p-6 rounded-2xl border border-[var(--xray-accent)]/20 bg-gradient-to-br from-[rgba(78,205,196,0.04)] to-transparent animate-fade-in" style={{ boxShadow: '0 0 40px rgba(78,205,196,0.04)' }}>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--xray-accent)] to-[var(--xray-accent-dark)] flex items-center justify-center shadow-lg">
              <Wallet size={24} className="text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-base font-bold text-[var(--xray-text)]">Upgrade to TitanWallet</h4>
              <p className="text-sm text-[var(--xray-subtext)] mt-1">9-layer security rails, Google-linked sessions, and built-in approval review.</p>
            </div>
            <a href="https://titanwallet.net" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-semibold text-sm hover:brightness-110 transition-all active:scale-[0.97] shadow-md whitespace-nowrap">
              Learn More <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-[var(--xray-tertiary)] max-w-lg mx-auto leading-relaxed">
          Disclaimer: This scan is informational only and does not constitute financial advice. Results are based on publicly available on-chain data. Always verify findings independently. Your wallet address is not stored by this browser flow.
        </p>
      </div>
    </section>
  );
}

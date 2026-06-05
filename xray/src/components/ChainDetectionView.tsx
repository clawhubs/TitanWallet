'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Radar, Search, ShieldAlert } from 'lucide-react';
import { CHAINS } from '@/data/chains';
import type { DetectedChain } from '@/types/scanner';

interface ChainDetectionViewProps {
  address: string;
  chains: DetectedChain[];
  durationMs: number;
  error?: string;
  onBack: () => void;
  onScan: (chains: number[]) => void;
}

export default function ChainDetectionView({ address, chains, durationMs, error, onBack, onScan }: ChainDetectionViewProps) {
  const manualChains = useMemo<DetectedChain[]>(
    () =>
      CHAINS.map((chain) => ({
        chainId: chain.chainId,
        chainName: chain.name,
        chainShortName: chain.shortName,
        nativeSymbol: chain.nativeSymbol || chain.shortName,
        nativeBalance: '0',
        nativeBalanceFormatted: `${chain.category === 'popular' ? 'Recommended' : 'Manual'} scan option`,
        hasActivity: false,
        explorerUrl: chain.explorerUrl,
      })),
    [],
  );
  const visibleChains = chains.length ? chains : manualChains;
  const [selected, setSelected] = useState<number[]>(
    chains.length
      ? chains.map((chain) => chain.chainId)
      : manualChains
          .filter((chain) => CHAINS.find((item) => item.chainId === chain.chainId)?.category === 'popular')
          .map((chain) => chain.chainId),
  );
  const short = address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-6)}` : address;

  const toggle = (chainId: number) => {
    setSelected((current) => current.includes(chainId) ? current.filter((id) => id !== chainId) : [...current, chainId]);
  };

  return (
    <section className="pt-28 pb-16 px-4 min-h-[80vh]">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-text)]">
          ← Back
        </button>

        <div className="rounded-3xl border border-[var(--xray-border)] bg-[var(--xray-surface)] p-6 sm:p-8" style={{ boxShadow: 'var(--xray-shadow-md)' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--xray-accent)]/25 bg-[rgba(78,205,196,0.08)] px-3 py-1 text-xs font-semibold text-[var(--xray-accent)]">
                <Radar size={14} /> Chain detection complete
              </div>
              <h1 className="mt-4 text-3xl font-extrabold text-[var(--xray-text)]">Choose chains to scan</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--xray-subtext)]">
                {chains.length
                  ? `Detected ${chains.length} active chain(s) for ${short}.`
                  : `No native balance was detected for ${short} on the fast RPC set, so TITAN loaded the full manual chain catalog.`}
                {' '}Detection took {durationMs}ms.
              </p>
            </div>
            <code className="rounded-xl border border-[var(--xray-border)] bg-[var(--xray-input-bg)] px-3 py-2 text-xs text-[var(--xray-accent)]">
              {short}
            </code>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-[rgba(224,84,78,0.25)] bg-[rgba(224,84,78,0.06)] p-4 text-sm text-[var(--xray-danger)]">
              {error}
            </div>
          ) : null}

          {visibleChains.length ? (
            <div className="mt-7">
              {!chains.length ? (
                <div className="mb-4 rounded-2xl border border-[rgba(212,148,58,0.25)] bg-[rgba(212,148,58,0.06)] p-4 text-sm leading-6 text-[var(--xray-subtext)]">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 shrink-0 text-[var(--xray-warning)]" size={18} />
                    <div>
                      <span className="font-semibold text-[var(--xray-text)]">No active chain detected.</span>{' '}
                      Select any network below to scan approvals anyway. Popular RPC networks are preselected, including 0G.
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="grid max-h-[440px] gap-3 overflow-y-auto pr-1">
              {visibleChains.map((chain) => {
                const active = selected.includes(chain.chainId);
                return (
                  <button
                    key={chain.chainId}
                    type="button"
                    onClick={() => toggle(chain.chainId)}
                    className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? 'border-[var(--xray-accent)]/40 bg-[rgba(78,205,196,0.08)]'
                        : 'border-[var(--xray-border)] bg-[var(--xray-bg)] hover:border-[var(--xray-accent)]/25'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[var(--xray-text)]">{chain.chainName}</span>
                        <span className="rounded-md border border-[var(--xray-border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--xray-subtext)]">
                          {chain.chainShortName}
                        </span>
                        {!chain.hasActivity ? (
                          <span className="rounded-md bg-[rgba(78,205,196,0.08)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--xray-accent)]">
                            Manual
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-[var(--xray-subtext)]">{chain.nativeBalanceFormatted}</div>
                    </div>
                    {active ? <CheckCircle2 className="text-[var(--xray-accent)]" /> : <span className="text-xs text-[var(--xray-tertiary)]">Tap to include</span>}
                  </button>
                );
              })}
              </div>
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-[var(--xray-border)] p-8 text-center">
              <ShieldAlert className="mx-auto text-[var(--xray-warning)]" />
              <h2 className="mt-4 font-bold text-[var(--xray-text)]">No active chain detected</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--xray-subtext)]">
                You can still scan Ethereum as a fallback if the wallet has token approvals but no native balance.
              </p>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => onScan(selected)}
              disabled={selected.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40"
              id="scan-selected-button"
            >
              <Search size={16} /> Scan Selected ({selected.length})
            </button>
            {visibleChains.length > 1 ? (
              <button
                onClick={() => onScan(visibleChains.map((chain) => chain.chainId))}
                className="rounded-xl border border-[var(--xray-border)] px-6 py-3 text-sm font-semibold text-[var(--xray-text)] transition hover:border-[var(--xray-accent)]/30"
              >
                Scan All
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

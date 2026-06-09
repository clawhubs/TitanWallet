'use client';

import { useEffect, useState } from 'react';
import { Lock, Loader2, RefreshCw, AtSign, Send } from 'lucide-react';
import OpportunityCard from './OpportunityCard';
import OpportunityModal from './OpportunityModal';
import type { Opportunity } from '@/lib/types';

const VISIBLE = 6;

export default function AlphaFeed() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Opportunity | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnlocked(localStorage.getItem('alpha-unlocked') === '1');
    fetch('/api/opportunities')
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.opportunities) ? d.opportunities : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const unlock = () => { localStorage.setItem('alpha-unlocked', '1'); setUnlocked(true); };

  const visibleItems = unlocked ? items : items.slice(0, VISIBLE);
  const hiddenCount = unlocked ? 0 : Math.max(0, items.length - VISIBLE);

  return (
    <section id="feed" className="py-20 sm:py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full xray-eyebrow text-[10px] font-semibold text-[var(--xray-accent)] uppercase tracking-widest mb-4">
            Live Alpha Feed
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--xray-text)] tracking-tight">
            Opportunities, <span className="text-gradient-accent">scored by AI</span>
          </h2>
          <p className="mt-4 text-base text-[var(--xray-subtext)] max-w-xl mx-auto leading-relaxed">
            Real projects from live on-chain data, ranked for airdrop &amp; alpha potential by GLM-4.7 and checked with GoPlus.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-[var(--xray-subtext)]">
            <Loader2 size={18} className="animate-spin text-[var(--xray-accent)]" /> Loading live opportunities…
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-[var(--xray-subtext)]">
            <RefreshCw size={20} className="mx-auto mb-3 text-[var(--xray-tertiary)]" />
            Feed is refreshing. Check back in a moment.
          </div>
        ) : (
          <>
            {!unlocked && (
              <p className="text-center text-xs font-medium text-[var(--xray-subtext)] mb-5">
                Showing <span className="text-[var(--xray-text)] font-bold">{visibleItems.length}</span> of <span className="text-[var(--xray-text)] font-bold">{items.length}</span> opportunities
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleItems.map((op) => (
                <OpportunityCard key={op.id} op={op} onOpen={setActive} />
              ))}
            </div>

            {hiddenCount > 0 && (
              <div className="relative mt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 blur-sm select-none pointer-events-none" aria-hidden>
                  {items.slice(VISIBLE, VISIBLE + 3).map((op) => (
                    <OpportunityCard key={op.id} op={op} onOpen={() => {}} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="xray-card xray-glass-card p-6 sm:p-8 max-w-md text-center">
                    <div className="mx-auto w-12 h-12 rounded-2xl xray-icon-tile flex items-center justify-center mb-4">
                      <Lock className="text-[var(--xray-accent)]" size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--xray-text)]">{hiddenCount} opportunities locked</h3>
                    <p className="mt-2 text-sm text-[var(--xray-subtext)]">Follow Titan to unlock the full real-time alpha feed.</p>
                    <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
                      <a href="https://x.com/titanwallet" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--xray-card-border)] text-sm font-semibold text-[var(--xray-text)] hover:border-[var(--xray-accent)]/30" style={{ background: 'var(--xray-card-gradient)' }}>
                        <AtSign size={15} /> Follow on X
                      </a>
                      <a href="https://t.me/titanwallet" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--xray-card-border)] text-sm font-semibold text-[var(--xray-text)] hover:border-[var(--xray-accent)]/30" style={{ background: 'var(--xray-card-gradient)' }}>
                        <Send size={15} /> Join Telegram
                      </a>
                    </div>
                    <button onClick={unlock} className="mt-3 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white font-bold text-sm hover:brightness-110 transition-all">
                      Unlock Full Feed
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {active && <OpportunityModal op={active} onClose={() => setActive(null)} />}
    </section>
  );
}

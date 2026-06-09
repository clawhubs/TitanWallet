'use client';

import { useEffect, useState } from 'react';
import { Lock, Loader2, RefreshCw, AtSign, Send, Check, Crown } from 'lucide-react';
import OpportunityCard from './OpportunityCard';
import OpportunityModal from './OpportunityModal';
import type { Opportunity } from '@/lib/types';

const PREMIUM = 5;       // top-scored picks reserved for unlocked users
const FREE_PREVIEW = 9;  // free picks shown below the gate

const X_URL = 'https://x.com/titan_wallet';
const TG_URL = 'https://t.me/titanx_wallet';

export default function AlphaFeed() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Opportunity | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [xFollowed, setXFollowed] = useState(false);
  const [tgJoined, setTgJoined] = useState(false);

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

  // Highest-scored picks are the premium reward; the rest are the free preview.
  const premium = items.slice(0, PREMIUM);
  const free = items.slice(PREMIUM, PREMIUM + FREE_PREVIEW);
  const canUnlock = xFollowed && tgJoined;

  return (
    <section id="feed" className="pt-4 pb-16 sm:pt-6 sm:pb-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--xray-subtext)] uppercase tracking-wider">
            Live airdrop feed
          </div>
          <p className="mt-2 text-xs text-[var(--xray-tertiary)]">
            {items.length > 0 ? `${items.length} opportunities · ` : ''}auto-updated {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} from airdrops.io &amp; on-chain data
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
        ) : unlocked ? (
          <>
            <p className="text-center text-xs font-medium text-[var(--xray-subtext)] mb-5">
              Full feed unlocked · <span className="text-[var(--xray-text)] font-bold">{items.length}</span> opportunities
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((op, i) => (
                <OpportunityCard key={op.id} op={op} onOpen={setActive} premium={i < PREMIUM} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Premium locked section — the BEST picks, revealed after following */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown size={15} className="text-[var(--xray-accent)]" />
              <span className="text-sm font-bold text-[var(--xray-text)]">Top {PREMIUM} Premium Alpha</span>
              <span className="text-xs text-[var(--xray-subtext)]">— highest-scored, unlock to view</span>
            </div>
            <div className="relative mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 blur-md select-none pointer-events-none" aria-hidden>
                {premium.map((op) => (
                  <OpportunityCard key={op.id} op={op} onOpen={() => {}} premium />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center px-2">
                <div className="xray-card xray-glass-card p-6 sm:p-8 max-w-md text-center">
                  <div className="mx-auto w-12 h-12 rounded-2xl xray-icon-tile flex items-center justify-center mb-4">
                    <Lock className="text-[var(--xray-accent)]" size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--xray-text)]">Unlock the top alpha</h3>
                  <p className="mt-2 text-sm text-[var(--xray-subtext)]">Follow Titan on X and join the Telegram to reveal the {PREMIUM} highest-scored opportunities + the full feed.</p>
                  <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
                    <a
                      href={X_URL} target="_blank" rel="noopener noreferrer"
                      onClick={() => setXFollowed(true)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${xFollowed ? 'border-[var(--xray-success)] text-[var(--xray-success)]' : 'border-[var(--xray-card-border)] text-[var(--xray-text)] hover:border-[var(--xray-accent)]/30'}`}
                      style={{ background: 'var(--xray-card-gradient)' }}
                    >
                      {xFollowed ? <Check size={15} /> : <AtSign size={15} />} {xFollowed ? 'Followed' : 'Follow @titan_wallet'}
                    </a>
                    <a
                      href={TG_URL} target="_blank" rel="noopener noreferrer"
                      onClick={() => setTgJoined(true)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${tgJoined ? 'border-[var(--xray-success)] text-[var(--xray-success)]' : 'border-[var(--xray-card-border)] text-[var(--xray-text)] hover:border-[var(--xray-accent)]/30'}`}
                      style={{ background: 'var(--xray-card-gradient)' }}
                    >
                      {tgJoined ? <Check size={15} /> : <Send size={15} />} {tgJoined ? 'Joined' : 'Join Telegram'}
                    </a>
                  </div>
                  <button
                    onClick={unlock}
                    disabled={!canUnlock}
                    className={`mt-3 w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${canUnlock ? 'bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white hover:brightness-110' : 'bg-[var(--xray-elevated)] text-[var(--xray-tertiary)] cursor-not-allowed'}`}
                  >
                    {canUnlock ? 'Unlock Full Feed' : 'Follow both to unlock'}
                  </button>
                </div>
              </div>
            </div>

            {/* Free preview */}
            <p className="text-center text-xs font-medium text-[var(--xray-subtext)] mb-5">
              Free picks · showing <span className="text-[var(--xray-text)] font-bold">{free.length}</span> of <span className="text-[var(--xray-text)] font-bold">{items.length}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {free.map((op) => (
                <OpportunityCard key={op.id} op={op} onOpen={setActive} />
              ))}
            </div>
          </>
        )}
      </div>

      {active && <OpportunityModal op={active} onClose={() => setActive(null)} />}
    </section>
  );
}

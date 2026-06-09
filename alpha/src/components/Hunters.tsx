'use client';

import { Trophy, Medal, Award } from 'lucide-react';

const HUNTERS = [
  { rank: 1, name: 'cipher.eth', points: 4820, published: 31, accuracy: 92 },
  { rank: 2, name: '0xRadar', points: 4110, published: 27, accuracy: 89 },
  { rank: 3, name: 'alphawolf', points: 3640, published: 24, accuracy: 87 },
  { rank: 4, name: 'degenscout', points: 2980, published: 19, accuracy: 84 },
  { rank: 5, name: 'mevhunter', points: 2440, published: 16, accuracy: 81 },
];

function rankIcon(rank: number) {
  if (rank === 1) return <Trophy size={16} className="text-[var(--xray-gold)]" />;
  if (rank === 2) return <Medal size={16} className="text-[var(--xray-subtext)]" />;
  if (rank === 3) return <Award size={16} className="text-[var(--xray-warning)]" />;
  return <span className="text-xs font-bold text-[var(--xray-tertiary)]">{rank}</span>;
}

export default function Hunters() {
  return (
    <section id="hunters" className="py-20 sm:py-24 relative border-t border-[var(--xray-border)]/60">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full xray-eyebrow text-[10px] font-semibold text-[var(--xray-accent)] uppercase tracking-widest mb-4">
            Hunter Reputation
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--xray-text)] tracking-tight">Top <span className="text-gradient-accent">Alpha Hunters</span></h2>
          <p className="mt-4 text-base text-[var(--xray-subtext)] leading-relaxed">Submit verified opportunities, earn points, climb the leaderboard. Season 1 is live.</p>
        </div>

        <div className="xray-card overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_auto_auto] gap-3 px-4 sm:px-5 py-3 border-b border-[var(--xray-border)] text-[10px] font-semibold uppercase tracking-wider text-[var(--xray-subtext)]">
            <span>#</span><span>Hunter</span><span className="text-right hidden sm:block">Published</span><span className="text-right">Points</span>
          </div>
          {HUNTERS.map((h) => (
            <div key={h.rank} className="grid grid-cols-[40px_1fr_auto_auto] gap-3 px-4 sm:px-5 py-3.5 items-center border-b border-[var(--xray-border)]/50 last:border-0 hover:bg-[var(--xray-elevated)]/40 transition-colors">
              <span className="flex items-center justify-center">{rankIcon(h.rank)}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--xray-text)] truncate">{h.name}</p>
                <p className="text-[11px] text-[var(--xray-subtext)]">{h.accuracy}% accuracy</p>
              </div>
              <span className="text-right text-sm text-[var(--xray-subtext)] hidden sm:block">{h.published}</span>
              <span className="text-right text-sm font-bold text-gradient-accent">{h.points.toLocaleString('en-US')}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-[var(--xray-tertiary)]">Rankings update as community submissions are verified and published.</p>
      </div>
    </section>
  );
}

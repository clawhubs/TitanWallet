'use client';

export default function AlphaHero() {
  return (
    <section className="relative pt-28 pb-6 sm:pt-32 sm:pb-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 xray-hero-aurora opacity-50" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(var(--xray-subtext) 1px, transparent 1px), linear-gradient(90deg, var(--xray-subtext) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 35%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 35%, transparent 100%)' }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full xray-eyebrow text-[11px] font-medium text-[var(--xray-text)] mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--xray-success)] animate-pulse" />
          AI-powered Web3 intelligence · live now
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] mb-3">
          Discover Web3 Airdrops <span className="text-gradient-accent">Before Everyone Else</span>
        </h1>

        <p className="text-sm sm:text-base text-[var(--xray-subtext)] max-w-xl mx-auto leading-relaxed">
          AI continuously scans on-chain data to surface, score, and explain pre-token protocols with real airdrop potential.
        </p>
      </div>
    </section>
  );
}

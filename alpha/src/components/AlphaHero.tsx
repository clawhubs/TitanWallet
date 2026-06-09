'use client';

export default function AlphaHero() {
  return (
    <section className="relative pt-28 pb-8 sm:pt-32 sm:pb-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 xray-hero-aurora opacity-50" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(var(--xray-subtext) 1px, transparent 1px), linear-gradient(90deg, var(--xray-subtext) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 35%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 35%, transparent 100%)' }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-xs font-semibold text-[var(--xray-accent)] uppercase tracking-[0.2em] mb-4">
          Web3 Opportunity Intelligence
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] mb-4">
          Discover Web3 airdrops <span className="text-gradient-accent">before everyone else</span>
        </h1>
        <p className="text-sm sm:text-base text-[var(--xray-subtext)] max-w-xl mx-auto leading-relaxed">
          Live airdrops and pre-token protocols, scored and explained by AI — so you know what to do and how to claim.
        </p>
      </div>
    </section>
  );
}

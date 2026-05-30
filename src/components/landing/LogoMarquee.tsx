import React from 'react';

type LogoKind =
  | 'image'
  | 'aws'
  | 'digitalocean'
  | 'alibaba'
  | 'ethereum'
  | 'usdc'
  | 'bnb'
  | 'polygon'
  | 'wbtc';

interface LogoItem {
  name: string;
  kind: LogoKind;
  src?: string;
  accent: string;
}

const logos: LogoItem[] = [
  { name: '0G', kind: 'image', src: '/0g-logo.png', accent: 'from-[#B24CFF]/30 to-[#35E6FF]/20' },
  { name: 'AWS Nitro', kind: 'aws', accent: 'from-[#FF9900]/25 to-[#FFCC66]/10' },
  { name: 'DigitalOcean', kind: 'digitalocean', accent: 'from-[#0080FF]/25 to-[#7CC7FF]/10' },
  { name: 'Alibaba Cloud', kind: 'alibaba', accent: 'from-[#FF6A00]/25 to-[#FFB36B]/10' },
  { name: 'Ethereum', kind: 'ethereum', accent: 'from-[#627EEA]/25 to-[#AEBBFF]/10' },
  { name: 'USD Coin', kind: 'usdc', accent: 'from-[#2775CA]/25 to-[#7EB6FF]/10' },
  { name: 'BNB Chain', kind: 'bnb', accent: 'from-[#F3BA2F]/25 to-[#FFE58A]/10' },
  { name: 'Polygon', kind: 'polygon', accent: 'from-[#8247E5]/25 to-[#B891FF]/10' },
  { name: 'Wrapped BTC', kind: 'wbtc', accent: 'from-[#F7931A]/25 to-[#FFD19A]/10' },
  { name: 'BTCB', kind: 'image', src: '/btcb-logo.png', accent: 'from-[#F7931A]/25 to-[#FFE3A8]/10' },
];

const marqueeItems = [...logos, ...logos];

const LogoMark: React.FC<{ item: LogoItem }> = ({ item }) => {
  if (item.kind === 'image' && item.src) {
    return (
      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white">
        <img src={item.src} alt={`${item.name} logo`} className="h-full w-full object-contain" />
      </span>
    );
  }

  if (item.kind === 'aws') {
    return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#15110A] text-[11px] font-black tracking-tight text-[#FF9900]">AWS</span>;
  }

  if (item.kind === 'digitalocean') {
    return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#05203E] text-sm font-black text-[#0080FF]">DO</span>;
  }

  if (item.kind === 'alibaba') {
    return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#251307] text-[10px] font-black text-[#FF6A00]">ALI</span>;
  }

  if (item.kind === 'ethereum') {
    return (
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#10172D]">
        <span className="h-5 w-3 rotate-45 bg-gradient-to-br from-[#8EA2FF] to-[#627EEA]" />
      </span>
    );
  }

  if (item.kind === 'usdc') {
    return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2775CA] text-lg font-bold text-white">$</span>;
  }

  if (item.kind === 'bnb') {
    return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3BA2F] text-xs font-black text-[#14110A]">BNB</span>;
  }

  if (item.kind === 'polygon') {
    return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8247E5] text-xs font-black text-white">POL</span>;
  }

  return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7931A] text-xs font-black text-white">BTC</span>;
};

const LogoMarquee: React.FC = () => {
  return (
    <section className="border-y border-titan-border/60 bg-[#080B11] py-5">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-titan-accent">Live ecosystem rails</p>
          <p className="hidden text-[12px] font-medium text-titan-subtext sm:block">Cloud, proof, and token surfaces shown without broken image dependencies.</p>
        </div>
      </div>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#080B11] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#080B11] to-transparent" />
        <div className="flex w-max animate-titan-marquee gap-4 px-4">
          {marqueeItems.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={`group flex min-w-[190px] items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br ${item.accent} bg-[#10141D] px-4 py-3 shadow-card`}
            >
              <LogoMark item={item} />
              <div>
                <p className="text-sm font-bold text-white">{item.name}</p>
                <p className="text-[11px] font-medium text-titan-subtext">{index < logos.length ? 'Connected rail' : 'Verified surface'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoMarquee;

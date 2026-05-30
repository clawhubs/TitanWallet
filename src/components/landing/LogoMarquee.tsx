import React from 'react';

interface LogoItem {
  name: string;
  src: string;
  accent: string;
  markClassName?: string;
}

const logos: LogoItem[] = [
  { name: '0G', src: '/0g-logo.png', accent: 'from-[#B24CFF]/30 to-[#35E6FF]/20', markClassName: 'bg-white' },
  { name: 'AWS Nitro', src: '/brand-logos/aws.svg', accent: 'from-[#FF9900]/25 to-[#FFCC66]/10', markClassName: 'bg-white px-1.5' },
  { name: 'DigitalOcean', src: '/brand-logos/digitalocean.svg', accent: 'from-[#0080FF]/25 to-[#7CC7FF]/10', markClassName: 'bg-white' },
  { name: 'Alibaba Cloud', src: '/brand-logos/alibabacloud.svg', accent: 'from-[#FF6A00]/25 to-[#FFB36B]/10', markClassName: 'bg-white' },
  { name: 'Ethereum', src: '/brand-logos/ethereum.svg', accent: 'from-[#627EEA]/25 to-[#AEBBFF]/10', markClassName: 'bg-[#10172D]' },
  { name: 'USD Coin', src: '/brand-logos/usdc.png', accent: 'from-[#2775CA]/25 to-[#7EB6FF]/10' },
  { name: 'Tether', src: '/brand-logos/usdt.png', accent: 'from-[#26A17B]/25 to-[#9AE6C5]/10' },
  { name: 'BNB Chain', src: '/brand-logos/bnb.png', accent: 'from-[#F3BA2F]/25 to-[#FFE58A]/10' },
  { name: 'Polygon', src: '/brand-logos/polygon.png', accent: 'from-[#8247E5]/25 to-[#B891FF]/10' },
  { name: 'Wrapped BTC', src: '/brand-logos/wbtc.png', accent: 'from-[#F7931A]/25 to-[#FFD19A]/10' },
  { name: 'BTCB', src: '/btcb-logo.png', accent: 'from-[#F7931A]/25 to-[#FFE3A8]/10' },
];

const marqueeItems = [...logos, ...logos];

const LogoMark: React.FC<{ item: LogoItem }> = ({ item }) => {
  return (
    <span className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ${item.markClassName || 'bg-white'}`}>
      <img src={item.src} alt="" aria-hidden="true" className="h-full w-full object-contain" />
    </span>
  );
};

const LogoMarquee: React.FC = () => {
  return (
    <section className="border-y border-titan-border/60 bg-[#080B11] py-5">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-titan-accent">Live ecosystem rails</p>
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

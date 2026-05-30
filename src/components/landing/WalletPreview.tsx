import React, { useState, useEffect } from 'react';
import { Zap, Send, ArrowDownLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

const proofTicker = [
  'Integrity check passed',
  'ZK proof generated',
  'Proof anchored on-chain',
  'Policy applied',
];

const tokens = [
  { symbol: 'ETH', balance: '2.483', usd: '$7,449', change: '+2.1%', pos: true, color: 'bg-titan-accent' },
  { symbol: 'USDC', balance: '3,200', usd: '$3,200', change: '0.0%', pos: true, color: 'bg-blue-500' },
  { symbol: 'WBTC', balance: '0.084', usd: '$8,749', change: '+1.8%', pos: true, color: 'bg-amber-500' },
];

const WalletPreview: React.FC = () => {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const balance = useCountUp(20493, 1500);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIndex((i) => (i + 1) % proofTicker.length);
        setTickerVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-[360px] mx-auto select-none animate-slide-up animate-delay-200">
      {/* Outer subtle glow */}
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-b from-titan-accent/[0.08] to-transparent blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative bg-[#0A0D14] border border-[#1A2233] rounded-[28px] overflow-hidden shadow-2xl shadow-black/50">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1A2233]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-titan-accent/10 border border-titan-accent/20 flex items-center justify-center overflow-hidden mix-blend-screen">
              <img src="/titan-logo.png" alt="TITAN Logo" className="h-full w-full object-cover scale-[1.45]" />
            </div>
            <span className="text-[13px] font-semibold text-white">TITAN</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#131821] border border-[#1A2233]">
            <div className="w-1.5 h-1.5 rounded-full bg-titan-success animate-pulse" />
            <span className="text-[11px] text-titan-subtext font-mono tracking-wide">0x3fE...64Ae</span>
          </div>
        </div>

        {/* Balance Area */}
        <div className="px-6 pt-6 pb-5 border-b border-[#1A2233]/40">
          <p className="text-[11px] text-titan-tertiary uppercase tracking-[0.15em] mb-1.5 font-semibold">Total Balance</p>
          <div className="flex items-baseline gap-2.5 mb-5">
            <span className="text-[36px] font-bold text-white tracking-tight leading-none">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-[13px] text-titan-success font-semibold px-2 py-0.5 rounded bg-titan-success/10">+$428</span>
          </div>

          {/* Quick actions mini */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="py-2.5 rounded-xl bg-[#131821] border border-[#1A2233] flex flex-col items-center justify-center gap-1.5 hover:bg-[#182030] hover:border-titan-accent/30 transition-all cursor-pointer">
              <Send size={14} className="text-titan-text" />
              <span className="text-[11px] text-titan-text font-medium">Send</span>
            </div>
            <div className="py-2.5 rounded-xl bg-[#131821] border border-[#1A2233] flex flex-col items-center justify-center gap-1.5 hover:bg-[#182030] hover:border-titan-accent/30 transition-all cursor-pointer">
              <ArrowDownLeft size={14} className="text-titan-text" />
              <span className="text-[11px] text-titan-text font-medium">Receive</span>
            </div>
            <div className="py-2.5 rounded-xl bg-[#131821] border border-[#1A2233] flex flex-col items-center justify-center gap-1.5 hover:bg-[#182030] hover:border-titan-accent/30 transition-all cursor-pointer">
              <RefreshCw size={14} className="text-titan-text" />
              <span className="text-[11px] text-titan-text font-medium">Swap</span>
            </div>
          </div>
        </div>

        {/* Tokens List */}
        <div className="px-6 py-2">
          {tokens.map((t) => (
            <div key={t.symbol} className="flex items-center justify-between py-3.5 border-b border-[#1A2233]/40 last:border-0 group cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className={`w-2.5 h-2.5 rounded-full ${t.color} ring-4 ring-[#131821]`} />
                <div>
                  <p className="text-[14px] font-semibold text-white leading-tight mb-0.5">{t.symbol}</p>
                  <p className="text-[12px] text-titan-subtext font-mono">{t.balance}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-medium text-white leading-tight mb-0.5">{t.usd}</p>
                <p className={`text-[12px] ${t.pos ? 'text-titan-success' : 'text-titan-danger'} font-medium`}>{t.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Security Bar */}
        <div className="px-6 py-4 bg-[#131821] border-t border-[#1A2233] rounded-b-[28px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-titan-success" />
              <span className="text-[11px] font-semibold text-titan-success tracking-wide">9 Wallet Rails</span>
            </div>
            
            <div 
              className="text-[11px] font-mono text-titan-subtext transition-opacity duration-300 flex items-center gap-1.5"
              style={{ opacity: tickerVisible ? 1 : 0 }}
            >
              <Zap size={10} className="text-titan-accent" />
              {proofTicker[tickerIndex]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPreview;

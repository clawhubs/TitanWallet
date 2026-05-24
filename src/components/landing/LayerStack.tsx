import React from 'react';

const layers = [
  { num: '01', name: 'Integrity Auditor', desc: 'Scans every transaction against known threats before signing' },
  { num: '02', name: 'Programmable Governance', desc: 'Enforces your personal rules — spend limits, allowlists' },
  { num: '03', name: 'ZK Layer', desc: 'Generates cryptographic proofs without exposing private data' },
  { num: '04', name: 'Secure Compute', desc: 'Isolates all key operations from the browser environment' },
  { num: '05', name: 'Proof Anchor', desc: 'Commits an immutable record of each event on-chain' },
  { num: '06', name: 'Sovereign Memory', desc: 'Maintains your signed history — owned and verified by you' },
];

const LayerStack: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Connecting line */}
      <div className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-titan-accent/30 via-titan-accent/10 to-transparent" />

      <div className="flex flex-col gap-2">
        {layers.map((layer, i) => (
          <div
            key={layer.num}
            className="relative group flex items-start gap-5 p-5 rounded-2xl border border-titan-border bg-titan-surface
              transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-titan-accent/25 hover:bg-[#0F1520]
              hover:shadow-elevated cursor-default"
          >
            {/* Pulse dot */}
            <div className="flex-shrink-0 relative flex items-center justify-center mt-1 z-10">
              <div className="absolute w-4 h-4 rounded-full bg-titan-accent/20 animate-pulse-slow" style={{ animationDelay: `${i * 400}ms` }} />
              <div className="w-2.5 h-2.5 rounded-full bg-titan-accent relative" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="font-mono text-[12px] text-titan-accent/50 font-bold group-hover:text-titan-accent/80 transition-colors">
                  {layer.num}
                </span>
                <span className="text-[15px] font-semibold text-white group-hover:text-white transition-colors">
                  {layer.name}
                </span>
              </div>
              <p className="text-[13px] text-titan-subtext leading-relaxed group-hover:text-titan-subtext/90">
                {layer.desc}
              </p>
            </div>

            {/* Active indicator */}
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-titan-success" />
              <span className="text-[10px] text-titan-success font-medium uppercase tracking-wider hidden sm:block">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerStack;

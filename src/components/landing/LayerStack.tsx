import React from 'react';

const layers = [
  { num: '01', name: 'Integrity Auditor', desc: 'Deterministic checks for payloads, permissions, and contract intent' },
  { num: '02', name: 'Secure Compute / TEE', desc: 'Sensitive wallet operations stay on the hardened secure-compute lane' },
  { num: '03', name: 'Sovereign Memory', desc: 'Maintains wallet context, trusted apps, and signed session history' },
  { num: '04', name: '0G Storage Proof Layer', desc: 'Writes proof payloads and sealed receipts into the 0G storage rail' },
  { num: '05', name: 'Zero-Knowledge Proof Layer', desc: 'Builds cryptographic proof envelopes without exposing secret state' },
  { num: '06', name: 'ProofRegistry Anchor', desc: 'Commits proof receipts into the chain-backed registry path' },
  { num: '07', name: 'Programmable Governance', desc: 'Applies spend policy, throttle, and safety-gate enforcement' },
  { num: '08', name: 'Cross-Agent Neural Handshake', desc: 'Records connect, sign, and approval actions into the handshake trail' },
  { num: '09', name: 'AWS Nitro Enclaves', desc: 'Fortress continuity rail for enclave witness and hardened signing lanes' },
];

const LayerStack: React.FC = () => {
  return (
    <div className="relative w-full max-w-xl mx-auto lg:mx-0">
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

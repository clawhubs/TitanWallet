'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Is my wallet safe during the scan?',
    a: 'Absolutely. The scan is completely read-only. We only need your public wallet address — no wallet connection, no private keys, no signing. It\'s the same as looking up your address on a block explorer.',
  },
  {
    q: 'How is the health score calculated?',
    a: 'The score is based on real on-chain data: number of active approvals, whether they are unlimited, if the spender contracts are verified, their reputation status, and total value exposed. No artificial inflation or fear-based scoring.',
  },
  {
    q: 'What does "revoke" actually do?',
    a: 'Revoking sets a token approval to zero, removing the smart contract\'s permission to spend your tokens. It\'s a standard on-chain transaction that you sign yourself. Your tokens stay in your wallet at all times.',
  },
  {
    q: 'Is this free?',
    a: 'Yes. Scanning and viewing results is completely free. Revoking approvals requires a small gas fee paid to the network (not to us). If you choose the optional TitanWallet migration, fees are displayed upfront before you confirm.',
  },
  {
    q: 'Do you store my wallet address?',
    a: 'No. We do not store, log, or sell your wallet address. Scans are processed in real-time and not retained. Your privacy is fundamental to our trust model.',
  },
  {
    q: 'Which chains are supported?',
    a: 'We support 55+ EVM-compatible networks including Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base, Avalanche, zkSync, Scroll, Linea, Blast, Fantom, Gnosis, Cronos, and many more Layer 2s and sidechains. We continuously add new networks as they gain traction.',
  },
  {
    q: 'How is this different from Revoke.cash?',
    a: 'We add AI-powered risk analysis that explains each finding in plain language, known drainer contract detection, exposure value calculations, and an optional upgrade path to TitanWallet\'s 9-layer security. Think of it as Revoke.cash + security advisor.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 sm:py-28 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--xray-border)] to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full xray-eyebrow text-[10px] font-semibold text-[var(--xray-accent)] uppercase tracking-widest mb-4">
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--xray-text)] tracking-tight">
            Frequently Asked <span className="text-gradient-accent">Questions</span>
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`xray-card overflow-hidden transition-all duration-300 ${openIndex === i ? 'border-[var(--xray-card-border-hover)]' : ''}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
                id={`faq-${i}`}
              >
                <span className={`text-sm font-semibold pr-4 transition-colors duration-200 ${openIndex === i ? 'text-[var(--xray-accent)]' : 'text-[var(--xray-text)]'}`}>{item.q}</span>
                <span className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${openIndex === i ? 'bg-[rgba(78,205,196,0.15)] text-[var(--xray-accent)] rotate-180' : 'text-[var(--xray-tertiary)]'}`}>
                  <ChevronDown size={18} />
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="px-5 pb-4 text-sm text-[var(--xray-subtext)] leading-relaxed border-t border-[var(--xray-border)] pt-3">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

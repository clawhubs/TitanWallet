'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Globe, Mail, AtSign, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--xray-border)] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <Image src="/titan-logo-transparent.png" alt="TITAN Logo" width={32} height={32} className="w-full h-full object-cover scale-[1.5]" />
              </div>
              <span className="text-base font-bold text-[var(--xray-text)]">TITAN <span className="text-gradient-accent">Alpha</span></span>
            </div>
            <p className="text-sm text-[var(--xray-subtext)] leading-relaxed max-w-sm">
              AI-powered Web3 opportunity intelligence. Discover, verify, and act on alpha — part of the TitanWallet ecosystem.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[var(--xray-subtext)] uppercase tracking-wider mb-3">Ecosystem</h4>
            <ul className="space-y-2">
              <li><a href="#feed" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Alpha Feed</a></li>
              <li><a href="#submit" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Submit Opportunity</a></li>
              <li><a href="https://xray.titanwallet.net" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Titan X-Ray</a></li>
              <li><a href="https://titanwallet.net" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">TitanWallet</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[var(--xray-subtext)] uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Disclaimer</Link></li>
              <li><Link href="/contact" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--xray-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--xray-tertiary)]">
            © 2026 Titan Alpha. Not financial advice. Always do your own research.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://x.com/titan_wallet" target="_blank" rel="noopener noreferrer" title="X (@titan_wallet)" aria-label="X" className="p-2 rounded-lg text-[var(--xray-tertiary)] hover:text-[var(--xray-accent)] hover:bg-[var(--xray-elevated)] transition-all">
              <AtSign size={16} />
            </a>
            <a href="https://t.me/titanx_wallet" target="_blank" rel="noopener noreferrer" title="Telegram (titanx_wallet)" aria-label="Telegram" className="p-2 rounded-lg text-[var(--xray-tertiary)] hover:text-[var(--xray-accent)] hover:bg-[var(--xray-elevated)] transition-all">
              <Send size={16} />
            </a>
            <a href="mailto:hallo@titanwallet.net" title="Email" aria-label="Email" className="p-2 rounded-lg text-[var(--xray-tertiary)] hover:text-[var(--xray-accent)] hover:bg-[var(--xray-elevated)] transition-all">
              <Mail size={16} />
            </a>
            <a href="https://titanwallet.net" target="_blank" rel="noopener noreferrer" title="TitanWallet" aria-label="TitanWallet" className="p-2 rounded-lg text-[var(--xray-tertiary)] hover:text-[var(--xray-accent)] hover:bg-[var(--xray-elevated)] transition-all">
              <Globe size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

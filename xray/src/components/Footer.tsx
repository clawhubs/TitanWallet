'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Globe, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--xray-border)] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <Image src="/titan-logo-transparent.png" alt="TITAN Logo" width={32} height={32} className="w-full h-full object-cover scale-[1.5]" />
              </div>
              <span className="text-base font-bold text-[var(--xray-text)]">TITAN <span className="text-gradient-accent">X-Ray</span></span>
            </div>
            <p className="text-sm text-[var(--xray-subtext)] leading-relaxed max-w-sm">
              Free, read-only wallet health scanner. Honest analysis, no fear tactics. Part of the TitanWallet ecosystem.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--xray-subtext)] uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">How It Works</a></li>
              <li><a href="#faq" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">FAQ</a></li>
              <li><a href="https://titanwallet.net" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">TitanWallet</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[var(--xray-subtext)] uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Disclaimer</Link></li>
              <li><a href="mailto:hallo@titanwallet.net" className="text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-accent)] transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--xray-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--xray-tertiary)]">
            © 2026 Titan X-Ray. Not financial advice. Results are informational only.
          </p>
          <div className="flex items-center gap-3">
            <a href="mailto:hallo@titanwallet.net" title="Email us" aria-label="Email us" className="p-2 rounded-lg text-[var(--xray-tertiary)] hover:text-[var(--xray-accent)] hover:bg-[var(--xray-elevated)] transition-all">
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

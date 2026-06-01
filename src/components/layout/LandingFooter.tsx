import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, MessageSquare, Globe } from 'lucide-react';

const socialLinks = [
  {
    title: 'Contact support',
    href: 'mailto:support@yieldboostai.xyz?subject=TITAN%20Wallet%20Support',
    icon: MessageSquare,
    external: false,
  },
  {
    title: 'GitHub repository',
    href: 'https://github.com/clawhubs/TitanWallet',
    icon: ExternalLink,
    external: true,
  },
  {
    title: 'Open TITAN Wallet',
    href: 'https://wallet.yieldboostai.xyz',
    icon: Globe,
    external: true,
  },
];

const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-titan-border bg-titan-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-titan-accent/10 border border-titan-accent/30 flex items-center justify-center overflow-hidden mix-blend-screen">
                <img src="/titan-logo.png" alt="TITAN Logo" className="h-full w-full object-cover scale-[1.45]" />
              </div>
              <span className="font-bold text-titan-text text-base">TITAN Wallet</span>
            </div>
            <p className="text-titan-subtext text-sm leading-relaxed max-w-xs">
              A secure web wallet with context-aware TITAN rails. No install required. No compromise.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    title={item.title}
                    aria-label={item.title}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noreferrer' : undefined}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-titan-subtext hover:text-titan-text hover:bg-titan-muted/40 transition-all"
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-titan-subtext uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Security Center', to: '/securitycenter' },
                { label: 'Activity', to: '/activity' },
                { label: 'Onboarding', to: '/onboarding' },
                { label: 'Developer Docs', to: '/developer/docs' },
              ].map(item => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-titan-subtext hover:text-titan-text transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Security */}
          <div>
            <h4 className="text-xs font-semibold text-titan-subtext uppercase tracking-wider mb-4">Security</h4>
            <ul className="space-y-2.5">
              {[
                'Integrity Auditor',
                'Secure Compute / TEE',
                '0G Storage Proof Layer',
                'Zero-Knowledge Proof Layer',
                'ProofRegistry Anchor',
                'Sovereign Memory',
                'AWS Nitro Enclaves',
              ].map(item => (
                <li key={item}>
                  <Link to="/security" className="text-sm text-titan-subtext hover:text-titan-text transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-titan-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <p className="text-xs text-titan-subtext">
              © 2026 TITAN Wallet. All rights reserved.
            </p>
            <p className="text-[10px] text-titan-tertiary uppercase tracking-wider font-medium">
              A YieldBoost AI Product
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-titan-subtext">
            <Shield size={12} className="text-titan-success" />
            9 Wallet Rails Active
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;

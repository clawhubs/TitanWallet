import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, MessageSquare, Globe } from 'lucide-react';

const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-titan-border bg-titan-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-titan-accent/10 border border-titan-accent/30 flex items-center justify-center">
                <span className="text-titan-accent font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-titan-text text-base">TITAN Wallet</span>
            </div>
            <p className="text-titan-subtext text-sm leading-relaxed max-w-xs">
              A secure web wallet with 6-layer protection. No install required. No compromise.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" title="Twitter / X" className="w-8 h-8 rounded-lg flex items-center justify-center text-titan-subtext hover:text-titan-text hover:bg-titan-muted/40 transition-all">
                <MessageSquare size={15} />
              </a>
              <a href="#" title="GitHub" className="w-8 h-8 rounded-lg flex items-center justify-center text-titan-subtext hover:text-titan-text hover:bg-titan-muted/40 transition-all">
                <ExternalLink size={15} />
              </a>
              <a href="#" title="Website" className="w-8 h-8 rounded-lg flex items-center justify-center text-titan-subtext hover:text-titan-text hover:bg-titan-muted/40 transition-all">
                <Globe size={15} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-titan-subtext uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              {['Dashboard', 'Security Center', 'Activity', 'Onboarding'].map(item => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase().replace(' ', '')}`} className="text-sm text-titan-subtext hover:text-titan-text transition-colors">
                    {item}
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
                'ZK Layer',
                'Secure Compute',
                'Proof Anchor',
                'Sovereign Memory',
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
            6-Layer Security Active
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;

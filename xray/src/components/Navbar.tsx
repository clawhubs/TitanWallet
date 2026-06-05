'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/app/providers';
import { Sun, Moon, Monitor, Menu, X, ExternalLink } from 'lucide-react';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeDropdown, setThemeDropdown] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun size={14} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
    { value: 'system', label: 'System', icon: <Monitor size={14} /> },
  ];

  const currentIcon = theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 xray-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
              <Image src="/titan-logo-transparent.png" alt="TITAN Logo" width={36} height={36} className="w-full h-full object-cover scale-[1.5]" priority />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[var(--xray-text)]">
                TITAN <span className="text-gradient-accent">X-Ray</span>
              </span>
              <span className="text-[10px] font-medium text-[var(--xray-subtext)] -mt-0.5 tracking-wide">
                Wallet Health Scanner
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="px-4 py-2 text-sm font-medium text-[var(--xray-subtext)] hover:text-[var(--xray-text)] rounded-lg hover:bg-[var(--xray-elevated)] transition-all duration-150">
              Features
            </a>
            <a href="#how-it-works" className="px-4 py-2 text-sm font-medium text-[var(--xray-subtext)] hover:text-[var(--xray-text)] rounded-lg hover:bg-[var(--xray-elevated)] transition-all duration-150">
              How It Works
            </a>
            <a href="#faq" className="px-4 py-2 text-sm font-medium text-[var(--xray-subtext)] hover:text-[var(--xray-text)] rounded-lg hover:bg-[var(--xray-elevated)] transition-all duration-150">
              FAQ
            </a>

            <div className="w-px h-6 bg-[var(--xray-border)] mx-2" />

            {/* Theme Switcher */}
            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setThemeDropdown(!themeDropdown)}
                className="p-2 rounded-lg text-[var(--xray-subtext)] hover:text-[var(--xray-text)] hover:bg-[var(--xray-elevated)] transition-all duration-150"
                aria-label="Toggle theme"
                id="theme-toggle"
              >
                {currentIcon}
              </button>
              {themeDropdown && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl border border-[var(--xray-border)] bg-[var(--xray-surface)] shadow-lg overflow-hidden animate-scale-in">
                  {themeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setTheme(opt.value); setThemeDropdown(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors duration-100
                        ${theme === opt.value
                          ? 'text-[var(--xray-accent)] bg-[var(--xray-glow)]'
                          : 'text-[var(--xray-subtext)] hover:text-[var(--xray-text)] hover:bg-[var(--xray-elevated)]'
                        }`}
                      id={`theme-${opt.value}`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <a
              href="https://titanwallet.net"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white hover:brightness-110 transition-all duration-150 active:scale-[0.97] shadow-md"
              id="nav-cta"
            >
              TitanWallet
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--xray-subtext)] hover:text-[var(--xray-text)] hover:bg-[var(--xray-elevated)] transition-all"
            aria-label="Open menu"
            id="mobile-menu-toggle"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--xray-border)] bg-[var(--xray-surface)] animate-slide-down">
          <div className="px-4 py-4 flex flex-col gap-1">
            <a href="#features" className="px-4 py-3 text-sm font-medium text-[var(--xray-subtext)] hover:text-[var(--xray-text)] rounded-lg hover:bg-[var(--xray-elevated)] transition-all">Features</a>
            <a href="#how-it-works" className="px-4 py-3 text-sm font-medium text-[var(--xray-subtext)] hover:text-[var(--xray-text)] rounded-lg hover:bg-[var(--xray-elevated)] transition-all">How It Works</a>
            <a href="#faq" className="px-4 py-3 text-sm font-medium text-[var(--xray-subtext)] hover:text-[var(--xray-text)] rounded-lg hover:bg-[var(--xray-elevated)] transition-all">FAQ</a>

            <div className="h-px bg-[var(--xray-border)] my-2" />

            {/* Theme selector mobile */}
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-xs font-medium text-[var(--xray-subtext)] uppercase tracking-wider">Theme</span>
              <div className="flex gap-1 ml-auto">
                {themeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`p-2 rounded-lg transition-all duration-150
                      ${theme === opt.value
                        ? 'text-[var(--xray-accent)] bg-[var(--xray-glow)]'
                        : 'text-[var(--xray-tertiary)] hover:text-[var(--xray-text)]'
                      }`}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>

            <a
              href="https://titanwallet.net"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] text-white hover:brightness-110 transition-all"
            >
              Get TitanWallet
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

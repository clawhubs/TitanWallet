import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Eye, Zap, Lock, Globe, Users, Bot, Briefcase, User, Puzzle, Smartphone, Shield
} from 'lucide-react';
import LandingFooter from '../components/layout/LandingFooter';
import WalletPreview from '../components/landing/WalletPreview';
import TrustBar from '../components/landing/TrustBar';
import LayerStack from '../components/landing/LayerStack';

// ─── Data ────────────────────────────────────────────────────────────────────

const benefits = [
  { icon: Globe, title: 'No install. Just open.', desc: 'Runs entirely in your browser. No extension, no app store, no setup wizard.' },
  { icon: ShieldCheck, title: '6 layers verify every action.', desc: 'Every transaction is independently checked before it ever touches your funds.' },
  { icon: Eye, title: 'Every proof is yours to audit.', desc: 'All security events are anchored on-chain. Your full trail, always verifiable.' },
  { icon: Lock, title: 'Keys never leave your device.', desc: 'Private keys live in an isolated compute context. Never sent to any server.' },
  { icon: Zap, title: 'Set rules. Enforce on-chain.', desc: 'Spend limits, address allowlists, time-locks — all enforced automatically.' },
  { icon: Shield, title: 'ZK Layer — prove safely.', desc: 'Zero-knowledge proofs verify actions without revealing your private data.' },
];

const useCases = [
  { icon: User, title: 'Personal wallet', desc: 'Full visibility into every action. Real security without complexity.' },
  { icon: Users, title: 'DAO treasury', desc: 'Multi-party governance with programmable approval flows and on-chain proof.' },
  { icon: Briefcase, title: 'Team vault', desc: 'Set spending policies for your team. Every transaction has a signed audit trail.' },
  { icon: Bot, title: 'AI agent wallet', desc: 'Give your agent a wallet with hard limits, time-locks, and full auditability.' },
];

const faqs = [
  { q: 'Do I need to install anything?', a: 'No. TITAN Wallet runs entirely in your browser. No extension, no app, no setup — just open the website and your wallet is ready.' },
  { q: 'How is my private key protected?', a: 'Your private key is generated and stored locally using the Secure Compute layer, isolated from the main browser context. It never leaves your device.' },
  { q: 'What is the ZK Layer?', a: 'The ZK Layer generates zero-knowledge proofs for sensitive operations — allowing you to prove validity without revealing your private data.' },
  { q: 'What networks are supported?', a: 'Ethereum, Arbitrum, Base, Optimism, and Polygon. More networks are being added regularly.' },
  { q: 'Is it self-custodial?', a: 'Completely. Your keys are generated on your device and never sent to any server. TITAN has zero access to your funds.' },
];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-titan-border/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group gap-4"
      >
        <span className="text-[15px] font-medium text-titan-text group-hover:text-white transition-colors">{q}</span>
        <span className={`text-titan-subtext text-xl font-light transition-transform duration-300 flex-shrink-0 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="text-[14px] text-titan-subtext leading-relaxed pr-8">{a}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-titan-bg overflow-x-hidden">

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 titan-glass">
        <div className="max-w-6xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden mix-blend-screen">
              <img src="/titan-logo.png" alt="TITAN Logo" className="w-full h-full object-cover scale-[1.5]" />
            </div>
            <span className="font-bold text-white text-[15px] tracking-wide">TITAN</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#product" className="text-[13px] text-titan-subtext hover:text-white transition-colors duration-200">Product</a>
            <a href="#security" className="text-[13px] text-titan-subtext hover:text-white transition-colors duration-200">Security</a>
            <a href="#faq" className="text-[13px] text-titan-subtext hover:text-white transition-colors duration-200">FAQ</a>
          </nav>

          <Link
            to="/onboarding"
            className="bg-white text-[#06080C] font-semibold text-[13px] px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors duration-200"
          >
            Create Wallet
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative px-6 overflow-hidden">
        {/* Background accent glow */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[400px] bg-titan-accent/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[300px] bg-titan-accent/[0.02] rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-6xl mx-auto pt-20 sm:pt-28 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-12 items-center min-h-[calc(100vh-72px)]">
          
          {/* Left — Copy */}
          <div className="flex flex-col items-start">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-titan-surface border border-titan-border mb-10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-titan-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-titan-success"></span>
              </span>
              <span className="text-[12px] font-semibold text-titan-text tracking-wide">Web Wallet — Live</span>
            </div>

            <h1 className="text-[52px] sm:text-[64px] lg:text-[72px] font-extrabold text-white leading-[1.02] tracking-[-0.03em] mb-7">
              The wallet that
              <br />
              <span className="text-gradient-accent">fights back.</span>
            </h1>

            <p className="text-[17px] sm:text-[18px] text-titan-subtext leading-[1.7] mb-10 max-w-[480px]">
              Open any browser. Create a wallet. Every action passes through 6 independent security layers before it reaches your funds.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-5">
              <Link
                to="/onboarding"
                className="bg-titan-accent text-[#06080C] font-bold text-[15px] px-8 py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2.5 shadow-lg shadow-titan-accent/20"
              >
                Create Wallet <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <a
                href="#security"
                className="bg-titan-surface border border-titan-border text-titan-text font-semibold text-[15px] px-8 py-4 rounded-xl hover:bg-[#182030] hover:border-titan-accent/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
              >
                <Shield size={16} /> View Security
              </a>
            </div>

            {/* Microcopy */}
            <p className="text-[12px] text-titan-subtext flex items-center gap-2 mb-14">
              <ShieldCheck size={13} className="text-titan-success flex-shrink-0" />
              No extension. No app download. Ready in 2 minutes.
            </p>

            {/* Trust badge */}
            <div className="flex items-center gap-4">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-titan-border" />
              <span className="text-[11px] text-titan-gold font-semibold tracking-[0.16em] uppercase">Secured by TITAN Protocol</span>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-titan-border" />
            </div>
          </div>

          {/* Right — Wallet Preview */}
          <div className="relative flex justify-center lg:justify-end">
            <WalletPreview />
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <TrustBar />

      {/* ── Use Cases ──────────────────────────────────────────────────── */}
      <section id="product" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-[11px] font-semibold text-titan-accent uppercase tracking-[0.12em] mb-4">Built for</p>
            <h2 className="text-[36px] sm:text-[40px] font-bold text-white tracking-tight">Anyone who needs a real wallet.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {useCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <div
                  key={uc.title}
                  className="group relative bg-titan-surface border border-titan-border rounded-2xl p-7 hover:-translate-y-1 hover:border-titan-accent/25 hover:shadow-elevated transition-all duration-300 cursor-default"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-titan-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-titan-bg border border-titan-border flex items-center justify-center mb-6 group-hover:border-titan-accent/30 group-hover:bg-titan-accent/5 transition-all duration-300">
                      <Icon size={20} className="text-titan-subtext group-hover:text-titan-accent transition-colors duration-300" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-white mb-2.5">{uc.title}</h3>
                    <p className="text-[13px] text-titan-subtext leading-[1.7]">{uc.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Benefits ───────────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-y border-titan-border/60 bg-gradient-to-b from-[#080A0F] to-titan-bg">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 max-w-xl">
            <p className="text-[11px] font-semibold text-titan-accent uppercase tracking-[0.12em] mb-4">Why TITAN</p>
            <h2 className="text-[36px] sm:text-[40px] font-bold text-white tracking-tight mb-5">Security without the compromise.</h2>
            <p className="text-[16px] text-titan-subtext leading-relaxed">Most wallets protect your keys. TITAN protects every action.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-titan-accent/[0.08] border border-titan-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-titan-accent/15 group-hover:border-titan-accent/30 transition-all duration-300">
                    <Icon size={20} className="text-titan-accent" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white mb-2">{b.title}</h3>
                    <p className="text-[13px] text-titan-subtext leading-[1.7]">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6 Layers Architecture ──────────────────────────────────────── */}
      <section id="security" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">
            
            {/* Left — Copy */}
            <div className="lg:col-span-5 lg:sticky lg:top-32">
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-titan-accent/10 border border-titan-accent/20 mb-8">
                <span className="text-[11px] font-bold text-titan-accent uppercase tracking-[0.12em]">Architecture</span>
              </div>
              <h2 className="text-[40px] sm:text-[44px] font-bold text-white tracking-tight leading-[1.08] mb-7">
                Six layers.
                <br />Zero single point
                <br />of failure.
              </h2>
              <p className="text-[16px] text-titan-subtext leading-[1.7] mb-4">
                Every transaction passes through all six layers independently. If any layer flags it, the action stops.
              </p>
              <p className="text-[14px] text-titan-subtext/70 mb-8">
                All layers are required. No shortcuts.
              </p>
              <Link to="/security" className="inline-flex items-center gap-2.5 text-[14px] font-semibold text-white hover:text-titan-accent transition-colors duration-200 group">
                View Security Center <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>

            {/* Right — Visual Stack */}
            <div className="lg:col-span-7">
              <LayerStack />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ + Coming Soon ─────────────────────────────────────────── */}
      <section id="faq" className="py-28 px-6 border-t border-titan-border/60">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
          
          {/* FAQ */}
          <div className="lg:col-span-8">
            <h2 className="text-[28px] font-bold text-white mb-10">Common questions</h2>
            <div>
              {faqs.map(faq => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="lg:col-span-4">
            <p className="text-[11px] font-semibold text-titan-subtext uppercase tracking-[0.12em] mb-6">Coming soon</p>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-5 border border-titan-border/50 rounded-2xl bg-titan-surface/40">
                <div className="w-10 h-10 rounded-xl bg-titan-bg border border-titan-border flex items-center justify-center">
                  <Puzzle size={18} className="text-titan-subtext" />
                </div>
                <div>
                  <span className="text-[14px] font-semibold text-titan-subtext">Chrome Extension</span>
                  <p className="text-[11px] text-titan-tertiary mt-0.5">In development</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 border border-titan-border/50 rounded-2xl bg-titan-surface/40">
                <div className="w-10 h-10 rounded-xl bg-titan-bg border border-titan-border flex items-center justify-center">
                  <Smartphone size={18} className="text-titan-subtext" />
                </div>
                <div>
                  <span className="text-[14px] font-semibold text-titan-subtext">Mobile App</span>
                  <p className="text-[11px] text-titan-tertiary mt-0.5">iOS & Android</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[300px] bg-titan-accent/[0.04] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-2xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-titan-surface border border-titan-border mb-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-titan-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-titan-success"></span>
            </span>
            <span className="text-[12px] font-semibold text-titan-text tracking-wide">Web Wallet — Live Now</span>
          </div>

          <h2 className="text-[44px] sm:text-[52px] font-extrabold text-white tracking-tight leading-[1.05] mb-6">
            Your wallet is
            <br />already waiting.
          </h2>

          <p className="text-[16px] text-titan-subtext mb-12 leading-relaxed">
            No extension. No app. Just open TITAN and start using it.
          </p>

          <Link
            to="/onboarding"
            className="bg-white text-[#06080C] font-bold text-[16px] px-12 py-4.5 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all duration-150 inline-flex items-center gap-2.5 shadow-lg shadow-white/10 mb-14"
          >
            Create Wallet — Free <ArrowRight size={18} strokeWidth={2.5} />
          </Link>

          <div className="flex items-center justify-center gap-5">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-titan-border" />
            <span className="text-[11px] text-titan-gold font-semibold tracking-[0.16em] uppercase">Secured by TITAN Protocol</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-titan-border" />
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;

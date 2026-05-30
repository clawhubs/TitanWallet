import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Key, Download, Fingerprint, Mail, Shield, Globe } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useWallet } from '../hooks/useWallet';

type OnboardingOption = 'create' | 'import' | 'google' | 'apple' | 'passkey' | 'email' | null;

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isConnected,
    address,
    hasSocialLogin,
    socialConfigReady,
    googleLoginEnabled,
    appleLoginEnabled,
  } = useWallet();
  const hasWalletSession = Boolean(isConnected && address);
  const [selected, setSelected] = useState<OnboardingOption>(null);
  const socialEnabled = hasSocialLogin && socialConfigReady;

  useEffect(() => {
    if (hasWalletSession) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasWalletSession, navigate]);

  const options = [
    {
      id: 'create' as OnboardingOption,
      icon: Key,
      title: 'Create a new wallet',
      desc: 'Generate a fresh wallet with a secure seed phrase.',
      recommended: true,
    },
    {
      id: 'import' as OnboardingOption,
      icon: Download,
      title: 'Import existing wallet',
      desc: 'Restore from seed phrase or private key.',
    },
    {
      id: 'google' as OnboardingOption,
      icon: Globe,
      title: 'Login with Google',
      desc: socialEnabled && googleLoginEnabled
        ? 'Google login creates a new TITAN wallet through the Privy MPC flow.'
        : 'Google login is disabled in the current Privy app.',
      recommended: false,
      disabled: !socialEnabled || !googleLoginEnabled,
    },
    ...(appleLoginEnabled ? [{
      id: 'apple' as OnboardingOption,
      icon: Mail,
      title: 'Login with Apple',
      desc: 'Apple login creates a new TITAN wallet through the Privy MPC flow.',
      disabled: !socialEnabled || !appleLoginEnabled,
    }] : []),
    {
      id: 'passkey' as OnboardingOption,
      icon: Fingerprint,
      title: 'Continue with Passkey',
      desc: 'Use your device biometrics for seamless login.',
      badge: 'Soon',
      disabled: true,
    },
    {
      id: 'email' as OnboardingOption,
      icon: Mail,
      title: 'Continue with Email',
      desc: 'Simple email-based wallet with MPC key management.',
      badge: 'Soon',
      disabled: true,
    },
  ];

  const handleContinue = () => {
    if (selected === 'create') navigate('/create-wallet');
    else if (selected === 'import') navigate('/create-wallet?mode=import');
    else if (selected === 'google') navigate('/create-wallet?auth=google');
    else if (selected === 'apple') navigate('/create-wallet?auth=apple');
  };

  return (
    <div className="min-h-screen bg-titan-bg flex flex-col items-center justify-center p-4">
      {/* Back to home */}
      <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center gap-2 text-sm text-titan-subtext hover:text-titan-text transition-colors">
        <span>←</span> Back
      </button>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden mix-blend-screen">
            <img src="/titan-logo.png" alt="TITAN Logo" className="h-full w-full object-cover scale-[1.45]" />
          </div>
          <span className="font-bold text-titan-text text-lg">TITAN Wallet</span>
        </div>

        <div className="titan-card p-6">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-titan-text mb-2">Welcome to TITAN</h1>
            <p className="text-sm text-titan-subtext">
              {appleLoginEnabled
                ? 'Choose how you want to get started. Google or Apple login creates a new TITAN wallet automatically.'
                : 'Choose how you want to get started. Google login creates a new TITAN wallet automatically.'}
            </p>
          </div>

          {!hasSocialLogin ? (
            <div className="mb-4 rounded-xl border border-titan-border bg-titan-surface px-4 py-3 text-xs text-titan-subtext">
              Social login is not configured because `VITE_PRIVY_APP_ID` is missing.
            </div>
          ) : null}
          {hasSocialLogin && !socialConfigReady ? (
            <div className="mb-4 rounded-xl border border-titan-border bg-titan-surface px-4 py-3 text-xs text-titan-subtext">
              Checking which login providers are enabled in the current Privy app.
            </div>
          ) : null}
          {socialEnabled && !googleLoginEnabled && !appleLoginEnabled ? (
            <div className="mb-4 rounded-xl border border-titan-danger/30 bg-titan-danger/5 px-4 py-3 text-xs text-titan-danger">
              The current Privy app has Google and Apple login disabled. Enable them in the Privy dashboard before offering social signup.
            </div>
          ) : null}

          {/* No install badge */}
          <div className="flex items-center gap-2 p-3 bg-titan-accent/5 border border-titan-accent/15 rounded-xl mb-5">
            <Globe size={14} className="text-titan-accent flex-shrink-0" />
            <p className="text-xs text-titan-subtext">
              This wallet runs entirely in your browser. <span className="text-titan-text font-medium">Nothing to install.</span>
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5 mb-6">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selected === opt.id;
              const isDisabled = Boolean(opt.disabled);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      setSelected(opt.id);
                    }
                  }}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
                    isDisabled
                      ? 'border-titan-border/70 bg-titan-surface/70 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-titan-accent/50 bg-titan-accent/5 shadow-titan'
                      : 'border-titan-border bg-titan-surface hover:border-titan-border/80 hover:bg-titan-muted/20'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-titan-accent/10' : 'bg-titan-muted/30'
                  }`}>
                    <Icon size={18} className={isSelected ? 'text-titan-accent' : 'text-titan-subtext'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-titan-text">{opt.title}</span>
                      {opt.recommended && <Badge variant="accent" size="sm">Recommended</Badge>}
                      {opt.badge && <Badge variant={isDisabled ? 'warning' : 'neutral'} size="sm">{opt.badge}</Badge>}
                    </div>
                    <p className="text-xs text-titan-subtext mt-0.5">{opt.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    isSelected ? 'border-titan-accent bg-titan-accent' : 'border-titan-border'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-titan-bg" />}
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            variant="primary"
            className="w-full"
            size="lg"
            disabled={!selected}
            onClick={handleContinue}
          >
            Continue <ArrowRight size={16} />
          </Button>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <Shield size={12} className="text-titan-success" />
          <p className="text-xs text-titan-subtext">9 wallet security rails ready from the first second</p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

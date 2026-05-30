import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Copy, Check, ShieldCheck, RefreshCw, Download } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useWallet } from '../hooks/useWallet';
import { useNetworkStore } from '../store/useNetworkStore';
import { useWalletStore } from '../store/useWalletStore';
import { runMilitaryGradeOperation } from '../services/militaryGrade';
import { WALLET_ACTION_LAYERS } from '../data/walletActionLayers';
import { addLocalWalletProof } from '../services/localActivity';
import { createNewWallet } from '../services/wallet';

type Step = 1 | 2 | 3 | 4;

const GOOGLE_WALLET_CREATE_LOCK_PREFIX = 'titan-google-wallet-create:';

function buildGoogleWalletCreateLockKey(identity: string | null) {
  const normalized = identity?.trim().toLowerCase();
  return normalized ? `${GOOGLE_WALLET_CREATE_LOCK_PREFIX}${normalized}` : null;
}

function readGoogleWalletCreateLock(lockKey: string | null) {
  if (!lockKey || typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(lockKey);
}

function writeGoogleWalletCreateLock(lockKey: string | null, status: 'in-flight' | 'done') {
  if (!lockKey || typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(lockKey, status);
}

function clearGoogleWalletCreateLock(lockKey: string | null) {
  if (!lockKey || typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(lockKey);
}

const CreateWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    createWallet,
    linkWalletToGoogle,
    importWallet,
    authLane,
    hasSocialLogin,
    privyReady,
    socialConfigReady,
    googleLoginEnabled,
    appleLoginEnabled,
    socialAuthenticated,
    socialUserName,
    socialUserEmail,
    socialProviderLabel,
    managedWalletReady,
    managedWalletMessage,
    managedWalletSession,
    socialProviderErrors,
    loginWithGoogle,
    loginWithApple,
  } = useWallet();
  const authProvider = useWalletStore((state) => state.authProvider);
  const connectWallet = useWalletStore((state) => state.connect);
  const walletAddress = useWalletStore((state) => state.address);
  const currentWalletName = useWalletStore((state) => state.walletName);
  const walletPrivateKey = useWalletStore((state) => state.privateKey);
  const hasWalletSession = useWalletStore((state) => Boolean(state.isConnected && state.address));
  const environment = useNetworkStore((state) => state.environment);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const isImportMode = searchParams.get('mode') === 'import';
  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const intent = searchParams.get('intent');
  const socialProvider = searchParams.get('auth');
  const socialAuthErrorCode = searchParams.get('error');
  const isSocialSignupFlow = socialProvider === 'google' || socialProvider === 'apple';
  const isRequestedSocialProviderEnabled = socialProvider === 'google'
    ? googleLoginEnabled
    : socialProvider === 'apple'
      ? appleLoginEnabled
      : false;
  const isAddAccountFlow = intent === 'add-account';
  const isAddWalletFlow = intent === 'add-wallet';
  const shouldRedirectExistingSession = useRef(hasWalletSession && !intent && !isImportMode && !isSocialSignupFlow);
  const socialAuthStarted = useRef(false);
  const googleWalletCreateStarted = useRef(false);
  const [step, setStep] = useState<Step>(1);
  const [showSeed, setShowSeed] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [downloadedBackup, setDownloadedBackup] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [creationProofStatus, setCreationProofStatus] = useState<'idle' | 'sealing' | 'sealed' | 'failed'>('idle');
  const [creationProofId, setCreationProofId] = useState<string | null>(null);
  const [importSecret, setImportSecret] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialSubmitting, setSocialSubmitting] = useState<'google' | 'apple' | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const socialIdentityLabel = socialUserName || socialUserEmail || 'Google account';
  const googleWalletName = socialUserEmail || socialUserName || 'Google Wallet';
  const googleWalletCreateLockKey = buildGoogleWalletCreateLockKey(socialUserEmail || socialUserName);
  const isGoogleLinkedLocalFlow = authLane === 'titan-managed' && socialAuthenticated && !isAddAccountFlow && !isAddWalletFlow;

  function getManagedAuthErrorMessage(code: string | null) {
    switch (code) {
      case 'google_not_configured':
        return 'Google auth is not configured in this TITAN Wallet deployment yet. Add the Google client ID, secret, and cookie secret in the wallet server config first.';
      case 'auth_config_missing':
        return 'The TITAN-managed auth lane is missing a required server secret. Complete the wallet server auth config first.';
      case 'oauth_state_mismatch':
        return 'The Google login session expired or changed tabs. Start the login flow again from TITAN Wallet.';
      case 'oauth_code_missing':
        return 'Google returned without an authorization code. Please try the login flow again.';
      case 'oauth_exchange_failed':
        return 'Google accepted the sign-in request, but TITAN Wallet could not finish the server exchange.';
      case 'oauth_userinfo_failed':
        return 'Google login finished, but TITAN Wallet could not read the user profile response.';
      default:
        return null;
    }
  }

  function getSocialDisabledMessage(provider: 'google' | 'apple') {
    if (!hasSocialLogin) {
      return 'This wallet deployment has not enabled the TITAN-managed social auth lane yet.';
    }

    if (!socialConfigReady) {
      return 'Checking the TITAN-managed auth configuration.';
    }

    return provider === 'apple'
      ? 'Apple login is not enabled in the TITAN-managed auth lane yet.'
      : `Google login is disabled in this TITAN Wallet deployment. ${socialProviderErrors[0] || 'Finish the wallet server Google auth config first.'}`;
  }
  const managedAuthErrorMessage = getManagedAuthErrorMessage(socialAuthErrorCode);
  const requestedSocialProviderError = isSocialSignupFlow && socialConfigReady && !isRequestedSocialProviderEnabled
    ? getSocialDisabledMessage(socialProvider === 'apple' ? 'apple' : 'google')
    : null;
  const socialLoginHeading = 'Google login unlocks a local TITAN wallet flow';
  const socialLoginDescription = 'The Google account is verified first, then the wallet is still created locally in this browser and linked back to that Google session.';

  useEffect(() => {
    if (shouldRedirectExistingSession.current) {
      navigate(returnTo, { replace: true });
    }
  }, [navigate, returnTo]);

  async function startSocialAuth(provider: 'google' | 'apple') {
    const providerEnabled = provider === 'google' ? googleLoginEnabled : appleLoginEnabled;
    if (!providerEnabled) {
      setSocialError(getSocialDisabledMessage(provider));
      return;
    }

    try {
      setSocialError(null);
      setSocialSubmitting(provider);

      if (provider === 'google') {
        await loginWithGoogle('/create-wallet?auth=google');
      } else {
        await loginWithApple();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start social login.';
      setSocialError(message.includes('not allowed') ? getSocialDisabledMessage(provider) : message);
      setSocialSubmitting(null);
    }
  }
  const startSocialAuthFromEffect = useEffectEvent((provider: 'google' | 'apple') => {
    void startSocialAuth(provider);
  });

  useEffect(() => {
    if (
      isImportMode
      || !socialProvider
      || socialAuthStarted.current
      || !hasSocialLogin
      || !privyReady
      || !socialConfigReady
      || hasWalletSession
      || (authLane === 'titan-managed' && socialAuthenticated)
    ) {
      return;
    }

    const provider = socialProvider === 'apple' ? 'apple' : 'google';
    if (!isRequestedSocialProviderEnabled) {
      return;
    }
    socialAuthStarted.current = true;
    const timeoutId = window.setTimeout(() => {
      startSocialAuthFromEffect(provider);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    googleLoginEnabled,
    appleLoginEnabled,
    authLane,
    hasSocialLogin,
    hasWalletSession,
    isImportMode,
    isRequestedSocialProviderEnabled,
    privyReady,
    socialConfigReady,
    socialAuthenticated,
    socialProvider,
  ]);

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonicWords.join(' '));
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const downloadRecoveryKit = () => {
    const mnemonic = mnemonicWords.join(' ');
    const fallbackName = isGoogleLinkedLocalFlow ? googleWalletName : name || currentWalletName || 'TITAN Wallet';
    const fileSlug = fallbackName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 48) || 'titan-wallet';
    const content = [
      'TITAN Wallet Recovery Kit',
      '',
      'Keep this file offline. Anyone with these secrets can control this wallet.',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Wallet name: ${fallbackName}`,
      `Address: ${walletAddress || 'Not available'}`,
      '',
      'Recovery phrase:',
      mnemonic || 'Not available',
      '',
      'Private key:',
      walletPrivateKey || 'Not available',
      '',
      'Security note:',
      'Do not upload this file to public storage or share it with support, admins, or apps.',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `titan-recovery-${fileSlug}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDownloadedBackup(true);
    window.setTimeout(() => setDownloadedBackup(false), 2000);
  };

  async function persistWalletProof(input: {
    address: string;
    eventType: string;
    description: string;
    source: 'create' | 'import' | 'social';
    walletLabel?: string | null;
  }) {
    try {
      setCreationProofStatus('sealing');
      const receipt = await runMilitaryGradeOperation({
        action: input.source === 'import' ? 'import-wallet' : 'create-wallet',
        walletAddress: input.address,
        network: environment,
        intent:
          input.source === 'import'
            ? 'Protect a wallet import flow inside the TITAN military-grade lane.'
            : input.source === 'social'
              ? 'Protect a social signup wallet creation flow inside the TITAN military-grade lane.'
              : 'Protect a new wallet creation flow inside the TITAN military-grade lane.',
        metadata: {
          event_type: input.eventType,
          description: input.description,
          wallet_name: input.walletLabel ?? name ?? null,
          source: input.source,
          auth_provider: input.source === 'social' ? authProvider : null,
        },
      });
      const proofId = receipt.request_id || `local-${input.source}-${Date.now()}`;
      setCreationProofId(proofId);
      setCreationProofStatus('sealed');
      addLocalWalletProof({
        walletAddress: input.address,
        network: activeNetwork.name,
        proof: {
          id: proofId,
          layer: 'Sovereign Memory',
          type: input.eventType,
          description: input.description,
          timestamp: new Date(),
          status: 'verified',
          proofStorageId: receipt['0g_storage_url'] || proofId,
        },
        securityEvents: [
          {
            type: input.eventType,
            desc: input.description,
            time: new Date(),
            level: 'success',
          },
        ],
      });
    } catch {
      setCreationProofStatus('failed');
    }
  }
  const handleCreateWallet = async (options?: { lockAlreadyAcquired?: boolean }) => {
    try {
      setIsSubmitting(true);
      setCreationProofStatus('idle');
      setCreationProofId(null);
      setImportError(null);

      if (isGoogleLinkedLocalFlow) {
        if (readGoogleWalletCreateLock(googleWalletCreateLockKey) && !options?.lockAlreadyAcquired) {
          return;
        }

        if (!options?.lockAlreadyAcquired) {
          writeGoogleWalletCreateLock(googleWalletCreateLockKey, 'in-flight');
        }

        const walletLabel = googleWalletName;
        const wallet = createNewWallet();

        try {
          await linkWalletToGoogle({
            walletName: walletLabel,
            address: wallet.address,
            mnemonic: wallet.mnemonic,
            privateKey: wallet.privateKey,
          });
          connectWallet({
            address: wallet.address,
            mnemonic: wallet.mnemonic,
            privateKey: wallet.privateKey,
            walletName: walletLabel,
            source: 'google',
            authProvider: 'google',
          });
          setMnemonicWords(wallet.mnemonic.split(' '));
          setShowSeed(false);
          setConfirmed(false);
          setStep(3);
          writeGoogleWalletCreateLock(googleWalletCreateLockKey, 'done');
          await persistWalletProof({
            address: wallet.address,
            eventType: 'Google Linked Wallet Creation Proof',
            description: 'Local wallet creation and Google account binding were sealed through the TITAN onboarding flow.',
            source: 'social',
            walletLabel,
          });
        } catch (error) {
          clearGoogleWalletCreateLock(googleWalletCreateLockKey);
          throw error;
        }
        return;
      }

      const wallet = createWallet(name);
      setMnemonicWords(wallet.mnemonic.split(' '));
      setShowSeed(false);
      setConfirmed(false);
      setStep(3);
      await persistWalletProof({
        address: wallet.address,
        eventType: 'Wallet Creation Proof',
        description: 'Wallet creation was sealed through the TITAN onboarding flow.',
        source: 'create',
        walletLabel: name || 'TITAN Wallet',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createGoogleWalletFromEffect = useEffectEvent((lockAlreadyAcquired?: boolean) => {
    void handleCreateWallet({ lockAlreadyAcquired });
  });

  useEffect(() => {
    if (
      !isGoogleLinkedLocalFlow
      || step !== 1
      || !managedWalletReady
      || Boolean(managedWalletSession?.address)
      || isSubmitting
      || googleWalletCreateStarted.current
      || Boolean(readGoogleWalletCreateLock(googleWalletCreateLockKey))
    ) {
      return;
    }

    googleWalletCreateStarted.current = true;
    writeGoogleWalletCreateLock(googleWalletCreateLockKey, 'in-flight');
    createGoogleWalletFromEffect(true);
  }, [
    isGoogleLinkedLocalFlow,
    isSubmitting,
    managedWalletReady,
    managedWalletSession,
    step,
    googleWalletCreateLockKey,
  ]);

  const handleImportWallet = async () => {
    try {
      setIsSubmitting(true);
      setImportError(null);
      setCreationProofStatus('idle');
      setCreationProofId(null);
      const wallet = importWallet(importSecret, name || 'Imported TITAN Wallet');
      setMnemonicWords(wallet.mnemonic ? wallet.mnemonic.split(' ') : []);
      setShowSeed(false);
      setConfirmed(false);
      setStep(4);
      await persistWalletProof({
        address: wallet.address,
        eventType: 'Wallet Import Proof',
        description: 'Wallet import was sealed through the TITAN onboarding flow.',
        source: 'import',
        walletLabel: name || 'Imported TITAN Wallet',
      });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unable to import this wallet secret.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = isImportMode ? [
    { n: 1, label: 'Import' },
    { n: 4, label: 'Done' },
  ] : [
    { n: 1, label: 'Account' },
    { n: 2, label: 'Confirm' },
    { n: 3, label: 'Backup' },
    { n: 4, label: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-titan-bg flex flex-col items-center justify-center p-4">
      <button
        onClick={() => step === 1 ? navigate(isAddAccountFlow || isAddWalletFlow ? returnTo : '/onboarding') : isImportMode ? setStep(1) : setStep((s) => (s - 1) as Step)}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-titan-subtext hover:text-titan-text transition-colors"
      >
        ← Back
      </button>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden mix-blend-screen">
            <img src="/titan-logo.png" alt="TITAN Logo" className="h-full w-full object-cover scale-[1.45]" />
          </div>
          <span className="font-bold text-titan-text">TITAN Wallet</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.n ? 'bg-titan-accent text-titan-bg' : step > s.n ? 'bg-titan-success text-titan-bg' : 'bg-titan-muted text-titan-subtext'
                }`}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === s.n ? 'text-titan-text' : 'text-titan-subtext'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-8 transition-all ${step > s.n ? 'bg-titan-success' : 'bg-titan-border'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="titan-card p-6">
          {/* Step 1: Account Setup */}
          {isImportMode && step === 1 && (
            <div>
              <h1 className="text-lg font-bold text-titan-text mb-1">Import your wallet</h1>
              <p className="text-sm text-titan-subtext mb-6">Paste a 12-word recovery phrase or a raw private key to restore an existing wallet into this browser tab session.</p>
              <div className="space-y-4">
                <div>
                  <label className="titan-label block mb-2">Wallet name</label>
                  <input
                    className="titan-input font-sans"
                    placeholder="Imported TITAN Wallet"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="titan-label block mb-2">Recovery phrase or private key</label>
                  <textarea
                    className="titan-input min-h-32 font-mono"
                    placeholder="word1 word2 ... word12 OR 0xabc123..."
                    value={importSecret}
                    onChange={(e) => setImportSecret(e.target.value)}
                  />
                </div>
                {importError ? (
                  <p className="text-xs text-titan-danger">{importError}</p>
                ) : null}
              </div>
              <Button
                variant="primary"
                className="w-full mt-6"
                size="lg"
                disabled={!importSecret.trim()}
                loading={isSubmitting}
                onClick={() => void handleImportWallet()}
              >
                Import Wallet <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {!isImportMode && step === 1 && (
            <div>
              <h1 className="text-lg font-bold text-titan-text mb-1">{isAddAccountFlow ? 'Add another account' : 'Set up your account'}</h1>
              <p className="text-sm text-titan-subtext mb-6">
                {isAddAccountFlow
                  ? 'Create another self-custodial account and keep it alongside your existing wallets.'
                  : isGoogleLinkedLocalFlow
                    ? 'Google login is active. Now create a normal local wallet and TITAN will bind it to this Google session.'
                    : 'Choose a name and password to protect your wallet locally.'}
              </p>
              {!isAddAccountFlow && !isAddWalletFlow ? (
                <>
                  <div className="mb-6 rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{socialLoginHeading}</p>
                        <p className="text-xs text-titan-subtext">{socialLoginDescription}</p>
                      </div>
                      <Badge variant={hasSocialLogin && socialConfigReady ? 'accent' : 'neutral'} size="sm">
                        {!hasSocialLogin
                          ? 'Not configured'
                          : !socialConfigReady
                            ? 'Checking lane'
                            : socialProviderLabel}
                      </Badge>
                    </div>
                    {authLane === 'titan-managed' && socialAuthenticated ? (
                      <div className="mb-3 rounded-xl border border-titan-accent/20 bg-titan-accent/5 px-3 py-3 text-xs text-titan-subtext">
                        <span className="font-medium text-white">Signed in:</span> {socialIdentityLabel}. Finish wallet creation below.
                        {!managedWalletReady ? (
                          <span className="mt-1 block text-titan-warning">{managedWalletMessage}</span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className={`grid grid-cols-1 gap-2 ${appleLoginEnabled ? 'sm:grid-cols-2' : ''}`}>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        disabled={!hasSocialLogin || !privyReady || !socialConfigReady || !googleLoginEnabled || (authLane === 'titan-managed' && socialAuthenticated)}
                        loading={socialSubmitting === 'google'}
                        onClick={() => void startSocialAuth('google')}
                      >
                        {authLane === 'titan-managed' && socialAuthenticated ? 'Google linked' : 'Login Google'}
                      </Button>
                      {appleLoginEnabled ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          disabled={!hasSocialLogin || !privyReady || !socialConfigReady || !appleLoginEnabled}
                          loading={socialSubmitting === 'apple'}
                          onClick={() => void startSocialAuth('apple')}
                        >
                          Login Apple
                        </Button>
                      ) : null}
                    </div>
                    {!hasSocialLogin ? (
                      <p className="mt-3 text-xs text-titan-subtext">
                        Enable the TITAN-managed consumer auth lane in this wallet server deployment to offer Google login.
                      </p>
                    ) : null}
                    {hasSocialLogin && !socialConfigReady ? (
                      <p className="mt-3 text-xs text-titan-subtext">
                        Checking which login providers are enabled in the TITAN-managed auth lane.
                      </p>
                    ) : null}
                    {hasSocialLogin && socialConfigReady && !googleLoginEnabled && !appleLoginEnabled ? (
                      <p className="mt-3 text-xs text-titan-danger">
                        {socialProviderErrors[0] || 'No social provider is enabled in this TITAN-managed auth lane yet.'}
                      </p>
                    ) : null}
                    {socialError || managedAuthErrorMessage ? (
                      <p className="mt-3 text-xs text-titan-danger">{socialError || managedAuthErrorMessage}</p>
                    ) : requestedSocialProviderError ? (
                      <p className="mt-3 text-xs text-titan-danger">{requestedSocialProviderError}</p>
                    ) : null}
                  </div>
                  {!isGoogleLinkedLocalFlow ? (
                    <div className="mb-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-titan-border" />
                      <span className="text-[11px] uppercase tracking-[0.2em] text-titan-subtext">or self-custody</span>
                      <div className="h-px flex-1 bg-titan-border" />
                    </div>
                  ) : null}
                </>
              ) : null}
              <div className="space-y-4">
                {isGoogleLinkedLocalFlow ? (
                  <div className="rounded-2xl border border-titan-accent/20 bg-titan-accent/5 px-4 py-3 text-xs text-titan-subtext">
                    <span className="font-medium text-white">Wallet name:</span> {googleWalletName}
                  </div>
                ) : (
                  <div>
                    <label className="titan-label block mb-2">Wallet name</label>
                    <input
                      className="titan-input font-sans"
                      placeholder="My TITAN Wallet"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}
                {!isGoogleLinkedLocalFlow ? (
                  <>
                    <div>
                      <label className="titan-label block mb-2">Password</label>
                      <div className="relative">
                        <input
                          className="titan-input font-sans pr-10"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-titan-subtext hover:text-titan-text">
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="titan-label block mb-2">Confirm password</label>
                      <input
                        className="titan-input font-sans"
                        type="password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-titan-danger text-xs mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
              {isGoogleLinkedLocalFlow ? (
                <div className="mt-4 rounded-2xl border border-titan-accent/20 bg-titan-accent/5 px-4 py-3 text-xs text-titan-subtext">
                  <span className="font-medium text-white">Google-linked:</span> creating your local wallet automatically. No extra wallet password or name step is needed for this Google flow.
                </div>
              ) : null}
              <Button
                variant="primary"
                className="w-full mt-6"
                size="lg"
                loading={isSubmitting}
                disabled={isGoogleLinkedLocalFlow ? !managedWalletReady : !name || password.length < 8 || password !== confirmPassword}
                onClick={() => {
                  if (isGoogleLinkedLocalFlow) {
                    void handleCreateWallet();
                    return;
                  }

                  setStep(2);
                }}
              >
                {isGoogleLinkedLocalFlow ? 'Creating Wallet' : 'Continue'} <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {/* Step 2: Confirm */}
          {!isImportMode && step === 2 && (
            <div>
              <h1 className="text-lg font-bold text-titan-text mb-1">
                {isAddAccountFlow ? 'Create another account' : 'Create your wallet'}
              </h1>
              <p className="text-sm text-titan-subtext mb-6">
                {isAddAccountFlow
                  ? 'A fresh Ethereum-compatible account will be added to your local TITAN wallet list.'
                  : isGoogleLinkedLocalFlow
                    ? 'The wallet will be generated locally, then linked back to this Google identity for future restore.'
                    : 'A new Ethereum-compatible wallet will be generated for you.'}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 bg-titan-surface rounded-xl border border-titan-border">
                  <ShieldCheck size={16} className="text-titan-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-titan-text">Self-custodial</p>
                    <p className="text-xs text-titan-subtext mt-0.5">
                      Your keys are generated on your device and never leave it unencrypted.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-titan-surface rounded-xl border border-titan-border">
                  <ShieldCheck size={16} className="text-titan-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-titan-text">Wallet rails initialize from creation</p>
                    <p className="text-xs text-titan-subtext mt-0.5">
                      Secure Compute / TEE, Sovereign Memory, and Nitro are activated as soon as the wallet is created.
                    </p>
                  </div>
                </div>
                {isGoogleLinkedLocalFlow ? (
                  <div className="flex items-start gap-3 p-3 bg-titan-warning/10 rounded-xl border border-titan-warning/20">
                    <RefreshCw size={16} className="text-titan-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-titan-text">Google restore binding</p>
                      <p className="text-xs text-titan-subtext mt-0.5">{managedWalletMessage}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-titan-muted/20 rounded-xl border border-titan-border">
                    <RefreshCw size={16} className="text-titan-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-titan-text">You will receive a 12-word seed phrase</p>
                      <p className="text-xs text-titan-subtext mt-0.5">Store it securely offline. It's the only way to recover your wallet if you lose access.</p>
                    </div>
                  </div>
                )}
              </div>

              <Button variant="primary" className="w-full" size="lg" loading={isSubmitting} onClick={() => void handleCreateWallet()}>
                Create Wallet <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {/* Step 3: Backup */}
          {!isImportMode && step === 3 && (
            <div>
              <h1 className="text-lg font-bold text-titan-text mb-1">Back up your wallet</h1>
              <p className="text-sm text-titan-subtext mb-1">This is your <span className="text-titan-warning font-medium">secret recovery phrase</span>. Write it down and keep it offline.</p>
              <p className="text-xs text-titan-danger mb-5">Never share this with anyone. TITAN will never ask for it.</p>

              {/* Seed phrase */}
              <div className="relative mb-4">
                <div className={`grid grid-cols-3 gap-2 p-4 bg-titan-surface rounded-xl border border-titan-border ${!showSeed ? 'select-none' : ''}`}>
                  {mnemonicWords.map((word, i) => (
                    <div key={i} className={`flex items-center gap-2 ${!showSeed ? 'blur-sm' : ''}`}>
                      <span className="text-xs text-titan-subtext w-4 text-right flex-shrink-0">{i + 1}.</span>
                      <span className="text-xs font-mono font-medium text-titan-text">{word}</span>
                    </div>
                  ))}
                </div>
                {!showSeed && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-titan-surface/60 backdrop-blur-sm">
                    <button onClick={() => setShowSeed(true)} className="flex items-center gap-2 text-sm font-medium text-titan-accent hover:text-titan-accentDark transition-colors">
                      <Eye size={16} /> Reveal seed phrase
                    </button>
                  </div>
                )}
              </div>

              {showSeed && (
                <div className="mb-4 flex flex-wrap gap-3">
                  <button onClick={copyMnemonic} className="flex items-center gap-2 text-xs text-titan-subtext hover:text-titan-text transition-colors">
                    {copiedSeed ? <Check size={13} className="text-titan-success" /> : <Copy size={13} />}
                    {copiedSeed ? 'Copied!' : 'Copy to clipboard'}
                  </button>
                  <button onClick={downloadRecoveryKit} className="flex items-center gap-2 text-xs text-titan-subtext hover:text-titan-text transition-colors">
                    {downloadedBackup ? <Check size={13} className="text-titan-success" /> : <Download size={13} />}
                    {downloadedBackup ? 'Downloaded' : 'Download recovery kit'}
                  </button>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 accent-[#4ECDC4]"
                />
                <span className="text-xs text-titan-subtext leading-relaxed">
                  I have written down my seed phrase and stored it in a safe, offline location.
                </span>
              </label>

              <Button
                variant="primary"
                className="w-full"
                size="lg"
                disabled={!confirmed || !showSeed}
                onClick={() => setStep(4)}
              >
                I've saved it safely <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-titan-success/10 border border-titan-success/30 flex items-center justify-center mx-auto mb-5">
                <ShieldCheck size={32} className="text-titan-success" />
              </div>
              <h1 className="text-xl font-bold text-titan-text mb-2">
                {isSocialSignupFlow
                  ? 'Wallet TITAN created from social login.'
                  : isImportMode
                    ? 'Wallet imported.'
                    : isAddAccountFlow
                      ? 'Account added.'
                      : 'Wallet created.'}
              </h1>
              <p className="text-sm text-titan-subtext mb-2">
                {isSocialSignupFlow
                  ? `${socialIdentityLabel} is now linked to this local TITAN wallet. Your recovery phrase and private key stay available in Settings just like the original local flow.`
                  : isImportMode
                    ? 'Your wallet is ready in this browser tab session. You can reveal the recovery phrase or private key from Settings while the tab stays open.'
                    : isAddAccountFlow
                      ? 'Your new account is now stored alongside your other TITAN wallet accounts in this browser session.'
                      : 'Your TITAN Wallet is ready. The wallet security rails are active for this tab session.'}
              </p>
              <Badge variant="success" dot className="mb-6">Wallet rails ready</Badge>
              {creationProofStatus === 'sealed' ? (
                <p className="mb-4 text-xs text-titan-success">Wallet proof sealed successfully: {creationProofId}</p>
              ) : null}
              {isGoogleLinkedLocalFlow && managedWalletSession ? (
                <p className="mb-4 text-xs text-titan-subtext">Google-linked wallet address: {managedWalletSession.address}</p>
              ) : null}
              {creationProofStatus === 'failed' ? (
                <p className="mb-4 text-xs text-titan-warning">Wallet is ready locally, but the security rail did not return a receipt yet.</p>
              ) : null}

              <div className="grid grid-cols-2 gap-2 mb-6 text-left">
                {[
                  ...(isImportMode ? WALLET_ACTION_LAYERS['import-wallet'] : WALLET_ACTION_LAYERS['create-wallet']),
                  ...(creationProofStatus === 'sealed'
                    ? ([
                        '0G Storage Proof Layer',
                        'Zero-Knowledge Proof Layer',
                        'ProofRegistry Anchor',
                      ] as const)
                    : []),
                ].map((l) => (
                  <div key={l} className="flex items-center gap-2 p-2 bg-titan-success/5 rounded-lg border border-titan-success/10">
                    <ShieldCheck size={12} className="text-titan-success flex-shrink-0" />
                    <span className="text-xs text-titan-text">{l}</span>
                  </div>
                ))}
              </div>

              <Button variant="primary" className="w-full" size="lg" onClick={() => navigate(returnTo)}>
                Open Dashboard <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateWalletPage;

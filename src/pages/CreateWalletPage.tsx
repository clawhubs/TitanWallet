import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Copy, Check, ShieldCheck, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useWallet } from '../hooks/useWallet';
import { useNetworkStore } from '../store/useNetworkStore';
import { createChallenge, seal } from '../services/integrity';
import { signMessage as signWalletMessage } from '../services/wallet';
import { hasTitanSecurityAccess } from '../config/api';
import { runMilitaryGradeOperation } from '../services/militaryGrade';
import { WALLET_ACTION_LAYERS } from '../data/walletActionLayers';

type Step = 1 | 2 | 3 | 4;

const CreateWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createWallet, importWallet } = useWallet();
  const environment = useNetworkStore((state) => state.environment);
  const isImportMode = searchParams.get('mode') === 'import';
  const [step, setStep] = useState<Step>(1);
  const [showSeed, setShowSeed] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [creationProofStatus, setCreationProofStatus] = useState<'idle' | 'sealing' | 'sealed' | 'skipped' | 'failed'>('idle');
  const [creationProofId, setCreationProofId] = useState<string | null>(null);
  const [importSecret, setImportSecret] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonicWords.join(' '));
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const persistWalletProof = async (input: {
    address: string;
    privateKey: string;
    eventType: string;
    description: string;
    source: 'create' | 'import';
  }) => {
    if (!hasTitanSecurityAccess()) {
      setCreationProofStatus('skipped');
      return;
    }

    try {
      setCreationProofStatus('sealing');
      await runMilitaryGradeOperation({
        action: input.source === 'create' ? 'create-wallet' : 'import-wallet',
        walletAddress: input.address,
        network: environment,
        intent:
          input.source === 'create'
            ? 'Protect a new wallet creation flow inside the TITAN military-grade lane.'
            : 'Protect a wallet import flow inside the TITAN military-grade lane.',
        metadata: {
          event_type: input.eventType,
          description: input.description,
          wallet_name: name || null,
          source: input.source,
        },
      });
      const challenge = await createChallenge({
        operation: 'seal',
        walletAddress: input.address,
        network: environment,
      });
      const signature = await signWalletMessage(challenge.message, input.privateKey);
      const result = await seal({
        walletAddress: input.address,
        network: environment,
        challengeId: challenge.challenge_id,
        message: challenge.message,
        signature,
        plaintext: JSON.stringify({
          wallet_name: name,
          created_at: new Date().toISOString(),
          flow: input.source,
          environment,
          wallet_address: input.address,
          app: 'titan-wallet',
        }),
        metadata: {
          event_type: input.eventType,
          description: input.description,
          layer_name: 'Sovereign Memory',
        },
      });
      setCreationProofStatus('sealed');
      setCreationProofId(result.storage_id);
    } catch {
      setCreationProofStatus('failed');
    }
  };

  const handleCreateWallet = async () => {
    try {
      setIsSubmitting(true);
      setCreationProofStatus('idle');
      const wallet = createWallet(name);
      setMnemonicWords(wallet.mnemonic.split(' '));
      setShowSeed(false);
      setConfirmed(false);
      setCreationProofId(null);
      setImportError(null);
      setStep(3);
      await persistWalletProof({
        address: wallet.address,
        privateKey: wallet.privateKey,
        eventType: 'Wallet Creation Proof',
        description: 'Wallet creation was sealed through the TITAN onboarding flow.',
        source: 'create',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        privateKey: wallet.privateKey,
        eventType: 'Wallet Import Proof',
        description: 'Wallet import was sealed through the TITAN onboarding flow.',
        source: 'import',
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
      <button onClick={() => step === 1 ? navigate('/onboarding') : isImportMode ? setStep(1) : setStep((s) => (s - 1) as Step)} className="absolute top-6 left-6 flex items-center gap-2 text-sm text-titan-subtext hover:text-titan-text transition-colors">
        ← Back
      </button>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-titan-accent/10 border border-titan-accent/30 flex items-center justify-center">
            <span className="text-titan-accent font-bold text-sm">T</span>
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
              <p className="text-sm text-titan-subtext mb-6">Paste a 12-word recovery phrase or a raw private key to restore an existing wallet into this browser session.</p>
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
              <h1 className="text-lg font-bold text-titan-text mb-1">Set up your account</h1>
              <p className="text-sm text-titan-subtext mb-6">Choose a name and password to protect your wallet locally.</p>
              <div className="space-y-4">
                <div>
                  <label className="titan-label block mb-2">Wallet name</label>
                  <input
                    className="titan-input font-sans"
                    placeholder="My TITAN Wallet"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
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
              </div>
              <Button
                variant="primary"
                className="w-full mt-6"
                size="lg"
                disabled={!name || password.length < 8 || password !== confirmPassword}
                onClick={() => setStep(2)}
              >
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {/* Step 2: Confirm */}
          {!isImportMode && step === 2 && (
            <div>
              <h1 className="text-lg font-bold text-titan-text mb-1">Create your wallet</h1>
              <p className="text-sm text-titan-subtext mb-6">A new Ethereum-compatible wallet will be generated for you.</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 bg-titan-surface rounded-xl border border-titan-border">
                  <ShieldCheck size={16} className="text-titan-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-titan-text">Self-custodial</p>
                    <p className="text-xs text-titan-subtext mt-0.5">Your keys are generated on your device and never leave it unencrypted.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-titan-surface rounded-xl border border-titan-border">
                  <ShieldCheck size={16} className="text-titan-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-titan-text">Wallet rails initialize from creation</p>
                    <p className="text-xs text-titan-subtext mt-0.5">Secure Compute / TEE, Sovereign Memory, and Nitro are activated as soon as the wallet is created.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-titan-muted/20 rounded-xl border border-titan-border">
                  <RefreshCw size={16} className="text-titan-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-titan-text">You will receive a 12-word seed phrase</p>
                    <p className="text-xs text-titan-subtext mt-0.5">Store it securely offline. It's the only way to recover your wallet if you lose access.</p>
                  </div>
                </div>
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
                <button onClick={copyMnemonic} className="flex items-center gap-2 text-xs text-titan-subtext hover:text-titan-text transition-colors mb-4">
                  {copiedSeed ? <Check size={13} className="text-titan-success" /> : <Copy size={13} />}
                  {copiedSeed ? 'Copied!' : 'Copy to clipboard'}
                </button>
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
              <h1 className="text-xl font-bold text-titan-text mb-2">{isImportMode ? 'Wallet imported.' : 'Wallet created.'}</h1>
              <p className="text-sm text-titan-subtext mb-2">
                {isImportMode
                  ? 'Your wallet is ready in this browser session. You can reveal the recovery phrase or private key from Settings while the session stays open.'
                  : 'Your TITAN Wallet is ready. The wallet security rails are active for this session.'}
              </p>
              <Badge variant="success" dot className="mb-6">Wallet rails ready</Badge>
              {creationProofStatus === 'sealed' ? (
                <p className="mb-4 text-xs text-titan-success">Wallet proof sealed successfully: {creationProofId}</p>
              ) : null}
              {creationProofStatus === 'skipped' ? (
                <p className="mb-4 text-xs text-titan-subtext">No API key configured, so wallet proof sealing was skipped for now.</p>
              ) : null}
              {creationProofStatus === 'failed' ? (
                <p className="mb-4 text-xs text-titan-warning">Wallet is ready locally, but proof sealing did not complete.</p>
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

              <Button variant="primary" className="w-full" size="lg" onClick={() => navigate('/dashboard')}>
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

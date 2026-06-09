import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import { generateSolanaWallet, generateTonWallet, type SolanaWallet, type TonWallet } from '../services/multichain';

function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div>
      <span className="titan-label block mb-1.5">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-titan-border bg-titan-bg/40 px-3 py-2.5">
        <span className={`flex-1 break-all text-xs text-titan-text ${mono ? 'font-mono' : ''}`}>{value}</span>
        <button onClick={copy} className="shrink-0 text-titan-subtext hover:text-titan-accent transition-colors" aria-label={`Copy ${label}`}>
          {copied ? <Check size={15} className="text-titan-success" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}

const MultiChainWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const [sol, setSol] = useState<SolanaWallet | null>(null);
  const [ton, setTon] = useState<TonWallet | null>(null);
  const [solBusy, setSolBusy] = useState(false);
  const [tonBusy, setTonBusy] = useState(false);
  const [tonError, setTonError] = useState<string | null>(null);
  const [revealSol, setRevealSol] = useState(false);
  const [revealTon, setRevealTon] = useState(false);

  const makeSolana = () => {
    setSolBusy(true);
    try {
      setSol(generateSolanaWallet());
      setRevealSol(false);
    } finally {
      setSolBusy(false);
    }
  };

  const makeTon = async () => {
    setTonBusy(true);
    setTonError(null);
    try {
      setTon(await generateTonWallet());
      setRevealTon(false);
    } catch (e) {
      setTonError(e instanceof Error ? e.message : 'Failed to generate TON wallet.');
    } finally {
      setTonBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-titan-bg flex flex-col items-center px-4 py-10">
      <button onClick={() => navigate(-1)} className="absolute top-6 left-6 flex items-center gap-2 text-sm text-titan-subtext hover:text-titan-text transition-colors">← Back</button>

      <div className="w-full max-w-2xl animate-slide-up">
        <div className="flex items-center gap-2.5 justify-center mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
            <img src="/titan-logo-transparent.png" alt="TITAN Logo" className="h-full w-full object-cover scale-[1.45]" />
          </div>
          <span className="font-bold text-titan-text">TITAN Wallet</span>
        </div>
        <h1 className="text-2xl font-bold text-titan-text text-center">Create a Solana or TON wallet</h1>
        <p className="text-sm text-titan-subtext text-center mt-2 mb-8 max-w-lg mx-auto">
          Generate a self-custodial wallet on Solana or TON. Keys are created locally in your browser — back up the secret before you leave this page.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Solana */}
          <div className="titan-card p-5" data-testid="solana-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#14F195]/15 text-[#14F195] flex items-center justify-center font-bold text-sm">S</span>
                <div>
                  <h2 className="text-sm font-bold text-titan-text">Solana</h2>
                  <p className="text-[11px] text-titan-subtext">ed25519 keypair</p>
                </div>
              </div>
              <Sparkles size={16} className="text-titan-accent" />
            </div>

            <Button variant="primary" size="md" className="w-full" loading={solBusy} onClick={makeSolana} data-testid="generate-solana">
              {sol ? 'Regenerate' : 'Generate Solana wallet'}
            </Button>

            {sol && (
              <div className="mt-4 space-y-3">
                <CopyField label="Address" value={sol.address} />
                <div data-testid="solana-address" className="hidden">{sol.address}</div>
                <div>
                  <button onClick={() => setRevealSol((v) => !v)} className="flex items-center gap-1.5 text-xs text-titan-subtext hover:text-titan-text mb-1.5">
                    {revealSol ? <EyeOff size={13} /> : <Eye size={13} />} {revealSol ? 'Hide' : 'Reveal'} secret key
                  </button>
                  {revealSol && <CopyField label="Secret key (base58)" value={sol.secretKey} />}
                </div>
              </div>
            )}
          </div>

          {/* TON */}
          <div className="titan-card p-5" data-testid="ton-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#0098EA]/15 text-[#0098EA] flex items-center justify-center font-bold text-sm">T</span>
                <div>
                  <h2 className="text-sm font-bold text-titan-text">TON</h2>
                  <p className="text-[11px] text-titan-subtext">Wallet v4R2</p>
                </div>
              </div>
              <Sparkles size={16} className="text-titan-accent" />
            </div>

            <Button variant="primary" size="md" className="w-full" loading={tonBusy} onClick={() => void makeTon()} data-testid="generate-ton">
              {ton ? 'Regenerate' : 'Generate TON wallet'}
            </Button>

            {tonError && <p className="mt-3 text-xs text-titan-danger">{tonError}</p>}

            {ton && (
              <div className="mt-4 space-y-3">
                <CopyField label="Address" value={ton.address} />
                <div data-testid="ton-address" className="hidden">{ton.address}</div>
                <div>
                  <button onClick={() => setRevealTon((v) => !v)} className="flex items-center gap-1.5 text-xs text-titan-subtext hover:text-titan-text mb-1.5">
                    {revealTon ? <EyeOff size={13} /> : <Eye size={13} />} {revealTon ? 'Hide' : 'Reveal'} recovery phrase
                  </button>
                  {revealTon && <CopyField label="24-word mnemonic" value={ton.mnemonic} mono={false} />}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-titan-border bg-titan-surface/60 px-4 py-3">
          <ShieldCheck size={16} className="text-titan-accent shrink-0 mt-0.5" />
          <p className="text-xs text-titan-subtext">
            These keys are generated locally and never sent anywhere. Save the secret key / recovery phrase offline — anyone with it controls the wallet. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiChainWalletPage;

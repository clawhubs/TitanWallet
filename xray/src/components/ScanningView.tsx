'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, Search, Database, AlertTriangle, CheckCircle2, Bot } from 'lucide-react';
import type { AIAnalysisResult, ScanResponse, XRaySessionResult } from '@/types/scanner';

const SCAN_STEPS = [
  { icon: <Search size={16} />, label: 'Fetching approval logs from explorers and RPC…' },
  { icon: <Database size={16} />, label: 'Reading token metadata and spender details…' },
  { icon: <AlertTriangle size={16} />, label: 'Scoring unlimited approvals and known drainers…' },
  { icon: <Shield size={16} />, label: 'Compiling multi-chain health report…' },
  { icon: <Bot size={16} />, label: 'Requesting Qwen AI risk analysis…' },
  { icon: <CheckCircle2 size={16} />, label: 'Finalizing read-only X-Ray report…' },
];

interface ScanningViewProps {
  address: string;
  chains: number[];
  onComplete: (result: XRaySessionResult) => void;
  onError: (message: string) => void;
}

export default function ScanningView({ address, chains, onComplete, onError }: ScanningViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(8);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    async function run() {
      try {
        setCurrentStep(0);
        setProgress(18);
        const scanResponse = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, chains }),
        });
        const scanPayload = await scanResponse.json();
        if (!scanResponse.ok) throw new Error(scanPayload.error || 'Wallet scan failed.');
        if (cancelled) return;

        setCurrentStep(4);
        setProgress(76);
        const aiResponse = await fetch('/api/ai-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, scanResults: scanPayload }),
        });
        const aiPayload = await aiResponse.json();
        if (!aiResponse.ok) throw new Error(aiPayload.error || 'AI analysis failed.');
        if (cancelled) return;

        setCurrentStep(5);
        setProgress(100);
        setTimeout(() => {
          const detectedChains = Object.values((scanPayload as ScanResponse).results).map((result) => ({
            chainId: result.chain.chainId,
            chainName: result.chain.name,
            chainShortName: result.chain.shortName,
            nativeSymbol: result.chain.nativeSymbol || result.chain.shortName,
            nativeBalance: '0',
            nativeBalanceFormatted: `Active ${result.chain.shortName}`,
            hasActivity: true,
            explorerUrl: result.chain.explorerUrl,
          }));
          onComplete({
            address,
            detectedChains,
            scan: scanPayload as ScanResponse,
            ai: aiPayload as AIAnalysisResult,
          });
        }, 350);
      } catch (error) {
        if (!cancelled) onError(error instanceof Error ? error.message : 'X-Ray scan failed.');
      }
    }

    void run();
    const timer = setInterval(() => {
      setProgress((value) => Math.min(value + 4, 72));
      setCurrentStep((step) => Math.min(step + 1, 3));
    }, 1100);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [address, chains, onComplete, onError]);

  const short = (a: string) => a.length > 16 ? `${a.slice(0, 8)}...${a.slice(-6)}` : a;

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--xray-border)] opacity-30" />
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="60" fill="none" stroke="var(--xray-accent)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${progress * 3.77} 377`} className="transition-all duration-300"
              style={{ filter: 'drop-shadow(0 0 6px rgba(var(--xray-accent-rgb), 0.4))' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-[var(--xray-text)]">{Math.round(progress)}%</div>
            <div className="text-[10px] font-medium text-[var(--xray-subtext)] uppercase tracking-wider">Scanning</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--xray-surface)] border border-[var(--xray-border)] mb-6" style={{ boxShadow: 'var(--xray-shadow-sm)' }}>
          <span className="text-xs font-medium text-[var(--xray-subtext)] uppercase tracking-wider">Scanning</span>
          <code className="text-xs font-mono text-[var(--xray-accent)]">{short(address)}</code>
          <span className="text-[10px] text-[var(--xray-tertiary)]">{chains.length} chain(s)</span>
        </div>
        <div className="space-y-3 max-w-sm mx-auto">
          {SCAN_STEPS.map((step, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
              ${i < currentStep ? 'text-[var(--xray-success)] bg-[rgba(62,189,122,0.06)]'
                : i === currentStep ? 'text-[var(--xray-accent)] bg-[rgba(78,205,196,0.06)] border-glow'
                : 'text-[var(--xray-tertiary)]'}`}>
              <span className={i === currentStep ? 'animate-pulse' : ''}>{step.icon}</span>
              <span>{step.label}</span>
              {i < currentStep && <CheckCircle2 size={14} className="ml-auto text-[var(--xray-success)]" />}
            </div>
          ))}
        </div>
        <div className="mt-8 mx-auto max-w-sm">
          <div className="h-1 rounded-full bg-[var(--xray-muted)] overflow-hidden scan-progress-bar">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--xray-accent)] to-[var(--xray-accent-dark)] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <p className="mt-6 text-[11px] text-[var(--xray-tertiary)]">This scan is read-only. Your wallet is never connected.</p>
      </div>
    </section>
  );
}

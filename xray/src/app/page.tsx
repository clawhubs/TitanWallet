'use client';

import { useCallback, useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ChainDetectionView from '@/components/ChainDetectionView';
import ScanningView from '@/components/ScanningView';
import DashboardResults from '@/components/DashboardResults';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import type { DetectedChain, XRaySessionResult } from '@/types/scanner';

type AppView = 'home' | 'detecting' | 'selecting' | 'scanning' | 'results';

export default function Home() {
  const [view, setView] = useState<AppView>('home');
  const [scanAddress, setScanAddress] = useState('');
  const [selectedChains, setSelectedChains] = useState<number[]>([]);
  const [detectedChains, setDetectedChains] = useState<DetectedChain[]>([]);
  const [detectDuration, setDetectDuration] = useState(0);
  const [result, setResult] = useState<XRaySessionResult | null>(null);
  const [error, setError] = useState('');

  const handleScan = async (address: string) => {
    setError('');
    setResult(null);
    setScanAddress(address);
    setView('detecting');
    try {
      const response = await fetch('/api/detect-chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Chain detection failed.');
      setDetectedChains(payload.detectedChains || []);
      setDetectDuration(payload.scanDurationMs || 0);
      setView('selecting');
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Chain detection failed.');
      setDetectedChains([]);
      setDetectDuration(0);
      setView('selecting');
    }
  };

  const handleSelectedScan = (chains: number[]) => {
    setSelectedChains(chains);
    setError('');
    setView('scanning');
  };

  const handleComplete = useCallback((payload: XRaySessionResult) => {
    setResult({
      ...payload,
      detectedChains,
    });
    setView('results');
  }, [detectedChains]);

  const handleReset = () => {
    setView('home');
    setScanAddress('');
    setSelectedChains([]);
    setDetectedChains([]);
    setDetectDuration(0);
    setResult(null);
    setError('');
  };

  return (
    <>
      <Navbar />

      {view === 'home' && (
        <>
          <HeroSection onScan={handleScan} />
          <FeaturesSection />
          <HowItWorksSection />
          <FAQSection />
        </>
      )}

      {view === 'detecting' && (
        <section className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-5 h-16 w-16 rounded-full border-2 border-[var(--xray-border)] border-t-[var(--xray-accent)] animate-spin" />
            <h1 className="text-2xl font-bold text-[var(--xray-text)]">Detecting active chains...</h1>
            <p className="mt-2 text-sm text-[var(--xray-subtext)]">Public RPC calls only. No wallet connection.</p>
          </div>
        </section>
      )}

      {view === 'selecting' && (
        <ChainDetectionView
          address={scanAddress}
          chains={detectedChains}
          durationMs={detectDuration}
          error={error}
          onBack={handleReset}
          onScan={handleSelectedScan}
        />
      )}

      {view === 'scanning' && (
        <ScanningView
          address={scanAddress}
          chains={selectedChains}
          onComplete={handleComplete}
          onError={(message) => {
            setError(message);
            setView('selecting');
          }}
        />
      )}

      {view === 'results' && result && (
        <DashboardResults
          result={result}
          onReset={handleReset}
        />
      )}

      <Footer />
    </>
  );
}

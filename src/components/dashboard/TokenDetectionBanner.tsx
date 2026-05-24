import React from 'react';
import { LoaderCircle, Radar, ShieldCheck } from 'lucide-react';

interface TokenDetectionBannerProps {
  isDetecting: boolean;
  detectedCount: number;
}

const TokenDetectionBanner: React.FC<TokenDetectionBannerProps> = ({
  isDetecting,
  detectedCount,
}) => {
  if (isDetecting) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-titan-accent/20 bg-titan-accent/5 px-4 py-3">
        <LoaderCircle size={16} className="animate-spin text-titan-accent" />
        <div>
          <p className="text-sm font-semibold text-white">Scanning wallet for tokens...</p>
          <p className="text-xs text-titan-subtext">Looking across the active network and known TITAN asset patterns.</p>
        </div>
      </div>
    );
  }

  if (!detectedCount) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-titan-border bg-titan-surface px-4 py-3">
        <Radar size={16} className="text-titan-subtext" />
        <div>
          <p className="text-sm font-semibold text-white">Auto-detect is ready</p>
          <p className="text-xs text-titan-subtext">Run a scan or import a contract address manually.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-titan-success/20 bg-titan-success/5 px-4 py-3">
      <ShieldCheck size={16} className="text-titan-success" />
      <div>
        <p className="text-sm font-semibold text-white">Found {detectedCount} detected token{detectedCount === 1 ? '' : 's'}</p>
        <p className="text-xs text-titan-subtext">Detected assets are tagged so you can distinguish them from manual imports.</p>
      </div>
    </div>
  );
};

export default TokenDetectionBanner;

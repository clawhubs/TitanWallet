import React from 'react';
import { LoaderCircle } from 'lucide-react';

interface TokenDetectionBannerProps {
  isDetecting: boolean;
}

const TokenDetectionBanner: React.FC<TokenDetectionBannerProps> = ({ isDetecting }) => {
  if (!isDetecting) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-titan-accent/20 bg-titan-accent/5 px-4 py-3">
      <LoaderCircle size={16} className="animate-spin text-titan-accent" />
      <div>
        <p className="text-sm font-semibold text-white">Scanning wallet for tokens...</p>
        <p className="text-xs text-titan-subtext">Looking across the active network and known TITAN asset patterns.</p>
      </div>
    </div>
  );
};

export default TokenDetectionBanner;

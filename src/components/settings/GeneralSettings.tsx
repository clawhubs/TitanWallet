import React, { useEffect, useState } from 'react';
import { ExternalLink, KeyRound } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  TITAN_API_BASE_URL,
  TITAN_DEV_PORTAL_URL,
  getTitanApiKey,
  setStoredTitanApiKey,
} from '../../config/api';
import { useNetworkStore } from '../../store/useNetworkStore';

const GeneralSettings: React.FC = () => {
  const environment = useNetworkStore((state) => state.environment);
  const toggleEnvironment = useNetworkStore((state) => state.toggleEnvironment);
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(getTitanApiKey());
  }, []);

  const saveApiKey = () => {
    setStoredTitanApiKey(apiKey);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">General</h2>
            <p className="text-sm text-titan-subtext">Control how TITAN talks to YieldBoost services and which environment it targets.</p>
          </div>
          <Badge variant="accent" size="sm">API-ready</Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-white">YieldBoost Environment</p>
              <p className="text-xs text-titan-subtext">Current target: {environment}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={toggleEnvironment}>
              Switch to {environment === 'mainnet' ? 'testnet' : 'mainnet'}
            </Button>
          </div>

          <div className="rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound size={15} className="text-titan-accent" />
              <p className="text-sm font-semibold text-white">YieldBoost API Key</p>
            </div>
            <input
              className="titan-input"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="yb_live_xxx or yb_dev_xxx"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-titan-subtext">Stored locally in this browser for dev use only. Production should proxy secrets server-side.</p>
              <Button variant="primary" size="sm" onClick={saveApiKey}>
                {saved ? 'Saved' : 'Save Key'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
        <h2 className="text-lg font-bold text-white">Endpoints</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4">
            <p className="text-xs uppercase tracking-wider text-titan-subtext">Public Integrity API</p>
            <p className="mt-1 font-mono text-white">{TITAN_API_BASE_URL}</p>
          </div>
          <a
            href={TITAN_DEV_PORTAL_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4 transition-all hover:border-titan-accent/30"
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-titan-subtext">Developer Portal</p>
              <p className="mt-1 font-mono text-white">{TITAN_DEV_PORTAL_URL}</p>
            </div>
            <ExternalLink size={16} className="text-titan-subtext" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;

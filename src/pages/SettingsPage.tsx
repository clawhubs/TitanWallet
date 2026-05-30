import React from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardHeader from '../components/layout/DashboardHeader';
import GeneralSettings from '../components/settings/GeneralSettings';
import NetworkSettings from '../components/settings/NetworkSettings';
import DeveloperSettings from '../features/developer/DeveloperSettings';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useTokenStore } from '../store/useTokenStore';
import { useNetworkStore } from '../store/useNetworkStore';

type SettingsTab = 'general' | 'networks' | 'tokens' | 'developer';

const SETTINGS_TABS = ['general', 'networks', 'tokens', 'developer'] as const;

function parseSettingsTab(tab: string | null): SettingsTab {
  return SETTINGS_TABS.includes(tab as SettingsTab) ? (tab as SettingsTab) : 'general';
}

const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseSettingsTab(searchParams.get('tab'));
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const tokens = useTokenStore((state) => state.tokens);
  const customTokens = useTokenStore((state) => state.customTokens);
  const removeToken = useTokenStore((state) => state.removeToken);
  const networkTokens = tokens.filter((token) => token.network === activeNetwork.name);
  const networkCustomTokens = customTokens.filter((token) => token.network === activeNetwork.name);

  const selectTab = (tab: SettingsTab) => {
    if (tab === 'general') {
      setSearchParams({});
      return;
    }
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-titan-bg">
      <DashboardHeader />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="mt-1 text-sm text-titan-subtext">Wallet session, network routing, and token behavior.</p>
          </div>
          <Badge variant="success" dot size="md">Wallet Settings</Badge>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { id: 'general', label: 'General' },
            { id: 'networks', label: 'Networks' },
            { id: 'tokens', label: 'Tokens' },
            { id: 'developer', label: 'Developer' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => selectTab(tab.id as SettingsTab)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === 'general' ? <GeneralSettings /> : null}
        {activeTab === 'networks' ? <NetworkSettings /> : null}
        {activeTab === 'developer' ? <DeveloperSettings /> : null}
        {activeTab === 'tokens' ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Token Registry</h2>
                  <p className="text-sm text-titan-subtext">Auto-detected tokens stay separate from manual imports so the dashboard can explain where each asset came from.</p>
                </div>
                <Badge variant="accent" size="sm">{networkTokens.length} on {activeNetwork.name}</Badge>
              </div>

              <div className="space-y-3">
                {networkTokens.length ? networkTokens.map((token) => (
                  <div key={token.id} className="flex flex-col gap-3 rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{token.symbol}</span>
                        <Badge
                          variant={token.source === 'custom' ? 'accent' : token.source === 'detected' ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {token.source}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-titan-subtext">{token.name} • {token.network}</p>
                      {token.contractAddress ? (
                        <p className="mt-1 text-xs font-mono text-titan-subtext/70">{token.contractAddress}</p>
                      ) : null}
                    </div>
                    {token.source === 'custom' ? (
                      <Button variant="ghost" size="sm" onClick={() => removeToken(token.id)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
                    No tokens are registered on {activeNetwork.name} yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
              <h2 className="text-lg font-bold text-white">Custom Tokens</h2>
              <p className="mt-1 text-sm text-titan-subtext">Imported manually from the dashboard.</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-white">{networkCustomTokens.length} custom token{networkCustomTokens.length === 1 ? '' : 's'} on {activeNetwork.name}</span>
                <Badge variant="neutral" size="sm">Dashboard import flow</Badge>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default SettingsPage;

import React from 'react';
import DashboardHeader from '../components/layout/DashboardHeader';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SecurityBadge from '../components/ui/SecurityBadge';
import { mockSecurityLayers } from '../data/mockProofs';
import { formatTimeAgo } from '../utils/cn';
import { ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { getLayerStatus } from '../services/security';
import { listRecords } from '../services/integrity';
import { useWalletStore } from '../store/useWalletStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { buildTitanSecurityLayersFromApi, countActiveTitanLayers, mapIntegrityRecordsToProofs } from '../utils/integrity';

const SecurityPage: React.FC = () => {
  const walletAddress = useWalletStore((state) => state.address);
  const environment = useNetworkStore((state) => state.environment);
  const [layers, setLayers] = React.useState(mockSecurityLayers);
  const [proofs, setProofs] = React.useState<ReturnType<typeof mapIntegrityRecordsToProofs>>([]);
  const [liveMode, setLiveMode] = React.useState(false);

  React.useEffect(() => {
    let disposed = false;

    const hydrate = async () => {
      try {
        const status = await getLayerStatus();
        if (disposed) {
          return;
        }

        setLayers(buildTitanSecurityLayersFromApi(status));
        setLiveMode(true);
      } catch {
        if (!disposed) {
          setLayers(mockSecurityLayers);
          setLiveMode(false);
        }
      }

      if (!walletAddress) {
        return;
      }

      try {
        const records = await listRecords({
          walletAddress,
          network: environment,
        });
        if (!disposed) {
          setProofs(mapIntegrityRecordsToProofs(records.items));
        }
      } catch {
        if (!disposed) {
          setProofs([]);
        }
      }
    };

    void hydrate();

    return () => {
      disposed = true;
    };
  }, [environment, walletAddress]);

  const activeLayerCount = countActiveTitanLayers(layers);

  return (
    <div className="min-h-screen bg-titan-bg">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-titan-text">Security Center</h1>
            <p className="text-sm text-titan-subtext mt-1">
              {liveMode ? 'Live layer status is being read from the YieldBoost integrity stack.' : 'Live layer endpoints need an API key, so fallback proof data is shown.'}
            </p>
          </div>
          <Badge variant="success" dot size="md">{activeLayerCount} / 6 Layers Active</Badge>
        </div>

        {/* 6 layers grid */}
        <div>
          <h2 className="text-sm font-semibold text-titan-text mb-3">TITAN Security Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {layers.map((layer) => (
              <SecurityBadge key={layer.id} layer={layer} />
            ))}
          </div>
        </div>

        {/* Proof Timeline + Trusted Apps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Proof Timeline */}
          <Card>
            <div className="p-5 border-b border-titan-border">
              <CardHeader className="mb-0">
                <CardTitle>Proof Timeline</CardTitle>
                <Badge variant="accent" size="sm">On-chain</Badge>
              </CardHeader>
            </div>
            <div className="p-4 space-y-1">
              {proofs.length ? proofs.map((proof, i) => (
                <div key={proof.id} className="relative flex gap-4 pb-4 last:pb-0">
                  {/* Line */}
                  {i < proofs.length - 1 && (
                    <div className="absolute left-[11px] top-5 bottom-0 w-px bg-titan-border" />
                  )}
                  {/* Dot */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 ${
                    proof.status === 'verified' ? 'bg-titan-success/10 border border-titan-success/30' :
                    proof.status === 'active' ? 'bg-titan-accent/10 border border-titan-accent/30' :
                    'bg-titan-warning/10 border border-titan-warning/30'
                  }`}>
                    {proof.status === 'verified' ? <ShieldCheck size={12} className="text-titan-success" /> :
                     proof.status === 'active' ? <AlertCircle size={12} className="text-titan-accent" /> :
                     <Clock size={12} className="text-titan-warning" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-titan-text leading-snug">{proof.type}</p>
                        <p className="text-xs text-titan-accent/80 mt-0.5">{proof.layer}</p>
                        <p className="text-xs text-titan-subtext mt-0.5 leading-relaxed">{proof.description}</p>
                        {proof.txHash && (
                          <p className="text-xs font-mono text-titan-subtext/60 mt-1">{proof.txHash.slice(0, 20)}...</p>
                        )}
                      </div>
                      <span className="text-xs text-titan-subtext flex-shrink-0">{formatTimeAgo(proof.timestamp)}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
                  No proof timeline entries yet for this wallet.
                </div>
              )}
            </div>
          </Card>

          {/* Policy + Memory */}
          <div className="space-y-4">
            {/* Governance policy */}
            <Card className="p-5">
              <CardHeader>
                <CardTitle>Governance Policies</CardTitle>
                <Badge variant="accent" size="sm">Active</Badge>
              </CardHeader>
              <div className="space-y-3">
                {[
                  { name: 'Daily Send Limit', value: '$10,000 / day', status: 'active' },
                  { name: 'Contract Allowlist', value: '4 contracts', status: 'active' },
                  { name: 'Multi-step Approval', value: 'Above $5,000', status: 'active' },
                  { name: 'Time-lock', value: 'Disabled', status: 'standby' },
                ].map(policy => (
                  <div key={policy.name} className="flex items-center justify-between py-2 border-b border-titan-border/40 last:border-0">
                    <span className="text-sm text-titan-text">{policy.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-titan-subtext">{policy.value}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${policy.status === 'active' ? 'bg-titan-success' : 'bg-titan-subtext'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Trusted App Memory */}
            <Card className="p-5">
              <CardHeader>
                <CardTitle>Sovereign Memory — Trusted Apps</CardTitle>
              </CardHeader>
              <div className="rounded-xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
                Trusted app memory will appear here after live app connection logs are available for reading.
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SecurityPage;

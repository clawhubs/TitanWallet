import React from 'react';
import DashboardHeader from '../components/layout/DashboardHeader';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SecurityBadge from '../components/ui/SecurityBadge';
import { formatHash, formatTimeAgo } from '../utils/cn';
import { ShieldCheck, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { getHealth, getLayerStatus } from '../services/security';
import { listRecords } from '../services/integrity';
import { runMilitaryGradeOperation, type MilitaryGradeLayerReceipt } from '../services/militaryGrade';
import { useWalletStore } from '../store/useWalletStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { buildTitanSecurityLayersFromApi, countActiveTitanLayers, mapIntegrityRecordsToProofs } from '../utils/integrity';
import type { SecurityLayer, TitanLayer } from '../types';
import { WALLET_SECURITY_LAYER_NAMES } from '../data/walletActionLayers';
import { hasTitanSecurityAccess } from '../config/api';

const WALLET_LAYER_SET = new Set<TitanLayer>(WALLET_SECURITY_LAYER_NAMES);

function filterWalletSecurityLayers(layers: SecurityLayer[]) {
  return WALLET_SECURITY_LAYER_NAMES
    .map((name) => layers.find((layer) => layer.name === name))
    .filter((layer): layer is SecurityLayer => Boolean(layer));
}

function applyMilitaryGradeReceipts(
  layers: SecurityLayer[],
  receipts?: MilitaryGradeLayerReceipt[] | null,
) {
  if (!receipts?.length) {
    return layers;
  }

  const receiptByName = new Map(
    receipts
      .filter((receipt) => WALLET_LAYER_SET.has(receipt.label as TitanLayer))
      .map((receipt) => [receipt.label, receipt]),
  );

  return layers.map((layer) => {
    const receipt = receiptByName.get(layer.name);
    if (!receipt) {
      return layer;
    }

    const status = /fail|error|blocked|denied/i.test(receipt.status) ? 'alert' : 'active';

    return {
      ...layer,
      status,
      shortDesc: receipt.proof || layer.shortDesc,
      description: receipt.proof || layer.description,
      lastCheck: new Date(),
      eventsCount: Math.max(layer.eventsCount, 1),
    } satisfies SecurityLayer;
  });
}

const SecurityPage: React.FC = () => {
  const walletAddress = useWalletStore((state) => state.address);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const [layers, setLayers] = React.useState<SecurityLayer[]>([]);
  const [proofs, setProofs] = React.useState<ReturnType<typeof mapIntegrityRecordsToProofs>>([]);
  const [liveMode, setLiveMode] = React.useState(false);
  const recordNetwork = activeNetwork.isTestnet ? 'testnet' : 'mainnet';

  React.useEffect(() => {
    let disposed = false;

    const hydrate = async () => {
      try {
        const status = hasTitanSecurityAccess() ? await getLayerStatus() : await getHealth();
        let nextLayers = filterWalletSecurityLayers(buildTitanSecurityLayersFromApi(status));

        try {
          const rail = await runMilitaryGradeOperation({
            action: 'security-center',
            walletAddress,
            network: activeNetwork.name,
            chainId: activeNetwork.chainId,
            intent: 'Read the live TITAN wallet security rail status for the Security Center.',
            metadata: {
              page: 'security-center',
              wallet_layer_count: WALLET_SECURITY_LAYER_NAMES.length,
            },
          });
          nextLayers = applyMilitaryGradeReceipts(nextLayers, rail.selected_layers);
        } catch {
          // The health endpoint still keeps the page useful if the server proxy is temporarily unavailable.
        }

        if (disposed) {
          return;
        }

        setLayers(nextLayers);
        setLiveMode(true);
      } catch {
        try {
          const rail = await runMilitaryGradeOperation({
            action: 'security-center',
            walletAddress,
            network: activeNetwork.name,
            chainId: activeNetwork.chainId,
            intent: 'Read the live TITAN wallet security rail status for the Security Center.',
            metadata: {
              page: 'security-center',
              wallet_layer_count: WALLET_SECURITY_LAYER_NAMES.length,
            },
          });

          if (!disposed) {
            setLayers(applyMilitaryGradeReceipts(filterWalletSecurityLayers(buildTitanSecurityLayersFromApi(null)), rail.selected_layers));
            setLiveMode(true);
          }
        } catch {
          if (!disposed) {
            setLayers([]);
            setLiveMode(false);
          }
        }
      }

      if (!walletAddress || !hasTitanSecurityAccess()) {
        return;
      }

      try {
        const records = await listRecords({
          walletAddress,
          network: recordNetwork,
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
    const interval = window.setInterval(() => {
      void hydrate();
    }, 15000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [recordNetwork, walletAddress]);

  const activeLayerCount = countActiveTitanLayers(layers);
  const hasWalletSession = Boolean(walletAddress);

  return (
    <div className="min-h-screen bg-titan-bg">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-titan-text">Security Center</h1>
            <p className="text-sm text-titan-subtext mt-1">
              {liveMode ? 'Live layer status is being read from the YieldBoost integrity stack.' : 'Live layer status is currently unavailable. No fallback mock layer data is shown.'}
            </p>
          </div>
          <Badge variant={liveMode ? 'success' : 'neutral'} dot size="md">
            {liveMode ? `${activeLayerCount} / ${WALLET_SECURITY_LAYER_NAMES.length} Wallet Rails Active` : 'Layer status unavailable'}
          </Badge>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-titan-text mb-3">TITAN Wallet Security Rails</h2>
          {layers.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {layers.map((layer) => (
                <SecurityBadge key={layer.id} layer={layer} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
              No live layer snapshot is available right now.
            </div>
          )}
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
                        {proof.proofStorageId && (
                          <p className="text-xs font-mono text-titan-subtext/60 mt-1">
                            Proof ID {formatHash(proof.proofStorageId, 10)}
                          </p>
                        )}
                        {proof.txHash && (
                          <p className="text-xs font-mono text-titan-subtext/60 mt-1">
                            Anchor {formatHash(proof.txHash, 10)}
                          </p>
                        )}
                        {proof.explorerUrl && (
                          <a
                            href={proof.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-titan-accent hover:text-titan-accent/80"
                          >
                            Open proof
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-titan-subtext flex-shrink-0">{formatTimeAgo(proof.timestamp)}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
                  {hasWalletSession ? 'No proof timeline entries yet for this wallet.' : 'Connect or import a wallet to load proof timeline entries.'}
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
                <Badge variant={hasWalletSession ? 'accent' : 'neutral'} size="sm">{hasWalletSession ? 'Session-ready' : 'No wallet'}</Badge>
              </CardHeader>
              {hasWalletSession ? (
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
              ) : (
                <div className="rounded-xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
                  Governance policy rails only appear after a wallet session is active.
                </div>
              )}
            </Card>

            {/* Trusted App Memory */}
            <Card className="p-5">
              <CardHeader>
                <CardTitle>Sovereign Memory — Trusted Apps</CardTitle>
              </CardHeader>
              <div className="rounded-xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
                {hasWalletSession
                  ? 'Trusted app memory will appear here after live app connection logs are available for reading.'
                  : 'Trusted app memory is unavailable until a wallet session is connected.'}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SecurityPage;

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardHeader from '../components/layout/DashboardHeader';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ActivityRow from '../components/ui/ActivityRow';
import { ShieldCheck, AlertCircle, Clock, ExternalLink, Filter } from 'lucide-react';
import { formatHash, formatTimeAgo } from '../utils/cn';
import { cn } from '../utils/cn';
import { listRecords } from '../services/integrity';
import { useNetworkStore } from '../store/useNetworkStore';
import { useWalletStore } from '../store/useWalletStore';
import { mapIntegrityRecordsToActivity, mapIntegrityRecordsToProofs } from '../utils/integrity';
import { getLocalWalletEvents } from '../services/localActivity';
import { hasTitanSecurityAccess } from '../config/api';

type Tab = 'transactions' | 'proofs' | 'security';

function parseActivityTab(tab: string | null): Tab {
  return tab === 'proofs' || tab === 'security' || tab === 'transactions' ? tab : 'transactions';
}

function proofHasAnchor(proof: ReturnType<typeof mapIntegrityRecordsToProofs>[number]) {
  return Boolean(proof.txHash);
}

const ActivityPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => parseActivityTab(searchParams.get('tab')));
  const [filter, setFilter] = useState<string>('all');
  const walletAddress = useWalletStore((state) => state.address);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const [activity, setActivity] = useState<ReturnType<typeof mapIntegrityRecordsToActivity>>([]);
  const [proofs, setProofs] = useState<ReturnType<typeof mapIntegrityRecordsToProofs>>([]);
  const [securityEvents, setSecurityEvents] = useState<{
    type: string;
    desc: string;
    time: Date;
    level: 'info' | 'success' | 'warning';
  }[]>([]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'transactions', label: 'Transactions', count: activity.length },
    { id: 'proofs', label: 'Proofs', count: proofs.length },
    { id: 'security', label: 'Security Events', count: securityEvents.length },
  ];

  const txFilters = ['all', 'send', 'receive', 'swap', 'approve'];

  const recordNetwork = activeNetwork.isTestnet ? 'testnet' : 'mainnet';
  const proofSourceBadge = proofs.length === 0
    ? 'No Proofs'
    : proofs.every(proofHasAnchor)
      ? 'On-chain Anchors'
      : proofs.some(proofHasAnchor)
        ? 'Mixed Proofs'
        : 'Off-chain Proofs';
  const proofSourceBadgeVariant = proofs.some(proofHasAnchor) ? 'accent' : 'success';

  const handleSelectTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    let disposed = false;

    const hydrate = async () => {
      if (!walletAddress) {
        setActivity([]);
        setProofs([]);
        setSecurityEvents([]);
        return;
      }

      const localEvents = getLocalWalletEvents(walletAddress, activeNetwork.name);

      if (!hasTitanSecurityAccess()) {
        setActivity(localEvents.activity);
        setProofs(localEvents.proofs);
        setSecurityEvents(localEvents.securityEvents);
        return;
      }

      try {
        const records = await listRecords({
          walletAddress,
          network: recordNetwork,
        });
        if (!disposed) {
          const nextActivity = mergeByKey(
            localEvents.activity,
            mapIntegrityRecordsToActivity(records.items),
            (item) => item.hash || item.id,
          );
          const nextProofs = mergeByKey(
            localEvents.proofs,
            mapIntegrityRecordsToProofs(records.items),
            (item) => item.txHash || item.id,
          );
          setActivity(nextActivity);
          setProofs(nextProofs);
          setSecurityEvents(
            mergeByKey(
              localEvents.securityEvents,
              nextProofs.slice(0, 10).map((proof) => ({
                type: proof.type,
                desc: proof.description,
                time: proof.timestamp,
                level:
                  proof.status === 'verified'
                    ? 'success'
                    : proof.status === 'active'
                      ? 'warning'
                      : 'info',
              })),
              (item) => `${item.type}:${item.time.toISOString()}`,
            ),
          );
        }
      } catch {
        if (!disposed) {
          setActivity(localEvents.activity);
          setProofs(localEvents.proofs);
          setSecurityEvents(localEvents.securityEvents);
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
  }, [activeNetwork.name, recordNetwork, walletAddress]);

  const filteredActivity = filter === 'all' ? activity : activity.filter((item) => item.type === filter);

  return (
    <div className="min-h-screen bg-titan-bg">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-titan-text">Activity</h1>
          <p className="text-sm text-titan-subtext mt-1">Your full wallet history, including proofs and security events.</p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-titan-surface border border-titan-border rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-titan-card text-titan-text shadow-card'
                  : 'text-titan-subtext hover:text-titan-text'
              )}
            >
              {tab.label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-titan-accent/10 text-titan-accent' : 'bg-titan-muted/40 text-titan-subtext'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'transactions' && (
          <Card className="overflow-hidden">
            {/* Filter row */}
            <div className="p-4 border-b border-titan-border flex items-center gap-2 flex-wrap">
              <Filter size={14} className="text-titan-subtext" />
              {txFilters.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all',
                    filter === f ? 'bg-titan-accent/10 text-titan-accent border border-titan-accent/20' : 'text-titan-subtext hover:text-titan-text bg-titan-surface border border-titan-border'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="divide-y divide-titan-border/40">
              {filteredActivity.length === 0 ? (
                <div className="py-10 text-center text-titan-subtext text-sm">No proof-backed wallet actions found yet.</div>
              ) : (
                filteredActivity.map(act => (
                  <ActivityRow key={act.id} activity={act} />
                ))
              )}
            </div>
          </Card>
        )}

        {activeTab === 'proofs' && (
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-titan-border">
              <CardHeader className="mb-0">
                <CardTitle>Proof History</CardTitle>
                <Badge variant={proofSourceBadgeVariant} size="sm">{proofSourceBadge}</Badge>
              </CardHeader>
            </div>
            <div className="p-4 space-y-3">
              {proofs.length ? proofs.map(proof => (
                <div key={proof.id} className="flex items-start gap-4 p-4 bg-titan-surface rounded-xl border border-titan-border hover:border-titan-border/80 transition-all">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    proof.status === 'verified' ? 'bg-titan-success/10' : proof.status === 'active' ? 'bg-titan-accent/10' : 'bg-titan-warning/10'
                  }`}>
                    {proof.status === 'verified' ? <ShieldCheck size={16} className="text-titan-success" /> :
                     proof.status === 'active' ? <AlertCircle size={16} className="text-titan-accent" /> :
                     <Clock size={16} className="text-titan-warning" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-titan-text">{proof.type}</p>
                        <p className="text-xs text-titan-accent/80 mt-0.5">{proof.layer}</p>
                        <p className="mt-1 text-xs font-semibold text-titan-subtext">
                          {proofHasAnchor(proof) ? 'On-chain anchor' : 'Off-chain proof'}
                        </p>
                        <p className="text-xs text-titan-subtext mt-1 leading-relaxed">{proof.description}</p>
                        {proof.proofStorageId && (
                          <p className="text-xs font-mono text-titan-subtext/60 mt-1">
                            Proof ID {formatHash(proof.proofStorageId, 10)}
                          </p>
                        )}
                        {proof.txHash && (
                          <p className="text-xs font-mono text-titan-subtext/50 mt-1">
                            Anchor {formatHash(proof.txHash, 10)}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant={proof.status === 'verified' ? 'success' : proof.status === 'active' ? 'accent' : 'warning'} size="sm">
                          {proof.status}
                        </Badge>
                        <p className="text-xs text-titan-subtext mt-1">{formatTimeAgo(proof.timestamp)}</p>
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
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
                  No live proof records yet for this wallet.
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-titan-border">
              <CardHeader className="mb-0">
                <CardTitle>Security Events</CardTitle>
              </CardHeader>
            </div>
            <div className="p-4 space-y-3">
              {securityEvents.length ? (
                securityEvents.map((event, i) => (
                  <div key={`${event.type}-${i}`} className="flex items-start gap-4 p-4 bg-titan-surface rounded-xl border border-titan-border">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      event.level === 'success' ? 'bg-titan-success/10' : event.level === 'warning' ? 'bg-titan-warning/10' : 'bg-titan-muted/30'
                    }`}>
                      <ShieldCheck size={16} className={
                        event.level === 'success' ? 'text-titan-success' : event.level === 'warning' ? 'text-titan-warning' : 'text-titan-subtext'
                      } />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-titan-text">{event.type}</p>
                        <span className="text-xs text-titan-subtext">{formatTimeAgo(event.time)}</span>
                      </div>
                      <p className="text-xs text-titan-subtext mt-0.5">{event.desc}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
                  No live security events are available for this wallet yet.
                </div>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

function mergeByKey<T>(primary: T[], secondary: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  const merged: T[] = [];

  [...primary, ...secondary].forEach((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(item);
  });

  return merged.sort((left, right) => getEventTime(right) - getEventTime(left));
}

function getEventTime(item: unknown) {
  const candidate = (item as { timestamp?: Date; time?: Date }).timestamp || (item as { timestamp?: Date; time?: Date }).time;
  return candidate instanceof Date ? candidate.getTime() : 0;
}

export default ActivityPage;

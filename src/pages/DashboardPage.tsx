import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ShieldCheck,
  Shield,
  Clock,
  Send,
  ChevronDown,
  EllipsisVertical,
  SlidersHorizontal,
} from 'lucide-react';
import PortfolioBar from '../components/dashboard/PortfolioBar';
import { useBalance } from '../hooks/useBalance';
import { useTokenStore } from '../store/useTokenStore';
import { useWalletStore } from '../store/useWalletStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { formatTimeAgo, formatUSD } from '../utils/cn';
import TokenRow from '../components/ui/TokenRow';
import ActivityRow from '../components/ui/ActivityRow';
import TokenDetectionBanner from '../components/dashboard/TokenDetectionBanner';
import AddTokenModal from '../components/dashboard/AddTokenModal';
import AssetNetworkPickerModal from '../components/dashboard/AssetNetworkPickerModal';
import Button from '../components/ui/Button';
import SwapPanel from '../components/dashboard/SwapPanel';
import { getHealth } from '../services/security';
import { listRecords } from '../services/integrity';
import { buildTitanSecurityLayersFromApi, countActiveTitanLayers, mapIntegrityRecordsToActivity, mapIntegrityRecordsToProofs } from '../utils/integrity';
import SendTransactionModal from '../components/modals/SendTransactionModal';
import ReceiveModal from '../components/modals/ReceiveModal';
import { hasTitanSecurityAccess } from '../config/api';
import ConnectAppModal from '../components/modals/ConnectAppModal';
import SignMessageModal from '../components/modals/SignMessageModal';
import { WALLET_SECURITY_LAYER_NAMES } from '../data/walletActionLayers';
import { mockTokens } from '../data/mockTokens';
import { runMilitaryGradeOperation } from '../services/militaryGrade';
import AddNetworkModal from '../components/settings/AddNetworkModal';
import { getLocalWalletEvents } from '../services/localActivity';
import {
  applyMarketPriceToToken,
  buildMarketPriceRequestFromToken,
  fetchMarketPrices,
  type MarketPriceMap,
} from '../services/marketPrices';
import type { Network, ProofEvent, Token } from '../types';

const WALLET_LAYER_NAME_SET = new Set<string>(WALLET_SECURITY_LAYER_NAMES);
const ASSET_TABS = [
  { id: 'tokens', label: 'Tokens' },
  { id: 'perps', label: 'Perps' },
  { id: 'defi', label: 'DeFi' },
  { id: 'nfts', label: 'NFTs' },
  { id: 'activity', label: 'Activity' },
] as const;
const POPULAR_TOKEN_ORDER = ['ETH', '0G', 'BNB', 'POL', 'USDC', 'USDT', 'WBTC', 'cbBTC', 'BTCB', 'LINK', 'UNI', 'AERO', 'OP', 'ARB', 'WETH'] as const;
const POPULAR_TOKEN_NETWORK_PREFERENCE: Record<string, string[]> = {
  ETH: ['Ethereum', 'Base', 'Arbitrum', 'Optimism'],
  '0G': ['0G'],
  BNB: ['BNB Chain'],
  POL: ['Polygon'],
  USDC: ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'BNB Chain'],
  USDT: ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'BNB Chain'],
  WBTC: ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon'],
  cbBTC: ['Base'],
  BTCB: ['BNB Chain'],
  LINK: ['Ethereum', 'Polygon'],
  UNI: ['Ethereum'],
  AERO: ['Base'],
  OP: ['Optimism'],
  ARB: ['Arbitrum'],
  WETH: ['Polygon'],
};

function mergeProofEvents(primary: ProofEvent[], secondary: ProofEvent[]) {
  const seen = new Set<string>();
  const merged: ProofEvent[] = [];

  [...primary, ...secondary].forEach((proof) => {
    const key = proof.txHash || proof.proofStorageId || proof.id;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(proof);
  });

  return merged.sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime());
}

function mergeActivityEvents(
  primary: ReturnType<typeof mapIntegrityRecordsToActivity>,
  secondary: ReturnType<typeof mapIntegrityRecordsToActivity>,
) {
  const seen = new Set<string>();
  const merged: ReturnType<typeof mapIntegrityRecordsToActivity> = [];

  [...primary, ...secondary].forEach((activity) => {
    const key = activity.hash || activity.id;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(activity);
  });

  return merged.sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime());
}

function buildProofFeed(proofs: ProofEvent[]) {
  return proofs.slice(0, 4).map((proof) => ({
    label: proof.type,
    time: proof.timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
  }));
}

function getProofSourceLabel(proof: ProofEvent) {
  return proof.txHash ? 'On-chain anchor' : 'Off-chain proof';
}

type AssetTabId = (typeof ASSET_TABS)[number]['id'];

function buildShowcaseTokens() {
  return mockTokens.map((token) => ({
    ...token,
    balance: '0',
    balanceUSD: 0,
  }));
}

function sortAssetCatalog(tokens: Token[]) {
  return [...tokens].sort((left, right) => {
    const leftBalance = Number.parseFloat(left.balance || '0');
    const rightBalance = Number.parseFloat(right.balance || '0');
    const leftHasValue = left.balanceUSD > 0 || leftBalance > 0;
    const rightHasValue = right.balanceUSD > 0 || rightBalance > 0;

    if (leftHasValue !== rightHasValue) {
      return leftHasValue ? -1 : 1;
    }

    const leftOrder = POPULAR_TOKEN_ORDER.indexOf(left.symbol as (typeof POPULAR_TOKEN_ORDER)[number]);
    const rightOrder = POPULAR_TOKEN_ORDER.indexOf(right.symbol as (typeof POPULAR_TOKEN_ORDER)[number]);

    if (leftOrder !== rightOrder) {
      const normalizedLeft = leftOrder === -1 ? Number.MAX_SAFE_INTEGER : leftOrder;
      const normalizedRight = rightOrder === -1 ? Number.MAX_SAFE_INTEGER : rightOrder;
      return normalizedLeft - normalizedRight;
    }

    const networkPreference = POPULAR_TOKEN_NETWORK_PREFERENCE[left.symbol] || [];
    const leftNetworkOrder = networkPreference.indexOf(left.network);
    const rightNetworkOrder = networkPreference.indexOf(right.network);

    if (leftNetworkOrder !== rightNetworkOrder) {
      const normalizedLeft = leftNetworkOrder === -1 ? Number.MAX_SAFE_INTEGER : leftNetworkOrder;
      const normalizedRight = rightNetworkOrder === -1 ? Number.MAX_SAFE_INTEGER : rightNetworkOrder;
      return normalizedLeft - normalizedRight;
    }

    return left.name.localeCompare(right.name);
  });
}

function dedupeAssetCatalog(tokens: Token[]) {
  const seen = new Set<string>();

  return tokens.filter((token) => {
    const key = token.symbol;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function findNetworkIdForToken(token: Token, networks: Network[]) {
  return networks.find((network) => network.name === token.network)?.id || '';
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [proofIndex, setProofIndex] = useState(0);
  const [assetTab, setAssetTab] = useState<AssetTabId>('tokens');
  const [assetFilter, setAssetFilter] = useState<'all' | string>('all');
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [showAddNetworkModal, setShowAddNetworkModal] = useState(false);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [showSwapPanel, setShowSwapPanel] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [proofEvents, setProofEvents] = useState<ReturnType<typeof mapIntegrityRecordsToProofs>>([]);
  const [walletActivity, setWalletActivity] = useState<ReturnType<typeof mapIntegrityRecordsToActivity>>([]);
  const [proofFeed, setProofFeed] = useState([
    { label: 'No integrity records yet', time: 'Create, sign, send, or swap to start a live trail.' },
  ]);
  const [activeLayerCount, setActiveLayerCount] = useState<number | null>(null);
  const walletAddress = useWalletStore((state) => state.address);
  const isConnected = useWalletStore((state) => state.isConnected);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const networks = useNetworkStore((state) => state.networks);
  const addNetwork = useNetworkStore((state) => state.addNetwork);
  const tokens = useTokenStore((state) => state.tokens);
  const isDetecting = useTokenStore((state) => state.isDetecting);
  const runAutoDetect = useTokenStore((state) => state.runAutoDetect);
  const { balanceETH, balanceUSD, isLoading: balanceLoading } = useBalance();
  const [marketPrices, setMarketPrices] = useState<MarketPriceMap>({});
  const rawShowcaseTokens = buildShowcaseTokens();
  const marketPriceRequestTokens = [...tokens, ...rawShowcaseTokens];
  const marketPriceRequestPayload = JSON.stringify(marketPriceRequestTokens
    .map((token) => [
      buildMarketPriceRequestFromToken(token, findNetworkIdForToken(token, networks)),
      [
        token.id,
        token.symbol,
        token.network,
        token.contractAddress || '',
        findNetworkIdForToken(token, networks),
      ].join(':'),
    ] as const)
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([request]) => request));
  const repricedWalletTokens = tokens.map((token) => applyMarketPriceToToken(token, marketPrices[token.id]));
  const showcaseTokens = rawShowcaseTokens.map((token) => applyMarketPriceToToken(token, marketPrices[token.id]));
  const combinedAssetTokens = [
    ...repricedWalletTokens,
    ...showcaseTokens.filter(
      (showcase) =>
        !repricedWalletTokens.some(
          (token) => token.symbol === showcase.symbol && token.network === showcase.network,
        ),
    ),
  ];
  const sortedAssetCatalog = sortAssetCatalog(combinedAssetTokens);
  const dedupedPopularCatalog = dedupeAssetCatalog(sortedAssetCatalog);
  const assetNetworkNames = Array.from(
    new Set([
      ...combinedAssetTokens.map((token) => token.network),
      ...networks.map((network) => network.name),
    ]),
  ).sort((a, b) => a.localeCompare(b));
  const networkTokens = tokens.filter((token) => token.network === activeNetwork.name);
  const assetDisplayedTokens =
    assetFilter === 'all'
      ? dedupedPopularCatalog
      : sortAssetCatalog(combinedAssetTokens.filter((token) => token.network === assetFilter));
  const totalTokenValue = networkTokens.reduce((sum, token) => sum + Math.max(token.balanceUSD, 0), 0);
  const portfolioData = networkTokens.map((token, index) => ({
    symbol: token.symbol,
    percentage: totalTokenValue > 0 ? Math.max(1, Math.round((token.balanceUSD / totalTokenValue) * 100)) : 100,
    color: ['#4ECDC4', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5],
  }));
  const recordNetwork = activeNetwork.isTestnet ? 'testnet' : 'mainnet';

  useEffect(() => {
    const interval = setInterval(() => {
      setProofIndex((prev) => (prev + 1) % proofFeed.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [proofFeed.length]);

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    void runAutoDetect();
  }, [activeNetwork.id, runAutoDetect, walletAddress]);

  useEffect(() => {
    let disposed = false;

    const loadMarketPrices = async () => {
      try {
        const prices = await fetchMarketPrices(JSON.parse(marketPriceRequestPayload));
        if (!disposed) {
          setMarketPrices(prices);
        }
      } catch {
        if (!disposed) {
          setMarketPrices({});
        }
      }
    };

    void loadMarketPrices();
    const interval = window.setInterval(() => {
      void loadMarketPrices();
    }, 60_000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [marketPriceRequestPayload]);

  useEffect(() => {
    let disposed = false;

    const hydrateLiveData = async () => {
      try {
        const health = await getHealth();
        if (disposed) {
          return;
        }

        const liveLayers = buildTitanSecurityLayersFromApi(health).filter((layer) => WALLET_LAYER_NAME_SET.has(layer.name));
        let nextActiveLayerCount = countActiveTitanLayers(liveLayers);

        try {
          const rail = await runMilitaryGradeOperation({
            action: 'dashboard-status',
            walletAddress,
            network: activeNetwork.name,
            chainId: activeNetwork.chainId,
            intent: 'Read the live TITAN wallet rail status for the dashboard balance card.',
            metadata: {
              page: 'dashboard',
              wallet_layer_count: WALLET_SECURITY_LAYER_NAMES.length,
            },
          });
          const verifiedWalletRails = (rail.selected_layers || []).filter(
            (layer) =>
              WALLET_LAYER_NAME_SET.has(layer.label) &&
              !/fail|error|blocked|denied/i.test(layer.status),
          );
          if (verifiedWalletRails.length) {
            nextActiveLayerCount = verifiedWalletRails.length;
          }
        } catch {
          // Health status remains the fallback if the military-grade rail is temporarily unavailable.
        }

        setActiveLayerCount(nextActiveLayerCount);
      } catch {
        if (!disposed) {
          setActiveLayerCount(null);
        }
      }

      if (!walletAddress) {
        if (!disposed) {
          setProofEvents([]);
          setWalletActivity([]);
          setProofFeed([
            { label: 'No wallet connected', time: 'Create or import a wallet to start a proof trail.' },
          ]);
        }
        return;
      }

      const localEvents = getLocalWalletEvents(walletAddress, activeNetwork.name);
      const localProofs = localEvents.proofs;
      if (!disposed) {
        setProofEvents(localProofs);
        setWalletActivity(localEvents.activity);
        setProofFeed(
          localProofs.length
            ? buildProofFeed(localProofs)
            : [{ label: 'No integrity records yet', time: 'Your first protected action will appear here.' }],
        );
      }

      if (!hasTitanSecurityAccess()) {
        return;
      }

      try {
        const records = await listRecords({
          walletAddress,
          network: recordNetwork,
        });
        if (disposed) {
          return;
        }

        const liveProofs = mapIntegrityRecordsToProofs(records.items);
        const liveActivity = mapIntegrityRecordsToActivity(records.items);
        const mergedProofs = mergeProofEvents(localProofs, liveProofs);
        const mergedActivity = mergeActivityEvents(localEvents.activity, liveActivity);
        setProofEvents(mergedProofs);
        setWalletActivity(mergedActivity);
        setProofFeed(
          mergedProofs.length
            ? buildProofFeed(mergedProofs)
            : [{ label: 'No integrity records yet', time: 'Your first protected action will appear here.' }],
        );
      } catch {
        if (!disposed) {
          setProofEvents(localProofs);
          setWalletActivity(localEvents.activity);
          setProofFeed(
            localProofs.length
              ? buildProofFeed(localProofs)
              : [{ label: 'Proof log unavailable', time: 'Check API key or network connectivity.' }],
          );
        }
      }
    };

    void hydrateLiveData();
    const interval = window.setInterval(() => {
      void hydrateLiveData();
    }, 15000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [activeNetwork.chainId, activeNetwork.name, recordNetwork, walletAddress]);

  const displayedBalance =
    isConnected && balanceUSD > 0
      ? formatUSD(balanceUSD)
      : isConnected
        ? `${Number.parseFloat(balanceETH || '0').toFixed(4)} ${activeNetwork.symbol}`
        : 'Wallet disconnected';

  const selectedAssetFilterLabel = assetFilter === 'all' ? 'All popular networks' : assetFilter;
  const walletTimelineEvents = [
    ...walletActivity.map((activity) => ({
      id: `activity:${activity.id}`,
      kind: 'activity' as const,
      timestamp: activity.timestamp,
      activity,
    })),
    ...proofEvents.map((proof) => ({
      id: `proof:${proof.id}`,
      kind: 'proof' as const,
      timestamp: proof.timestamp,
      proof,
    })),
  ].sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime());
  const assetTabStatusLabel = assetTab === 'tokens'
    ? `${assetDisplayedTokens.length} visible`
    : assetTab === 'activity'
      ? `${walletTimelineEvents.length} events`
      : '0 live';

  const renderDomainEmptyState = (
    title: string,
    body: string,
  ) => (
    <div className="rounded-[20px] border border-dashed border-white/10 bg-[#15171C] px-5 py-10 text-center">
      <p className="text-[15px] font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-titan-subtext">{body}</p>
      <p className="mt-4 inline-flex rounded-full border border-titan-border bg-titan-surface px-3 py-1 text-[11px] font-semibold text-titan-subtext">
        Live data only, no placeholder rows
      </p>
    </div>
  );

  const renderNonTokenAssetTab = () => {
    if (assetTab === 'activity') {
      return walletTimelineEvents.length ? (
        <div className="overflow-hidden rounded-[20px] border border-white/6 bg-[#15171C]">
          {walletTimelineEvents.slice(0, 5).map((event) => {
            if (event.kind === 'activity') {
              return (
                <ActivityRow
                  key={event.id}
                  activity={event.activity}
                  onClick={() => navigate('/activity?tab=transactions')}
                />
              );
            }

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => navigate('/activity?tab=proofs')}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-titan-accent/10 text-titan-accent">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-titan-text">{event.proof.type}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-titan-subtext">
                      <Clock size={10} /> {formatTimeAgo(event.proof.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-semibold text-titan-accent">{getProofSourceLabel(event.proof)}</p>
                  <p className="mt-0.5 max-w-[120px] truncate text-xs text-titan-subtext">{event.proof.layer}</p>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => navigate('/activity')}
            className="w-full border-t border-white/6 px-4 py-3 text-sm font-semibold text-titan-accent transition-colors hover:bg-white/[0.02] hover:text-white"
          >
            Open full Activity
          </button>
        </div>
      ) : (
        renderDomainEmptyState(
          'No wallet activity yet',
          'This tab reads the wallet timeline: sends, receives, swaps, approvals, security proofs, and sealed wallet events.',
        )
      );
    }

    if (assetTab === 'perps') {
      return renderDomainEmptyState(
        'No live Perps positions',
        'Perps will stay empty until TITAN has actual wallet-owned perpetual positions to display. Activity events are not mixed into this tab.',
      );
    }

    if (assetTab === 'defi') {
      return renderDomainEmptyState(
        'No live DeFi positions',
        'DeFi will only show wallet-owned liquidity, lending, staking, or protocol positions. Transaction activity belongs in the Activity tab.',
      );
    }

    return renderDomainEmptyState(
      'No wallet NFTs found',
      'NFTs will only show collections owned by this wallet after NFT indexing/import is available. No mock NFTs are shown here.',
    );
  };

  const handleSaveCustomNetwork = (network: Network) => {
    addNetwork(network);
    setAssetFilter(network.name);
  };

  return (
    <div className="min-h-screen bg-titan-bg">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 py-10 pb-24">
        
        {/* ── Balance Card ───────────────────────────────────────────────── */}
        <section className="bg-[#0A0D14] border border-titan-border rounded-[28px] p-8 sm:p-10 shadow-elevated mb-8 relative overflow-hidden animate-fade-in">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-titan-accent/[0.04] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10 relative z-10">
            <div>
              <p className="text-[12px] font-semibold text-titan-accent uppercase tracking-[0.12em] mb-3">Total Balance</p>
              <div className="flex items-baseline gap-4">
                <h1 className="text-[48px] sm:text-[56px] font-bold text-white tracking-tight leading-none">
                  {displayedBalance}
                </h1>
                <span className="text-[14px] font-semibold text-titan-success bg-titan-success/10 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <ArrowUpRight size={14} strokeWidth={2.5} /> {activeLayerCount === null ? 'Live status unavailable' : `${activeLayerCount}/${WALLET_SECURITY_LAYER_NAMES.length}`}
                </span>
              </div>
              <p className="mt-3 text-[13px] text-titan-subtext">
                {walletAddress
                  ? `${activeNetwork.name} wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}${balanceLoading ? ' • syncing balance' : ''}`
                  : 'Import or create a wallet to load live balances and proof records.'}
              </p>
            </div>
            
            {/* Trust badge */}
            <div className="flex items-center gap-2.5 bg-[#131821] border border-titan-border px-3 py-1.5 rounded-full">
              <Shield size={12} className="text-titan-gold" />
                  <span className="text-[10px] text-titan-gold font-bold tracking-[0.15em] uppercase">TITAN Protocol</span>
            </div>
          </div>

          <div className="mb-10 relative z-10 max-w-2xl">
            <PortfolioBar tokens={portfolioData} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
            {[
              { icon: Send, label: 'Send', onClick: () => setShowSendModal(true) },
              { icon: ArrowDownLeft, label: 'Receive', onClick: () => setShowReceiveModal(true) },
              { icon: RefreshCw, label: 'Swap', onClick: () => setShowSwapPanel(true) },
              { icon: ShieldCheck, label: 'Security', onClick: () => navigate('/security') },
            ].map(action => (
              <button key={action.label} onClick={action.onClick} className="bg-[#131821] border border-[#1A2233] hover:bg-[#182030] hover:border-titan-accent/30 transition-all duration-200 py-4 rounded-xl flex flex-col items-center justify-center gap-2.5 group">
                <action.icon size={18} className="text-titan-text group-hover:text-titan-accent transition-colors duration-200" />
                <span className="text-[13px] font-semibold text-white tracking-wide">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 2-Column Layout for Desktop ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column (Assets) */}
          <div className="md:col-span-7 space-y-8">
            
            <section>
              <div className="mb-5 flex items-center justify-between px-1">
                <h2 className="text-[16px] font-bold tracking-wide text-white">Assets</h2>
                <span className="rounded-md border border-titan-border bg-titan-surface px-2.5 py-1 text-[12px] font-semibold text-titan-subtext">
                  {assetTabStatusLabel}
                </span>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-titan-border bg-[#111317] shadow-card">
                <div className="border-b border-white/5 px-4 pt-4">
                  <div className="flex gap-5 overflow-x-auto pb-3">
                    {ASSET_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAssetTab(tab.id)}
                        className={`shrink-0 border-b-2 pb-2 text-[15px] font-semibold transition-colors ${
                          assetTab === tab.id
                            ? 'border-white text-white'
                            : 'border-transparent text-white/55 hover:text-white/85'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-b border-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={() => setShowNetworkPicker(true)}
                    className="flex h-11 min-w-0 flex-1 items-center justify-between rounded-xl border border-white/10 bg-[#1A1C21] px-4 text-sm font-semibold text-white transition-colors hover:border-white/20 sm:max-w-[250px]"
                  >
                    <span className="truncate">{selectedAssetFilterLabel}</span>
                    <ChevronDown size={16} className="shrink-0 text-white/65" />
                  </button>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setShowNetworkPicker(true)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1A1C21] text-white/70 transition-colors hover:border-white/20 hover:text-white"
                    >
                      <SlidersHorizontal size={16} />
                    </button>
                    <button
                      onClick={() => setShowAddNetworkModal(true)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#1A1C21] text-white/70 transition-colors hover:border-white/20 hover:text-white"
                    >
                      <EllipsisVertical size={16} />
                    </button>
                  </div>
                </div>

                {isDetecting ? (
                  <div className="p-4">
                    <TokenDetectionBanner isDetecting={isDetecting} />
                  </div>
                ) : null}

                {assetTab === 'tokens' ? (
                  <>
                    <div className="px-4 pb-2">
                      {assetDisplayedTokens.length ? (
                        <div className="overflow-hidden rounded-[20px] border border-white/6 bg-[#15171C]">
                          {assetDisplayedTokens.map((token, i) => (
                            <div
                              key={token.id}
                              className="border-b border-white/6 last:border-0 hover:bg-white/[0.02] transition-colors duration-200 animate-stagger-up"
                              style={{ animationDelay: `${i * 50 + 120}ms` }}
                            >
                              <TokenRow token={token} variant="wallet-compact" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[20px] border border-dashed border-white/10 bg-[#15171C] px-4 py-10 text-center text-sm text-titan-subtext">
                          No assets found for {assetFilter === 'all' ? 'your current wallet scope' : assetFilter}. Run a scan, switch networks, or import a token manually.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1">
                      <Button variant="secondary" size="sm" onClick={() => void runAutoDetect()} loading={isDetecting}>
                        Scan Tokens
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setShowAddTokenModal(true)}>
                        Add Token
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 pb-4">
                    {renderNonTokenAssetTab()}
                  </div>
                )}
              </div>
            </section>

            <section id="approval-flows" className="scroll-mt-28">
              <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="text-[16px] font-bold text-white tracking-wide">Approval Flows</h2>
                <span className="text-[12px] font-semibold text-titan-subtext px-2.5 py-1 bg-titan-surface rounded-md border border-titan-border">
                  Connect + Sign
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="secondary" className="justify-center" onClick={() => setShowConnectModal(true)}>
                  Connect dApp
                </Button>
                <Button variant="secondary" className="justify-center" onClick={() => setShowSignModal(true)}>
                  Sign Message
                </Button>
              </div>
            </section>

          </div>

          {/* Right Column (Activity & Proofs) */}
          <div className="md:col-span-5 space-y-8">
            
            {/* Activity */}
            <section>
              <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="text-[16px] font-bold text-white tracking-wide">Recent Integrity Events</h2>
                <button
                  type="button"
                  onClick={() => navigate('/activity?tab=proofs')}
                  className="text-[12px] font-semibold text-titan-accent hover:text-white transition-colors duration-200"
                >
                  View all
                </button>
              </div>
              <div className="bg-[#0A0D14] border border-titan-border rounded-2xl overflow-hidden shadow-card animate-stagger-up" style={{ animationDelay: '400ms' }}>
                {proofEvents.length ? (
                  proofEvents.slice(0, 3).map((proof) => (
                    <button
                      key={proof.id}
                      type="button"
                      onClick={() => navigate('/activity?tab=proofs')}
                      className="flex w-full items-center justify-between p-5 text-left border-b border-titan-border/40 last:border-0 hover:bg-[#0F1520] transition-colors duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#131821] border border-[#1A2233] flex items-center justify-center">
                          <ShieldCheck size={16} className="text-titan-accent" />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-white leading-none mb-1">{proof.type}</p>
                          <p className="text-[12px] text-titan-subtext flex items-center gap-1 font-medium">
                            <Clock size={10} /> {formatTimeAgo(proof.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="mb-1 text-[11px] font-semibold text-titan-accent">{getProofSourceLabel(proof)}</p>
                        <p className="text-[12px] font-medium text-titan-subtext">{proof.layer}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-titan-subtext">
                    No recorded wallet actions yet. Once you sign, send, or seal data, the feed will update here.
                  </div>
                )}
              </div>
            </section>

            {/* Live Proof Activity */}
            <section>
              <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[16px] font-bold text-white tracking-wide">Proof Log</h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-titan-success/10 rounded border border-titan-success/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-titan-success animate-pulse" />
                    <span className="text-[10px] text-titan-success font-bold uppercase tracking-widest">Live</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#0A0D14] border border-titan-border rounded-2xl p-6 shadow-card animate-stagger-up" style={{ animationDelay: '500ms' }}>
                <div className="space-y-5">
                  {proofFeed.map((proof, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="relative mt-1">
                        {i === proofIndex && (
                          <div className="absolute -inset-1 rounded-full bg-titan-accent opacity-20 animate-pulse" />
                        )}
                        <div className={`w-2.5 h-2.5 rounded-full ${i === proofIndex ? 'bg-titan-accent' : 'bg-titan-border'}`} />
                        {i !== proofFeed.length - 1 && (
                          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-6 bg-titan-border" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-[14px] font-semibold transition-colors duration-200 ${i === proofIndex ? 'text-white' : 'text-titan-subtext'}`}>
                          {proof.label}
                        </p>
                        <p className="text-[12px] text-titan-tertiary mt-0.5 font-medium">{proof.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>

        </div>
      </main>

      {showAddTokenModal ? (
        <AddTokenModal isOpen={showAddTokenModal} onClose={() => setShowAddTokenModal(false)} />
      ) : null}
      {showSendModal ? (
        <SendTransactionModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} />
      ) : null}
      {showReceiveModal ? (
        <ReceiveModal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} />
      ) : null}
      {showSwapPanel ? (
        <SwapPanel isOpen={showSwapPanel} onClose={() => setShowSwapPanel(false)} />
      ) : null}
      {showConnectModal ? (
        <ConnectAppModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
      ) : null}
      {showSignModal ? (
        <SignMessageModal isOpen={showSignModal} onClose={() => setShowSignModal(false)} />
      ) : null}
      {showNetworkPicker ? (
        <AssetNetworkPickerModal
          isOpen={showNetworkPicker}
          onClose={() => setShowNetworkPicker(false)}
          selectedNetwork={assetFilter}
          onSelect={setAssetFilter}
          onAddCustom={() => {
            setShowNetworkPicker(false);
            setShowAddNetworkModal(true);
          }}
          networks={networks.filter((network) => assetNetworkNames.includes(network.name))}
        />
      ) : null}
      {showAddNetworkModal ? (
        <AddNetworkModal
          isOpen={showAddNetworkModal}
          onClose={() => setShowAddNetworkModal(false)}
          onSave={handleSaveCustomNetwork}
        />
      ) : null}
    </div>
  );
};

export default DashboardPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/layout/DashboardHeader';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, ShieldCheck, Shield, Clock, Send } from 'lucide-react';
import PortfolioBar from '../components/dashboard/PortfolioBar';
import { useBalance } from '../hooks/useBalance';
import { useTokenStore } from '../store/useTokenStore';
import { useWalletStore } from '../store/useWalletStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { formatTimeAgo, formatUSD } from '../utils/cn';
import TokenRow from '../components/ui/TokenRow';
import TokenDetectionBanner from '../components/dashboard/TokenDetectionBanner';
import AddTokenModal from '../components/dashboard/AddTokenModal';
import Button from '../components/ui/Button';
import SwapPanel from '../components/dashboard/SwapPanel';
import { getHealth } from '../services/security';
import { listRecords } from '../services/integrity';
import { buildTitanSecurityLayersFromApi, countActiveTitanLayers, mapIntegrityRecordsToProofs } from '../utils/integrity';
import SendTransactionModal from '../components/modals/SendTransactionModal';
import ReceiveModal from '../components/modals/ReceiveModal';
import { TITAN_SECURITY_LAYERS } from '../data/titanLayers';
import { hasTitanSecurityAccess } from '../config/api';
import ConnectAppModal from '../components/modals/ConnectAppModal';
import SignMessageModal from '../components/modals/SignMessageModal';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [proofIndex, setProofIndex] = useState(0);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [showSwapPanel, setShowSwapPanel] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [proofEvents, setProofEvents] = useState<ReturnType<typeof mapIntegrityRecordsToProofs>>([]);
  const [proofFeed, setProofFeed] = useState([
    { label: 'No integrity records yet', time: 'Create, sign, send, or swap to start a live trail.' },
  ]);
  const [activeLayerCount, setActiveLayerCount] = useState<number | null>(null);
  const walletAddress = useWalletStore((state) => state.address);
  const isConnected = useWalletStore((state) => state.isConnected);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const tokens = useTokenStore((state) => state.tokens);
  const isDetecting = useTokenStore((state) => state.isDetecting);
  const runAutoDetect = useTokenStore((state) => state.runAutoDetect);
  const { balanceETH, balanceUSD, isLoading: balanceLoading } = useBalance();
  const networkTokens = tokens.filter((token) => token.network === activeNetwork.name);
  const displayedTokens = networkTokens;
  const totalTokenValue = displayedTokens.reduce((sum, token) => sum + Math.max(token.balanceUSD, 0), 0);
  const portfolioData = displayedTokens.map((token, index) => ({
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

    const hydrateLiveData = async () => {
      try {
        const health = await getHealth();
        if (disposed) {
          return;
        }

        const liveLayers = buildTitanSecurityLayersFromApi(health);
        setActiveLayerCount(countActiveTitanLayers(liveLayers));
      } catch {
        if (!disposed) {
          setActiveLayerCount(null);
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
        if (disposed) {
          return;
        }

        const mapped = mapIntegrityRecordsToProofs(records.items).slice(0, 3).map((proof) => ({
          label: proof.type,
          time: proof.timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          }),
        }));
        const liveProofs = mapIntegrityRecordsToProofs(records.items);
        setProofEvents(liveProofs);
        setProofFeed(
          mapped.length
            ? mapped
            : [{ label: 'No integrity records yet', time: 'Your first protected action will appear here.' }],
        );
      } catch {
        if (!disposed) {
          setProofEvents([]);
          setProofFeed([
            { label: 'Proof log unavailable', time: 'Check API key or network connectivity.' },
          ]);
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
  }, [recordNetwork, walletAddress]);

  const displayedBalance =
    isConnected && balanceUSD > 0
      ? formatUSD(balanceUSD)
      : isConnected
        ? `${Number.parseFloat(balanceETH || '0').toFixed(4)} ${activeNetwork.symbol}`
        : 'Wallet disconnected';

  const detectedTokenCount = displayedTokens.filter((token) => token.source === 'detected').length;

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
                  <ArrowUpRight size={14} strokeWidth={2.5} /> {activeLayerCount === null ? 'Live status unavailable' : `${activeLayerCount}/${TITAN_SECURITY_LAYERS.length}`}
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
              <div className="flex items-center justify-between mb-5 px-1">
                <h2 className="text-[16px] font-bold text-white tracking-wide">Assets</h2>
                <span className="text-[12px] font-semibold text-titan-subtext px-2.5 py-1 bg-titan-surface rounded-md border border-titan-border">{tokens.length} Tokens</span>
              </div>
              <div className="mb-4">
                <TokenDetectionBanner isDetecting={isDetecting} detectedCount={detectedTokenCount} />
              </div>
              <div className="bg-[#0A0D14] border border-titan-border rounded-2xl overflow-hidden shadow-card">
                {displayedTokens.length ? (
                  displayedTokens.map((token, i) => (
                    <div
                      key={token.id}
                      className="border-b border-titan-border/40 last:border-0 hover:bg-[#0F1520] transition-colors duration-200 animate-stagger-up"
                      style={{ animationDelay: `${i * 60 + 200}ms` }}
                    >
                      <TokenRow token={token} />
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-titan-subtext">
                    No assets detected on {activeNetwork.name} yet. Run a token scan or import a custom token.
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => void runAutoDetect()} loading={isDetecting}>
                  Scan Tokens
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowAddTokenModal(true)}>
                  Add Token
                </Button>
              </div>
            </section>

            <section>
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
                <button className="text-[12px] font-semibold text-titan-accent hover:text-white transition-colors duration-200">View all</button>
              </div>
              <div className="bg-[#0A0D14] border border-titan-border rounded-2xl overflow-hidden shadow-card animate-stagger-up" style={{ animationDelay: '400ms' }}>
                {proofEvents.length ? (
                  proofEvents.slice(0, 3).map((proof) => (
                    <div key={proof.id} className="flex items-center justify-between p-5 border-b border-titan-border/40 last:border-0 hover:bg-[#0F1520] transition-colors duration-200 cursor-pointer">
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
                        <p className="text-[12px] font-medium text-titan-subtext">{proof.layer}</p>
                      </div>
                    </div>
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
    </div>
  );
};

export default DashboardPage;

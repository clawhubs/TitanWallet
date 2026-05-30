import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Bell, Settings, LogOut, Check, ExternalLink, WalletCards, ShieldCheck } from 'lucide-react';
import { formatAddress, formatTimeAgo } from '../../utils/cn';
import { useWallet } from '../../hooks/useWallet';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useWalletStore } from '../../store/useWalletStore';
import AccountSwitcherModal from './AccountSwitcherModal';
import { getLocalWalletEvents } from '../../services/localActivity';

const DashboardHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const { disconnectWallet } = useWallet();
  const walletAddress = useWalletStore((state) => state.address);
  const isConnected = useWalletStore((state) => state.isConnected);
  const walletName = useWalletStore((state) => state.walletName);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const networks = useNetworkStore((state) => state.networks);
  const setActiveNetwork = useNetworkStore((state) => state.setActiveNetwork);
  const explorerHref = walletAddress ? `${activeNetwork.explorerUrl}/address/${walletAddress}` : activeNetwork.explorerUrl;
  const notifications = useMemo(() => {
    if (!walletAddress) {
      return [];
    }

    const localEvents = getLocalWalletEvents(walletAddress, activeNetwork.name);
    return [
      ...localEvents.proofs.map((proof) => ({
        id: `proof:${proof.id}`,
        title: proof.type,
        desc: proof.txHash ? 'On-chain anchor recorded' : 'Off-chain proof sealed',
        time: proof.timestamp,
      })),
      ...localEvents.securityEvents.map((event, index) => ({
        id: `security:${event.type}:${index}`,
        title: event.type,
        desc: event.desc,
        time: event.time,
      })),
    ]
      .sort((left, right) => right.time.getTime() - left.time.getTime())
      .slice(0, 5);
  }, [activeNetwork.name, walletAddress]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/activity', label: 'Activity' },
    { to: '/security', label: 'Security' },
  ];

  return (
    <header className="sticky top-0 z-40 titan-glass border-b border-titan-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden mix-blend-screen">
            <img src="/titan-logo.png" alt="TITAN Logo" className="w-full h-full object-cover scale-[1.5]" />
          </div>
          <span className="font-bold text-white text-[15px] tracking-wide">TITAN</span>
        </Link>

        {/* Nav */}
        {isConnected ? (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.to || (link.to === '/security' && location.pathname === '/securitycenter')
                    ? 'text-titan-text bg-titan-muted/40'
                    : 'text-titan-subtext hover:text-titan-text hover:bg-titan-muted/20'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Network selector */}
          <div className="relative">
            <button
              onClick={() => { setShowNetworkMenu(!showNetworkMenu); setShowUserMenu(false); setShowNotifications(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-titan-surface border border-titan-border text-xs font-medium text-titan-text hover:border-titan-accent/30 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-titan-success" />
              {activeNetwork.name}
              <ChevronDown size={12} className="text-titan-subtext" />
            </button>

            {showNetworkMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 titan-card shadow-titan border border-titan-border rounded-xl overflow-hidden z-50">
                {networks.map(network => (
                  <button
                    key={network.id}
                    onClick={() => { setActiveNetwork(network); setShowNetworkMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-titan-muted/30 text-left transition-all"
                  >
                    <span className={`w-2 h-2 rounded-full ${network.id === activeNetwork.id ? 'bg-titan-success' : 'bg-titan-border'}`} />
                    <span className="text-sm text-titan-text">{network.name}</span>
                    {network.id === activeNetwork.id && <Check size={12} className="ml-auto text-titan-success" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Address / Connect */}
          {walletAddress ? (
            <button
              onClick={() => {
                setShowAccountSwitcher(true);
                setShowNetworkMenu(false);
                setShowUserMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-xl border border-titan-border bg-titan-surface px-3 py-1.5 text-left transition-all hover:border-titan-accent/30 hover:text-titan-text"
              data-testid="account-switcher-trigger"
            >
              <WalletCards size={14} className="text-titan-accent" />
              <div className="min-w-0">
                <p className="max-w-[110px] truncate text-[11px] font-semibold text-white">{walletName}</p>
                <p className="text-xs font-mono text-titan-subtext">{formatAddress(walletAddress)}</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => navigate('/onboarding')}
              className="rounded-xl border border-titan-accent/30 bg-titan-accent/10 px-3 py-1.5 text-xs font-semibold text-titan-accent transition-all hover:bg-titan-accent/20"
            >
              Connect wallet
            </button>
          )}

          {/* Bell */}
          {isConnected ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowNetworkMenu(false);
                  setShowUserMenu(false);
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-titan-subtext hover:text-titan-text hover:bg-titan-muted/30 transition-all relative"
                aria-label="Open notifications"
              >
                <Bell size={16} />
                {notifications.length ? (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-titan-accent" />
                ) : null}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 titan-card shadow-titan border border-titan-border rounded-xl overflow-hidden z-50">
                  <div className="flex items-center justify-between border-b border-titan-border px-4 py-3">
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    <span className="text-xs text-titan-subtext">{notifications.length} live</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            setShowNotifications(false);
                            navigate('/activity?tab=proofs');
                          }}
                          className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-titan-muted/30"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-titan-accent/10 text-titan-accent">
                            <ShieldCheck size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-titan-text">{notification.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-titan-subtext">{notification.desc}</p>
                            <p className="mt-1 text-xs text-titan-tertiary">{formatTimeAgo(notification.time)}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-titan-subtext">
                        No wallet notifications yet.
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/activity');
                    }}
                    className="w-full border-t border-titan-border px-4 py-3 text-sm font-semibold text-titan-accent transition-colors hover:bg-titan-muted/30 hover:text-white"
                  >
                    Open Activity
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* User menu */}
          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNetworkMenu(false); setShowNotifications(false); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden hover:opacity-80 transition-all mix-blend-screen"
              >
                <img src="/titan-logo.png" alt="Profile" className="w-full h-full object-cover scale-[1.5]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 titan-card shadow-titan border border-titan-border rounded-xl overflow-hidden z-50">
                  <Link to="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-titan-muted/30 text-sm text-titan-text transition-all">
                    <Settings size={14} className="text-titan-subtext" /> Settings
                  </Link>
                  <a href={explorerHref} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-titan-muted/30 text-sm text-titan-text transition-all">
                    <ExternalLink size={14} className="text-titan-subtext" /> Explorer
                  </a>
                  <div className="border-t border-titan-border my-1" />
                  <button onClick={() => { void disconnectWallet().then(() => navigate('/create-wallet')); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-titan-muted/30 text-sm text-titan-danger transition-all">
                    <LogOut size={14} /> Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showNetworkMenu || showUserMenu || showNotifications) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowNetworkMenu(false); setShowUserMenu(false); setShowNotifications(false); }} />
      )}

      <AccountSwitcherModal
        isOpen={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />
    </header>
  );
};

export default DashboardHeader;

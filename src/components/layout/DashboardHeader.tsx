import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Bell, Settings, LogOut, Check, ExternalLink, WalletCards } from 'lucide-react';
import { formatAddress } from '../../utils/cn';
import { useWallet } from '../../hooks/useWallet';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useWalletStore } from '../../store/useWalletStore';
import AccountSwitcherModal from './AccountSwitcherModal';

const DashboardHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const { disconnectWallet } = useWallet();
  const walletAddress = useWalletStore((state) => state.address);
  const isConnected = useWalletStore((state) => state.isConnected);
  const walletName = useWalletStore((state) => state.walletName);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const networks = useNetworkStore((state) => state.networks);
  const setActiveNetwork = useNetworkStore((state) => state.setActiveNetwork);
  const explorerHref = walletAddress ? `${activeNetwork.explorerUrl}/address/${walletAddress}` : activeNetwork.explorerUrl;

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
              onClick={() => { setShowNetworkMenu(!showNetworkMenu); setShowUserMenu(false); }}
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
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-titan-subtext hover:text-titan-text hover:bg-titan-muted/30 transition-all relative">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-titan-accent" />
            </button>
          ) : null}

          {/* User menu */}
          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNetworkMenu(false); }}
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
      {(showNetworkMenu || showUserMenu) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowNetworkMenu(false); setShowUserMenu(false); }} />
      )}

      <AccountSwitcherModal
        isOpen={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />
    </header>
  );
};

export default DashboardHeader;

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTitanManagedAuthBridge } from './features/consumer-auth/TitanManagedAuthBridge';
import LandingPage from './pages/LandingPage';
import RequireWallet from './components/routing/RequireWallet';
import { useWalletStore } from './store/useWalletStore';
import { useTokenStore } from './store/useTokenStore';

const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const CreateWalletPage = lazy(() => import('./pages/CreateWalletPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const DeveloperDocsPage = lazy(() => import('./features/developer/DeveloperDocsPage'));

const TitanManagedWalletSessionSync: React.FC = () => {
  const managed = useTitanManagedAuthBridge();
  const connect = useWalletStore((state) => state.connect);
  const removeAccountsBySource = useWalletStore((state) => state.removeAccountsBySource);
  const restoreWalletFromGoogle = managed.restoreWalletFromGoogle;

  useEffect(() => {
    if (!managed.enabled || !managed.ready) {
      return;
    }

    if (!managed.authenticated) {
      removeAccountsBySource('google');
      return;
    }

    if (!managed.linkedWallet) {
      return;
    }

    const state = useWalletStore.getState();
    const existingAccount = state.accounts.find((account) => account.id === managed.linkedWallet?.address.toLowerCase());
    const needsActiveResync = state.walletSource === 'google' && state.address !== managed.linkedWallet.address;
    const needsSecretRestore = !existingAccount?.privateKey || !existingAccount?.mnemonic;
    const needsMetadataRefresh = Boolean(
      existingAccount
      && (
        existingAccount.source !== 'google'
        || existingAccount.authProvider !== managed.provider
        || existingAccount.walletName !== managed.linkedWallet.walletName
      ),
    );

    if (!existingAccount || needsActiveResync || needsSecretRestore || (state.walletSource === 'google' && needsMetadataRefresh)) {
      void restoreWalletFromGoogle().then((wallet) => {
        connect({
          address: wallet.address,
          mnemonic: wallet.mnemonic,
          privateKey: wallet.privateKey,
          walletName: wallet.walletName,
          source: 'google',
          authProvider: managed.provider,
        });
      }).catch(() => {});
    }
  }, [
    connect,
    managed.authenticated,
    managed.enabled,
    managed.linkedWallet,
    managed.provider,
    managed.ready,
    restoreWalletFromGoogle,
    removeAccountsBySource,
  ]);

  return null;
};

const App: React.FC = () => {
  const walletAddress = useWalletStore((state) => state.address);
  const syncWalletScope = useTokenStore((state) => state.syncWalletScope);

  useEffect(() => {
    syncWalletScope();
  }, [syncWalletScope, walletAddress]);

  return (
    <BrowserRouter>
      <TitanManagedWalletSessionSync />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/create-wallet" element={<CreateWalletPage />} />
          <Route path="/dashboard" element={<RequireWallet><DashboardPage /></RequireWallet>} />
          <Route path="/security" element={<RequireWallet><SecurityPage /></RequireWallet>} />
          <Route path="/securitycenter" element={<RequireWallet><SecurityPage /></RequireWallet>} />
          <Route path="/activity" element={<RequireWallet><ActivityPage /></RequireWallet>} />
          <Route path="/settings" element={<RequireWallet><SettingsPage /></RequireWallet>} />
          <Route path="/developer/docs" element={<DeveloperDocsPage />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const RouteFallback: React.FC = () => (
  <div className="min-h-screen bg-titan-bg flex items-center justify-center px-4">
    <div className="rounded-3xl border border-titan-border bg-titan-surface px-6 py-4 text-sm text-titan-subtext">
      Loading TITAN workspace...
    </div>
  </div>
);

export default App;

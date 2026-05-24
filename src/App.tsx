import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import CreateWalletPage from './pages/CreateWalletPage';
import DashboardPage from './pages/DashboardPage';
import SecurityPage from './pages/SecurityPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import RequireWallet from './components/routing/RequireWallet';
import { useWalletStore } from './store/useWalletStore';
import { useTokenStore } from './store/useTokenStore';

const App: React.FC = () => {
  const walletAddress = useWalletStore((state) => state.address);
  const syncWalletScope = useTokenStore((state) => state.syncWalletScope);

  useEffect(() => {
    syncWalletScope();
  }, [syncWalletScope, walletAddress]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/create-wallet" element={<CreateWalletPage />} />
        <Route path="/dashboard" element={<RequireWallet><DashboardPage /></RequireWallet>} />
        <Route path="/security" element={<RequireWallet><SecurityPage /></RequireWallet>} />
        <Route path="/securitycenter" element={<RequireWallet><SecurityPage /></RequireWallet>} />
        <Route path="/activity" element={<RequireWallet><ActivityPage /></RequireWallet>} />
        <Route path="/settings" element={<RequireWallet><SettingsPage /></RequireWallet>} />
        {/* Catch-all redirect */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import CreateWalletPage from './pages/CreateWalletPage';
import DashboardPage from './pages/DashboardPage';
import SecurityPage from './pages/SecurityPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import RequireWallet from './components/routing/RequireWallet';

const App: React.FC = () => {
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
        <Route path="/settings" element={<SettingsPage />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWalletStore } from '../../store/useWalletStore';

interface RequireWalletProps {
  children: React.ReactElement;
}

const RequireWallet: React.FC<RequireWalletProps> = ({ children }) => {
  const location = useLocation();
  const isConnected = useWalletStore((state) => state.isConnected);
  const walletAddress = useWalletStore((state) => state.address);

  if (!isConnected || !walletAddress) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default RequireWallet;

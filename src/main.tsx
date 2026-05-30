import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { TitanManagedAuthProvider } from './features/consumer-auth/TitanManagedAuthBridge.tsx';
import { PrivyBridgeProvider } from './features/privy/PrivyBridge.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TitanManagedAuthProvider>
      <PrivyBridgeProvider>
        <App />
      </PrivyBridgeProvider>
    </TitanManagedAuthProvider>
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { PrivyBridgeProvider } from './features/privy/PrivyBridge.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyBridgeProvider>
      <App />
    </PrivyBridgeProvider>
  </StrictMode>,
);

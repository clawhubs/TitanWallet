import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import './index.css';
import App from './App.tsx';
import { TitanManagedAuthProvider } from './features/consumer-auth/TitanManagedAuthBridge.tsx';
import { registerTitanServiceWorker } from './registerServiceWorker.ts';

// Polyfill Buffer for browser-side libraries (e.g. TON SDK) that expect Node globals.
if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
}

registerTitanServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TitanManagedAuthProvider>
      <App />
    </TitanManagedAuthProvider>
  </StrictMode>,
);

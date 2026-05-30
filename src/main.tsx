import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { TitanManagedAuthProvider } from './features/consumer-auth/TitanManagedAuthBridge.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TitanManagedAuthProvider>
      <App />
    </TitanManagedAuthProvider>
  </StrictMode>,
);

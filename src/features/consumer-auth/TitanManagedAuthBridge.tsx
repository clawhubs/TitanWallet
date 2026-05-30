/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SocialAuthProvider = 'google' | 'apple';

interface TitanManagedAuthConfig {
  provider: 'titan-managed' | 'none';
  label: string;
  loginMethods: {
    google: boolean;
    apple: boolean;
  };
  managedWallet: {
    ready: boolean;
    label: string;
    message: string;
  };
  errors: string[];
}

interface TitanManagedAuthSession {
  authenticated: boolean;
  provider: SocialAuthProvider | null;
  user: {
    sub: string;
    email: string | null;
    name: string | null;
    picture: string | null;
  } | null;
  linkedWallet: {
    id: string;
    address: string;
    walletName: string;
    createdAt: string;
    custody: 'google-linked-local' | 'nitro-adapter';
  } | null;
}

interface TitanManagedAuthValue {
  enabled: boolean;
  ready: boolean;
  authenticated: boolean;
  provider: SocialAuthProvider | null;
  label: string;
  userName: string | null;
  userEmail: string | null;
  userPicture: string | null;
  linkedWallet: TitanManagedAuthSession['linkedWallet'];
  loginMethods: {
    loaded: boolean;
    google: boolean;
    apple: boolean;
  };
  managedWalletReady: boolean;
  managedWalletMessage: string;
  errors: string[];
  loginWithGoogle: (returnTo?: string) => void;
  linkWalletToGoogle: (input: { walletName: string; address: string; mnemonic: string; privateKey: string }) => Promise<NonNullable<TitanManagedAuthSession['linkedWallet']>>;
  restoreWalletFromGoogle: () => Promise<{ walletName: string; address: string; mnemonic: string; privateKey: string; createdAt: string; custody: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const defaultConfig: TitanManagedAuthConfig = {
  provider: 'none',
  label: 'TITAN Managed',
  loginMethods: {
    google: false,
    apple: false,
  },
  managedWallet: {
    ready: false,
    label: 'Nitro-backed 2-of-2 MPC',
    message: 'Managed wallet provisioning is not wired yet.',
  },
  errors: [],
};

const defaultSession: TitanManagedAuthSession = {
  authenticated: false,
  provider: null,
  user: null,
  linkedWallet: null,
};

const defaultValue: TitanManagedAuthValue = {
  enabled: false,
  ready: false,
  authenticated: false,
  provider: null,
  label: 'TITAN Managed',
  userName: null,
  userEmail: null,
  userPicture: null,
  linkedWallet: null,
  loginMethods: {
    loaded: false,
    google: false,
    apple: false,
  },
  managedWalletReady: false,
  managedWalletMessage: 'Managed wallet provisioning is not wired yet.',
  errors: [],
  loginWithGoogle: () => {},
  linkWalletToGoogle: async () => {
    throw new Error('Google wallet linking is unavailable.');
  },
  restoreWalletFromGoogle: async () => {
    throw new Error('Google wallet restore is unavailable.');
  },
  logout: async () => {},
  refreshSession: async () => {},
};

const TitanManagedAuthContext = createContext<TitanManagedAuthValue>(defaultValue);

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const TitanManagedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TitanManagedAuthConfig>(defaultConfig);
  const [session, setSession] = useState<TitanManagedAuthSession>(defaultSession);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const refreshSession = async () => {
    try {
      const nextSession = await readJson<TitanManagedAuthSession>('/api/consumer-auth/session', {
        credentials: 'include',
      });
      setSession(nextSession);
    } catch {
      setSession(defaultSession);
    } finally {
      setSessionLoaded(true);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const nextConfig = await readJson<TitanManagedAuthConfig>('/api/consumer-auth/config');
        if (!cancelled) {
          setConfig(nextConfig);
        }
      } catch {
        if (!cancelled) {
          setConfig(defaultConfig);
        }
      } finally {
        if (!cancelled) {
          setConfigLoaded(true);
        }
      }

      try {
        const nextSession = await readJson<TitanManagedAuthSession>('/api/consumer-auth/session', {
          credentials: 'include',
        });
        if (!cancelled) {
          setSession(nextSession);
        }
      } catch {
        if (!cancelled) {
          setSession(defaultSession);
        }
      } finally {
        if (!cancelled) {
          setSessionLoaded(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<TitanManagedAuthValue>(() => ({
    enabled: config.provider === 'titan-managed',
    ready: configLoaded && sessionLoaded,
    authenticated: session.authenticated,
    provider: session.provider,
    label: config.label,
    userName: session.user?.name || null,
    userEmail: session.user?.email || null,
    userPicture: session.user?.picture || null,
    linkedWallet: session.linkedWallet,
    loginMethods: {
      loaded: configLoaded,
      google: config.loginMethods.google,
      apple: config.loginMethods.apple,
    },
    managedWalletReady: config.managedWallet.ready,
    managedWalletMessage: config.managedWallet.message,
    errors: config.errors,
    loginWithGoogle: (returnTo) => {
      const target = returnTo || `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/api/consumer-auth/google/start?returnTo=${encodeURIComponent(target)}`);
    },
    linkWalletToGoogle: async (input) => {
      const result = await readJson<{
        wallet: NonNullable<TitanManagedAuthSession['linkedWallet']>;
      }>('/api/consumer-wallet/google/link', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      await refreshSession();
      return result.wallet;
    },
    restoreWalletFromGoogle: async () => {
      const result = await readJson<{
        wallet: { walletName: string; address: string; mnemonic: string; privateKey: string; createdAt: string; custody: string };
      }>('/api/consumer-wallet/google/restore', {
        method: 'POST',
        credentials: 'include',
      });
      return result.wallet;
    },
    logout: async () => {
      try {
        await fetch('/api/consumer-auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } finally {
        setSession(defaultSession);
      }
    },
    refreshSession,
  }), [config, configLoaded, session, sessionLoaded]);

  return (
    <TitanManagedAuthContext.Provider value={value}>
      {children}
    </TitanManagedAuthContext.Provider>
  );
};

export function useTitanManagedAuthBridge() {
  return useContext(TitanManagedAuthContext);
}

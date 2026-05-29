import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SecurityPreferencesStore {
  anchorOnChain: boolean;
  setAnchorOnChain: (value: boolean) => void;
}

export const useSecurityPreferencesStore = create<SecurityPreferencesStore>()(
  persist(
    (set) => ({
      anchorOnChain: false,
      setAnchorOnChain: (value) => set({ anchorOnChain: value }),
    }),
    {
      name: 'titan-wallet-security-preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

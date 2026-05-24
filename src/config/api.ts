export type YieldBoostEnvironment = 'testnet' | 'mainnet';

const API_KEY_STORAGE_KEY = 'titan-wallet-api-key';
const TITAN_RUNTIME_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

export const TITAN_API_BASE_URL =
  import.meta.env.VITE_TITAN_API_BASE_URL?.trim() || 'https://api.yieldboostai.xyz';

export const TITAN_MILITARY_GRADE_BASE_URL =
  import.meta.env.VITE_TITAN_MILITARY_GRADE_BASE_URL?.trim() || TITAN_RUNTIME_ORIGIN;

export const TITAN_DEV_PORTAL_URL =
  import.meta.env.VITE_TITAN_DEV_PORTAL_URL?.trim() || 'https://dev.yieldboostai.xyz';

export const TITAN_DEFAULT_API_KEY = import.meta.env.VITE_TITAN_API_KEY?.trim() || '';

export const TITAN_DEFAULT_ENVIRONMENT: YieldBoostEnvironment =
  import.meta.env.VITE_TITAN_API_ENV === 'testnet' ? 'testnet' : 'mainnet';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredTitanApiKey() {
  if (!canUseStorage()) {
    return '';
  }

  return window.localStorage.getItem(API_KEY_STORAGE_KEY)?.trim() || '';
}

export function getTitanApiKey() {
  return getStoredTitanApiKey() || TITAN_DEFAULT_API_KEY;
}

export function hasTitanSecurityAccess() {
  return Boolean(getTitanApiKey());
}

export function setStoredTitanApiKey(apiKey: string) {
  if (!canUseStorage()) {
    return;
  }

  const normalized = apiKey.trim();
  if (!normalized) {
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(API_KEY_STORAGE_KEY, normalized);
}

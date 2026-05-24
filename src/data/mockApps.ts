import type { TrustedApp } from '../types';

export const mockTrustedApps: TrustedApp[] = [
  {
    id: 'app-001',
    name: 'Uniswap',
    url: 'app.uniswap.org',
    icon: '🦄',
    connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    permissions: ['view-address', 'sign-transactions'],
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 8),
    risk: 'low',
  },
  {
    id: 'app-002',
    name: 'Aave',
    url: 'app.aave.com',
    icon: '👻',
    connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    permissions: ['view-address', 'sign-transactions'],
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24),
    risk: 'low',
  },
  {
    id: 'app-003',
    name: 'OpenSea',
    url: 'opensea.io',
    icon: '🌊',
    connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    permissions: ['view-address', 'sign-messages'],
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    risk: 'medium',
  },
  {
    id: 'app-004',
    name: 'Lido',
    url: 'lido.fi',
    icon: '🏊',
    connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    permissions: ['view-address', 'sign-transactions'],
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    risk: 'low',
  },
];

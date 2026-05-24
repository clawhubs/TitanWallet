import type { TitanLayer } from '../types';

export type WalletActionKey =
  | 'create-wallet'
  | 'import-wallet'
  | 'receive'
  | 'connect-dapp'
  | 'sign-message'
  | 'send'
  | 'swap'
  | 'export-secret';

export const WALLET_ACTION_LAYERS: Record<WalletActionKey, TitanLayer[]> = {
  'create-wallet': [
    'Secure Compute / TEE',
    'Sovereign Memory',
    'AWS Nitro Enclaves',
  ],
  'import-wallet': [
    'Secure Compute / TEE',
    'Sovereign Memory',
    'AWS Nitro Enclaves',
  ],
  receive: ['Sovereign Memory'],
  'connect-dapp': [
    'Integrity Auditor',
    'Sovereign Memory',
    'Cross-Agent Neural Handshake',
  ],
  'sign-message': [
    'Secure Compute / TEE',
    'Sovereign Memory',
    'Zero-Knowledge Proof Layer',
    'Cross-Agent Neural Handshake',
    'AWS Nitro Enclaves',
  ],
  send: [
    'Integrity Auditor',
    'Secure Compute / TEE',
    '0G Storage Proof Layer',
    'Zero-Knowledge Proof Layer',
    'ProofRegistry Anchor',
    'Programmable Governance',
    'Cross-Agent Neural Handshake',
    'AWS Nitro Enclaves',
  ],
  swap: [
    'Integrity Auditor',
    'Secure Compute / TEE',
    '0G Storage Proof Layer',
    'Zero-Knowledge Proof Layer',
    'ProofRegistry Anchor',
    'Programmable Governance',
    'Cross-Agent Neural Handshake',
    'AWS Nitro Enclaves',
  ],
  'export-secret': [
    'Secure Compute / TEE',
    'Sovereign Memory',
    'Cross-Agent Neural Handshake',
    'AWS Nitro Enclaves',
  ],
};

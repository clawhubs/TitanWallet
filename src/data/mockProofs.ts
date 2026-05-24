import type { ProofEvent, SecurityLayer } from '../types';
import { TITAN_SECURITY_LAYERS } from './titanLayers';

export const mockProofs: ProofEvent[] = [
  {
    id: 'proof-001',
    layer: 'Hallucination Blacklist',
    type: 'Preflight Screening',
    description: 'Request intent screened before the wallet action proceeded.',
    timestamp: new Date(Date.now() - 1000 * 60 * 32),
    status: 'verified',
    txHash: '0xf7a3c1e9b5d24680f3a7c1e9b5d24680',
  },
  {
    id: 'proof-002',
    layer: 'Zero-Knowledge Proof Layer',
    type: 'Zero-Knowledge Proof Generated',
    description: 'Private balance proof generated without revealing wallet state.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'verified',
  },
  {
    id: 'proof-003',
    layer: 'ProofRegistry Anchor',
    type: 'On-chain Proof Anchored',
    description: 'Activity proof committed to on-chain registry.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    status: 'verified',
    txHash: '0xa1b2c3d4e5f67890abcda1b2c3d4e5f6',
  },
  {
    id: 'proof-004',
    layer: 'Programmable Governance',
    type: 'Policy Enforcement Active',
    description: 'Outbound transaction limit policy applied ($10,000/day).',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    status: 'active',
  },
  {
    id: 'proof-005',
    layer: 'Secure Compute / TEE',
    type: 'Secure Compute Lane',
    description: 'Sensitive operation routed through the secure compute lane.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    status: 'verified',
  },
  {
    id: 'proof-006',
    layer: 'Sovereign Memory',
    type: 'Memory Snapshot Verified',
    description: 'Trusted app memory verified against signed manifest.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'verified',
  },
  {
    id: 'proof-007',
    layer: '0G Storage Proof Layer',
    type: '0G Proof Receipt Stored',
    description: 'Encrypted proof payload was written to the 0G-backed storage rail.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    status: 'active',
  },
  {
    id: 'proof-008',
    layer: 'Cross-Agent Neural Handshake',
    type: 'Handshake Log Recorded',
    description: 'Connection event recorded in the handshake journal.',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    status: 'active',
  },
];

export const mockSecurityLayers: SecurityLayer[] = TITAN_SECURITY_LAYERS.map((layer) => ({
  ...layer,
}));

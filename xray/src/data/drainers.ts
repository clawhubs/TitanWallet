export interface DrainerEntry {
  address: string;
  name: string;
  chains: number[];
  type: 'phishing' | 'drainer' | 'honeypot' | 'rug';
  reportedAt: string;
  source: 'community' | 'chainabuse' | 'scamsniffer' | 'forta';
}

export const KNOWN_DRAINERS: DrainerEntry[] = [
  {
    address: '0x0000000000a39bb272e79075ade125fd351887ac',
    name: 'Flagged Seaport Impersonation Pattern',
    chains: [1, 137, 42161, 10, 8453],
    type: 'drainer',
    reportedAt: '2026-05-01',
    source: 'community',
  },
  {
    address: '0x000000000000ad05ccc4f10045630fb830b95127',
    name: 'Flagged NFT Approval Drainer Pattern',
    chains: [1, 56, 137, 42161],
    type: 'drainer',
    reportedAt: '2026-05-01',
    source: 'community',
  },
];

export function findKnownDrainer(address: string, chainId: number) {
  const normalized = address.toLowerCase();
  return KNOWN_DRAINERS.find((entry) => entry.address.toLowerCase() === normalized && entry.chains.includes(chainId));
}

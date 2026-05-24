import { Contract, Interface, JsonRpcProvider, Wallet, id } from 'ethers';
import type { Network } from '../types';
import type { YieldBoostSealResponse } from './api';

const PROOF_REGISTRY_ABI = [
  'function recordProof(string cid, bytes32 rootHash, bytes32 storageTxHash, uint256 currentApyBps, uint256 optimizedApyBps) external returns (uint256 proofId)',
  'event ProofRecorded(uint256 indexed proofId,address indexed owner,string cid,bytes32 indexed rootHash,bytes32 storageTxHash,uint256 currentApyBps,uint256 optimizedApyBps,uint64 timestamp)',
] as const;

const proofRegistryInterface = new Interface(PROOF_REGISTRY_ABI);

const PROOF_REGISTRY_BY_NETWORK_ID: Record<string, string> = {
  '0g-mainnet': '0x8e63e117E71A80Cfc10fDF375F079e2e29cd7D7D',
  '0g-galileo': '0x516D005367045b1fc18c9c9a0Ff7bf8653d1B4e3',
};

export interface ProofRegistryAnchorResult {
  proofId: string | null;
  proofRegistryAddress: string;
  proofRegistryTxHash: string;
  proofRegistryExplorerUrl: string;
}

export function getProofRegistryAddress(network: Network) {
  return PROOF_REGISTRY_BY_NETWORK_ID[network.id] || null;
}

export function canAnchorProofOnNetwork(network: Network) {
  return Boolean(getProofRegistryAddress(network));
}

function normalizeBytes32(value: string | null | undefined, fallbackSeed: string) {
  if (typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value)) {
    return value;
  }

  return id(fallbackSeed);
}

export async function anchorSealedProofOnChain(input: {
  network: Network;
  privateKey: string;
  seal: YieldBoostSealResponse;
  fallbackTxHash: string;
  cidHint?: string;
  currentApyBps?: number;
  optimizedApyBps?: number;
}) {
  const proofRegistryAddress = getProofRegistryAddress(input.network);
  if (!proofRegistryAddress) {
    throw new Error(`ProofRegistry is not configured for ${input.network.name}.`);
  }

  const provider = new JsonRpcProvider(input.network.rpcUrl);
  const wallet = new Wallet(input.privateKey, provider);
  const proofRegistry = new Contract(proofRegistryAddress, PROOF_REGISTRY_ABI, wallet);
  const cid = input.cidHint || input.seal.storage_id;
  const rootHash = normalizeBytes32(
    input.seal.storage_root_hash,
    `${input.seal.storage_id}:root`,
  );
  const storageTxHash = normalizeBytes32(
    input.seal.storage_tx_hash || input.seal.transaction_hash || input.fallbackTxHash,
    `${input.seal.storage_id}:${input.fallbackTxHash}:storage`,
  );

  const tx = await proofRegistry.recordProof(
    cid,
    rootHash,
    storageTxHash,
    input.currentApyBps || 0,
    input.optimizedApyBps || 0,
  );
  const receipt = await tx.wait();

  if (!receipt) {
    throw new Error('ProofRegistry transaction receipt did not arrive.');
  }

  const proofEvent = receipt.logs
    .filter((log: { address: string }) => log.address.toLowerCase() === proofRegistryAddress.toLowerCase())
    .map((log: { topics: string[]; data: string }) => {
      try {
        return proofRegistryInterface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: { name?: string } | null) => event?.name === 'ProofRecorded');

  return {
    proofId: proofEvent?.args?.proofId?.toString() || null,
    proofRegistryAddress,
    proofRegistryTxHash: tx.hash,
    proofRegistryExplorerUrl: `${input.network.explorerUrl.replace(/\/$/, '')}/tx/${tx.hash}`,
  } satisfies ProofRegistryAnchorResult;
}

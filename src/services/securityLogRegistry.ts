import { Contract, Interface, JsonRpcProvider, Wallet, id } from 'ethers';
import type { Network } from '../types';
import type { YieldBoostSealResponse } from './api';

const WALLET_SECURITY_REGISTRY_ABI = [
  'function recordWalletSecurity(string action, string storageId, bytes32 sourceTxHash, bytes32 integrityHash, string context) external returns (uint256 logId)',
  'event WalletSecurityLogged(uint256 indexed logId,address indexed owner,bytes32 indexed actionHash,string action,string storageId,bytes32 sourceTxHash,bytes32 integrityHash,string context,uint64 timestamp)',
] as const;

const walletSecurityRegistryInterface = new Interface(WALLET_SECURITY_REGISTRY_ABI);

const SECURITY_LOG_REGISTRY_BY_NETWORK_ID: Record<string, string> = {
  '0g-mainnet': '0x05240D9636605e6cE1CFbCB03189e563f484F4DF',
  '0g-galileo': '0x56D8A81b1F034818bB416FBAeC55f0286F32AfA9',
};

export interface SecurityLogAnchorResult {
  logId: string | null;
  registryAddress: string;
  txHash: string;
  explorerUrl: string;
}

export function getSecurityLogRegistryAddress(network: Network) {
  return SECURITY_LOG_REGISTRY_BY_NETWORK_ID[network.id] || null;
}

export function canAnchorSecurityLogsOnNetwork(network: Network) {
  return Boolean(getSecurityLogRegistryAddress(network));
}

function normalizeBytes32(value: string | null | undefined, fallbackSeed: string) {
  if (typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value)) {
    return value;
  }

  return id(fallbackSeed);
}

export async function anchorWalletSecurityLog(input: {
  network: Network;
  privateKey: string;
  seal: YieldBoostSealResponse;
  action: string;
  sourceTxHash: string;
  context: string;
}) {
  const registryAddress = getSecurityLogRegistryAddress(input.network);
  if (!registryAddress) {
    throw new Error(`WalletSecurityRegistry is not configured for ${input.network.name}.`);
  }

  const provider = new JsonRpcProvider(input.network.rpcUrl);
  const wallet = new Wallet(input.privateKey, provider);
  const registry = new Contract(registryAddress, WALLET_SECURITY_REGISTRY_ABI, wallet);
  const normalizedSourceTxHash = normalizeBytes32(
    input.sourceTxHash,
    `${input.seal.storage_id}:${input.action}:source`,
  );
  const integrityHash = normalizeBytes32(
    input.seal.integrity_hash,
    `${input.seal.storage_id}:${input.action}:integrity`,
  );

  const tx = await registry.recordWalletSecurity(
    input.action,
    input.seal.storage_id,
    normalizedSourceTxHash,
    integrityHash,
    input.context,
  );
  const receipt = await tx.wait();

  if (!receipt) {
    throw new Error('Wallet security log receipt did not arrive.');
  }

  const logEvent = receipt.logs
    .filter((log: { address: string }) => log.address.toLowerCase() === registryAddress.toLowerCase())
    .map((log: { topics: string[]; data: string }) => {
      try {
        return walletSecurityRegistryInterface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: { name?: string } | null) => event?.name === 'WalletSecurityLogged');

  return {
    logId: logEvent?.args?.logId?.toString() || null,
    registryAddress,
    txHash: tx.hash,
    explorerUrl: `${input.network.explorerUrl.replace(/\/$/, '')}/tx/${tx.hash}`,
  } satisfies SecurityLogAnchorResult;
}

import { getChainByChainId, type ChainInfo } from '@/data/chains';
import type { ChainScanResult, TokenApproval } from '@/types/scanner';
import { assessApprovalRisk, computeHealthScore } from './riskEngine';
import { rpcCall, toTopicAddress } from './rpc';
import { fetchWalletChainProfile } from './walletProfile';
import { fetchGoPlusApprovals, isGoPlusSupported } from './goPlusApi';

const ERC20_APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
const APPROVAL_FOR_ALL_TOPIC = '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31';
const MAX_LOGS_PER_CHAIN = 40;

interface ExplorerLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  timeStamp?: string;
  transactionHash: string;
}

export async function scanChainApprovals(address: string, chainId: number): Promise<ChainScanResult | null> {
  const chain = getChainByChainId(chainId);
  if (!chain) return null;

  const warnings: string[] = [];

  // Always gather a read-only wallet footprint (balance, tx count, account type).
  // Cheap RPC calls that work on every chain (incl. 0G) without an API key or gas.
  const profile = await fetchWalletChainProfile(address, chain).catch(() => undefined);

  let logs: ExplorerLog[] = [];

  if (chain.approvalScanMode === 'offchain') {
    return {
      chain,
      approvals: [],
      riskAssessments: [],
      healthScore: 100,
      totalExposureUsd: 0,
      warnings,
      profile,
    };
  }

  // Preferred provider: GoPlus security API — fast, broad token coverage, and
  // returns spender risk intel in one call. Falls back below if unsupported/unavailable.
  if (isGoPlusSupported(chain.chainId)) {
    const goPlus = await fetchGoPlusApprovals(address, chain).catch(() => null);
    if (goPlus) {
      return {
        chain,
        approvals: goPlus.approvals,
        riskAssessments: goPlus.riskAssessments,
        healthScore: computeHealthScore(goPlus.riskAssessments),
        totalExposureUsd: 0,
        warnings,
        profile,
      };
    }
    warnings.push(`${chain.name}: risk provider unavailable, used on-chain log scan instead.`);
  }

  // Fallback: only hit the block explorer when one is actually configured for this chain.
  if (chain.explorerApiUrl) {
    try {
      logs = await fetchExplorerApprovalLogs(address, chain);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `${chain.name} explorer scan failed.`);
    }
  }

  if (!logs.length) {
    try {
      logs = await fetchRecentRpcApprovalLogs(address, chain);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `${chain.name} RPC log scan failed.`);
    }
  }

  const approvals = await Promise.all(logs.slice(0, MAX_LOGS_PER_CHAIN).map((log, index) => mapLogToApproval(log, chain, index)));
  const riskAssessments = approvals.map(assessApprovalRisk);
  const healthScore = computeHealthScore(riskAssessments);

  return {
    chain,
    approvals,
    riskAssessments,
    healthScore,
    totalExposureUsd: 0,
    warnings,
    profile,
  };
}

async function fetchExplorerApprovalLogs(address: string, chain: ChainInfo): Promise<ExplorerLog[]> {
  if (!chain.explorerApiUrl) {
    throw new Error(`${chain.name} explorer API is not configured.`);
  }

  const apiKey = chain.explorerApiKeyEnv ? process.env[chain.explorerApiKeyEnv] : '';
  const ownerTopic = toTopicAddress(address);
  const [erc20, nft] = await Promise.all([
    fetchLogTopic(chain, ERC20_APPROVAL_TOPIC, ownerTopic, apiKey),
    fetchLogTopic(chain, APPROVAL_FOR_ALL_TOPIC, ownerTopic, apiKey),
  ]);

  return dedupeLogs([...erc20, ...nft]);
}

async function fetchLogTopic(chain: ChainInfo, topic0: string, topic1: string, apiKey?: string): Promise<ExplorerLog[]> {
  const url = new URL(chain.explorerApiUrl || '');
  url.searchParams.set('module', 'logs');
  url.searchParams.set('action', 'getLogs');
  url.searchParams.set('fromBlock', '0');
  url.searchParams.set('toBlock', 'latest');
  url.searchParams.set('topic0', topic0);
  url.searchParams.set('topic1', topic1);
  url.searchParams.set('topic0_1_opr', 'and');
  if (apiKey) url.searchParams.set('apikey', apiKey);

  const response = await fetch(url, { next: { revalidate: 30 } });
  if (!response.ok) {
    throw new Error(`${chain.name} explorer returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (payload.status === '0' && /invalid|missing|rate|deprecated/i.test(String(payload.message || payload.result))) {
    throw new Error(`${chain.name} explorer unavailable: ${payload.message || payload.result}`);
  }
  if (!Array.isArray(payload.result)) return [];
  return payload.result;
}

async function fetchRecentRpcApprovalLogs(address: string, chain: ChainInfo): Promise<ExplorerLog[]> {
  const latestHex = await rpcCall<string>(chain, 'eth_blockNumber', [], 2500);
  const latest = Number(BigInt(latestHex));
  const from = Math.max(0, latest - 250_000);
  const ownerTopic = toTopicAddress(address);
  const filters = [
    { fromBlock: `0x${from.toString(16)}`, toBlock: 'latest', topics: [ERC20_APPROVAL_TOPIC, ownerTopic] },
    { fromBlock: `0x${from.toString(16)}`, toBlock: 'latest', topics: [APPROVAL_FOR_ALL_TOPIC, ownerTopic] },
  ];

  const results = await Promise.allSettled(filters.map((filter) => rpcCall<ExplorerLog[]>(chain, 'eth_getLogs', [filter], 4000)));
  return dedupeLogs(results.flatMap((result) => result.status === 'fulfilled' ? result.value : []));
}

async function mapLogToApproval(log: ExplorerLog, chain: ChainInfo, index: number): Promise<TokenApproval> {
  const isApprovalForAll = log.topics?.[0]?.toLowerCase() === APPROVAL_FOR_ALL_TOPIC;
  const spender = topicToAddress(log.topics?.[2] || '');
  const tokenAddress = log.address;
  const tokenSymbol = await readTokenSymbol(chain, tokenAddress).catch(() => 'TOKEN');
  const decimals = await readTokenDecimals(chain, tokenAddress).catch(() => 18);
  const allowance = isApprovalForAll ? 'setApprovalForAll' : formatAllowance(log.data, decimals, tokenSymbol);
  const blockNumber = hexOrDecimalToNumber(log.blockNumber);

  return {
    id: `${chain.chainId}-${log.transactionHash || 'log'}-${index}`,
    chainId: chain.chainId,
    chainName: chain.name,
    token: tokenAddress,
    tokenName: tokenSymbol,
    tokenSymbol,
    tokenDecimals: decimals,
    spender,
    spenderLabel: spender === '0x0000000000000000000000000000000000000000' ? 'Unknown spender' : spender,
    allowance,
    rawAllowance: log.data,
    type: isApprovalForAll ? 'ERC-721' : 'ERC-20',
    txHash: log.transactionHash,
    blockNumber,
    timestamp: Number(log.timeStamp || 0),
    isVerified: false,
    explorerUrl: `${chain.explorerUrl}/tx/${log.transactionHash}`,
  };
}

async function readTokenSymbol(chain: ChainInfo, tokenAddress: string) {
  const result = await rpcCall<string>(chain, 'eth_call', [{ to: tokenAddress, data: '0x95d89b41' }, 'latest'], 2500);
  return decodeStringResult(result) || 'TOKEN';
}

async function readTokenDecimals(chain: ChainInfo, tokenAddress: string) {
  const result = await rpcCall<string>(chain, 'eth_call', [{ to: tokenAddress, data: '0x313ce567' }, 'latest'], 2500);
  return Number(BigInt(result || '0x12')) || 18;
}

function decodeStringResult(hex: string) {
  if (!hex || hex === '0x') return '';
  try {
    const clean = hex.slice(2);
    if (clean.length <= 64) return Buffer.from(clean, 'hex').toString('utf8').replace(/\0/g, '').trim();
    const length = Number.parseInt(clean.slice(64, 128), 16);
    const data = clean.slice(128, 128 + length * 2);
    return Buffer.from(data, 'hex').toString('utf8').replace(/\0/g, '').trim();
  } catch {
    return '';
  }
}

function formatAllowance(data: string, decimals: number, symbol: string) {
  const value = data && data !== '0x' ? BigInt(data) : 0n;
  if (value > (2n ** 255n)) return `Unlimited ${symbol}`;
  const divisor = 10n ** BigInt(decimals || 18);
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(decimals || 18, '0').slice(0, 4).replace(/0+$/, '');
  return `${whole.toString()}${fraction ? `.${fraction}` : ''} ${symbol}`;
}

function topicToAddress(topic: string) {
  const clean = topic.toLowerCase().replace(/^0x/, '');
  if (clean.length < 40) return '0x0000000000000000000000000000000000000000';
  return `0x${clean.slice(-40)}`;
}

function hexOrDecimalToNumber(value: string) {
  if (!value) return 0;
  return Number(value.startsWith('0x') ? BigInt(value) : BigInt(value));
}

function dedupeLogs(logs: ExplorerLog[]) {
  const seen = new Set<string>();
  return logs.filter((log) => {
    const key = `${log.transactionHash}-${log.address}-${log.data}-${log.topics?.join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

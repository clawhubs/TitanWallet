import { Contract, Interface, JsonRpcProvider, Wallet, id, isAddress, parseEther } from 'ethers';
import {
  type AgentIntentContext,
  type AgentWalletAction,
  type AgentWalletPolicy,
  type ApiResponse,
  type NativeSendInput,
  type NativeSendResult,
  type TitanAgentWalletConfig,
  type TitanNetwork,
} from './types.js';

const REGISTRY_ABI = [
  'function recordWalletSecurity(string action, string storageId, bytes32 sourceTxHash, bytes32 integrityHash, string context) external returns (uint256 logId)',
  'event WalletSecurityLogged(uint256 indexed logId,address indexed owner,bytes32 indexed actionHash,string action,string storageId,bytes32 sourceTxHash,bytes32 integrityHash,string context,uint64 timestamp)',
] as const;

const REGISTRY_BY_CHAIN_ID: Record<number, string> = {
  16661: '0x05240D9636605e6cE1CFbCB03189e563f484F4DF',
  16601: '0x56D8A81b1F034818bB416FBAeC55f0286F32AfA9',
};

const registryInterface = new Interface(REGISTRY_ABI);

export class TitanAgentWalletClient {
  private baseUrl: string;
  private militaryBaseUrl: string;
  private identity: Partial<TitanAgentWalletConfig>;

  constructor(config: TitanAgentWalletConfig = {}) {
    this.baseUrl = (config.baseUrl || 'https://wallet.yieldboostai.xyz/api').replace(/\/$/, '');
    this.militaryBaseUrl = (config.militaryBaseUrl || 'https://wallet.yieldboostai.xyz').replace(/\/$/, '');
    this.identity = config;
  }

  async health() {
    return this.api<ApiResponse>('/v1/health', { method: 'GET' });
  }

  async layerStatus() {
    return this.api<ApiResponse>('/v1/status/layers', { method: 'GET' });
  }

  async checkIntent(input: AgentIntentContext) {
    const text = [input.intent, input.toolSummary].filter(Boolean).join('\n\n');
    return this.api<ApiResponse>('/v1/blacklist/check', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async runTenLayerRail(input: {
    action: AgentWalletAction;
    walletAddress?: string;
    network: string;
    chainId?: number;
    context: AgentIntentContext;
    metadata?: Record<string, unknown>;
  }) {
    return this.military<ApiResponse>({
      payload: {
        source: 'titan-agent-wallet-sdk',
        action: input.action,
        intent: input.context.intent,
        walletAddress: input.walletAddress,
        network: input.network,
        chainId: input.chainId,
        requested_at: new Date().toISOString(),
        agent_wallet: this.identity.agentWalletId,
        project_id: this.identity.projectId,
        capability_token: this.identity.capabilityToken,
        metadata: {
          actor: input.context.actor || 'developer-ai',
          session_id: input.context.sessionId,
          tool_summary: input.context.toolSummary,
          ...input.context.metadata,
          ...input.metadata,
        },
      },
    });
  }

  async createChallenge(input: {
    operation: 'seal' | 'unseal' | 'delete';
    walletAddress: string;
    network?: TitanNetwork;
    storageId?: string;
  }) {
    return this.api<ApiResponse>('/v1/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({
        operation: input.operation,
        network: input.network || 'mainnet',
        wallet_address: input.walletAddress,
        storage_id: input.storageId,
      }),
    });
  }

  async sealWithWallet(input: {
    privateKey: string;
    plaintext: string;
    network?: TitanNetwork;
    metadata?: Record<string, unknown>;
    transactionHash?: string;
  }) {
    const wallet = new Wallet(input.privateKey);
    const challenge = await this.createChallenge({
      operation: 'seal',
      walletAddress: wallet.address,
      network: input.network || 'mainnet',
    });
    const message = String(challenge.message || '');
    const signature = await wallet.signMessage(message);
    return this.api<ApiResponse>('/v1/integrity/seal', {
      method: 'POST',
      body: JSON.stringify({
        network: input.network || 'mainnet',
        challenge_id: challenge.challenge_id,
        wallet_address: wallet.address,
        signature,
        signature_kind: 'eip191',
        message,
        plaintext: input.plaintext,
        mime_type: 'application/json',
        transaction_hash: input.transactionHash,
        metadata: {
          layer_name: 'Sovereign Memory',
          event_type: 'Agent Wallet Memory',
          ...input.metadata,
        },
      }),
    });
  }

  async proofRun(commitment: Record<string, unknown>, integrityHash?: string) {
    return this.api<ApiResponse>('/v1/proof/run', {
      method: 'POST',
      body: JSON.stringify({
        commitment,
        integrity_hash: integrityHash,
      }),
    });
  }

  async handshakeLog(input: {
    subjectId: string;
    operation: string;
    walletAddress?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.api<ApiResponse>('/v1/handshake/log', {
      method: 'POST',
      body: JSON.stringify({
        subject_id: input.subjectId,
        operation: input.operation,
        wallet_address: input.walletAddress,
        metadata: input.metadata || {},
      }),
    });
  }

  async sendNative(input: NativeSendInput): Promise<NativeSendResult> {
    const wallet = new Wallet(input.privateKey, new JsonRpcProvider(input.rpcUrl));
    const valueWei = parseEther(input.valueEth).toString();
    this.assertPolicy({
      policy: input.policy,
      chainId: input.chainId,
      to: input.to,
      valueWei,
    });

    await this.checkIntent(input.context);
    await this.runTenLayerRail({
      action: 'agent-send',
      walletAddress: wallet.address,
      network: input.networkName,
      chainId: input.chainId,
      context: input.context,
      metadata: { to: input.to, value_wei: valueWei },
    });

    const tx = await wallet.sendTransaction({
      to: input.to,
      value: parseEther(input.valueEth),
      chainId: input.chainId,
    });
    const receipt = input.waitForReceipt === false ? null : await tx.wait();

    await this.runTenLayerRail({
      action: 'agent-tool-result',
      walletAddress: wallet.address,
      network: input.networkName,
      chainId: input.chainId,
      context: {
        ...input.context,
        intent: `Attach confirmed agent wallet transaction ${tx.hash} to the 10-layer rail.`,
      },
      metadata: {
        tx_hash: tx.hash,
        block_number: receipt?.blockNumber ? Number(receipt.blockNumber) : null,
      },
    });

    const proof = await this.proofRun({
      wallet_address: wallet.address,
      type: 'agent-send',
      to: input.to,
      value_wei: valueWei,
      tx_hash: tx.hash,
      chain_id: input.chainId,
      project_id: this.identity.projectId,
      agent_wallet_id: this.identity.agentWalletId,
    });
    const seal = await this.sealWithWallet({
      privateKey: input.privateKey,
      network: input.chainId === 16601 ? 'testnet' : 'mainnet',
      transactionHash: tx.hash,
      plaintext: JSON.stringify({
        tx_hash: tx.hash,
        from: wallet.address,
        to: input.to,
        value_wei: valueWei,
        chain_id: input.chainId,
        context: input.context,
      }),
      metadata: {
        event_type: 'Agent Wallet Native Transfer',
        layer_name: 'ProofRegistry Anchor',
        project_id: this.identity.projectId,
        agent_wallet_id: this.identity.agentWalletId,
      },
    });
    const handshake = await this.handshakeLog({
      subjectId: tx.hash,
      operation: 'agent-send',
      walletAddress: wallet.address,
      metadata: {
        chain_id: input.chainId,
        to: input.to,
        value_wei: valueWei,
      },
    });

    const anchor = input.anchorSecurityLog
      ? await this.anchorSecurityLog({
          wallet,
          chainId: input.chainId,
          action: 'agent-send',
          storageId: String(seal.storage_id || ''),
          sourceTxHash: tx.hash,
          integrityHash: typeof seal.integrity_hash === 'string' ? seal.integrity_hash : undefined,
          context: `agent-send|${input.chainId}|${wallet.address}|${input.to}|${valueWei}`,
        })
      : null;

    return {
      txHash: tx.hash,
      receiptBlockNumber: receipt?.blockNumber ? Number(receipt.blockNumber) : null,
      sealStorageId: typeof seal.storage_id === 'string' ? seal.storage_id : null,
      proofRequestId: typeof proof.request_id === 'string' ? proof.request_id : null,
      handshakeRequestId: typeof handshake.request_id === 'string' ? handshake.request_id : null,
      securityLogTxHash: anchor?.txHash || null,
      securityLogId: anchor?.logId || null,
    };
  }

  private assertPolicy(input: {
    policy?: AgentWalletPolicy;
    chainId: number;
    to: string;
    valueWei: string;
  }) {
    const policy = input.policy;
    if (!isAddress(input.to)) {
      throw new Error('Recipient address is invalid.');
    }
    if (!policy) {
      return;
    }
    if (policy.expiresAt && Date.parse(policy.expiresAt) <= Date.now()) {
      throw new Error('Capability is expired.');
    }
    if (policy.allowedChainIds?.length && !policy.allowedChainIds.includes(input.chainId)) {
      throw new Error(`Chain ${input.chainId} is not allowed by policy.`);
    }
    if (
      policy.allowedDestinations?.length &&
      !policy.allowedDestinations.some((address) => address.toLowerCase() === input.to.toLowerCase())
    ) {
      throw new Error('Recipient is not on the policy allowlist.');
    }
    if (policy.maxValueWei && BigInt(input.valueWei) > BigInt(policy.maxValueWei)) {
      throw new Error('Transfer exceeds policy maxValueWei.');
    }
  }

  private async anchorSecurityLog(input: {
    wallet: Wallet;
    chainId: number;
    action: string;
    storageId: string;
    sourceTxHash: string;
    integrityHash?: string;
    context: string;
  }) {
    const registryAddress = REGISTRY_BY_CHAIN_ID[input.chainId];
    if (!registryAddress) {
      throw new Error(`WalletSecurityRegistry is not configured for chain ${input.chainId}.`);
    }
    const registry = new Contract(registryAddress, REGISTRY_ABI, input.wallet);
    const tx = await registry.recordWalletSecurity(
      input.action,
      input.storageId,
      normalizeBytes32(input.sourceTxHash, `${input.storageId}:${input.action}:source`),
      normalizeBytes32(input.integrityHash, `${input.storageId}:${input.action}:integrity`),
      input.context,
    );
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('Security log receipt did not arrive.');
    }
    const event = receipt.logs
      .filter((log: { address: string }) => log.address.toLowerCase() === registryAddress.toLowerCase())
      .map((log: { topics: string[]; data: string }) => {
        try {
          return registryInterface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((item: { name?: string } | null) => item?.name === 'WalletSecurityLogged');

    return {
      txHash: tx.hash,
      logId: event?.args?.logId?.toString() || null,
    };
  }

  private async military<T>(body: unknown): Promise<T> {
    const response = await fetch(`${this.militaryBaseUrl}/api/dev/store/military-grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return readJson<T>(response);
  }

  private async api<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    return readJson<T>(response);
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : `TITAN request failed with status ${response.status}.`;
    throw new Error(error);
  }
  return payload as T;
}

function normalizeBytes32(value: string | undefined, fallbackSeed: string) {
  if (typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value)) {
    return value;
  }
  return id(fallbackSeed);
}

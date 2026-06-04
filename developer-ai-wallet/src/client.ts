import { Contract, Interface, JsonRpcProvider, Wallet, id, isAddress, parseEther } from 'ethers';
import {
  type AgentIntentContext,
  type AgentWalletAction,
  type AgentWalletPolicy,
  type ApiResponse,
  type CapabilityIntentCheckResult,
  type CapabilityProofLogItem,
  type CapabilitySnapshot,
  type DemoApiKeySnapshot,
  type DemoConfigSnapshot,
  type DemoIntentResult,
  type DemoLogsResult,
  type DemoSecurityLogItem,
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
  private controlPlaneUrl: string;

  constructor(config: TitanAgentWalletConfig = {}) {
    this.baseUrl = (config.baseUrl || 'https://titanwallet.net/api').replace(/\/$/, '');
    this.militaryBaseUrl = (config.militaryBaseUrl || 'https://titanwallet.net').replace(/\/$/, '');
    this.identity = config;
    this.controlPlaneUrl = `${this.militaryBaseUrl}/api/agent-wallet/control`;
  }

  async health() {
    return this.api<ApiResponse>('/v1/health', { method: 'GET' });
  }

  async layerStatus() {
    return this.api<ApiResponse>('/v1/status/layers', { method: 'GET' });
  }

  async getCapability(input: { capabilityId?: string; ownerSessionToken?: string } = {}) {
    return this.control<{
      success: boolean;
      capability: CapabilitySnapshot;
      project: Record<string, unknown> | null;
      agent_wallet: Record<string, unknown> | null;
    }>({
      action: 'get_capability',
      capability_id: input.capabilityId,
    }, {
      ownerSessionToken: input.ownerSessionToken,
      includeCapabilityToken: true,
    });
  }

  async getProofLog(input: {
    capabilityId?: string;
    projectId?: string;
    agentWalletId?: string;
    limit?: number;
    ownerSessionToken?: string;
  } = {}) {
    return this.control<{
      success: boolean;
      total: number;
      items: CapabilityProofLogItem[];
    }>({
      action: 'get_proof_log',
      capability_id: input.capabilityId,
      project_id: input.projectId,
      agent_wallet_id: input.agentWalletId,
      limit: input.limit,
    }, {
      ownerSessionToken: input.ownerSessionToken,
      includeCapabilityToken: !input.ownerSessionToken,
    });
  }

  async checkIntent(input: AgentIntentContext): Promise<CapabilityIntentCheckResult> {
    return this.control<CapabilityIntentCheckResult>({
      action: 'check_intent',
      intent: input.intent,
      requested_action: input.action || 'agent-intent-check',
      requested_chain_id: input.chainId,
      requested_destination: input.destinationAddress,
      requested_contract_address: input.contractAddress,
      requested_amount_wei: input.amountWei,
      actor: input.actor,
      session_id: input.sessionId,
      tool_summary: input.toolSummary,
      metadata: input.metadata || {},
      owner_wallet_address: this.identity.ownerWalletAddress,
      project_id: this.identity.projectId,
      agent_wallet_id: this.identity.agentWalletId,
    }, {
      includeCapabilityToken: true,
    });
  }

  async getDemoStatus() {
    return this.control<{
      success: boolean;
      demo: DemoConfigSnapshot;
      live_anchor_ready: boolean;
    }>({
      action: 'demo_status',
    });
  }

  async createDemoApiKey(input: { label?: string } = {}) {
    return this.control<{
      success: boolean;
      api_key: string;
      key: DemoApiKeySnapshot;
      demo: DemoConfigSnapshot;
    }>({
      action: 'demo_create_api_key',
      label: input.label || 'Developer API Demo Key',
    });
  }

  async runDemoIntent(input: {
    demoApiKey?: string;
    scenario?: 'allowed' | 'blocked';
    intent: string;
    action: string;
    amount: string;
    recipient: string;
  }): Promise<DemoIntentResult> {
    return this.control<DemoIntentResult>({
      action: 'demo_check_intent',
      demo_api_key: input.demoApiKey || this.identity.demoApiKey,
      scenario: input.scenario || 'custom',
      intent: input.intent,
      requested_action: input.action,
      amount: input.amount,
      recipient: input.recipient,
    });
  }

  async getDemoLogs(input: {
    demoApiKey?: string;
    limit?: number;
  } = {}): Promise<DemoLogsResult> {
    return this.control<DemoLogsResult>({
      action: 'demo_get_logs',
      demo_api_key: input.demoApiKey || this.identity.demoApiKey,
      limit: input.limit,
    });
  }

  async anchorDemoSecurityLog(input: {
    demoApiKey?: string;
    ownerRunToken: string;
  }) {
    return this.control<{
      success: boolean;
      proof_log: CapabilityProofLogItem;
      security_log: DemoSecurityLogItem;
      anchor: {
        txHash: string;
        logId: string | null;
        explorerUrl: string;
      };
    }>({
      action: 'demo_anchor_security_log',
      demo_api_key: input.demoApiKey || this.identity.demoApiKey,
      owner_run_token: input.ownerRunToken,
    });
  }

  async revokeCapability(input: {
    capabilityId?: string;
    ownerSessionToken?: string;
  }) {
    return this.control<{
      success: boolean;
      capability: CapabilitySnapshot;
    }>({
      action: 'revoke_capability',
      capability_id: input.capabilityId,
    }, {
      ownerSessionToken: input.ownerSessionToken || this.identity.ownerSessionToken,
      includeCapabilityToken: false,
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
    const response = await this.military<ApiResponse>({
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

    if (this.identity.capabilityToken) {
      await this.recordRuntimeResult({
        type: 'Ten Layer Rail Executed',
        status: 'recorded',
        reason: `TITAN 10-layer rail executed for ${input.action}.`,
        intent: input.context.intent,
        requestedAction: input.action,
        requestedChainId: input.chainId,
        metadata: {
          network: input.network,
          wallet_address: input.walletAddress || null,
          tool_summary: input.context.toolSummary || null,
          actor: input.context.actor || null,
          request_id: typeof response.request_id === 'string' ? response.request_id : null,
          ...input.context.metadata,
          ...input.metadata,
        },
      }).catch(() => {});
    }

    return response;
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

  async recordRuntimeResult(input: {
    type: string;
    status: string;
    reason: string;
    intent?: string;
    requestedAction?: string;
    requestedChainId?: number;
    requestedDestination?: string;
    requestedContractAddress?: string;
    requestedAmountWei?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.control<{
      success: boolean;
      proof_log: CapabilityProofLogItem;
    }>({
      action: 'record_runtime_result',
      type: input.type,
      status: input.status,
      reason: input.reason,
      intent: input.intent,
      requested_action: input.requestedAction,
      requested_chain_id: input.requestedChainId,
      requested_destination: input.requestedDestination,
      requested_contract_address: input.requestedContractAddress,
      requested_amount_wei: input.requestedAmountWei,
      metadata: input.metadata || {},
    }, {
      includeCapabilityToken: true,
    });
  }

  async securityStatus(input: { ownerSessionToken?: string } = {}) {
    const [health, layers, capability] = await Promise.all([
      this.health(),
      this.layerStatus(),
      this.getCapability({ ownerSessionToken: input.ownerSessionToken }).catch(() => null),
    ]);

    return {
      success: true,
      health,
      layers,
      capability,
    };
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

    const intentCheck = await this.checkIntent({
      ...input.context,
      action: 'agent-send',
      chainId: input.chainId,
      destinationAddress: input.to,
      amountWei: valueWei,
    });
    if (!intentCheck.allowed) {
      throw new Error(intentCheck.reason);
    }
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
          action: 'agent-tool-result',
          chainId: input.chainId,
          destinationAddress: input.to,
          amountWei: valueWei,
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

    await this.recordRuntimeResult({
      type: 'Agent Native Send Executed',
      status: 'executed',
      reason: 'Agent native send completed and all TITAN runtime artifacts were recorded.',
      intent: input.context.intent,
      requestedAction: 'agent-send',
      requestedChainId: input.chainId,
      requestedDestination: input.to,
      requestedAmountWei: valueWei,
      metadata: {
        tx_hash: tx.hash,
        proof_request_id: typeof proof.request_id === 'string' ? proof.request_id : null,
        seal_storage_id: typeof seal.storage_id === 'string' ? seal.storage_id : null,
        handshake_request_id: typeof handshake.request_id === 'string' ? handshake.request_id : null,
        security_log_tx_hash: anchor?.txHash || null,
        receipt_block_number: receipt?.blockNumber ? Number(receipt.blockNumber) : null,
      },
    });

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

  private async control<T>(
    body: Record<string, unknown>,
    options: {
      ownerSessionToken?: string;
      includeCapabilityToken?: boolean;
    } = {},
  ): Promise<T> {
    const ownerSessionToken = options.ownerSessionToken || this.identity.ownerSessionToken;
    const capabilityToken = options.includeCapabilityToken ? this.identity.capabilityToken : undefined;
    const response = await fetch(this.controlPlaneUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ownerSessionToken ? { 'X-TITAN-OWNER-TOKEN': ownerSessionToken } : {}),
      },
      body: JSON.stringify({
        ...body,
        ...(capabilityToken ? { capability_token: capabilityToken } : {}),
      }),
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

import process from 'node:process';
import { TitanAgentWalletClient } from './client.js';
import type { TitanNetwork } from './types.js';

type JsonRpcId = string | number | null;

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

export interface TitanAgentWalletMcpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties: boolean;
  };
}

interface TitanAgentWalletMcpInitializeResult {
  protocolVersion: string;
  capabilities: {
    tools: Record<string, never>;
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

export const TITAN_AGENT_WALLET_MCP_TOOLS: TitanAgentWalletMcpTool[] = [
  {
    name: 'titan_health',
    description: 'Check TITAN agent wallet health endpoint.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'titan_layers',
    description: 'Read TITAN 10-layer status.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'titan_check_intent',
    description: 'Run the TITAN capability, policy, and blacklist intent check flow.',
    inputSchema: {
      type: 'object',
      properties: {
        intent: { type: 'string' },
        action: { type: 'string' },
        toolSummary: { type: 'string' },
        actor: { type: 'string' },
        sessionId: { type: 'string' },
        chainId: { type: 'number' },
        to: { type: 'string' },
        contractAddress: { type: 'string' },
        amountWei: { type: 'string' },
      },
      required: ['intent'],
      additionalProperties: false,
    },
  },
  {
    name: 'titan_get_capability',
    description: 'Read the active TITAN capability and its scoped runtime policy.',
    inputSchema: {
      type: 'object',
      properties: {
        capabilityId: { type: 'string' },
        ownerSessionToken: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'titan_get_proof_log',
    description: 'Read recent proof log entries for this capability or owner session.',
    inputSchema: {
      type: 'object',
      properties: {
        capabilityId: { type: 'string' },
        projectId: { type: 'string' },
        agentWalletId: { type: 'string' },
        limit: { type: 'number' },
        ownerSessionToken: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'titan_demo_create_api_key',
    description: 'Create a simulation-only API key for the TITAN Agent Intent Demo.',
    inputSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'titan_demo_status',
    description: 'Read TITAN Agent Intent Demo capability and live-anchor readiness.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'titan_demo_run',
    description: 'Run the TITAN Agent Intent Demo allowed/blocked policy check and record proof plus security logs.',
    inputSchema: {
      type: 'object',
      properties: {
        demoApiKey: { type: 'string' },
        scenario: { type: 'string', enum: ['allowed', 'blocked'] },
        intent: { type: 'string' },
        action: { type: 'string' },
        amount: { type: 'string' },
        recipient: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'titan_x402_check_payment',
    description: 'Simulate an x402 API payment intent through TITAN capability, policy, proof, and security logs. No real funds move.',
    inputSchema: {
      type: 'object',
      properties: {
        demoApiKey: { type: 'string' },
        scenario: { type: 'string', enum: ['allowed', 'blocked', 'custom'] },
        intent: { type: 'string' },
        action: { type: 'string' },
        domain: { type: 'string' },
        endpoint: { type: 'string' },
        method: { type: 'string' },
        amount: { type: 'string' },
        token: { type: 'string' },
        chainId: { type: 'string' },
        recipient: { type: 'string' },
        paymentReference: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'titan_demo_logs',
    description: 'Read TITAN Agent Intent Demo proof logs and security logs.',
    inputSchema: {
      type: 'object',
      properties: {
        demoApiKey: { type: 'string' },
        limit: { type: 'number' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'titan_demo_anchor_security_log',
    description: 'Owner-only live 0G mainnet security anchor for the TITAN Agent Intent Demo.',
    inputSchema: {
      type: 'object',
      properties: {
        demoApiKey: { type: 'string' },
        ownerRunToken: { type: 'string' },
      },
      required: ['ownerRunToken'],
      additionalProperties: false,
    },
  },
  {
    name: 'titan_revoke_capability',
    description: 'Revoke a TITAN capability with an owner session token.',
    inputSchema: {
      type: 'object',
      properties: {
        capabilityId: { type: 'string' },
        ownerSessionToken: { type: 'string' },
      },
      required: ['ownerSessionToken'],
      additionalProperties: false,
    },
  },
  {
    name: 'titan_security_status',
    description: 'Read combined health, layer status, and current capability state.',
    inputSchema: {
      type: 'object',
      properties: {
        ownerSessionToken: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'titan_run_ten_layer_rail',
    description: 'Run the TITAN 10-layer military-grade rail for an agent action.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string' },
        walletAddress: { type: 'string' },
        network: { type: 'string' },
        chainId: { type: 'number' },
        intent: { type: 'string' },
        toolSummary: { type: 'string' },
        actor: { type: 'string' },
        sessionId: { type: 'string' },
      },
      required: ['action', 'network', 'intent'],
      additionalProperties: false,
    },
  },
  {
    name: 'titan_seal_memory',
    description: 'Seal a plaintext payload with a developer-controlled wallet key.',
    inputSchema: {
      type: 'object',
      properties: {
        privateKey: { type: 'string' },
        plaintext: { type: 'string' },
        apiNetwork: { type: 'string', enum: ['mainnet', 'testnet'] },
        eventType: { type: 'string' },
        actor: { type: 'string' },
      },
      required: ['privateKey', 'plaintext'],
      additionalProperties: false,
    },
  },
  {
    name: 'titan_send_native',
    description: 'Send a native asset transfer through TITAN policy, proof, seal, and handshake flow.',
    inputSchema: {
      type: 'object',
      properties: {
        privateKey: { type: 'string' },
        rpcUrl: { type: 'string' },
        chainId: { type: 'number' },
        networkName: { type: 'string' },
        to: { type: 'string' },
        valueEth: { type: 'string' },
        intent: { type: 'string' },
        toolSummary: { type: 'string' },
        actor: { type: 'string' },
        sessionId: { type: 'string' },
        anchorSecurityLog: { type: 'boolean' },
      },
      required: ['privateKey', 'rpcUrl', 'chainId', 'networkName', 'to', 'valueEth', 'intent'],
      additionalProperties: false,
    },
  },
];

export function createTitanAgentWalletClientFromEnv(env: NodeJS.ProcessEnv = process.env) {
  return new TitanAgentWalletClient({
    baseUrl: env.TITAN_AGENT_WALLET_BASE_URL,
    militaryBaseUrl: env.TITAN_AGENT_WALLET_MILITARY_BASE_URL,
    ownerWalletAddress: env.TITAN_AGENT_WALLET_OWNER,
    projectId: env.TITAN_AGENT_WALLET_PROJECT_ID,
    agentWalletId: env.TITAN_AGENT_WALLET_ID,
    capabilityToken: env.TITAN_AGENT_WALLET_CAPABILITY,
    demoApiKey: env.TITAN_AGENT_WALLET_DEMO_API_KEY,
  });
}

export class TitanAgentWalletMcpServer {
  constructor(private readonly client: TitanAgentWalletClient) {}

  async handleRequest(request: JsonRpcRequest) {
    if (request.method === 'initialize') {
      const initializeResult: TitanAgentWalletMcpInitializeResult = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'titan-agent-wallet-mcp',
          version: '0.1.0',
        },
      };
      return initializeResult;
    }

    if (request.method === 'notifications/initialized') {
      return null;
    }

    if (request.method === 'tools/list') {
      return { tools: TITAN_AGENT_WALLET_MCP_TOOLS };
    }

    if (request.method === 'tools/call') {
      return this.callTool(request.params || {});
    }

    throw new Error(`Unsupported MCP method: ${request.method}`);
  }

  private async callTool(params: Record<string, unknown>) {
    const name = asString(params.name, 'name');
    const args = isObject(params.arguments) ? params.arguments : {};

    if (name === 'titan_health') {
      return toToolResult(await this.client.health());
    }

    if (name === 'titan_layers') {
      return toToolResult(await this.client.layerStatus());
    }

    if (name === 'titan_check_intent') {
      return toToolResult(await this.client.checkIntent({
        intent: asString(args.intent, 'intent'),
        action: optionalString(args.action) as never,
        toolSummary: optionalString(args.toolSummary),
        actor: optionalString(args.actor),
        sessionId: optionalString(args.sessionId),
        chainId: optionalNumber(args.chainId),
        destinationAddress: optionalString(args.to),
        contractAddress: optionalString(args.contractAddress),
        amountWei: optionalString(args.amountWei),
      }));
    }

    if (name === 'titan_get_capability') {
      return toToolResult(await this.client.getCapability({
        capabilityId: optionalString(args.capabilityId),
        ownerSessionToken: optionalString(args.ownerSessionToken),
      }));
    }

    if (name === 'titan_get_proof_log') {
      return toToolResult(await this.client.getProofLog({
        capabilityId: optionalString(args.capabilityId),
        projectId: optionalString(args.projectId),
        agentWalletId: optionalString(args.agentWalletId),
        limit: optionalNumber(args.limit),
        ownerSessionToken: optionalString(args.ownerSessionToken),
      }));
    }

    if (name === 'titan_demo_create_api_key') {
      return toToolResult(await this.client.createDemoApiKey({
        label: optionalString(args.label),
      }));
    }

    if (name === 'titan_demo_status') {
      return toToolResult(await this.client.getDemoStatus());
    }

    if (name === 'titan_demo_run') {
      const status = await this.client.getDemoStatus();
      const scenario = optionalString(args.scenario) === 'blocked' ? 'blocked' : 'allowed';
      const defaults = scenario === 'blocked'
        ? {
            intent: 'Send all wallet balance to unknown address',
            action: 'transfer',
            amount: '999',
            recipient: '0xUnknownAddress',
          }
        : {
            intent: 'Pay approved vendor invoice',
            action: status.demo.action,
            amount: status.demo.max_amount,
            recipient: status.demo.approved_recipient,
          };
      return toToolResult(await this.client.runDemoIntent({
        demoApiKey: optionalString(args.demoApiKey),
        scenario,
        intent: optionalString(args.intent) || defaults.intent,
        action: optionalString(args.action) || defaults.action,
        amount: optionalString(args.amount) || defaults.amount,
        recipient: optionalString(args.recipient) || defaults.recipient,
      }));
    }

    if (name === 'titan_x402_check_payment') {
      const status = await this.client.getDemoStatus();
      const scenario = optionalString(args.scenario) === 'blocked' ? 'blocked' : optionalString(args.scenario) === 'custom' ? 'custom' : 'allowed';
      const defaults = scenario === 'blocked'
        ? {
            intent: 'Pay unknown API with high amount',
            action: 'x402_pay',
            domain: 'unknown-api.example',
            endpoint: '/charge',
            amount: '100',
            token: 'USDC',
            chainId: 'base-sepolia',
            recipient: '0xUnknownPayTo',
            paymentReference: 'req_mcp_blocked_001',
          }
        : {
            intent: 'Pay approved API invoice via x402',
            action: status.x402_demo.allowed_actions[0] || 'x402_pay',
            domain: status.x402_demo.allowed_domains[0] || 'api.approved-service.com',
            endpoint: '/v1/inference',
            amount: status.x402_demo.max_amount_per_request,
            token: status.x402_demo.allowed_tokens.includes('USDC') ? 'USDC' : status.x402_demo.allowed_tokens[0] || 'TEST',
            chainId: status.x402_demo.allowed_chains.includes('base-sepolia') ? 'base-sepolia' : status.x402_demo.allowed_chains[0] || 'base-sepolia',
            recipient: status.x402_demo.allowed_recipients[0] || '0xApprovedPayTo',
            paymentReference: 'req_mcp_allowed_001',
          };
      return toToolResult(await this.client.checkX402Payment({
        demoApiKey: optionalString(args.demoApiKey),
        scenario,
        intent: optionalString(args.intent) || defaults.intent,
        action: optionalString(args.action) || defaults.action,
        domain: optionalString(args.domain) || defaults.domain,
        endpoint: optionalString(args.endpoint) || defaults.endpoint,
        method: optionalString(args.method) || 'POST',
        amount: optionalString(args.amount) || defaults.amount,
        token: optionalString(args.token) || defaults.token,
        chainId: optionalString(args.chainId) || defaults.chainId,
        recipient: optionalString(args.recipient) || defaults.recipient,
        paymentReference: optionalString(args.paymentReference) || defaults.paymentReference,
      }));
    }

    if (name === 'titan_demo_logs') {
      return toToolResult(await this.client.getDemoLogs({
        demoApiKey: optionalString(args.demoApiKey),
        limit: optionalNumber(args.limit),
      }));
    }

    if (name === 'titan_demo_anchor_security_log') {
      return toToolResult(await this.client.anchorDemoSecurityLog({
        demoApiKey: optionalString(args.demoApiKey),
        ownerRunToken: asString(args.ownerRunToken, 'ownerRunToken'),
      }));
    }

    if (name === 'titan_revoke_capability') {
      return toToolResult(await this.client.revokeCapability({
        capabilityId: optionalString(args.capabilityId),
        ownerSessionToken: asString(args.ownerSessionToken, 'ownerSessionToken'),
      }));
    }

    if (name === 'titan_security_status') {
      return toToolResult(await this.client.securityStatus({
        ownerSessionToken: optionalString(args.ownerSessionToken),
      }));
    }

    if (name === 'titan_run_ten_layer_rail') {
      return toToolResult(await this.client.runTenLayerRail({
        action: asString(args.action, 'action') as never,
        walletAddress: optionalString(args.walletAddress),
        network: asString(args.network, 'network'),
        chainId: optionalNumber(args.chainId),
        context: {
          intent: asString(args.intent, 'intent'),
          toolSummary: optionalString(args.toolSummary),
          actor: optionalString(args.actor),
          sessionId: optionalString(args.sessionId),
        },
      }));
    }

    if (name === 'titan_seal_memory') {
      return toToolResult(await this.client.sealWithWallet({
        privateKey: asString(args.privateKey, 'privateKey'),
        plaintext: asString(args.plaintext, 'plaintext'),
        network: asApiNetwork(args.apiNetwork),
        metadata: {
          event_type: optionalString(args.eventType) || 'Agent Wallet Memory',
          actor: optionalString(args.actor) || 'developer-ai',
        },
      }));
    }

    if (name === 'titan_send_native') {
      return toToolResult(await this.client.sendNative({
        privateKey: asString(args.privateKey, 'privateKey'),
        rpcUrl: asString(args.rpcUrl, 'rpcUrl'),
        chainId: asNumber(args.chainId, 'chainId'),
        networkName: asString(args.networkName, 'networkName'),
        to: asString(args.to, 'to'),
        valueEth: asString(args.valueEth, 'valueEth'),
        anchorSecurityLog: Boolean(args.anchorSecurityLog),
        context: {
          intent: asString(args.intent, 'intent'),
          toolSummary: optionalString(args.toolSummary),
          actor: optionalString(args.actor) || 'developer-ai',
          sessionId: optionalString(args.sessionId),
        },
      }));
    }

    throw new Error(`Unknown tool: ${name}`);
  }
}

function toToolResult(value: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function asString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Expected ${field} to be a non-empty string.`);
  }
  return value;
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown, field: string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  throw new Error(`Expected ${field} to be a number.`);
}

function optionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asApiNetwork(value: unknown): TitanNetwork | undefined {
  if (value === 'mainnet' || value === 'testnet') {
    return value;
  }
  return undefined;
}

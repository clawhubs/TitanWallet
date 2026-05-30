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
    description: 'Run the TITAN blacklist and intent check flow.',
    inputSchema: {
      type: 'object',
      properties: {
        intent: { type: 'string' },
        toolSummary: { type: 'string' },
        actor: { type: 'string' },
        sessionId: { type: 'string' },
      },
      required: ['intent'],
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
        toolSummary: optionalString(args.toolSummary),
        actor: optionalString(args.actor),
        sessionId: optionalString(args.sessionId),
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

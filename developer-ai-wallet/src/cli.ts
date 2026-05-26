#!/usr/bin/env node
import { Wallet } from 'ethers';
import { TitanAgentWalletClient } from './client.js';

type Args = Record<string, string | boolean>;

const command = process.argv[2] || 'help';
const args = parseArgs(process.argv.slice(3));

const client = new TitanAgentWalletClient({
  baseUrl: stringArg('base-url') || process.env.TITAN_AGENT_WALLET_BASE_URL,
  militaryBaseUrl: stringArg('military-base-url') || process.env.TITAN_AGENT_WALLET_MILITARY_BASE_URL,
  projectId: stringArg('project-id') || process.env.TITAN_AGENT_WALLET_PROJECT_ID,
  agentWalletId: stringArg('agent-wallet-id') || process.env.TITAN_AGENT_WALLET_ID,
  capabilityToken: stringArg('capability-token') || process.env.TITAN_AGENT_WALLET_CAPABILITY,
});

async function main() {
  if (command === 'help' || args.help) {
    printHelp();
    return;
  }

  if (command === 'health') {
    print(await client.health());
    return;
  }

  if (command === 'layers') {
    print(await client.layerStatus());
    return;
  }

  if (command === 'check-intent') {
    print(await client.checkIntent({
      intent: required('intent'),
      toolSummary: stringArg('tool-summary'),
      actor: stringArg('actor') || 'developer-ai',
      sessionId: stringArg('session-id'),
    }));
    return;
  }

  if (command === 'run') {
    print(await client.runTenLayerRail({
      action: (stringArg('action') || 'agent-simulate') as never,
      walletAddress: stringArg('wallet-address'),
      network: stringArg('network') || '0G Mainnet',
      chainId: numberArg('chain-id'),
      context: {
        intent: required('intent'),
        toolSummary: stringArg('tool-summary'),
        actor: stringArg('actor') || 'developer-ai',
        sessionId: stringArg('session-id'),
      },
    }));
    return;
  }

  if (command === 'seal') {
    const privateKey = privateKeyArg();
    print(await client.sealWithWallet({
      privateKey,
      network: networkArg(),
      plaintext: required('plaintext'),
      metadata: {
        event_type: stringArg('event-type') || 'Agent Wallet Memory',
        actor: stringArg('actor') || 'developer-ai',
      },
    }));
    return;
  }

  if (command === 'send') {
    const privateKey = privateKeyArg();
    const wallet = new Wallet(privateKey);
    print(await client.sendNative({
      privateKey,
      rpcUrl: required('rpc-url', 'TITAN_AGENT_WALLET_RPC_URL'),
      chainId: numberArg('chain-id') || 16661,
      networkName: stringArg('network') || '0G Mainnet',
      to: required('to'),
      valueEth: required('value-eth'),
      waitForReceipt: !args['no-wait'],
      anchorSecurityLog: Boolean(args.anchor),
      policy: {
        maxValueWei: stringArg('max-value-wei'),
        allowedChainIds: numberListArg('allowed-chain-ids'),
        allowedDestinations: listArg('allowed-destinations'),
        expiresAt: stringArg('expires-at'),
      },
      context: {
        intent: required('intent'),
        toolSummary: stringArg('tool-summary'),
        actor: stringArg('actor') || wallet.address,
        sessionId: stringArg('session-id'),
      },
    }));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function parseArgs(tokens: string[]) {
  const next: Args = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const value = tokens[index + 1];
    if (!value || value.startsWith('--')) {
      next[key] = true;
      continue;
    }
    next[key] = value;
    index += 1;
  }
  return next;
}

function stringArg(name: string) {
  const value = args[name];
  return typeof value === 'string' ? value : undefined;
}

function numberArg(name: string) {
  const value = stringArg(name);
  return value ? Number.parseInt(value, 10) : undefined;
}

function listArg(name: string) {
  const value = stringArg(name);
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : undefined;
}

function numberListArg(name: string) {
  return listArg(name)?.map((item) => Number.parseInt(item, 10)).filter((item) => Number.isFinite(item));
}

function privateKeyArg() {
  return required('private-key', 'TITAN_AGENT_WALLET_PRIVATE_KEY');
}

function networkArg() {
  const value = stringArg('api-network') || process.env.TITAN_AGENT_WALLET_API_NETWORK;
  return value === 'testnet' ? 'testnet' : 'mainnet';
}

function required(name: string, envName?: string) {
  const value = stringArg(name) || (envName ? process.env[envName] : undefined);
  if (!value) {
    throw new Error(`Missing --${name}${envName ? ` or ${envName}` : ''}.`);
  }
  return value;
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp() {
  console.log(`TITAN Agent Wallet CLI

Commands:
  health
  layers
  check-intent --intent "Pay invoice"
  run --action agent-simulate --intent "Prepare a treasury transfer"
  seal --private-key <key> --plaintext '{"memory":"trusted vendor"}'
  send --private-key <key> --rpc-url <url> --to <address> --value-eth 0.001 --intent "Pay vendor"

Environment:
  TITAN_AGENT_WALLET_BASE_URL=https://wallet.yieldboostai.xyz/api
  TITAN_AGENT_WALLET_MILITARY_BASE_URL=https://wallet.yieldboostai.xyz
  TITAN_AGENT_WALLET_PROJECT_ID=proj_...
  TITAN_AGENT_WALLET_ID=aw_...
  TITAN_AGENT_WALLET_CAPABILITY=cap_...
  TITAN_AGENT_WALLET_PRIVATE_KEY=0x...
  TITAN_AGENT_WALLET_RPC_URL=https://evmrpc.0g.ai
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

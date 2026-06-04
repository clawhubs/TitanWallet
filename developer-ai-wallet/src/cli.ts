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
  ownerSessionToken: stringArg('owner-session-token') || process.env.TITAN_AGENT_WALLET_OWNER_SESSION_TOKEN,
  demoApiKey: stringArg('demo-api-key') || process.env.TITAN_AGENT_WALLET_DEMO_API_KEY,
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
      action: (stringArg('action') || 'agent-intent-check') as never,
      toolSummary: stringArg('tool-summary'),
      actor: stringArg('actor') || 'developer-ai',
      sessionId: stringArg('session-id'),
      chainId: numberArg('chain-id'),
      destinationAddress: stringArg('to'),
      contractAddress: stringArg('contract-address'),
      amountWei: stringArg('amount-wei'),
    }));
    return;
  }

  if (command === 'capability') {
    print(await client.getCapability({
      capabilityId: stringArg('capability-id'),
      ownerSessionToken: stringArg('owner-session-token'),
    }));
    return;
  }

  if (command === 'proof:list') {
    print(await client.getProofLog({
      capabilityId: stringArg('capability-id'),
      projectId: stringArg('project-id'),
      agentWalletId: stringArg('agent-wallet-id'),
      limit: numberArg('limit'),
      ownerSessionToken: stringArg('owner-session-token'),
    }));
    return;
  }

  if (command === 'demo:status') {
    print(await client.getDemoStatus());
    return;
  }

  if (command === 'demo:key') {
    print(await client.createDemoApiKey({
      label: stringArg('label') || 'TITAN Agent Intent Demo',
    }));
    return;
  }

  if (command === 'demo:run') {
    const status = await client.getDemoStatus();
    const scenario = stringArg('scenario') === 'blocked' ? 'blocked' : 'allowed';
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
    print(await client.runDemoIntent({
      demoApiKey: stringArg('demo-api-key'),
      scenario,
      intent: stringArg('intent') || defaults.intent,
      action: stringArg('action') || defaults.action,
      amount: stringArg('amount') || defaults.amount,
      recipient: stringArg('recipient') || stringArg('to') || defaults.recipient,
    }));
    return;
  }

  if (command === 'x402:check') {
    const status = await client.getDemoStatus();
    const scenario = stringArg('scenario') === 'blocked' ? 'blocked' : 'allowed';
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
          paymentReference: 'req_cli_blocked_001',
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
          paymentReference: 'req_cli_allowed_001',
        };
    print(await client.checkX402Payment({
      demoApiKey: stringArg('demo-api-key'),
      scenario,
      intent: stringArg('intent') || defaults.intent,
      action: stringArg('action') || defaults.action,
      domain: stringArg('domain') || defaults.domain,
      endpoint: stringArg('endpoint') || defaults.endpoint,
      method: stringArg('method') || 'POST',
      amount: stringArg('amount') || defaults.amount,
      token: stringArg('token') || defaults.token,
      chainId: stringArg('x402-chain-id') || stringArg('chain') || defaults.chainId,
      recipient: stringArg('recipient') || stringArg('to') || defaults.recipient,
      paymentReference: stringArg('payment-reference') || defaults.paymentReference,
    }));
    return;
  }

  if (command === 'demo:logs') {
    print(await client.getDemoLogs({
      demoApiKey: stringArg('demo-api-key'),
      limit: numberArg('limit'),
    }));
    return;
  }

  if (command === 'demo:anchor') {
    print(await client.anchorDemoSecurityLog({
      demoApiKey: stringArg('demo-api-key'),
      ownerRunToken: required('owner-run-token', 'TITAN_DEMO_OWNER_RUN_TOKEN'),
    }));
    return;
  }

  if (command === 'capability:revoke') {
    print(await client.revokeCapability({
      capabilityId: stringArg('capability-id'),
      ownerSessionToken: required('owner-session-token', 'TITAN_AGENT_WALLET_OWNER_SESSION_TOKEN'),
    }));
    return;
  }

  if (command === 'security-status') {
    print(await client.securityStatus({
      ownerSessionToken: stringArg('owner-session-token'),
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
  capability
  proof:list
  demo:status
  demo:key --label "TITAN Agent Intent Demo"
  demo:run --demo-api-key titan_demo_... --scenario allowed
  demo:run --demo-api-key titan_demo_... --scenario blocked
  x402:check --demo-api-key titan_demo_... --scenario allowed
  x402:check --demo-api-key titan_demo_... --scenario blocked
  demo:logs --demo-api-key titan_demo_...
  demo:anchor --demo-api-key titan_demo_... --owner-run-token <owner-only>
  security-status
  check-intent --intent "Pay invoice" --action agent-send --chain-id 16661 --to 0x...
  capability:revoke --owner-session-token titan_owner_...
  run --action agent-simulate --intent "Prepare a treasury transfer"
  seal --private-key <key> --plaintext '{"memory":"trusted vendor"}'
  send --private-key <key> --rpc-url <url> --to <address> --value-eth 0.001 --intent "Pay vendor"

Environment:
  TITAN_AGENT_WALLET_BASE_URL=https://titanwallet.net/api
  TITAN_AGENT_WALLET_MILITARY_BASE_URL=https://titanwallet.net
  TITAN_AGENT_WALLET_PROJECT_ID=proj_...
  TITAN_AGENT_WALLET_ID=aw_...
  TITAN_AGENT_WALLET_CAPABILITY=cap_...
  TITAN_AGENT_WALLET_OWNER_SESSION_TOKEN=titan_owner_...
  TITAN_AGENT_WALLET_DEMO_API_KEY=titan_demo_...
  TITAN_AGENT_WALLET_PRIVATE_KEY=0x...
  TITAN_AGENT_WALLET_RPC_URL=https://evmrpc.0g.ai
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

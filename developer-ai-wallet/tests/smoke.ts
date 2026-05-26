import { Wallet } from 'ethers';
import { TitanAgentWalletClient } from '../src/client.js';

const client = new TitanAgentWalletClient({
  baseUrl: process.env.TITAN_AGENT_WALLET_BASE_URL || 'https://wallet.yieldboostai.xyz/api',
  militaryBaseUrl: process.env.TITAN_AGENT_WALLET_MILITARY_BASE_URL || 'https://wallet.yieldboostai.xyz',
});

async function main() {
  const wallet = Wallet.createRandom();
  const results: Record<string, unknown> = {};

  results.health = await client.health();
  results.layers = await client.layerStatus();
  results.blacklist = await client.checkIntent({
    intent: 'Autonomous agent prepares a capped treasury operation.',
  });
  results.tenLayerRail = await client.runTenLayerRail({
    action: 'agent-simulate',
    walletAddress: wallet.address,
    network: '0G Mainnet',
    chainId: 16661,
    context: {
      intent: 'Smoke test the public developer wallet rail.',
      actor: 'smoke-test',
    },
  });
  results.proof = await client.proofRun({
    wallet_address: wallet.address,
    type: 'agent-wallet-smoke',
    created_at: new Date().toISOString(),
  });
  results.handshake = await client.handshakeLog({
    subjectId: wallet.address,
    operation: 'agent-wallet-smoke',
    walletAddress: wallet.address,
  });
  results.seal = await client.sealWithWallet({
    privateKey: wallet.privateKey,
    plaintext: JSON.stringify({
      smoke: true,
      wallet_address: wallet.address,
      created_at: new Date().toISOString(),
    }),
    metadata: {
      event_type: 'Agent Wallet Smoke Test',
    },
  });

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});

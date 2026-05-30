import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Play, ShieldCheck, Terminal } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const TEN_LAYERS = [
  'Hallucination Blacklist',
  'Integrity Auditor',
  'Secure Compute / TEE',
  'Sovereign Memory',
  '0G Storage Proof Layer',
  'Zero-Knowledge Proof Layer',
  'ProofRegistry Anchor',
  'Programmable Governance',
  'Cross-Agent Neural Handshake',
  'AWS Nitro Enclaves',
];

const ZERO_G_PC_MODELS = [
  '0GM-1.0-35B-A3B',
  'deepseek-v4-pro',
  'deepseek/deepseek-chat-v3-0324',
  'qwen/qwen3-vl-30b-a3b-instruct',
  'qwen3.6-plus',
  'zai-org/GLM-5-FP8',
  'zai-org/GLM-5.1-FP8',
  'z-image',
  'openai/whisper-large-v3',
];

const MCP_TOOLS = [
  'titan_health',
  'titan_layers',
  'titan_check_intent',
  'titan_run_ten_layer_rail',
  'titan_seal_memory',
  'titan_send_native',
];

const DeveloperDocsPage: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D');
  const [intent, setIntent] = useState('Autonomous agent prepares a capped wallet operation for an approved workflow.');
  const [network, setNetwork] = useState('0G Mainnet');
  const [chainId, setChainId] = useState('16661');
  const [action, setAction] = useState('agent-simulate');
  const [output, setOutput] = useState('Ready.');
  const [running, setRunning] = useState(false);

  const runPlayground = async () => {
    setRunning(true);
    setOutput('Running 10-layer playground...');
    try {
      const response = await fetch('/api/dev/store/military-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: {
            source: 'titan-agent-wallet-docs',
            action,
            intent,
            walletAddress,
            network,
            chainId: Number.parseInt(chainId, 10),
            requested_at: new Date().toISOString(),
            metadata: {
              playground: true,
              byok_ai: true,
            },
          },
        }),
      });
      const payload = await response.json();
      setOutput(JSON.stringify(payload, null, 2));
    } catch (error) {
      setOutput(error instanceof Error ? error.message : 'Playground request failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-titan-bg">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-titan-subtext hover:text-white">
              <ArrowLeft size={15} /> Back to wallet
            </Link>
            <h1 className="text-3xl font-bold text-white">Developer AI Wallet Docs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-titan-subtext">
              Build autonomous wallet flows with TITAN rails. Bring your own AI runtime, and if you want Privy auth in your own product, bring your own Privy app too.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">Playground first</Badge>
            <Badge variant="success" dot>10 layers</Badge>
            <Badge variant="neutral">BYO Privy</Badge>
            <Badge variant="neutral">MCP ready</Badge>
          </div>
        </div>

        <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Playground</h2>
              <p className="mt-1 text-sm text-titan-subtext">Dry-run the 10-layer rail without needing an AI model.</p>
            </div>
            <Badge variant="live">Public docs</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-3">
              <input className="titan-input font-mono" value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} />
              <div className="grid gap-3 sm:grid-cols-3">
                <select className="titan-input" value={action} onChange={(event) => setAction(event.target.value)}>
                  <option value="agent-simulate">agent-simulate</option>
                  <option value="agent-intent-check">agent-intent-check</option>
                  <option value="agent-tool-result">agent-tool-result</option>
                  <option value="agent-sign">agent-sign</option>
                </select>
                <select className="titan-input" value={network} onChange={(event) => setNetwork(event.target.value)}>
                  <option>0G Mainnet</option>
                  <option>0G Galileo Testnet</option>
                </select>
                <input className="titan-input" value={chainId} onChange={(event) => setChainId(event.target.value)} />
              </div>
              <textarea className="titan-input min-h-32" value={intent} onChange={(event) => setIntent(event.target.value)} />
              <Button onClick={() => void runPlayground()} loading={running}>
                <Play size={15} /> Run playground
              </Button>
            </div>
            <pre className="max-h-96 overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{output}</code>
            </pre>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <BookOpen size={18} className="text-titan-accent" /> Quickstart
            </h2>
            <div className="mt-4 space-y-3 text-sm text-titan-subtext">
              <p>1. Create or import a wallet in TITAN Wallet.</p>
              <p>2. Open Settings, then Developer.</p>
              <p>3. Create a project, agent wallet, and capability.</p>
              <p>4. Export the SDK/CLI env block into your own AI runtime.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <ShieldCheck size={18} className="text-titan-accent" /> Bring Your Own Privy
            </h2>
            <div className="mt-4 space-y-3 text-sm text-titan-subtext">
              <p>TITAN Wallet uses its own Privy app only for the consumer wallet experience on this site.</p>
              <p>If a developer wants Google / Apple login or embedded MPC wallets inside their own app, they must use their own Privy App ID, App Secret, and JWKS endpoint.</p>
              <p>Do not reuse the TITAN Wallet Privy app or share one Privy API across outside developer products.</p>
            </div>
            <pre className="mt-4 overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{`# Example only: each developer uses their own Privy app
export PRIVY_APP_ID="your_privy_app_id"
export PRIVY_APP_SECRET="your_privy_app_secret"
export PRIVY_JWKS_URL="https://auth.privy.io/api/v1/apps/<your-app-id>/jwks.json"`}</code>
            </pre>
          </section>

          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <ShieldCheck size={18} className="text-titan-accent" /> 10 Layers
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {TEN_LAYERS.map((layer) => (
                <div key={layer} className="rounded-xl border border-titan-border bg-[#0A0D14] px-3 py-2 text-xs text-titan-text">
                  {layer}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-3xl border border-titan-border bg-titan-surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Terminal size={18} className="text-titan-accent" /> SDK and CLI
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <pre className="overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{`import { TitanAgentWalletClient } from "@titan/agent-wallet";

const client = new TitanAgentWalletClient({
  baseUrl: "https://wallet.yieldboostai.xyz/api",
  militaryBaseUrl: "https://wallet.yieldboostai.xyz",
  ownerWalletAddress: process.env.TITAN_AGENT_WALLET_OWNER,
  projectId: process.env.TITAN_AGENT_WALLET_PROJECT_ID,
  agentWalletId: process.env.TITAN_AGENT_WALLET_ID,
  capabilityToken: process.env.TITAN_AGENT_WALLET_CAPABILITY,
});

await client.checkIntent({
  intent: "Pay approved vendor invoice",
  actor: "my-local-agent",
});`}</code>
            </pre>
            <pre className="overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{`node dist/cli.js health
node dist/cli.js layers
node dist/cli.js check-intent \\
  --intent "Pay approved vendor invoice"
node dist/cli.js run \\
  --action agent-simulate \\
  --intent "Prepare capped transfer"`}</code>
            </pre>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="text-lg font-bold text-white">MCP server</h2>
            <div className="mt-4 space-y-3 text-sm text-titan-subtext">
              <p>The `developer-ai-wallet` package now includes a local MCP server so the developer can expose TITAN wallet tools directly into their own coding or agent runtime.</p>
              <p>MCP is not a separate auth lane. It reuses the same `TITAN_AGENT_WALLET_*` env values, owner wallet binding, project, agent wallet, and capability token that the SDK and CLI already use.</p>
              <p>If a developer wants Google / Apple login in their own app, they still bring their own Privy app. Privy auth and TITAN capability remain separate layers.</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {MCP_TOOLS.map((tool) => (
                <div key={tool} className="rounded-xl border border-titan-border bg-[#0A0D14] px-3 py-2 text-xs text-titan-text">
                  {tool}
                </div>
              ))}
            </div>
            <pre className="mt-4 overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{`cd developer-ai-wallet
npm install
npm run build
npm run mcp

node dist/src/mcp.js`}</code>
            </pre>
          </section>

          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="text-lg font-bold text-white">MCP config example</h2>
            <pre className="mt-4 overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{`{
  "mcpServers": {
    "titan-agent-wallet": {
      "command": "node",
      "args": ["/absolute/path/to/developer-ai-wallet/dist/src/mcp.js"],
      "env": {
        "TITAN_AGENT_WALLET_BASE_URL": "https://wallet.yieldboostai.xyz/api",
        "TITAN_AGENT_WALLET_MILITARY_BASE_URL": "https://wallet.yieldboostai.xyz",
        "TITAN_AGENT_WALLET_OWNER": "0x...",
        "TITAN_AGENT_WALLET_PROJECT_ID": "proj_...",
        "TITAN_AGENT_WALLET_ID": "aw_...",
        "TITAN_AGENT_WALLET_CAPABILITY": "titan_cap_..."
      }
    }
  }
}`}</code>
            </pre>
            <p className="mt-4 text-sm text-titan-subtext">
              Use the same capability token here that you copied from <span className="text-white">Settings - Developer</span>. Do not invent a separate MCP secret.
            </p>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="text-lg font-bold text-white">Install and bind to wallet</h2>
            <div className="mt-4 space-y-3 text-sm text-titan-subtext">
              <p>1. Create or import the owner wallet in TITAN Wallet.</p>
              <p>2. Open <span className="font-medium text-white">Settings - Developer</span>.</p>
              <p>3. Create a project, then create an agent wallet, then issue a capability.</p>
              <p>4. Copy the generated env block into your own AI runtime.</p>
            </div>
            <pre className="mt-4 overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{`cd developer-ai-wallet
npm install
npm run build`}</code>
            </pre>
          </section>

          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="text-lg font-bold text-white">Environment</h2>
            <pre className="mt-4 overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{`export TITAN_AGENT_WALLET_BASE_URL="https://wallet.yieldboostai.xyz/api"
export TITAN_AGENT_WALLET_MILITARY_BASE_URL="https://wallet.yieldboostai.xyz"
export TITAN_AGENT_WALLET_OWNER="0x..."
export TITAN_AGENT_WALLET_PROJECT_ID="proj_..."
export TITAN_AGENT_WALLET_ID="aw_..."
export TITAN_AGENT_WALLET_CAPABILITY="titan_cap_..."
export TITAN_AGENT_WALLET_RPC_URL="https://evmrpc.0g.ai"`}</code>
            </pre>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="text-lg font-bold text-white">CLI commands</h2>
            <pre className="mt-4 overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{`node dist/cli.js health
node dist/cli.js layers
node dist/cli.js check-intent \\
  --intent "Pay approved vendor invoice"
node dist/cli.js run \\
  --action agent-simulate \\
  --intent "Prepare capped transfer"
node dist/cli.js seal \\
  --private-key "$TITAN_AGENT_WALLET_PRIVATE_KEY" \\
  --plaintext '{"memory":"trusted vendor"}'
node dist/cli.js send \\
  --private-key "$TITAN_AGENT_WALLET_PRIVATE_KEY" \\
  --to "0x..." \\
  --value-eth "0.001" \\
  --intent "Pay approved vendor invoice"`}</code>
            </pre>
          </section>

          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="text-lg font-bold text-white">What the SDK does</h2>
            <div className="mt-4 space-y-3 text-sm text-titan-subtext">
              <p>The SDK does not bring its own AI. Your agent, model, or local runtime stays yours.</p>
              <p>The SDK binds that runtime to the wallet owner created in TITAN Wallet through a project, an agent wallet, and a capability token.</p>
              <p>For local autonomous signing, the developer can opt into a scoped private key lane with policy, proof, seal, handshake, and optional security-log anchoring.</p>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-3xl border border-titan-border bg-titan-surface p-6">
          <h2 className="text-lg font-bold text-white">0G Private Computer</h2>
          <p className="mt-2 text-sm text-titan-subtext">
            Prioritize 0G Private Computer for agent inference. Its router is OpenAI-compatible, so we can keep the developer's AI runtime independent and just point it at the 0G endpoint.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <pre className="overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{`from openai import OpenAI

client = OpenAI(
  base_url="https://router-api.0g.ai/v1",
  api_key="<0G_PC_API_KEY>",
)

response = client.chat.completions.create(
  model="qwen3.6-plus",
  messages=[{"role": "user", "content": "Hello!"}],
  stream=True,
  verify_tee=True,
)`}</code>
            </pre>
            <div>
              <div className="grid gap-2 sm:grid-cols-2">
                {ZERO_G_PC_MODELS.map((model) => (
                  <div key={model} className="rounded-xl border border-titan-border bg-[#0A0D14] px-3 py-2 text-xs text-titan-text">
                    {model}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-titan-subtext">
                The router endpoint is <span className="text-white">`POST https://router-api.0g.ai/v1/chat/completions`</span>.
                You can ask for TEE verification with <span className="text-white">`verify_tee: true`</span>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DeveloperDocsPage;

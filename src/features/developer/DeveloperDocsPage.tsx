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

const BYO_PRIVY_SNIPPET = `export PRIVY_APP_ID="your_privy_app_id"
export PRIVY_APP_SECRET="your_privy_app_secret"
export PRIVY_JWKS_URL="https://auth.privy.io/api/v1/apps/<your-app-id>/jwks.json"`;

const TITAN_ENV_SNIPPET = `export TITAN_AGENT_WALLET_BASE_URL="https://wallet.yieldboostai.xyz/api"
export TITAN_AGENT_WALLET_MILITARY_BASE_URL="https://wallet.yieldboostai.xyz"
export TITAN_AGENT_WALLET_OWNER="0x..."
export TITAN_AGENT_WALLET_PROJECT_ID="proj_..."
export TITAN_AGENT_WALLET_ID="aw_..."
export TITAN_AGENT_WALLET_CAPABILITY="titan_cap_..."
export TITAN_AGENT_WALLET_RPC_URL="https://evmrpc.0g.ai"`;

const SDK_SNIPPET = `import { TitanAgentWalletClient } from "@titan/agent-wallet";

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
});`;

const CLI_SNIPPET = `node dist/cli.js health
node dist/cli.js layers
node dist/cli.js check-intent \\
  --intent "Pay approved vendor invoice"
node dist/cli.js run \\
  --action agent-simulate \\
  --intent "Prepare capped transfer"`;

const MCP_BOOT_SNIPPET = `cd developer-ai-wallet
npm install
npm run build
npm run mcp`;

const MCP_CONFIG_SNIPPET = `{
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
}`;

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
              Build autonomous wallet flows with one connected system: owner wallet, project, agent wallet, capability, then wire the same identity into BYO Privy and MCP.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">Playground first</Badge>
            <Badge variant="success" dot>10 layers</Badge>
            <Badge variant="neutral">BYO Privy</Badge>
            <Badge variant="neutral">MCP ready</Badge>
          </div>
        </div>

        <section className="mb-4 rounded-3xl border border-titan-border bg-titan-surface p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Build flow</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-titan-subtext">
                TITAN Developer should feel like one system. First create the project, then create the agent wallet,
                then issue the capability. BYO Privy handles app login. MCP, SDK, and CLI all reuse the same capability after that.
              </p>
            </div>
            <Badge variant="success">One shared identity</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['1. Project', 'AI Agent Project', 'Create project in Settings - Developer.'],
                ['2. Agent Wallet', 'Autonomous Wallet Agent', 'Create an agent wallet under that project.'],
                ['3. Capability', 'Reusable runtime token', 'Issue the capability used by SDK, CLI, and MCP.'],
              ].map(([step, title, detail]) => (
                <div key={step} className="rounded-2xl border border-titan-border bg-[#0A0D14] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-titan-accent">{step}</p>
                  <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-titan-subtext">{detail}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-titan-border bg-[#0A0D14] p-5">
              <p className="text-sm font-semibold text-white">Where BYO Privy and MCP fit</p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-titan-subtext">
                <p>BYO Privy belongs to the developer&apos;s own product and uses the developer&apos;s own Privy app keys.</p>
                <p>MCP is only the runtime bridge. It should not invent a second secret or a second wallet identity.</p>
                <p>The capability token from step 3 is what connects SDK, CLI, MCP, and the developer app into one system.</p>
              </div>
            </div>
          </div>
        </section>

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
              <BookOpen size={18} className="text-titan-accent" /> Settings flow
            </h2>
            <div className="mt-4 space-y-3 text-sm text-titan-subtext">
              <p>1. Create or import a wallet in TITAN Wallet.</p>
              <p>2. Open Settings, then Developer.</p>
              <p>3. Create a project, agent wallet, and capability.</p>
              <p>4. Export the TITAN env block into your runtime.</p>
              <p>5. If your product needs social login, add your own Privy app after the TITAN flow exists.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <ShieldCheck size={18} className="text-titan-accent" /> BYO Privy boundary
            </h2>
            <div className="mt-4 space-y-3 text-sm text-titan-subtext">
              <p>TITAN Wallet uses its own Privy app only for the consumer wallet experience on this site.</p>
              <p>If a developer wants Google or Apple login or embedded MPC wallets inside their own app, they must use their own Privy App ID, App Secret, and JWKS endpoint.</p>
              <p>Do not reuse the TITAN Wallet Privy app or share one Privy API across outside developer products.</p>
            </div>
            <pre className="mt-4 overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{BYO_PRIVY_SNIPPET}</code>
            </pre>
          </section>
        </div>

        <section className="mt-4 rounded-3xl border border-titan-border bg-titan-surface p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Terminal size={18} className="text-titan-accent" /> Runtime wiring
              </h2>
              <p className="mt-2 text-sm text-titan-subtext">The same capability token powers your env, SDK usage, CLI commands, and MCP host config.</p>
            </div>
            <Badge variant="success">Shared capability</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <pre className="overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{TITAN_ENV_SNIPPET}</code>
            </pre>
            <pre className="overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{SDK_SNIPPET}</code>
            </pre>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <pre className="overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{CLI_SNIPPET}</code>
            </pre>
            <pre className="overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{MCP_BOOT_SNIPPET}</code>
            </pre>
            <pre className="overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
              <code>{MCP_CONFIG_SNIPPET}</code>
            </pre>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {MCP_TOOLS.map((tool) => (
              <div key={tool} className="rounded-xl border border-titan-border bg-[#0A0D14] px-3 py-2 text-xs text-titan-text">
                {tool}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-titan-subtext">
            Use the same capability token here that you copied from <span className="text-white">Settings - Developer</span>. Do not invent a separate MCP secret.
          </p>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <ShieldCheck size={18} className="text-titan-accent" /> 10 layers
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {TEN_LAYERS.map((layer) => (
                <div key={layer} className="rounded-xl border border-titan-border bg-[#0A0D14] px-3 py-2 text-xs text-titan-text">
                  {layer}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <h2 className="text-lg font-bold text-white">What stays separate</h2>
            <div className="mt-4 space-y-3 text-sm text-titan-subtext">
              <p>Your AI model choice stays yours. TITAN does not force a model runtime.</p>
              <p>Your Privy app stays yours. TITAN does not share consumer Privy credentials with developer projects.</p>
              <p>Your runtime host stays yours. MCP, CLI, and SDK only bridge it into the capability-backed wallet identity.</p>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-3xl border border-titan-border bg-titan-surface p-6">
          <h2 className="text-lg font-bold text-white">0G Private Computer</h2>
          <p className="mt-2 text-sm text-titan-subtext">
            Prioritize 0G Private Computer for agent inference. Its router is OpenAI-compatible, so the developer&apos;s AI runtime stays independent and only the base URL changes.
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
                The router endpoint is <span className="text-white">POST https://router-api.0g.ai/v1/chat/completions</span>.
                You can ask for TEE verification with <span className="text-white">verify_tee: true</span>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DeveloperDocsPage;

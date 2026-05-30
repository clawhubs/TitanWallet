import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clipboard, Cpu, KeyRound, Plus, ShieldCheck, Terminal, WalletCards } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useWallet } from '../../hooks/useWallet';
import {
  createDeveloperAgentWallet,
  createDeveloperProject,
  createOwnerChallenge,
  getDeveloperDashboard,
  issueDeveloperCapability,
  revokeDeveloperCapability,
  verifyOwnerChallenge,
} from './api';
import type { DeveloperCapability, DeveloperDashboard, OwnerSession } from './types';

const DEFAULT_EXPIRY_HOURS = 24;
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

const BYO_PRIVY_SNIPPET = `export PRIVY_APP_ID="your_privy_app_id"
export PRIVY_APP_SECRET="your_privy_app_secret"
export PRIVY_JWKS_URL="https://auth.privy.io/api/v1/apps/<your-app-id>/jwks.json"`;

const MCP_BOOT_SNIPPET = `cd developer-ai-wallet
npm install
npm run build
npm run mcp`;

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

const DeveloperSettings: React.FC = () => {
  const { address, signTextMessage } = useWallet();
  const [ownerSession, setOwnerSession] = useState<OwnerSession | null>(null);
  const [dashboard, setDashboard] = useState<DeveloperDashboard | null>(null);
  const [projectName, setProjectName] = useState('AI Agent Project');
  const [agentName, setAgentName] = useState('Autonomous Wallet Agent');
  const [maxValueWei, setMaxValueWei] = useState('10000000000000000');
  const [dailyLimitWei, setDailyLimitWei] = useState('50000000000000000');
  const [allowedChainIds, setAllowedChainIds] = useState('16661');
  const [allowedDestinations, setAllowedDestinations] = useState('');
  const [status, setStatus] = useState('Waiting for owner wallet session.');
  const [busy, setBusy] = useState(false);

  const activeProject = dashboard?.projects[0] || null;
  const activeAgentWallet = dashboard?.agent_wallets.find((wallet) => wallet.project_id === activeProject?.id) || dashboard?.agent_wallets[0] || null;
  const activeCapability = useMemo(
    () => dashboard?.capabilities.find((capability) => capability.status === 'active' && capability.agent_wallet_id === activeAgentWallet?.id) || null,
    [activeAgentWallet?.id, dashboard?.capabilities],
  );

  useEffect(() => {
    let disposed = false;

    const authorize = async () => {
      if (!address) {
        return;
      }
      try {
        setBusy(true);
        setStatus('Verifying owner wallet for developer API access...');
        const challenge = await createOwnerChallenge(address);
        const signature = await signTextMessage(challenge.message);
        const session = await verifyOwnerChallenge({
          challengeId: challenge.challenge_id,
          signature,
        });
        if (disposed) {
          return;
        }
        setOwnerSession(session);
        const nextDashboard = await getDeveloperDashboard(session.owner_session_token);
        if (!disposed) {
          setDashboard(nextDashboard);
          setStatus('Owner wallet verified. Developer API access is ready.');
        }
      } catch (error) {
        if (!disposed) {
          setStatus(error instanceof Error ? error.message : 'Developer API owner verification failed.');
        }
      } finally {
        if (!disposed) {
          setBusy(false);
        }
      }
    };

    void authorize();
    return () => {
      disposed = true;
    };
  }, [address, signTextMessage]);

  const refresh = async () => {
    if (!ownerSession) {
      return;
    }
    setDashboard(await getDeveloperDashboard(ownerSession.owner_session_token));
  };

  const createProject = async () => {
    if (!ownerSession) {
      return;
    }
    setBusy(true);
    try {
      const nextDashboard = await createDeveloperProject({
        ownerSessionToken: ownerSession.owner_session_token,
        name: projectName,
      });
      setDashboard(nextDashboard);
      setStatus('Project created for this owner wallet.');
    } finally {
      setBusy(false);
    }
  };

  const createAgentWallet = async () => {
    if (!ownerSession || !activeProject) {
      return;
    }
    setBusy(true);
    try {
      const nextDashboard = await createDeveloperAgentWallet({
        ownerSessionToken: ownerSession.owner_session_token,
        projectId: activeProject.id,
        name: agentName,
      });
      setDashboard(nextDashboard);
      setStatus('Agent wallet created under the active project.');
    } finally {
      setBusy(false);
    }
  };

  const issueCapability = async () => {
    if (!ownerSession || !activeAgentWallet) {
      return;
    }
    setBusy(true);
    try {
      const nextDashboard = await issueDeveloperCapability({
        ownerSessionToken: ownerSession.owner_session_token,
        agentWalletId: activeAgentWallet.id,
        maxValueWei,
        dailyLimitWei,
        allowedChainIds: allowedChainIds.split(',').map((item) => Number.parseInt(item.trim(), 10)).filter(Number.isFinite),
        allowedDestinations: allowedDestinations.split(',').map((item) => item.trim()).filter(Boolean),
        expiresAt: new Date(Date.now() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      });
      setDashboard(nextDashboard);
      setStatus('Capability issued for SDK and CLI.');
    } finally {
      setBusy(false);
    }
  };

  const revokeCapability = async (capability: DeveloperCapability) => {
    if (!ownerSession) {
      return;
    }
    setBusy(true);
    try {
      const nextDashboard = await revokeDeveloperCapability({
        ownerSessionToken: ownerSession.owner_session_token,
        capabilityId: capability.id,
      });
      setDashboard(nextDashboard);
      setStatus('Capability revoked.');
    } finally {
      setBusy(false);
    }
  };

  const envSnippet = activeCapability && activeAgentWallet && activeProject ? [
    'export TITAN_AGENT_WALLET_BASE_URL="https://wallet.yieldboostai.xyz/api"',
    'export TITAN_AGENT_WALLET_MILITARY_BASE_URL="https://wallet.yieldboostai.xyz"',
    `export TITAN_AGENT_WALLET_OWNER="${address || ''}"`,
    `export TITAN_AGENT_WALLET_PROJECT_ID="${activeProject.id}"`,
    `export TITAN_AGENT_WALLET_ID="${activeAgentWallet.id}"`,
    `export TITAN_AGENT_WALLET_CAPABILITY="${activeCapability.token}"`,
    'export TITAN_AGENT_WALLET_RPC_URL="https://evmrpc.0g.ai"',
  ].join('\n') : 'Create a project, agent wallet, and capability first.';

  const mcpConfigSnippet = activeCapability && activeAgentWallet && activeProject ? `{
  "mcpServers": {
    "titan-agent-wallet": {
      "command": "node",
      "args": ["/absolute/path/to/developer-ai-wallet/dist/src/mcp.js"],
      "env": {
        "TITAN_AGENT_WALLET_BASE_URL": "https://wallet.yieldboostai.xyz/api",
        "TITAN_AGENT_WALLET_MILITARY_BASE_URL": "https://wallet.yieldboostai.xyz",
        "TITAN_AGENT_WALLET_OWNER": "${address || ''}",
        "TITAN_AGENT_WALLET_PROJECT_ID": "${activeProject.id}",
        "TITAN_AGENT_WALLET_ID": "${activeAgentWallet.id}",
        "TITAN_AGENT_WALLET_CAPABILITY": "${activeCapability.token}"
      }
    }
  }
}` : 'Create a project, agent wallet, and capability first.';

  const activeCapabilityCount = dashboard?.capabilities.filter((capability) => capability.status === 'active').length || 0;

  const copyEnv = async () => {
    await navigator.clipboard.writeText(envSnippet);
    setStatus('SDK and CLI environment copied.');
  };

  const copyText = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value);
    setStatus(message);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Developer API</h2>
            <p className="mt-1 text-sm text-titan-subtext">
              Bind TITAN rails to the wallet in this browser session. If a developer wants Privy in their own app, they must bring their own Privy app keys.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" dot>{ownerSession ? 'Owner verified' : 'Owner required'}</Badge>
            <Badge variant="accent">10 layers</Badge>
            <Badge variant="neutral">BYO Privy</Badge>
            <Badge variant="neutral">MCP ready</Badge>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <InfoTile icon={<WalletCards size={16} />} label="Owner wallet" value={address || 'No wallet connected'} />
          <InfoTile icon={<ShieldCheck size={16} />} label="API status" value={status} />
          <div className="rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <BookOpen size={16} className="text-titan-accent" />
              Docs and playground
            </div>
            <p className="mt-2 text-xs text-titan-subtext">Developer docs cover BYO Privy guidance and the MCP server setup.</p>
            <Link to="/developer/docs" className="mt-3 inline-flex text-sm font-semibold text-titan-accent hover:text-white">
              Open docs
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="accent">Build order</Badge>
                <Badge variant="success" dot>Owner wallet bound</Badge>
                <Badge variant="neutral">Capability-first</Badge>
              </div>
              <h3 className="text-xl font-bold text-white">Project, agent wallet, then capability</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-titan-subtext">
                This is the core TITAN developer system. First bind the owner wallet in this browser session, then create the
                project, create the agent wallet under that project, and finally issue the capability that the SDK, CLI, and MCP
                runtime will all reuse.
              </p>
            </div>
            <div className="rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-titan-subtext">Shared identity</p>
              <p className="mt-1 text-sm font-semibold text-white">{activeCapability ? 'Capability live' : 'Create the 3 steps first'}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-titan-border bg-[#0A0D14] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-titan-accent">1. Project</p>
              <p className="mt-3 text-sm font-semibold text-white">AI Agent Project</p>
              <input className="titan-input mt-4" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
              <Button className="mt-4 w-full" disabled={busy || !ownerSession} onClick={() => void createProject()}>
                <Plus size={15} /> Create project
              </Button>
              <p className="mt-3 break-all text-xs text-titan-subtext">{activeProject?.id || 'No project yet.'}</p>
            </div>

            <div className="rounded-3xl border border-titan-border bg-[#0A0D14] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-titan-accent">2. Agent Wallet</p>
              <p className="mt-3 text-sm font-semibold text-white">Autonomous Wallet Agent</p>
              <input className="titan-input mt-4" value={agentName} onChange={(event) => setAgentName(event.target.value)} />
              <Button className="mt-4 w-full" disabled={busy || !activeProject} onClick={() => void createAgentWallet()}>
                <KeyRound size={15} /> Create agent wallet
              </Button>
              <p className="mt-3 break-all text-xs text-titan-subtext">{activeAgentWallet?.id || 'Create a project first.'}</p>
            </div>

            <div className="rounded-3xl border border-titan-border bg-[#0A0D14] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-titan-accent">3. Capability</p>
              <p className="mt-3 text-sm font-semibold text-white">Reusable runtime token</p>
              <div className="mt-4 grid gap-2">
                <input className="titan-input" value={maxValueWei} onChange={(event) => setMaxValueWei(event.target.value)} />
                <input className="titan-input" value={dailyLimitWei} onChange={(event) => setDailyLimitWei(event.target.value)} />
                <input className="titan-input" value={allowedChainIds} onChange={(event) => setAllowedChainIds(event.target.value)} />
                <input className="titan-input" placeholder="Allowlist addresses, comma-separated" value={allowedDestinations} onChange={(event) => setAllowedDestinations(event.target.value)} />
              </div>
              <Button className="mt-4 w-full" disabled={busy || !activeAgentWallet} onClick={() => void issueCapability()}>
                <Plus size={15} /> Issue capability
              </Button>
              <p className="mt-3 break-all text-xs text-titan-subtext">{activeCapability?.id || 'Create an agent wallet first.'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="accent" dot>One system</Badge>
              <Badge variant="neutral">BYO Privy wiring</Badge>
              <Badge variant="success" dot>MCP bridge</Badge>
            </div>
            <h3 className="text-xl font-bold text-white">How the developer stack stays connected</h3>
            <p className="mt-2 text-sm leading-6 text-titan-subtext">
              Project, agent wallet, and capability are the main system. BYO Privy and MCP do not sit outside of it. They wire
              the same owner-bound identity into the developer app and the external runtime.
            </p>

            <div className="mt-5 grid gap-3">
              {[
                {
                  title: 'Owner wallet session',
                  detail: 'The wallet in this browser signs the developer challenge and becomes the root owner for the project.',
                },
                {
                  title: 'BYO Privy',
                  detail: 'Google or Apple login in the developer app should use the developer-owned Privy app, then map into this same TITAN flow.',
                },
                {
                  title: 'MCP / SDK / CLI',
                  detail: 'All runtime tools reuse the same TITAN_AGENT_WALLET_* env values and the same capability token from step 3.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-titan-subtext">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-titan-border bg-[#05080D] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Privy env example</p>
                    <p className="text-xs text-titan-subtext">This stays in the developer&apos;s own app or backend.</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => void copyText(BYO_PRIVY_SNIPPET, 'BYO Privy snippet copied.')}>
                    <Clipboard size={14} /> Copy
                  </Button>
                </div>
                <pre className="overflow-auto rounded-2xl border border-titan-border bg-black/20 p-4 text-xs text-titan-subtext">
                  <code>{BYO_PRIVY_SNIPPET}</code>
                </pre>
              </div>

              <div className="rounded-2xl border border-titan-border bg-[#05080D] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">MCP boot</p>
                    <p className="text-xs text-titan-subtext">Run the packaged tool bridge after the same capability env is loaded.</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => void copyText(MCP_BOOT_SNIPPET, 'MCP boot command copied.')}>
                    <Clipboard size={14} /> Copy
                  </Button>
                </div>
                <pre className="overflow-auto rounded-2xl border border-titan-border bg-black/20 p-4 text-xs text-titan-subtext">
                  <code>{MCP_BOOT_SNIPPET}</code>
                </pre>
              </div>
            </div>

            <Link to="/developer/docs" className="mt-5 inline-flex text-sm font-semibold text-titan-accent hover:text-white">
              Open docs
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Capabilities</h3>
              <p className="mt-1 text-sm text-titan-subtext">Issued from the connected TITAN owner wallet and reused by the SDK, CLI, and MCP server.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={!ownerSession || busy}>Refresh</Button>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="success">{activeCapabilityCount} active</Badge>
            <Badge variant="neutral">{dashboard?.capabilities.length || 0} total</Badge>
            <Badge variant="neutral">Wallet-bound policy</Badge>
          </div>
          <div className="max-h-[29rem] space-y-3 overflow-auto pr-1">
            {dashboard?.capabilities.length ? dashboard.capabilities.map((capability) => (
              <div key={capability.id} className="rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={capability.status === 'active' ? 'success' : 'neutral'}>{capability.status}</Badge>
                  {capability.status === 'active' ? (
                    <Button variant="ghost" size="sm" onClick={() => void revokeCapability(capability)} disabled={busy}>
                      Revoke
                    </Button>
                  ) : null}
                </div>
                <p className="mt-3 break-all font-mono text-xs text-titan-subtext">{capability.token}</p>
                <p className="mt-2 text-xs text-titan-subtext">Expires {new Date(capability.policy.expires_at).toLocaleString()}</p>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
                No capabilities issued yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">SDK, CLI, and MCP config</h3>
              <p className="mt-1 text-sm text-titan-subtext">One capability, one env identity, then wire the same values into the SDK, CLI, or MCP host runtime.</p>
            </div>
            <Badge variant="success">Same capability token</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="accent"><Terminal size={12} /> BYOK AI runtime</Badge>
            <Badge variant="success">Wallet-bound capability</Badge>
            <Badge variant="neutral">Bring your own Privy app</Badge>
            <Badge variant="neutral">MCP server included in SDK</Badge>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
            <div className="rounded-2xl border border-titan-border bg-[#05080D] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">SDK and CLI env</p>
                  <p className="text-xs text-titan-subtext">Paste this into the developer&apos;s runtime before using the SDK, CLI, or MCP.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => void copyEnv()}>
                  <Clipboard size={14} /> Copy
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto rounded-2xl border border-titan-border bg-black/20 p-4 text-xs text-titan-subtext">
                <code>{envSnippet}</code>
              </pre>
            </div>

            <div className="rounded-2xl border border-titan-border bg-[#05080D] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">MCP host config</p>
                  <p className="text-xs text-titan-subtext">This host config points at the same `developer-ai-wallet` SDK package and capability env.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => void copyText(mcpConfigSnippet, 'MCP host config copied.')}>
                  <Clipboard size={14} /> Copy
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto rounded-2xl border border-titan-border bg-black/20 p-4 text-xs text-titan-subtext">
                <code>{mcpConfigSnippet}</code>
              </pre>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-white">Example SDK call</p>
              <p className="mt-1 text-xs text-titan-subtext">The SDK, CLI, and MCP server all sit on top of the same identity created above.</p>
            </div>
            <pre className="overflow-auto rounded-2xl border border-titan-border bg-black/20 p-4 text-xs text-titan-subtext">
              <code>{SDK_SNIPPET}</code>
            </pre>
          </div>

          <div className="mt-4 rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">MCP boot</p>
                <p className="mt-1 text-xs text-titan-subtext">Run the packaged server after the same capability env is loaded.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void copyText(MCP_BOOT_SNIPPET, 'MCP boot command copied.')}>
                <Clipboard size={14} /> Copy boot command
              </Button>
            </div>
            <pre className="mt-3 overflow-auto rounded-2xl border border-titan-border bg-black/20 p-4 text-xs text-titan-subtext">
              <code>{MCP_BOOT_SNIPPET}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-titan-border bg-titan-surface p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">LLM priority: 0G Private Computer</h3>
            <p className="mt-1 text-sm text-titan-subtext">
              Use 0G PC first for autonomous agent inference. It is OpenAI-compatible, so the developer keeps their own AI runtime and just swaps the base URL.
            </p>
          </div>
          <Badge variant="accent"><Cpu size={12} /> router-api.0g.ai</Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <pre className="overflow-auto rounded-2xl border border-titan-border bg-[#05080D] p-4 text-xs text-titan-subtext">
            <code>{`export OPENAI_BASE_URL="https://router-api.0g.ai/v1"
export OPENAI_API_KEY="<0G_PC_API_KEY>"

const client = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

await client.chat.completions.create({
  model: "qwen3.6-plus",
  messages: [{ role: "user", content: "Hello" }],
  verify_tee: true,
});`}</code>
          </pre>

          <div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ZERO_G_PC_MODELS.map((model) => (
                <div key={model} className="rounded-xl border border-titan-border bg-[#0A0D14] px-3 py-2 text-xs text-titan-text">
                  {model}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-titan-subtext">
              Recommended starting models: <span className="text-white">qwen3.6-plus</span> for general agent work,
              <span className="text-white"> 0GM-1.0-35B-A3B</span> for lighter agentic coding, and
              <span className="text-white"> GLM-5.1-FP8</span> when you want reasoning enabled by default.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const InfoTile: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
    <div className="flex items-center gap-2 text-sm font-semibold text-white">
      <span className="text-titan-accent">{icon}</span>
      {label}
    </div>
    <p className="mt-2 break-all text-xs text-titan-subtext">{value}</p>
  </div>
);

export default DeveloperSettings;

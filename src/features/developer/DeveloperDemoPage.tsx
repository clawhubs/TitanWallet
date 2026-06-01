import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileKey2,
  KeyRound,
  Lock,
  Play,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
  anchorDeveloperDemoSecurityLog,
  createDeveloperDemoApiKey,
  getDeveloperDemoLogs,
  getDeveloperDemoStatus,
  runDeveloperDemoIntent,
} from './api';
import type {
  DeveloperDemoApiKey,
  DeveloperDemoConfig,
  DeveloperDemoEvidenceLayer,
  DeveloperDemoIntentResult,
  DeveloperDemoLatestAnchor,
  DeveloperProofLog,
  DeveloperSecurityLog,
} from './types';

type DemoScenario = 'allowed' | 'blocked';

const fallbackDemoConfig: DeveloperDemoConfig = {
  name: 'TITAN Agent Intent Demo',
  mode: 'simulation',
  owner_wallet: '0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D',
  agent_wallet_id: 'agent_demo_001',
  capability_id: 'cap_invoice_001',
  capability_name: 'Invoice Payment Capability',
  action: 'pay_invoice',
  max_amount: '0.01',
  max_amount_wei: '10000000000000000',
  token: 'TEST',
  approved_recipient: '0x8a3c7524Aaed081825aC88eC7f4cCECFc583ee7D',
  policy_window: '24h simulated',
  chain_id: 16661,
  network: '0G Mainnet',
  live_anchor_registry: '0x05240D9636605e6cE1CFbCB03189e563f484F4DF',
  layers: [
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
  ],
};

const DeveloperDemoPage: React.FC = () => {
  const [demo, setDemo] = useState<DeveloperDemoConfig>(fallbackDemoConfig);
  const [liveAnchorReady, setLiveAnchorReady] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyRecord, setApiKeyRecord] = useState<DeveloperDemoApiKey | null>(null);
  const [latestLiveAnchor, setLatestLiveAnchor] = useState<DeveloperDemoLatestAnchor | null>(null);
  const [proofLogs, setProofLogs] = useState<DeveloperProofLog[]>([]);
  const [securityLogs, setSecurityLogs] = useState<DeveloperSecurityLog[]>([]);
  const [result, setResult] = useState<DeveloperDemoIntentResult | null>(null);
  const [evidence, setEvidence] = useState<DeveloperDemoEvidenceLayer[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [ownerRunToken, setOwnerRunToken] = useState('');

  useEffect(() => {
    void getDeveloperDemoStatus()
      .then((payload) => {
        setDemo(payload.demo);
        setLiveAnchorReady(payload.live_anchor_ready);
        setLatestLiveAnchor(payload.latest_live_anchor);
        setEvidence(payload.demo.layers.map((name, index) => ({
          id: `L${String(index + 1).padStart(2, '0')}`,
          name,
          status: 'Ready',
        })));
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Demo status failed to load.');
      });
  }, []);

  const generateApiKey = async () => {
    setBusy('key');
    setMessage('');
    try {
      const payload = await createDeveloperDemoApiKey({ label: 'TITAN Agent Intent Demo' });
      setApiKey(payload.api_key);
      setApiKeyRecord(payload.key);
      setDemo(payload.demo);
      await refreshLogs(payload.api_key);
      setMessage('Simulation API key created. It can only run this demo rail.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'API key creation failed.');
    } finally {
      setBusy(null);
    }
  };

  const refreshLogs = async (key = apiKey) => {
    if (!key) {
      return;
    }
    const payload = await getDeveloperDemoLogs({ demoApiKey: key, limit: 30 });
    setProofLogs(payload.proof_logs);
    setSecurityLogs(payload.security_logs);
  };

  const runScenario = async (scenario: DemoScenario) => {
    if (!apiKey) {
      setMessage('Create a simulation API key first.');
      return;
    }

    const input = getScenarioInput(demo, scenario);
    setBusy(scenario);
    setMessage('');
    try {
      const payload = await runDeveloperDemoIntent({
        demoApiKey: apiKey,
        scenario,
        intent: input.intent,
        action: input.action,
        amount: input.amount,
        recipient: input.recipient,
      });
      setResult(payload);
      setEvidence(payload.evidence);
      await refreshLogs(apiKey);
      setMessage(`${scenario === 'allowed' ? 'Allowed' : 'Blocked'} demo recorded with proof and security logs.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Demo run failed.');
    } finally {
      setBusy(null);
    }
  };

  const runLiveAnchor = async () => {
    if (!apiKey) {
      setMessage('Create a simulation API key first.');
      return;
    }
    if (!ownerRunToken.trim()) {
      setMessage('Owner run token is required for live anchoring.');
      return;
    }

    setBusy('anchor');
    setMessage('');
    try {
      const payload = await anchorDeveloperDemoSecurityLog({
        demoApiKey: apiKey,
        ownerRunToken,
      });
      setLatestLiveAnchor(payload.security_log);
      await refreshLogs(apiKey);
      setMessage(`Live security anchor recorded: ${payload.anchor.txHash}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Live anchor failed.');
    } finally {
      setBusy(null);
    }
  };

  const copyApiKey = async () => {
    if (!apiKey) {
      return;
    }
    await navigator.clipboard.writeText(apiKey);
    setMessage('API key copied.');
  };

  return (
    <div className="min-h-screen bg-titan-bg text-titan-text">
      <header className="border-b border-titan-border bg-titan-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl mix-blend-screen">
              <img src="/titan-logo.png" alt="TITAN Logo" className="h-full w-full scale-[1.45] object-cover" />
            </span>
            <span className="font-bold text-white">TITAN Developer Demo</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="live" dot>Simulation safe</Badge>
            <Link to="/developer/docs" className="hidden rounded-xl border border-titan-border px-4 py-2 text-sm font-semibold text-titan-subtext transition hover:border-titan-accent/30 hover:text-white sm:inline-flex">
              Docs
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <section className="relative overflow-hidden rounded-[32px] border border-titan-border bg-gradient-to-br from-titan-surface via-[#0B1019] to-[#06080C] p-6 shadow-elevated sm:p-9 lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-titan-accent/10 blur-[90px]" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-80 rounded-full bg-[#7A3DFF]/10 blur-[80px]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-6 flex flex-wrap gap-2">
                <Badge variant="accent" dot>10-Layer AI Agent Rail Active</Badge>
                <Badge variant="neutral">No real funds moved</Badge>
                <Badge variant="gold">API key demo</Badge>
              </div>
              <h1 className="max-w-3xl text-[42px] font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-[58px]">
                AI agents should not get unlimited wallet access.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-titan-subtext sm:text-lg">
                TITAN checks every agent intent before wallet execution, records a proof log, and keeps a separate security log so developers can show what was allowed and what was blocked.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => void generateApiKey()} loading={busy === 'key'}>
                  <KeyRound size={18} /> {apiKey ? 'Rotate demo API key' : 'Generate demo API key'}
                </Button>
                <a
                  href="#run-demo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-titan-border bg-titan-surface px-7 py-3.5 text-base font-semibold text-white transition hover:border-titan-accent/40"
                >
                  Run simulation <ArrowRight size={18} />
                </a>
              </div>
              {message ? (
                <p className="mt-5 rounded-2xl border border-titan-border bg-black/20 px-4 py-3 text-sm text-titan-subtext">
                  {message}
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-titan-border bg-black/25 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-titan-subtext">Demo capability</p>
                  <h2 className="mt-1 text-xl font-bold text-white">{demo.capability_name}</h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-titan-accent/30 bg-titan-accent/10">
                  <Bot size={22} className="text-titan-accent" />
                </span>
              </div>
              <div className="grid gap-3 text-sm">
                <InfoRow label="Owner wallet" value={shortAddress(demo.owner_wallet)} />
                <InfoRow label="Agent wallet" value={demo.agent_wallet_id} />
                <InfoRow label="Allowed action" value="Pay approved invoice" />
                <InfoRow label="Max amount" value={`${demo.max_amount} ${demo.token}`} />
                <InfoRow label="Recipient" value={shortAddress(demo.approved_recipient)} />
                <InfoRow label="Policy window" value={demo.policy_window} />
                <InfoRow label="Proof log" value="Enabled" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ApiKeyPanel apiKey={apiKey} apiKeyRecord={apiKeyRecord} busy={busy === 'key'} onCreate={() => void generateApiKey()} onCopy={() => void copyApiKey()} />
          <LiveAnchorPanel
            ready={liveAnchorReady}
            latestLiveAnchor={latestLiveAnchor}
            ownerRunToken={ownerRunToken}
            busy={busy === 'anchor'}
            onOwnerRunTokenChange={setOwnerRunToken}
            onRun={() => void runLiveAnchor()}
          />
        </section>

        <section id="run-demo" className="mt-6 grid gap-6 lg:grid-cols-2">
          <ScenarioCard
            tone="allowed"
            title="Allowed Demo"
            description="Agent wants to pay an approved invoice."
            input={getScenarioInput(demo, 'allowed')}
            disabled={!apiKey}
            busy={busy === 'allowed'}
            onRun={() => void runScenario('allowed')}
          />
          <ScenarioCard
            tone="blocked"
            title="Blocked Demo"
            description="Agent tries to move funds outside permission."
            input={getScenarioInput(demo, 'blocked')}
            disabled={!apiKey}
            busy={busy === 'blocked'}
            onRun={() => void runScenario('blocked')}
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <ResultPanel result={result} />
          <EvidencePanel evidence={evidence} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <LogPanel title="Proof Logs" subtitle="Capability, intent, and policy decisions." logs={proofLogs} />
          <SecurityLogPanel logs={securityLogs} />
        </section>
      </main>
    </div>
  );
};

function getScenarioInput(demo: DeveloperDemoConfig, scenario: DemoScenario) {
  if (scenario === 'blocked') {
    return {
      intent: 'Send all wallet balance to unknown address',
      action: 'transfer',
      amount: '999',
      recipient: '0xUnknownAddress',
      token: demo.token,
    };
  }

  return {
    intent: 'Pay approved vendor invoice',
    action: demo.action,
    amount: demo.max_amount,
    recipient: demo.approved_recipient,
    token: demo.token,
  };
}

const ApiKeyPanel: React.FC<{
  apiKey: string;
  apiKeyRecord: DeveloperDemoApiKey | null;
  busy: boolean;
  onCreate: () => void;
  onCopy: () => void;
}> = ({ apiKey, apiKeyRecord, busy, onCreate, onCopy }) => (
  <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-titan-subtext">Step 1</p>
        <h2 className="mt-1 text-xl font-bold text-white">Create simulation API key</h2>
        <p className="mt-2 text-sm leading-6 text-titan-subtext">
          This key can only run the public demo policy. It cannot transfer funds.
        </p>
      </div>
      <FileKey2 className="text-titan-accent" />
    </div>
    {apiKey ? (
      <div className="rounded-2xl border border-titan-accent/25 bg-titan-accent/5 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Badge variant="accent">{apiKeyRecord?.prefix || 'titan_demo_...'}</Badge>
          <button onClick={onCopy} className="inline-flex items-center gap-2 text-xs font-semibold text-titan-accent hover:text-white">
            <Copy size={14} /> Copy
          </button>
        </div>
        <code className="block break-all rounded-xl border border-titan-border bg-black/35 p-3 text-xs text-titan-subtext">
          {apiKey}
        </code>
      </div>
    ) : (
      <Button onClick={onCreate} loading={busy} className="w-full">
        <KeyRound size={16} /> Generate API key
      </Button>
    )}
  </div>
);

const LiveAnchorPanel: React.FC<{
  ready: boolean;
  latestLiveAnchor: DeveloperDemoLatestAnchor | null;
  ownerRunToken: string;
  busy: boolean;
  onOwnerRunTokenChange: (value: string) => void;
  onRun: () => void;
}> = ({ ready, latestLiveAnchor, ownerRunToken, busy, onOwnerRunTokenChange, onRun }) => (
  <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-titan-subtext">Owner-only</p>
        <h2 className="mt-1 text-xl font-bold text-white">Live 0G security proof anchor</h2>
        <p className="mt-2 text-sm leading-6 text-titan-subtext">
          Optional live run writes the TITAN 10-layer security proof log to the 0G registry.
          This is not a token transfer.
        </p>
      </div>
      <Lock className={ready ? 'text-titan-success' : 'text-titan-subtext'} />
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        value={ownerRunToken}
        onChange={(event) => onOwnerRunTokenChange(event.target.value)}
        placeholder={ready ? 'Owner run token' : 'Live anchor not configured'}
        className="min-w-0 flex-1 rounded-xl border border-titan-border bg-titan-bg px-4 py-3 text-sm text-white outline-none focus:border-titan-accent/60"
        disabled={!ready}
      />
      <Button variant="secondary" onClick={onRun} loading={busy} disabled={!ready || !ownerRunToken.trim()}>
        Anchor live
      </Button>
    </div>
    {latestLiveAnchor?.tx_hash ? (
      <div className="mt-4 rounded-2xl border border-titan-accent/20 bg-titan-accent/5 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">TITAN 10-layer security proof anchor</Badge>
            <Badge variant="success">Verified on 0G mainnet</Badge>
            <Badge variant="neutral">Value 0 OG</Badge>
            {typeof latestLiveAnchor.metadata?.block_number === 'number' ? (
              <Badge variant="neutral">{`Block ${latestLiveAnchor.metadata.block_number}`}</Badge>
            ) : null}
          </div>
          <span className="text-xs text-titan-subtext">{new Date(latestLiveAnchor.created_at).toLocaleString()}</span>
        </div>
        <p className="text-sm leading-6 text-titan-subtext">
          This transaction calls the TITAN Wallet Security Registry and emits a verifiable
          security log for the demo rail. It proves the 10-layer check was anchored on-chain;
          it does not send the 0.01 TEST demo amount.
        </p>
        <div className="mt-3 grid gap-2 text-xs text-titan-subtext sm:grid-cols-2">
          <span>Tx type: <strong className="text-white">registry proof log</strong></span>
          <span>On-chain value: <strong className="text-white">0 OG</strong></span>
        </div>
        <p className="mt-3 break-all text-sm font-semibold text-white">{latestLiveAnchor.tx_hash}</p>
        <a
          href={`https://chainscan.0g.ai/tx/${latestLiveAnchor.tx_hash}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-titan-accent hover:text-white"
        >
          Inspect on 0G explorer <ExternalLink size={13} />
        </a>
      </div>
    ) : null}
  </div>
);

const ScenarioCard: React.FC<{
  tone: DemoScenario;
  title: string;
  description: string;
  input: ReturnType<typeof getScenarioInput>;
  disabled: boolean;
  busy: boolean;
  onRun: () => void;
}> = ({ tone, title, description, input, disabled, busy, onRun }) => {
  const isAllowed = tone === 'allowed';
  return (
    <div className={`rounded-3xl border p-6 ${isAllowed ? 'border-titan-success/25 bg-titan-success/5' : 'border-titan-danger/25 bg-titan-danger/5'}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <Badge variant={isAllowed ? 'success' : 'danger'}>{isAllowed ? 'Expected: Allowed' : 'Expected: Blocked'}</Badge>
          <h2 className="mt-4 text-2xl font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-titan-subtext">{description}</p>
        </div>
        {isAllowed ? <CheckCircle2 className="text-titan-success" /> : <XCircle className="text-titan-danger" />}
      </div>
      <pre className="mb-5 overflow-x-auto rounded-2xl border border-titan-border bg-black/35 p-4 text-xs leading-6 text-titan-subtext">
{JSON.stringify({
  intent: input.intent,
  action: input.action,
  amount: input.amount,
  recipient: input.recipient,
  token: input.token,
}, null, 2)}
      </pre>
      <Button variant={isAllowed ? 'primary' : 'danger'} onClick={onRun} loading={busy} disabled={disabled} className="w-full">
        <Play size={16} /> Run {isAllowed ? 'Allowed' : 'Blocked'} Demo
      </Button>
    </div>
  );
};

const ResultPanel: React.FC<{ result: DeveloperDemoIntentResult | null }> = ({ result }) => (
  <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-titan-subtext">Latest result</p>
        <h2 className="mt-1 text-xl font-bold text-white">Allowed or Blocked</h2>
      </div>
      {result ? (
        <Badge variant={result.allowed ? 'success' : 'danger'}>{result.policyResult}</Badge>
      ) : (
        <Badge variant="neutral">Waiting</Badge>
      )}
    </div>
    {result ? (
      <div className="space-y-3 text-sm">
        <InfoRow
          label="Amount"
          value={`${result.proofLog.metadata?.raw_amount || formatDemoAmount(result.proofLog.requested_amount_wei)} TEST`}
        />
        <InfoRow label="Action" value={result.proofLog.requested_action || '-'} />
        <InfoRow
          label="Recipient"
          value={result.proofLog.metadata?.raw_recipient
            ? String(result.proofLog.metadata.raw_recipient)
            : (result.proofLog.requested_destination || '-')}
        />
        <InfoRow label="Reason" value={result.reason} />
        <InfoRow label="Proof ID" value={result.proofId} />
        <InfoRow label="Proof hash" value={shortHash(result.proofHash)} />
        <InfoRow label="Anchor status" value={result.anchorStatus} />
        <InfoRow label="Rail status" value={result.railStatus} />
        <InfoRow label="Mode" value={result.mode} />
      </div>
    ) : (
      <div className="rounded-2xl border border-dashed border-titan-border p-8 text-center text-sm text-titan-subtext">
        Run an allowed or blocked scenario to create a proof log.
      </div>
    )}
  </div>
);

const EvidencePanel: React.FC<{ evidence: DeveloperDemoEvidenceLayer[] }> = ({ evidence }) => (
  <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-titan-subtext">Security panel</p>
        <h2 className="mt-1 text-xl font-bold text-white">10-Layer Rail Evidence</h2>
      </div>
      <ShieldCheck className="text-titan-accent" />
    </div>
    <div className="grid gap-2">
      {evidence.map((layer) => (
        <div key={layer.id} className="flex items-center justify-between gap-4 rounded-2xl border border-titan-border bg-titan-bg/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-xs font-bold text-titan-accent">{layer.id}</span>
            <span className="truncate text-sm font-semibold text-white">{layer.name}</span>
          </div>
          <span className="shrink-0 text-xs font-semibold text-titan-success">{layer.status}</span>
        </div>
      ))}
    </div>
  </div>
);

const LogPanel: React.FC<{
  title: string;
  subtitle: string;
  logs: DeveloperProofLog[];
}> = ({ title, subtitle, logs }) => (
  <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-titan-subtext">{subtitle}</p>
      </div>
      <Badge variant="neutral">{logs.length} logs</Badge>
    </div>
    <div className="space-y-3">
      {logs.length ? logs.map((log) => (
        <div key={log.id} className="rounded-2xl border border-titan-border bg-titan-bg/60 p-4">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-white">{log.type}</p>
              <p className="text-xs text-titan-subtext">{new Date(log.created_at).toLocaleString()}</p>
            </div>
            <Badge variant={log.status === 'allowed' || log.status === 'anchored' ? 'success' : log.status === 'blocked' ? 'danger' : 'neutral'}>
              {log.status}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-titan-subtext">{log.reason}</p>
        </div>
      )) : (
        <div className="rounded-2xl border border-dashed border-titan-border p-8 text-center text-sm text-titan-subtext">
          No proof logs yet.
        </div>
      )}
    </div>
  </div>
);

const SecurityLogPanel: React.FC<{ logs: DeveloperSecurityLog[] }> = ({ logs }) => (
  <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-white">Security Logs</h2>
        <p className="mt-1 text-sm text-titan-subtext">Separate rail events for security evidence.</p>
      </div>
      <Badge variant="live" dot>{logs.length} logs</Badge>
    </div>
    <div className="space-y-3">
      {logs.length ? logs.map((log) => (
        <div key={log.id} className="rounded-2xl border border-titan-border bg-titan-bg/60 p-4">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-white">{log.type}</p>
              <p className="text-xs text-titan-subtext">{new Date(log.created_at).toLocaleString()}</p>
            </div>
            <Badge variant={log.status === 'failed' ? 'danger' : 'success'}>{log.mode}</Badge>
          </div>
          <p className="text-sm leading-6 text-titan-subtext">{log.reason}</p>
          {log.tx_hash ? (
            <a
              href={`https://chainscan.0g.ai/tx/${log.tx_hash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-titan-accent hover:text-white"
            >
              Open anchor <ExternalLink size={13} />
            </a>
          ) : null}
        </div>
      )) : (
        <div className="rounded-2xl border border-dashed border-titan-border p-8 text-center text-sm text-titan-subtext">
          No security logs yet.
        </div>
      )}
    </div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-titan-border bg-titan-bg/50 px-4 py-3">
    <span className="shrink-0 text-titan-subtext">{label}</span>
    <span className="min-w-0 break-words text-right font-semibold text-white">{value}</span>
  </div>
);

function shortAddress(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function shortHash(value: string) {
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
}

function formatDemoAmount(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return '0';
  }
  const normalized = value.padStart(19, '0');
  const whole = normalized.slice(0, -18).replace(/^0+(?=\d)/, '') || '0';
  const fraction = normalized.slice(-18).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

export default DeveloperDemoPage;

import React, { useState } from 'react';
import { AlertTriangle, Copy, ExternalLink, Eye, EyeOff, KeyRound } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  TITAN_API_BASE_URL,
  TITAN_DEV_PORTAL_URL,
  TITAN_MILITARY_GRADE_BASE_URL,
  getTitanApiKey,
  hasTitanSecurityAccess,
  setStoredTitanApiKey,
} from '../../config/api';
import { handshakeLog } from '../../services/security';
import { runMilitaryGradeOperation } from '../../services/militaryGrade';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useWalletStore } from '../../store/useWalletStore';
import { formatAddress } from '../../utils/cn';

const GeneralSettings: React.FC = () => {
  const environment = useNetworkStore((state) => state.environment);
  const toggleEnvironment = useNetworkStore((state) => state.toggleEnvironment);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const walletAddress = useWalletStore((state) => state.address);
  const walletName = useWalletStore((state) => state.walletName);
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const privateKey = useWalletStore((state) => state.privateKey);
  const [apiKey, setApiKey] = useState(() => getTitanApiKey());
  const [saved, setSaved] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedField, setCopiedField] = useState<'mnemonic' | 'privateKey' | null>(null);
  const [secretStatus, setSecretStatus] = useState<string | null>(null);
  const hasWalletSession = Boolean(walletAddress);

  const saveApiKey = () => {
    setStoredTitanApiKey(apiKey);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const copySecret = async (field: 'mnemonic' | 'privateKey', value: string | null) => {
    if (!value) {
      return;
    }

    try {
      if (walletAddress && hasTitanSecurityAccess()) {
        setSecretStatus(`Routing ${field === 'mnemonic' ? 'recovery phrase' : 'private key'} export through the TITAN military-grade rail...`);
        await runMilitaryGradeOperation({
          action: 'export-secret',
          walletAddress,
          network: activeNetwork.name,
          chainId: activeNetwork.chainId,
          intent:
            field === 'mnemonic'
              ? 'Protect a recovery phrase copy action inside the TITAN military-grade lane.'
              : 'Protect a private key copy action inside the TITAN military-grade lane.',
          metadata: {
            field,
            mode: 'copy',
            wallet_name: walletName || null,
          },
        });
        await handshakeLog({
          subjectId: walletAddress,
          operation: field === 'mnemonic' ? 'export-mnemonic' : 'export-private-key',
          walletAddress,
          metadata: {
            network: activeNetwork.name,
            field,
            mode: 'copy',
          },
        });
        setSecretStatus(`${field === 'mnemonic' ? 'Recovery phrase' : 'Private key'} export logged.`);
      }
    } catch (error) {
      setSecretStatus(error instanceof Error ? error.message : 'Secret export logging failed.');
    }

    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const revealSecret = async (field: 'mnemonic' | 'privateKey') => {
    const nextValue = field === 'mnemonic' ? !showMnemonic : !showPrivateKey;
    try {
      if (nextValue && walletAddress && hasTitanSecurityAccess()) {
        setSecretStatus(`Routing ${field === 'mnemonic' ? 'recovery phrase' : 'private key'} reveal through the TITAN military-grade rail...`);
        await runMilitaryGradeOperation({
          action: 'export-secret',
          walletAddress,
          network: activeNetwork.name,
          chainId: activeNetwork.chainId,
          intent:
            field === 'mnemonic'
              ? 'Protect a recovery phrase reveal action inside the TITAN military-grade lane.'
              : 'Protect a private key reveal action inside the TITAN military-grade lane.',
          metadata: {
            field,
            mode: 'reveal',
            wallet_name: walletName || null,
          },
        });
        await handshakeLog({
          subjectId: walletAddress,
          operation: field === 'mnemonic' ? 'reveal-mnemonic' : 'reveal-private-key',
          walletAddress,
          metadata: {
            network: activeNetwork.name,
            field,
            mode: 'reveal',
          },
        });
        setSecretStatus(`${field === 'mnemonic' ? 'Recovery phrase' : 'Private key'} reveal logged.`);
      }
    } catch (error) {
      setSecretStatus(error instanceof Error ? error.message : 'Secret reveal logging failed.');
    }

    if (field === 'mnemonic') {
      setShowMnemonic(nextValue);
      return;
    }

    setShowPrivateKey(nextValue);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">General</h2>
            <p className="text-sm text-titan-subtext">Control how TITAN talks to YieldBoost services and which environment it targets.</p>
          </div>
          <Badge variant="accent" size="sm">API-ready</Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-white">YieldBoost Environment</p>
              <p className="text-xs text-titan-subtext">Current target: {environment} · active chain: {activeNetwork.name}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={toggleEnvironment}>
              Switch to {environment === 'mainnet' ? 'testnet' : 'mainnet'}
            </Button>
          </div>

          <div className="rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound size={15} className="text-titan-accent" />
              <p className="text-sm font-semibold text-white">YieldBoost API Key</p>
            </div>
            <input
              className="titan-input"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="yb_live_xxx or yb_dev_xxx"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-titan-subtext">Use a developer key from the YieldBoost Console. TITAN sends military-grade requests directly to the developer store from this wallet session.</p>
              <Button variant="primary" size="sm" onClick={saveApiKey}>
                {saved ? 'Saved' : 'Save Key'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Wallet Secrets</h2>
            <p className="text-sm text-titan-subtext">Session-only secret controls appear here only after a wallet is imported or created in this browser.</p>
          </div>
          <Badge variant="warning" size="sm">Memory only</Badge>
        </div>

        {hasWalletSession ? (
          <>
            <div className="mb-4 rounded-2xl border border-titan-warning/20 bg-titan-warning/10 px-4 py-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="mt-0.5 text-titan-warning" />
                <div>
                  <p className="text-sm font-semibold text-white">Current session</p>
                  <p className="text-xs text-titan-subtext">
                    {walletName} · {formatAddress(walletAddress || '')}
                  </p>
                  <p className="mt-1 text-xs text-titan-subtext">
                    TITAN keeps secrets in memory only for the MVP, so export them before refreshing if you need to re-import later.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Recovery phrase</p>
                    <p className="text-xs text-titan-subtext">Shown only if this session was created from or imported with a mnemonic.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => void revealSecret('mnemonic')} disabled={!mnemonic}>
                      {showMnemonic ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showMnemonic ? 'Hide' : 'Reveal'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => void copySecret('mnemonic', mnemonic)} disabled={!mnemonic}>
                      <Copy size={14} />
                      {copiedField === 'mnemonic' ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border border-titan-border bg-titan-surface px-4 py-3 font-mono text-xs text-white">
                  {mnemonic
                    ? showMnemonic
                      ? mnemonic
                      : '•••••• •••••• •••••• •••••• •••••• •••••• •••••• •••••• •••••• •••••• •••••• ••••••'
                    : 'No recovery phrase is available in this session.'}
                </div>
              </div>

              <div className="rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Private key</p>
                    <p className="text-xs text-titan-subtext">Available for imported wallets and newly-created wallets while this browser session stays open.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => void revealSecret('privateKey')} disabled={!privateKey}>
                      {showPrivateKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showPrivateKey ? 'Hide' : 'Reveal'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => void copySecret('privateKey', privateKey)} disabled={!privateKey}>
                      <Copy size={14} />
                      {copiedField === 'privateKey' ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border border-titan-border bg-titan-surface px-4 py-3 font-mono text-xs text-white break-all">
                  {privateKey
                    ? showPrivateKey
                      ? privateKey
                      : '0x••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                    : 'No private key is available in this session.'}
                </div>
              </div>
            </div>
            {secretStatus ? (
              <div className="mt-4 rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-3 text-xs text-titan-subtext">
                {secretStatus}
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-titan-border px-4 py-10 text-center">
            <p className="text-sm font-semibold text-white">No wallet session is active.</p>
            <p className="mt-2 text-sm text-titan-subtext">
              Import or create a wallet first if you want to reveal recovery data for the current browser session.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
        <h2 className="text-lg font-bold text-white">Endpoints</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4">
            <p className="text-xs uppercase tracking-wider text-titan-subtext">Public Integrity API</p>
            <p className="mt-1 font-mono text-white">{TITAN_API_BASE_URL}</p>
          </div>
          <div className="rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4">
            <p className="text-xs uppercase tracking-wider text-titan-subtext">Military-Grade Execution</p>
            <p className="mt-1 font-mono text-white">{`${TITAN_MILITARY_GRADE_BASE_URL}/api/dev/store/military-grade`}</p>
          </div>
          <a
            href={TITAN_DEV_PORTAL_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4 transition-all hover:border-titan-accent/30"
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-titan-subtext">Developer Portal</p>
              <p className="mt-1 font-mono text-white">{TITAN_DEV_PORTAL_URL}</p>
            </div>
            <ExternalLink size={16} className="text-titan-subtext" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;

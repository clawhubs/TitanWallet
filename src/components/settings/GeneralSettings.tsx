import React, { useState } from 'react';
import { AlertTriangle, Copy, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { hasTitanSecurityAccess } from '../../config/api';
import { handshakeLog } from '../../services/security';
import { runMilitaryGradeOperation } from '../../services/militaryGrade';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useSecurityPreferencesStore } from '../../store/useSecurityPreferencesStore';
import { useWalletStore } from '../../store/useWalletStore';
import { formatAddress } from '../../utils/cn';
import { canAnchorSecurityLogsOnNetwork } from '../../services/securityLogRegistry';

const GeneralSettings: React.FC = () => {
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const walletAddress = useWalletStore((state) => state.address);
  const walletName = useWalletStore((state) => state.walletName);
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const privateKey = useWalletStore((state) => state.privateKey);
  const anchorOnChain = useSecurityPreferencesStore((state) => state.anchorOnChain);
  const setAnchorOnChain = useSecurityPreferencesStore((state) => state.setAnchorOnChain);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedField, setCopiedField] = useState<'mnemonic' | 'privateKey' | null>(null);
  const [secretStatus, setSecretStatus] = useState<string | null>(null);
  const hasWalletSession = Boolean(walletAddress);
  const canAnchorCurrentNetwork = canAnchorSecurityLogsOnNetwork(activeNetwork);

  const logSecretAction = async (field: 'mnemonic' | 'privateKey', mode: 'copy' | 'reveal') => {
    if (!walletAddress) {
      return;
    }

    const label = field === 'mnemonic' ? 'recovery phrase' : 'private key';

    try {
      setSecretStatus(`Routing ${label} ${mode} through the TITAN wallet security rail...`);
      await runMilitaryGradeOperation({
        action: 'export-secret',
        walletAddress,
        network: activeNetwork.name,
        chainId: activeNetwork.chainId,
        intent: `Protect a ${label} ${mode} action inside the TITAN wallet rail.`,
        metadata: {
          field,
          mode,
          wallet_name: walletName || null,
        },
      });

      if (hasTitanSecurityAccess()) {
        await handshakeLog({
          subjectId: walletAddress,
          operation: field === 'mnemonic' ? `${mode}-mnemonic` : `${mode}-private-key`,
          walletAddress,
          metadata: {
            network: activeNetwork.name,
            field,
            mode,
          },
        });
      }

      setSecretStatus(`${field === 'mnemonic' ? 'Recovery phrase' : 'Private key'} ${mode} logged.`);
    } catch (error) {
      setSecretStatus(error instanceof Error ? error.message : 'Secret export logging failed.');
    }
  };

  const copySecret = async (field: 'mnemonic' | 'privateKey', value: string | null) => {
    if (!value) {
      return;
    }

    await logSecretAction(field, 'copy');
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const revealSecret = async (field: 'mnemonic' | 'privateKey') => {
    const nextValue = field === 'mnemonic' ? !showMnemonic : !showPrivateKey;

    if (nextValue) {
      await logSecretAction(field, 'reveal');
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
            <h2 className="text-lg font-bold text-white">Wallet Session</h2>
            <p className="text-sm text-titan-subtext">Manage the active in-browser wallet session and local secret export controls.</p>
          </div>
          <Badge variant={hasWalletSession ? 'success' : 'neutral'} size="sm">
            {hasWalletSession ? 'Connected' : 'No wallet'}
          </Badge>
        </div>

        {hasWalletSession ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{walletName}</p>
              <p className="mt-1 font-mono text-xs text-titan-subtext">{formatAddress(walletAddress || '', 10)}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-titan-subtext">
              <ShieldCheck size={14} className="text-titan-success" />
              <span>{activeNetwork.name} session active</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-titan-border px-4 py-10 text-center">
            <p className="text-sm font-semibold text-white">No wallet session is active.</p>
            <p className="mt-2 text-sm text-titan-subtext">Create or import a wallet first to unlock dashboard, activity, security, and export controls.</p>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Proof Anchoring</h2>
            <p className="text-sm text-titan-subtext">Control whether TITAN adds an extra on-chain security log after protected sends and swaps.</p>
          </div>
          <Badge variant={anchorOnChain ? 'warning' : 'success'} size="sm">
            {anchorOnChain ? 'Extra gas enabled' : 'Off-chain only'}
          </Badge>
        </div>

        <div className="rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-white">Anchor security logs on-chain</p>
              <p className="mt-1 text-sm text-titan-subtext">
                When enabled, TITAN emits one extra registry transaction on supported 0G networks after a successful seal. Turning it off keeps the proof envelope off-chain and avoids that extra gas spend.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={canAnchorCurrentNetwork ? 'accent' : 'neutral'} size="sm">
                  {canAnchorCurrentNetwork ? `${activeNetwork.name} supports anchoring` : `${activeNetwork.name} stays off-chain`}
                </Badge>
                <Badge variant="neutral" size="sm">
                  Default: cost saver
                </Badge>
              </div>
            </div>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={anchorOnChain}
                onChange={(event) => setAnchorOnChain(event.target.checked)}
              />
              <span className="h-7 w-12 rounded-full bg-titan-muted/70 transition-colors peer-checked:bg-titan-accent" />
              <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
            </label>
          </div>

          <p className="mt-4 text-xs text-titan-subtext">
            Create wallet and import wallet stay free either way. This setting only affects the optional post-proof anchor step on supported networks.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Wallet Secrets</h2>
            <p className="text-sm text-titan-subtext">Session-only recovery controls appear only after a wallet is imported or created in this browser.</p>
          </div>
          <Badge variant="warning" size="sm">Tab session</Badge>
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
                    TITAN now restores this wallet after a page refresh in the same tab. Export the secrets before you close the tab if you need a fresh import later.
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
                    <p className="text-xs text-titan-subtext">Available for imported wallets and newly-created wallets while this browser tab session stays open.</p>
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
                <div className="break-all rounded-xl border border-titan-border bg-titan-surface px-4 py-3 font-mono text-xs text-white">
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
            <p className="text-sm font-semibold text-white">No local secrets are loaded.</p>
            <p className="mt-2 text-sm text-titan-subtext">Secret reveal and copy controls stay hidden until this browser has an active wallet session.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralSettings;

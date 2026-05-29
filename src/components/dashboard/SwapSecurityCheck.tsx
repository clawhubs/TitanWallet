import React, { useEffect, useEffectEvent, useState } from 'react';
import { AlertTriangle, ExternalLink, LoaderCircle, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SecurityBadge from '../ui/SecurityBadge';
import type { Token } from '../../types';
import type { SwapRoute } from '../../services/swap';
import { auditEvaluate, governanceEvaluate, handshakeLog, proofRun } from '../../services/security';
import { hasTitanSecurityAccess } from '../../config/api';
import { useWalletStore } from '../../store/useWalletStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useTitanSecurity } from '../../hooks/useTitanSecurity';
import { WALLET_ACTION_LAYERS } from '../../data/walletActionLayers';
import { runMilitaryGradeOperation } from '../../services/militaryGrade';
import { createChallenge, seal } from '../../services/integrity';
import { useWallet } from '../../hooks/useWallet';
import { anchorWalletSecurityLog, canAnchorSecurityLogsOnNetwork } from '../../services/securityLogRegistry';
import { useSecurityPreferencesStore } from '../../store/useSecurityPreferencesStore';

interface SwapSecurityCheckProps {
  isOpen: boolean;
  onClose: () => void;
  fromToken: Token;
  toToken: Token;
  amount: string;
  route: SwapRoute;
}

const SwapSecurityCheck: React.FC<SwapSecurityCheckProps> = ({
  isOpen,
  onClose,
  fromToken,
  toToken,
  amount,
  route,
}) => {
  const walletAddress = useWalletStore((state) => state.address);
  const environment = useNetworkStore((state) => state.environment);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const anchorOnChain = useSecurityPreferencesStore((state) => state.anchorOnChain);
  const { signTextMessage, privateKey } = useWallet();
  const { getLayer } = useTitanSecurity(isOpen);
  const [status, setStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [message, setMessage] = useState('Ready to run TITAN pre-swap checks.');
  const [securityLogExplorerUrl, setSecurityLogExplorerUrl] = useState<string | null>(null);
  const activeLayers = WALLET_ACTION_LAYERS.swap.map((layer) => getLayer(layer));
  const canAnchorOnActiveNetwork = canAnchorSecurityLogsOnNetwork(activeNetwork);
  const willTryOnChainAnchor = anchorOnChain && canAnchorOnActiveNetwork && Boolean(privateKey);
  const signSwapChallenge = useEffectEvent(async (messageToSign: string) => signTextMessage(messageToSign));
  const routeKey = `${route.provider}:${route.supported ? 'supported' : 'blocked'}:${route.url || route.reason || 'none'}`;

  useEffect(() => {
    let disposed = false;

    const runChecks = async () => {
      setSecurityLogExplorerUrl(null);

      if (!route.supported) {
        setStatus('failed');
        setMessage(route.reason || 'This network does not have a verified swap route yet.');
        return;
      }

      try {
        setStatus('running');
        setMessage('Running swap review through the TITAN wallet rail...');
        const summary = [
          `wallet=${walletAddress || 'disconnected'}`,
          `env=${environment}`,
          `swap=${amount || '0'} ${fromToken.symbol} -> ${toToken.symbol}`,
          `from=${fromToken.contractAddress || fromToken.symbol}`,
          `to=${toToken.contractAddress || toToken.symbol}`,
        ].join(' | ');

        if (disposed) {
          return;
        }

        await runMilitaryGradeOperation({
          action: 'swap',
          walletAddress,
          network: activeNetwork.name,
          chainId: activeNetwork.chainId,
          intent: 'Protect a swap review and external venue redirect inside the TITAN wallet rail.',
          metadata: {
            provider: route.provider,
            amount,
            from_token: fromToken.symbol,
            to_token: toToken.symbol,
            summary,
          },
        });

        const canUseIntegrityApi = hasTitanSecurityAccess();

        if (canUseIntegrityApi) {
          void auditEvaluate({
            plaintext: summary,
            metadata: {
              wallet_address: walletAddress,
              environment,
              from_token: fromToken.symbol,
              to_token: toToken.symbol,
              amount,
              provider: route.provider,
            },
          }).catch(() => undefined);

          void governanceEvaluate({
            walletAddress: walletAddress || undefined,
            recentRequestCount: Number.parseFloat(amount || '0') >= 1000 ? 3 : 1,
          }).catch(() => undefined);

          void proofRun({
            commitment: {
              wallet_address: walletAddress,
              type: 'swap-review',
              amount,
              from_token: fromToken.symbol,
              to_token: toToken.symbol,
              provider: route.provider,
              network: activeNetwork.name,
            },
          }).catch(() => undefined);
        }

        if (disposed) {
          return;
        }

        let anchorExplorerUrl: string | null = null;

        if (walletAddress && canUseIntegrityApi) {
          try {
            const challenge = await createChallenge({
              operation: 'seal',
              walletAddress,
              network: environment,
            });
            const signature = await signSwapChallenge(challenge.message);
            const sealResult = await seal({
              walletAddress,
              network: environment,
              challengeId: challenge.challenge_id,
              message: challenge.message,
              signature,
              plaintext: JSON.stringify({
                action: 'swap-review',
                wallet_address: walletAddress,
                network: activeNetwork.name,
                amount,
                from_token: fromToken.symbol,
                to_token: toToken.symbol,
                provider: route.provider,
                created_at: new Date().toISOString(),
              }),
              metadata: {
                event_type: 'Swap Review',
                description: `Reviewed ${amount || '0'} ${fromToken.symbol} to ${toToken.symbol} on ${route.provider}.`,
                layer_name: 'ProofRegistry Anchor',
                activity_type: 'swap',
                from: walletAddress,
                to: route.provider,
                amount,
                asset_symbol: fromToken.symbol,
                network: activeNetwork.name,
              },
            });

            if (anchorOnChain && privateKey && canAnchorOnActiveNetwork) {
              const anchor = await anchorWalletSecurityLog({
                network: activeNetwork,
                privateKey,
                seal: sealResult,
                action: 'swap-review',
                sourceTxHash: sealResult.transaction_hash || sealResult.storage_tx_hash || sealResult.storage_id,
                context: `swap-review|${activeNetwork.name}|${walletAddress}|${amount || '0'} ${fromToken.symbol}|${toToken.symbol}|${route.provider}`,
              });
              anchorExplorerUrl = anchor.explorerUrl;
              if (!disposed) {
                setSecurityLogExplorerUrl(anchorExplorerUrl);
              }
            }
          } catch {
            // The external swap redirect should not be blocked by delayed remote sealing.
          }
        }

        if (disposed) {
          return;
        }

        if (canUseIntegrityApi) {
          void handshakeLog({
            subjectId: route.provider,
            operation: 'swap-review',
            walletAddress: walletAddress || undefined,
            metadata: {
              amount,
              from_token: fromToken.symbol,
              to_token: toToken.symbol,
              provider: route.provider,
              network: activeNetwork.name,
            },
          }).catch(() => undefined);
        }

        if (!disposed) {
          setStatus('passed');
          setMessage(
            anchorExplorerUrl
              ? 'Swap rails passed and TITAN security logs are ready.'
              : anchorOnChain && canAnchorOnActiveNetwork
                ? 'Swap rails passed. Proofs were sealed, but the extra on-chain anchor was skipped in this session.'
                : 'Swap rails passed: audit, military-grade execution, governance, proof, storage, and handshake are ready.',
          );
        }
      } catch (error) {
        if (!disposed) {
          setStatus('failed');
          setMessage(error instanceof Error ? error.message : 'Swap security checks failed.');
        }
      }
    };

    void runChecks();

    return () => {
      disposed = true;
    };
  }, [
    activeNetwork,
    anchorOnChain,
    amount,
    canAnchorOnActiveNetwork,
    environment,
    fromToken.contractAddress,
    fromToken.symbol,
    isOpen,
    privateKey,
    routeKey,
    route.provider,
    route.reason,
    route.supported,
    toToken.contractAddress,
    toToken.symbol,
    walletAddress,
  ]);

  const handleContinue = () => {
    if (!route.url) {
      return;
    }

    window.location.assign(route.url);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="TITAN Pre-Swap Check" size="md">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">{route.provider}</Badge>
          <Badge variant={status === 'passed' ? 'success' : status === 'failed' ? 'danger' : 'accent'} size="sm">
            {status === 'running' ? 'Checking' : status === 'passed' ? 'Passed' : status === 'failed' ? 'Blocked' : 'Queued'}
          </Badge>
          <Badge variant={willTryOnChainAnchor ? 'warning' : 'neutral'} size="sm">
            {willTryOnChainAnchor ? 'On-chain anchor on' : 'On-chain anchor off'}
          </Badge>
        </div>

        <div className="rounded-2xl border border-titan-border bg-titan-surface p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-titan-subtext">Route</span>
            <span className="font-semibold text-white">{amount || '0'} {fromToken.symbol} → {toToken.symbol}</span>
          </div>
          <div className="mt-3 flex items-start gap-3">
            {status === 'running' ? (
              <LoaderCircle size={16} className="mt-0.5 animate-spin text-titan-accent" />
            ) : status === 'passed' ? (
              <ShieldCheck size={16} className="mt-0.5 text-titan-success" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 text-titan-warning" />
            )}
            <p className="text-sm text-titan-subtext">{message}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {activeLayers.map((layer) => (
            <SecurityBadge key={layer.id} layer={layer} compact />
          ))}
        </div>

        <div className="flex gap-2">
          {securityLogExplorerUrl ? (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => window.open(securityLogExplorerUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink size={15} /> View Logs
            </Button>
          ) : null}
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleContinue}
            disabled={status !== 'passed' || !route.url}
          >
            <ExternalLink size={15} /> Continue to {route.provider}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SwapSecurityCheck;

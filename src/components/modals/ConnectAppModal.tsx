import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SecurityBadge from '../ui/SecurityBadge';
import { ShieldCheck } from 'lucide-react';
import { auditEvaluate, handshakeLog } from '../../services/security';
import { useTitanSecurity } from '../../hooks/useTitanSecurity';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useWalletStore } from '../../store/useWalletStore';
import { formatAddress } from '../../utils/cn';
import { WALLET_ACTION_LAYERS } from '../../data/walletActionLayers';

interface ConnectAppRequest {
  appName: string;
  appUrl: string;
  appIcon?: string;
  permissions?: string[];
  risk?: 'low' | 'medium' | 'high';
}

interface ConnectAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: ConnectAppRequest;
}

const defaultRequest: ConnectAppRequest = {
  appName: 'Uniswap',
  appUrl: 'https://app.uniswap.org',
  appIcon: '🦄',
  permissions: ['View your wallet address', 'Request transaction signatures'],
  risk: 'low',
};

const ConnectAppModal: React.FC<ConnectAppModalProps> = ({ isOpen, onClose, request }) => {
  const navigate = useNavigate();
  const walletAddress = useWalletStore((state) => state.address);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const { getLayer, liveMode } = useTitanSecurity(isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const payload = request || defaultRequest;

  const activeLayers = useMemo(
    () => WALLET_ACTION_LAYERS['connect-dapp'].map((layer) => getLayer(layer)),
    [getLayer],
  );

  const handleConnect = async () => {
    try {
      setIsSubmitting(true);
      setStatus('Auditing the dApp connection payload...');
      await auditEvaluate({
        plaintext: [
          `wallet=${walletAddress || 'disconnected'}`,
          `app=${payload.appName}`,
          `origin=${payload.appUrl}`,
          `network=${activeNetwork.name}`,
          `permissions=${(payload.permissions || []).join(', ')}`,
        ].join(' | '),
        metadata: {
          action: 'connect-dapp',
          app: payload.appName,
          origin: payload.appUrl,
          network: activeNetwork.name,
          risk: payload.risk || 'low',
          permissions: payload.permissions || [],
        },
      });
      setStatus('Logging the app handshake with TITAN...');
      await handshakeLog({
        subjectId: payload.appUrl,
        operation: 'wallet-connect',
        walletAddress: walletAddress || undefined,
        metadata: {
          app: payload.appName,
          risk: payload.risk || 'low',
          permissions: payload.permissions || [],
          network: activeNetwork.name,
        },
      });
      setStatus('Handshake recorded successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Handshake logging failed, but you can still continue.');
    } finally {
      setIsSubmitting(false);
    }

    onClose();
    navigate('/dashboard');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-titan-muted/40 text-3xl">
            {payload.appIcon || '🌐'}
          </div>
          <h2 className="text-base font-bold text-titan-text">Connect to {payload.appName}?</h2>
          <p className="mt-1 text-xs text-titan-subtext">{payload.appUrl}</p>
        </div>

        <div className="mb-5 flex items-center justify-center gap-2">
          <Badge variant={payload.risk === 'high' ? 'danger' : payload.risk === 'medium' ? 'warning' : 'success'} dot>
            {payload.risk || 'low'} risk
          </Badge>
          <Badge variant={liveMode ? 'success' : 'neutral'} size="sm">
            {liveMode ? 'Live layer status' : 'Fallback layer status'}
          </Badge>
        </div>

        <div className="mb-4 rounded-xl border border-titan-border bg-titan-surface p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-titan-subtext">Connection payload</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-titan-subtext">Wallet</span>
              <span className="font-mono text-white">
                {walletAddress ? formatAddress(walletAddress, 10) : 'No wallet connected'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-titan-subtext">Network</span>
              <span className="text-white">{activeNetwork.name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-titan-subtext">Origin</span>
              <span className="break-all font-mono text-white">{payload.appUrl}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-titan-border bg-titan-surface p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-titan-subtext">This app will be able to</p>
          <div className="space-y-2">
            {(payload.permissions || []).map((permission) => (
              <div key={permission} className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-titan-success">✓</span>
                <span className="text-xs text-titan-text">{permission}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-titan-success">✗</span>
              <span className="text-xs text-titan-subtext line-through">Move funds without approval</span>
              <Badge variant="success" size="sm">Blocked by TITAN</Badge>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-titan-subtext">
            TITAN layers active for this connection
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {activeLayers.map((layer) => (
              <SecurityBadge key={layer.id} layer={layer} compact />
            ))}
          </div>
        </div>

        {status ? (
          <div className="mb-4 rounded-xl border border-titan-border bg-[#0A0D14] px-4 py-3 text-xs text-titan-subtext">
            {status}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Reject
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => void handleConnect()} loading={isSubmitting}>
            <ShieldCheck size={15} /> Connect
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConnectAppModal;

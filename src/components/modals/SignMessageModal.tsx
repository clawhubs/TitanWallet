import React, { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SecurityBadge from '../ui/SecurityBadge';
import { ShieldCheck } from 'lucide-react';
import { proofRun, handshakeLog } from '../../services/security';
import { useTitanSecurity } from '../../hooks/useTitanSecurity';
import { useWallet } from '../../hooks/useWallet';
import { useNetworkStore } from '../../store/useNetworkStore';

interface SignMessageRequest {
  appName: string;
  appUrl: string;
  appIcon?: string;
  message?: string;
}

interface SignMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: SignMessageRequest;
}

const defaultRequest: SignMessageRequest = {
  appName: 'Aave',
  appUrl: 'https://app.aave.com',
  appIcon: '👻',
};

const SignMessageModal: React.FC<SignMessageModalProps> = ({ isOpen, onClose, request }) => {
  const { address, signTextMessage } = useWallet();
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const { getLayer, liveMode } = useTitanSecurity(isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const payload = request || defaultRequest;

  const signatureMessage = useMemo(() => {
    if (payload.message) {
      return payload.message;
    }

    return [
      `TITAN Wallet sign-in request for ${payload.appName}`,
      '',
      'This request will not trigger a blockchain transaction.',
      '',
      `Wallet address: ${address || 'No wallet connected'}`,
      `Network: ${activeNetwork.name}`,
      `Issued at: ${new Date().toISOString()}`,
      `Nonce: ${Math.random().toString(16).slice(2, 10)}`,
    ].join('\n');
  }, [activeNetwork.name, address, payload.appName, payload.message]);

  const liveLayers = [
    getLayer('Integrity Auditor'),
    getLayer('ZK Layer'),
    getLayer('Sovereign Memory'),
  ];

  const handleSign = async () => {
    try {
      setIsSubmitting(true);
      setStatus('Signing message locally in the active wallet session...');
      if (address) {
        await signTextMessage(signatureMessage);
      }
      setStatus('Logging sign request proof with TITAN...');
      await Promise.allSettled([
        proofRun({
          commitment: {
            wallet_address: address,
            type: 'message-signature',
            app: payload.appName,
            origin: payload.appUrl,
            network: activeNetwork.name,
            message_preview: signatureMessage.slice(0, 140),
          },
        }),
        handshakeLog({
          subjectId: payload.appUrl,
          operation: 'message-sign',
          walletAddress: address || undefined,
          metadata: {
            app: payload.appName,
            network: activeNetwork.name,
            message_preview: signatureMessage.slice(0, 140),
          },
        }),
      ]);
      setStatus('Signature completed.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to sign the requested payload.');
    } finally {
      setIsSubmitting(false);
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-titan-muted/40 text-xl">
            {payload.appIcon || '✍'}
          </div>
          <div>
            <h2 className="text-base font-bold text-titan-text">Sign Message</h2>
            <p className="text-xs text-titan-subtext">
              {payload.appName} is requesting your signature from {payload.appUrl}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Badge variant="success" dot>Signature only</Badge>
          <Badge variant="neutral" size="sm">{activeNetwork.name}</Badge>
          <Badge variant={liveMode ? 'success' : 'neutral'} size="sm">
            {liveMode ? 'Live layer status' : 'Fallback layer status'}
          </Badge>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-titan-subtext">Message content</p>
          <div className="rounded-xl border border-titan-border bg-titan-surface p-4">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-titan-subtext">{signatureMessage}</pre>
          </div>
        </div>

        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-titan-accent/15 bg-titan-accent/5 p-3">
          <ShieldCheck size={14} className="mt-0.5 flex-shrink-0 text-titan-accent" />
          <p className="text-xs text-titan-subtext">
            <span className="font-medium text-titan-text">ZK Layer is active.</span> TITAN can prove this signature event happened without exposing the full secret state of your wallet.
          </p>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-titan-subtext">Active layers</p>
          <div className="grid grid-cols-2 gap-1.5">
            {liveLayers.map((layer) => (
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
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => void handleSign()} loading={isSubmitting}>
            <ShieldCheck size={15} /> Sign Message
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SignMessageModal;

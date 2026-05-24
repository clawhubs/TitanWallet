import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SecurityBadge from '../ui/SecurityBadge';
import { ShieldCheck } from 'lucide-react';
import { mockSecurityLayers } from '../../data/mockProofs';
import { handshakeLog } from '../../services/security';
import { useWalletStore } from '../../store/useWalletStore';

interface ConnectAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectAppModal: React.FC<ConnectAppModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const walletAddress = useWalletStore((state) => state.address);

  const handleConnect = async () => {
    try {
      await handshakeLog({
        subjectId: 'app.uniswap.org',
        operation: 'wallet-connect',
        walletAddress: walletAddress || undefined,
        metadata: {
          app: 'Uniswap',
          risk: 'low',
        },
      });
    } catch {
      // Keep connection UX unblocked even when the API key is missing.
    }

    onClose();
    navigate('/dashboard');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        {/* App info */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-titan-muted/40 flex items-center justify-center text-3xl mb-3">
            🦄
          </div>
          <h2 className="text-base font-bold text-titan-text">Connect to Uniswap?</h2>
          <p className="text-xs text-titan-subtext mt-1">app.uniswap.org</p>
        </div>

        {/* Risk label */}
        <div className="flex items-center justify-center mb-5">
          <Badge variant="success" dot>Safe — Low Risk</Badge>
        </div>

        {/* Permissions */}
        <div className="p-4 bg-titan-surface rounded-xl border border-titan-border mb-4">
          <p className="text-xs font-semibold text-titan-subtext uppercase tracking-wider mb-3">This app will be able to:</p>
          <div className="space-y-2">
            {[
              { icon: '✓', text: 'View your wallet address', safe: true },
              { icon: '✓', text: 'Request transaction signatures', safe: true },
              { icon: '✗', text: 'Move funds without approval', safe: false, blocked: true },
            ].map((perm, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className={`text-xs font-bold ${perm.blocked ? 'text-titan-success' : 'text-titan-success'}`}>{perm.icon}</span>
                <span className={`text-xs ${perm.blocked ? 'text-titan-subtext line-through' : 'text-titan-text'}`}>{perm.text}</span>
                {perm.blocked && <Badge variant="success" size="sm">Blocked by TITAN</Badge>}
              </div>
            ))}
          </div>
        </div>

        {/* Active layers */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-titan-subtext uppercase tracking-wider mb-2">TITAN layers active for this connection:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {['Integrity Auditor', 'Programmable Governance', 'Sovereign Memory'].map(name => {
              const layer = mockSecurityLayers.find(l => l.name === name)!;
              return layer ? <SecurityBadge key={name} layer={layer} compact /> : null;
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Reject
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => void handleConnect()}>
            <ShieldCheck size={15} /> Connect
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConnectAppModal;

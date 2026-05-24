import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SecurityBadge from '../ui/SecurityBadge';
import { ShieldCheck } from 'lucide-react';
import { mockSecurityLayers } from '../../data/mockProofs';
import { proofRun } from '../../services/security';
import { useWallet } from '../../hooks/useWallet';

interface SignMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignMessageModal: React.FC<SignMessageModalProps> = ({ isOpen, onClose }) => {
  const { address, signTextMessage } = useWallet();
  const mockMessage = `Welcome to Aave!\n\nClick to sign in and accept the Aave Terms of Service.\n\nThis request will not trigger a blockchain transaction.\n\nWallet address: 0x3fE2b97C1Fd336E750087D68B9b867997Fd64Ae\nNonce: 4a8f2c1d`;

  const handleSign = async () => {
    try {
      if (address) {
        await signTextMessage(mockMessage);
      }
      await proofRun({
        commitment: {
          wallet_address: address,
          type: 'message-signature',
          message_preview: mockMessage.slice(0, 120),
        },
      });
    } catch {
      // Signing should still be closable when API key is not available.
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-titan-muted/40 flex items-center justify-center text-xl">
            👻
          </div>
          <div>
            <h2 className="text-base font-bold text-titan-text">Sign Message</h2>
            <p className="text-xs text-titan-subtext">app.aave.com is requesting your signature</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="success" dot>Safe — Signature Only</Badge>
          <Badge variant="neutral" size="sm">No Gas Required</Badge>
        </div>

        {/* Message preview */}
        <div className="mb-4">
          <p className="titan-label mb-2">Message content</p>
          <div className="p-4 bg-titan-surface border border-titan-border rounded-xl">
            <pre className="text-xs text-titan-subtext font-mono whitespace-pre-wrap leading-relaxed">{mockMessage}</pre>
          </div>
        </div>

        {/* ZK Layer note */}
        <div className="flex items-start gap-2.5 p-3 bg-titan-accent/5 border border-titan-accent/15 rounded-xl mb-4">
          <ShieldCheck size={14} className="text-titan-accent mt-0.5 flex-shrink-0" />
          <p className="text-xs text-titan-subtext">
            <span className="text-titan-text font-medium">ZK Layer is active.</span> A zero-knowledge proof will be generated for this signature, preserving your privacy.
          </p>
        </div>

        {/* Active layers */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-titan-subtext uppercase tracking-wider mb-2">Active layers</p>
          <div className="grid grid-cols-2 gap-1.5">
            {['Integrity Auditor', 'ZK Layer'].map(name => {
              const layer = mockSecurityLayers.find(l => l.name === name)!;
              return layer ? <SecurityBadge key={name} layer={layer} compact /> : null;
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={() => void handleSign()}>
            <ShieldCheck size={15} /> Sign Message
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SignMessageModal;

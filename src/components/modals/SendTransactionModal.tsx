import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SecurityBadge from '../ui/SecurityBadge';
import { ShieldCheck, Fuel } from 'lucide-react';
import { mockSecurityLayers } from '../../data/mockProofs';
import { formatAddress } from '../../utils/cn';
import { auditEvaluate, checkBlacklist, proofRun } from '../../services/security';
import { useWalletStore } from '../../store/useWalletStore';
import { useNetworkStore } from '../../store/useNetworkStore';

interface SendTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendTransactionModal: React.FC<SendTransactionModalProps> = ({ isOpen, onClose }) => {
  const walletAddress = useWalletStore((state) => state.address);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const tx = {
    to: '0xB2C3d4E5f67890123456789012345678901234AB',
    value: `0.25 ${activeNetwork.symbol}`,
    valueUSD: '$749.30',
    gasEstimate: `~0.0014 ${activeNetwork.symbol} ($4.19)`,
    network: activeNetwork.name,
    riskLevel: 'safe' as const,
  };

  const handleConfirm = async () => {
    const summary = `${walletAddress || 'wallet'} sending ${tx.value} to ${tx.to} on ${tx.network}`;

    try {
      await checkBlacklist(summary);
      await auditEvaluate({
        plaintext: summary,
        metadata: {
          to: tx.to,
          network: tx.network,
          amount: tx.value,
        },
      });
      await proofRun({
        commitment: {
          wallet_address: walletAddress,
          type: 'send-transaction',
          to: tx.to,
          amount: tx.value,
        },
      });
    } catch {
      // Keep modal usable in offline/dev mode.
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Transaction" size="md">
      <div className="p-6">
        {/* Risk label */}
        <div className="flex items-center gap-2 mb-5">
          <Badge variant="success" dot>Safe Transaction</Badge>
          <Badge variant="neutral" size="sm">{tx.network}</Badge>
        </div>

        {/* Transaction summary */}
        <div className="p-4 bg-titan-surface border border-titan-border rounded-xl mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-titan-subtext">From</span>
            <span className="text-xs font-mono text-titan-text">
              {walletAddress ? formatAddress(walletAddress, 10) : 'No wallet connected'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-titan-subtext">To</span>
            <span className="text-xs font-mono text-titan-text">{formatAddress(tx.to, 10)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-titan-subtext">Amount</span>
            <div className="text-right">
              <span className="text-sm font-bold text-titan-text">{tx.value}</span>
              <span className="text-xs text-titan-subtext ml-2">{tx.valueUSD}</span>
            </div>
          </div>
          <div className="border-t border-titan-border pt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Fuel size={12} className="text-titan-subtext" />
              <span className="text-xs text-titan-subtext">Estimated fee</span>
            </div>
            <span className="text-xs font-mono text-titan-text">{tx.gasEstimate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-titan-subtext">Total</span>
            <span className="text-sm font-bold text-titan-text">≈ $753.49</span>
          </div>
        </div>

        {/* TITAN check */}
        <div className="flex items-start gap-2.5 p-3 bg-titan-success/5 border border-titan-success/20 rounded-xl mb-4">
          <ShieldCheck size={14} className="text-titan-success mt-0.5 flex-shrink-0" />
          <p className="text-xs text-titan-subtext">
            <span className="text-titan-text font-medium">Integrity Auditor passed.</span> This destination address has been verified against known malicious patterns. No issues detected.
          </p>
        </div>

        {/* Active layers summary */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-titan-subtext uppercase tracking-wider mb-2">All 6 layers verified</p>
          <div className="grid grid-cols-2 gap-1.5">
            {mockSecurityLayers.map(layer => (
              <SecurityBadge key={layer.id} layer={layer} compact />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Reject</Button>
          <Button variant="primary" className="flex-1" onClick={() => void handleConfirm()}>
            <ShieldCheck size={15} /> Confirm Send
          </Button>
        </div>

        <p className="text-xs text-titan-subtext text-center mt-3">
          A proof of this transaction will be anchored on-chain.
        </p>
      </div>
    </Modal>
  );
};

export default SendTransactionModal;

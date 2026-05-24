import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Wallet } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useWalletStore } from '../../store/useWalletStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { formatAddress } from '../../utils/cn';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose }) => {
  const walletAddress = useWalletStore((state) => state.address);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!walletAddress) {
      return;
    }

    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const addressExplorerUrl = walletAddress
    ? `${activeNetwork.explorerUrl.replace(/\/$/, '')}/address/${walletAddress}`
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive Assets" size="md">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>{activeNetwork.name}</Badge>
          <Badge variant="neutral" size="sm">Self-custody</Badge>
        </div>

        <div className="rounded-2xl border border-titan-border bg-titan-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-titan-border bg-[#0A0D14]">
              <Wallet size={18} className="text-titan-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Deposit to your TITAN wallet</p>
              <p className="text-xs text-titan-subtext">Only send assets supported on {activeNetwork.name} to this address.</p>
            </div>
          </div>

          <div className="rounded-xl border border-titan-border bg-[#0A0D14] p-4">
            <p className="text-xs uppercase tracking-wider text-titan-subtext">Wallet address</p>
            <p className="mt-2 break-all font-mono text-sm text-white">
              {walletAddress || 'No wallet connected'}
            </p>
            {walletAddress ? (
              <p className="mt-2 text-xs text-titan-subtext">Short format: {formatAddress(walletAddress, 8)}</p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={copyAddress} disabled={!walletAddress}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy Address'}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              if (addressExplorerUrl) {
                window.open(addressExplorerUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            disabled={!addressExplorerUrl}
          >
            <ExternalLink size={15} /> View Explorer
          </Button>
        </div>

        <p className="text-center text-xs text-titan-subtext">
          Double-check the selected network before sharing your address.
        </p>
      </div>
    </Modal>
  );
};

export default ReceiveModal;

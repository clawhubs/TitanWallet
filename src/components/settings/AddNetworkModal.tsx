import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { Network } from '../../types';

interface AddNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (network: Network) => void;
  initialNetwork?: Network | null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const AddNetworkModal: React.FC<AddNetworkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNetwork,
}) => {
  const [name, setName] = useState(() => initialNetwork?.name || '');
  const [rpcUrl, setRpcUrl] = useState(() => initialNetwork?.rpcUrl || '');
  const [chainId, setChainId] = useState(() => (initialNetwork ? String(initialNetwork.chainId) : ''));
  const [symbol, setSymbol] = useState(() => initialNetwork?.symbol || '');
  const [explorerUrl, setExplorerUrl] = useState(() => initialNetwork?.explorerUrl || '');
  const [isTestnet, setIsTestnet] = useState(() => initialNetwork?.isTestnet || false);

  const handleSave = () => {
    onSave({
      id: initialNetwork?.id || slugify(name),
      name,
      rpcUrl,
      chainId: Number.parseInt(chainId, 10),
      symbol,
      explorerUrl,
      isTestnet,
      isActive: initialNetwork?.isActive || false,
      isDefault: initialNetwork?.isDefault || false,
    });
    onClose();
  };

  const isDisabled = !name.trim() || !rpcUrl.trim() || !chainId.trim() || !symbol.trim() || !explorerUrl.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialNetwork ? 'Edit Custom Network' : 'Add Custom Network'}
      size="md"
    >
      <div className="p-6 space-y-4">
        <div>
          <label className="titan-label block mb-2">Network Name</label>
          <input className="titan-input" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <label className="titan-label block mb-2">RPC URL</label>
          <input className="titan-input" value={rpcUrl} onChange={(event) => setRpcUrl(event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="titan-label block mb-2">Chain ID</label>
            <input className="titan-input" value={chainId} onChange={(event) => setChainId(event.target.value)} />
          </div>
          <div>
            <label className="titan-label block mb-2">Currency Symbol</label>
            <input className="titan-input" value={symbol} onChange={(event) => setSymbol(event.target.value)} />
          </div>
        </div>
        <div>
          <label className="titan-label block mb-2">Block Explorer</label>
          <input className="titan-input" value={explorerUrl} onChange={(event) => setExplorerUrl(event.target.value)} />
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-titan-border bg-titan-surface px-4 py-3">
          <input
            type="checkbox"
            checked={isTestnet}
            onChange={(event) => setIsTestnet(event.target.checked)}
            className="accent-[#4ECDC4]"
          />
          <span className="text-sm text-titan-subtext">This is a testnet</span>
        </label>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} disabled={isDisabled}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddNetworkModal;

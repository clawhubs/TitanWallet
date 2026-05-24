import React, { useEffect, useState } from 'react';
import { Search, PlusCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useTokenStore } from '../../store/useTokenStore';
import { getTokenMetadata } from '../../services/tokens';

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTokenModal: React.FC<AddTokenModalProps> = ({ isOpen, onClose }) => {
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const addCustomToken = useTokenStore((state) => state.addCustomToken);
  const [contractAddress, setContractAddress] = useState('');
  const [metadata, setMetadata] = useState<{ name: string; symbol: string; decimals: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || contractAddress.trim().length !== 42) {
      return;
    }

    let disposed = false;

    const lookup = async () => {
      try {
        setIsLoading(true);
        const result = await getTokenMetadata(contractAddress, activeNetwork);
        if (!disposed) {
          setMetadata(result);
          setError(null);
        }
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : 'Unable to resolve token metadata.');
          setMetadata(null);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void lookup();

    return () => {
      disposed = true;
    };
  }, [activeNetwork, contractAddress, isOpen]);

  const handleImport = () => {
    if (!metadata) {
      return;
    }

    addCustomToken({
      id: contractAddress.toLowerCase(),
      symbol: metadata.symbol,
      name: metadata.name,
      balance: '0.00',
      balanceUSD: 0,
      price: 0,
      change24h: 0,
      icon: metadata.symbol.slice(0, 1).toUpperCase(),
      network: activeNetwork.name,
      source: 'custom',
      contractAddress,
    });
    onClose();
  };

  const handleAddressChange = (value: string) => {
    setContractAddress(value);
    setError(null);
    if (value.trim().length !== 42) {
      setMetadata(null);
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Token" size="md">
      <div className="p-6 space-y-4">
        <div>
          <label className="titan-label block mb-2">Contract Address</label>
          <div className="relative">
            <input
              className="titan-input pr-10"
              placeholder="0x1234..."
              value={contractAddress}
              onChange={(event) => handleAddressChange(event.target.value)}
            />
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-titan-subtext" />
          </div>
          <p className="mt-2 text-xs text-titan-subtext">Network: {activeNetwork.name}</p>
        </div>

        <div className="rounded-2xl border border-titan-border bg-titan-surface p-4 min-h-[112px]">
          {metadata ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-titan-accent">Auto-filled</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-titan-subtext">Token Name</span>
                <span className="font-semibold text-white">{metadata.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-titan-subtext">Symbol</span>
                <span className="font-semibold text-white">{metadata.symbol}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-titan-subtext">Decimals</span>
                <span className="font-semibold text-white">{metadata.decimals}</span>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <p className="text-sm text-titan-subtext">
                {isLoading ? 'Looking up token metadata...' : 'Enter a contract address to resolve token details.'}
              </p>
            </div>
          )}
        </div>

        {error ? <p className="text-xs text-titan-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleImport} disabled={!metadata} loading={isLoading}>
            <PlusCircle size={15} /> Import
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddTokenModal;

import React, { useState } from 'react';
import { Check, Globe, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { Network } from '../../types';
import { cn } from '../../utils/cn';

type NetworkPickerTab = 'popular' | 'testnets' | 'custom';

interface AssetNetworkPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNetwork: string;
  onSelect: (networkName: string) => void;
  onAddCustom: () => void;
  networks: Network[];
}

function getNetworkMonogram(network: Network) {
  const cleaned = network.symbol.replace(/[^a-z0-9]/gi, '');
  if (cleaned) {
    return cleaned.slice(0, 2).toUpperCase();
  }

  return network.name.slice(0, 2).toUpperCase();
}

function getNetworkLogo(network: Network) {
  if (/^0G\b/i.test(network.name)) {
    return '/0g-logo.png';
  }

  if (/^Ethereum\b/i.test(network.name)) {
    return 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png';
  }

  if (/^Base\b/i.test(network.name)) {
    return '/base-logo.ico';
  }

  if (/^Arbitrum\b/i.test(network.name)) {
    return 'https://assets.coingecko.com/coins/images/16547/standard/photo_2023-03-29_21.47.00.jpeg';
  }

  if (/^Optimism\b/i.test(network.name)) {
    return 'https://assets.coingecko.com/coins/images/25244/standard/Optimism.png';
  }

  if (/^Polygon\b/i.test(network.name)) {
    return 'https://assets.coingecko.com/coins/images/4713/standard/polygon.png';
  }

  if (/^BNB Chain\b/i.test(network.name)) {
    return 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png';
  }

  return null;
}

const AssetNetworkPickerModal: React.FC<AssetNetworkPickerModalProps> = ({
  isOpen,
  onClose,
  selectedNetwork,
  onSelect,
  onAddCustom,
  networks,
}) => {
  const [tab, setTab] = useState<NetworkPickerTab>('popular');
  const popularNetworks = networks.filter((network) => network.isDefault && !network.isTestnet);
  const testnetNetworks = networks.filter((network) => network.isDefault && network.isTestnet);
  const customNetworks = networks.filter((network) => !network.isDefault);

  const chooseNetwork = (networkName: string) => {
    onSelect(networkName);
    onClose();
  };

  const renderNetworkAvatar = (network: Network) => {
    const logoUrl = getNetworkLogo(network);

    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={network.name}
          className="h-10 w-10 rounded-xl border border-white/10 bg-[#0F1116] object-cover"
        />
      );
    }

    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">
        {getNetworkMonogram(network)}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select network" size="md" className="max-w-[360px]">
      <div className="bg-[#111317]">
        <div className="border-b border-white/5 px-5 pt-2">
          <div className="flex gap-6">
            {[
              { id: 'popular', label: 'Popular' },
              { id: 'testnets', label: 'Testnets' },
              { id: 'custom', label: 'Custom RPC' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as NetworkPickerTab)}
                className={cn(
                  'border-b-2 pb-3 text-[15px] font-semibold transition-colors',
                  tab === item.id ? 'border-white text-white' : 'border-transparent text-white/55 hover:text-white/85',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'popular' ? (
          <div className="max-h-[420px] overflow-y-auto py-3">
            <button
              onClick={() => chooseNetwork('all')}
              className={cn(
                'mx-3 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
                selectedNetwork === 'all' ? 'bg-white/[0.07] text-white' : 'text-white/85 hover:bg-white/[0.04]',
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Globe size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">All popular networks</p>
              </div>
              {selectedNetwork === 'all' ? <Check size={16} className="text-titan-accent" /> : null}
            </button>

            <div className="mt-2 space-y-1 px-3">
              {popularNetworks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => chooseNetwork(network.name)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
                    selectedNetwork === network.name ? 'bg-white/[0.07] text-white' : 'text-white/85 hover:bg-white/[0.04]',
                  )}
                >
                  {renderNetworkAvatar(network)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{network.name}</p>
                    <p className="mt-0.5 text-xs text-titan-subtext">{network.symbol} • Chain {network.chainId}</p>
                  </div>
                  {selectedNetwork === network.name ? <Check size={16} className="text-titan-accent" /> : null}
                </button>
              ))}
            </div>
          </div>
        ) : tab === 'testnets' ? (
          <div className="max-h-[420px] overflow-y-auto p-4">
            {testnetNetworks.length ? (
              <div className="space-y-1">
                {testnetNetworks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => chooseNetwork(network.name)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
                      selectedNetwork === network.name ? 'bg-white/[0.07] text-white' : 'text-white/85 hover:bg-white/[0.04]',
                    )}
                  >
                    {renderNetworkAvatar(network)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{network.name}</p>
                      <p className="mt-0.5 text-xs text-titan-subtext">{network.symbol} • Chain {network.chainId}</p>
                    </div>
                    {selectedNetwork === network.name ? <Check size={16} className="text-titan-accent" /> : null}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#15171C] px-4 py-10 text-center text-sm text-titan-subtext">
                No bundled testnets available.
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto p-4">
            <div className="mb-4 rounded-2xl border border-titan-border bg-[#15171C] p-4">
              <p className="text-sm font-semibold text-white">Custom RPC endpoints</p>
              <p className="mt-1 text-xs text-titan-subtext">
                Add your own network and surface it here for quick switching.
              </p>
              <Button variant="primary" size="sm" className="mt-4 w-full justify-center" onClick={onAddCustom}>
                <Plus size={14} /> Add Custom RPC
              </Button>
            </div>

            {customNetworks.length ? (
              <div className="space-y-1">
                {customNetworks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => chooseNetwork(network.name)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors',
                      selectedNetwork === network.name ? 'bg-white/[0.07] text-white' : 'text-white/85 hover:bg-white/[0.04]',
                    )}
                  >
                    {renderNetworkAvatar(network)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{network.name}</p>
                      <p className="mt-0.5 truncate text-xs text-titan-subtext">{network.rpcUrl}</p>
                    </div>
                    {selectedNetwork === network.name ? <Check size={16} className="text-titan-accent" /> : null}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#15171C] px-4 py-10 text-center text-sm text-titan-subtext">
                No custom RPC added yet.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AssetNetworkPickerModal;

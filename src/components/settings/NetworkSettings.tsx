import React, { useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import AddNetworkModal from './AddNetworkModal';
import { useNetworkStore } from '../../store/useNetworkStore';
import type { Network } from '../../types';

const NetworkSettings: React.FC = () => {
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const networks = useNetworkStore((state) => state.networks);
  const environment = useNetworkStore((state) => state.environment);
  const addNetwork = useNetworkStore((state) => state.addNetwork);
  const updateNetwork = useNetworkStore((state) => state.updateNetwork);
  const removeNetwork = useNetworkStore((state) => state.removeNetwork);
  const setActiveNetwork = useNetworkStore((state) => state.setActiveNetwork);
  const toggleEnvironment = useNetworkStore((state) => state.toggleEnvironment);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null);

  const handleSave = (network: Network) => {
    if (editingNetwork) {
      updateNetwork(editingNetwork.id, network);
      return;
    }

    addNetwork(network);
  };

  return (
    <>
      <div className="rounded-3xl border border-titan-border bg-titan-surface p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Networks</h2>
            <p className="text-sm text-titan-subtext">Manage the RPCs your wallet can use for balance checks, proof calls, and swaps.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingNetwork(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={14} /> Add
          </Button>
        </div>

        <div className="space-y-3">
          {networks.map((network) => (
            <div key={network.id} className="rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{network.name}</span>
                    {network.id === activeNetwork.id ? <Badge variant="success" size="sm">Active</Badge> : null}
                    {network.isDefault ? <Badge variant="neutral" size="sm">Default</Badge> : null}
                    {network.isTestnet ? <Badge variant="warning" size="sm">Testnet</Badge> : null}
                  </div>
                  <p className="text-xs text-titan-subtext">Chain {network.chainId} • {network.symbol}</p>
                  <p className="text-xs text-titan-subtext/70">{network.rpcUrl}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {network.id !== activeNetwork.id ? (
                    <Button variant="secondary" size="sm" onClick={() => setActiveNetwork(network)}>
                      <CheckCircle2 size={14} /> Set
                    </Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingNetwork(network);
                      setIsModalOpen(true);
                    }}
                  >
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNetwork(network.id)}
                    disabled={network.isDefault}
                  >
                    <Trash2 size={14} /> Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-titan-border bg-[#0A0D14] px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-white">Environment</p>
            <p className="text-xs text-titan-subtext">Affects YieldBoost API calls only.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleEnvironment}>
            {environment === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </Button>
        </div>
      </div>

      <AddNetworkModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNetwork(null);
        }}
        onSave={handleSave}
        initialNetwork={editingNetwork}
      />
    </>
  );
};

export default NetworkSettings;

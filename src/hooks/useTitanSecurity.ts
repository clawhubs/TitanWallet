import { useEffect, useMemo, useState } from 'react';
import { mockSecurityLayers } from '../data/mockProofs';
import { getHealth, getLayerStatus } from '../services/security';
import type { SecurityLayer, TitanLayer } from '../types';
import { buildTitanSecurityLayersFromApi } from '../utils/integrity';
import { hasTitanSecurityAccess } from '../config/api';
import { runMilitaryGradeOperation, type MilitaryGradeLayerReceipt } from '../services/militaryGrade';
import { useNetworkStore } from '../store/useNetworkStore';
import { useWalletStore } from '../store/useWalletStore';

function applyMilitaryGradeReceipts(
  layers: SecurityLayer[],
  receipts?: MilitaryGradeLayerReceipt[] | null,
) {
  if (!receipts?.length) {
    return layers;
  }

  const receiptsByLayer = new Map(receipts.map((receipt) => [receipt.label, receipt]));

  return layers.map((layer) => {
    const receipt = receiptsByLayer.get(layer.name);
    if (!receipt) {
      return layer;
    }

    return {
      ...layer,
      status: /fail|error|blocked|denied/i.test(receipt.status) ? 'alert' : 'active',
      shortDesc: receipt.proof || layer.shortDesc,
      description: receipt.proof || layer.description,
      lastCheck: new Date(),
      eventsCount: Math.max(layer.eventsCount, 1),
    } satisfies SecurityLayer;
  });
}

export function useTitanSecurity(enabled = true) {
  const walletAddress = useWalletStore((state) => state.address);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const [layers, setLayers] = useState<SecurityLayer[]>(mockSecurityLayers);
  const [liveMode, setLiveMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let disposed = false;

    const hydrate = async () => {
      try {
        setIsLoading(true);
        const status = await (hasTitanSecurityAccess() ? getLayerStatus() : getHealth());
        let nextLayers = buildTitanSecurityLayersFromApi(status);

        try {
          const rail = await runMilitaryGradeOperation({
            action: 'layer-status',
            walletAddress,
            network: activeNetwork.name,
            chainId: activeNetwork.chainId,
            intent: 'Read live TITAN layer status for wallet action UI.',
            metadata: {
              source: 'useTitanSecurity',
            },
          });
          nextLayers = applyMilitaryGradeReceipts(nextLayers, rail.selected_layers);
        } catch {
          // The public health endpoint remains the fallback for layer cards.
        }

        if (!disposed) {
          setLayers(nextLayers);
          setLiveMode(true);
        }
      } catch {
        try {
          const rail = await runMilitaryGradeOperation({
            action: 'layer-status',
            walletAddress,
            network: activeNetwork.name,
            chainId: activeNetwork.chainId,
            intent: 'Read live TITAN layer status for wallet action UI.',
            metadata: {
              source: 'useTitanSecurity',
              fallback: true,
            },
          });

          if (!disposed) {
            setLayers(applyMilitaryGradeReceipts(mockSecurityLayers, rail.selected_layers));
            setLiveMode(true);
          }
        } catch {
          if (!disposed) {
            setLayers(mockSecurityLayers);
            setLiveMode(false);
          }
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void hydrate();

    return () => {
      disposed = true;
    };
  }, [activeNetwork.chainId, activeNetwork.name, enabled, walletAddress]);

  const layerMap = useMemo(
    () => new Map(layers.map((layer) => [layer.name, layer])),
    [layers],
  );

  const getLayer = (name: TitanLayer) =>
    layerMap.get(name) || mockSecurityLayers.find((layer) => layer.name === name) || mockSecurityLayers[0];

  return {
    layers,
    liveMode,
    isLoading,
    getLayer,
  };
}

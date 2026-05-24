import { useEffect, useMemo, useState } from 'react';
import { mockSecurityLayers } from '../data/mockProofs';
import { getHealth, getLayerStatus } from '../services/security';
import { getNitroFortressStatus } from '../services/nitro';
import type { SecurityLayer, TitanLayer } from '../types';
import { buildTitanSecurityLayersFromApi } from '../utils/integrity';
import { getTitanApiKey } from '../config/api';

export function useTitanSecurity(enabled = true) {
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
        const hasApiKey = Boolean(getTitanApiKey());
        const [status, nitro] = await Promise.allSettled([
          hasApiKey ? getLayerStatus() : getHealth(),
          getNitroFortressStatus(),
        ]);
        if (!disposed) {
          const layerStatus = status.status === 'fulfilled' ? status.value : null;
          const nitroHealth =
            nitro.status === 'fulfilled'
              ? {
                  status: 'ok' as const,
                  detail: nitro.value.fortress?.ip
                    ? `Nitro fortress live at ${nitro.value.fortress.ip}.`
                    : 'Nitro fortress live via developer rail.',
                }
              : null;

          if (layerStatus) {
            setLayers(buildTitanSecurityLayersFromApi(layerStatus, nitroHealth));
            setLiveMode(true);
          } else {
            setLayers(mockSecurityLayers);
            setLiveMode(false);
          }
        }
      } catch {
        if (!disposed) {
          setLayers(mockSecurityLayers);
          setLiveMode(false);
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
  }, [enabled]);

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

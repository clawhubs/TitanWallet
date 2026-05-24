import { useEffect, useMemo, useState } from 'react';
import { mockSecurityLayers } from '../data/mockProofs';
import { getHealth, getLayerStatus } from '../services/security';
import type { SecurityLayer, TitanLayer } from '../types';
import { buildTitanSecurityLayersFromApi } from '../utils/integrity';
import { hasTitanSecurityAccess } from '../config/api';

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
        const status = await (hasTitanSecurityAccess() ? getLayerStatus() : getHealth());
        if (!disposed) {
          setLayers(buildTitanSecurityLayersFromApi(status));
          setLiveMode(true);
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

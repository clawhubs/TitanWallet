import React, { useMemo, useState } from 'react';
import { ArrowDownUp, ArrowRightLeft } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useTokenStore } from '../../store/useTokenStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { buildSwapUrl } from '../../services/swap';
import SwapSecurityCheck from './SwapSecurityCheck';
import { getSwapTokensForNetwork } from '../../data/swapTokens';

interface SwapPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SwapPanel: React.FC<SwapPanelProps> = ({ isOpen, onClose }) => {
  const tokens = useTokenStore((state) => state.tokens);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [showSecurityCheck, setShowSecurityCheck] = useState(false);

  const networkTokens = useMemo(
    () => getSwapTokensForNetwork(activeNetwork, tokens),
    [activeNetwork, tokens],
  );

  const fromToken =
    networkTokens.find((token) => token.id === fromId) ||
    networkTokens[0] ||
    null;
  const selectableToTokens = useMemo(
    () => networkTokens.filter((token) => token.id !== fromToken?.id),
    [fromToken?.id, networkTokens],
  );
  const toToken =
    networkTokens.find((token) => token.id === toId) ||
    selectableToTokens[0] ||
    null;

  const route = useMemo(
    () =>
      fromToken && toToken
        ? buildSwapUrl({
            network: activeNetwork,
            fromToken,
            toToken,
            amount,
          })
        : {
            provider: 'Uniswap' as const,
            supported: false,
            url: null,
            reason: 'At least two tokens are required to prepare a swap.',
          },
    [activeNetwork, amount, fromToken, toToken],
  );

  const flipTokens = () => {
    if (!fromToken || !toToken) {
      return;
    }

    setFromId(toToken.id);
    setToId(fromToken.id);
  };

  const canReview = Boolean(fromToken && toToken && amount && Number.parseFloat(amount) > 0);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Swap Assets" size="md">
        <div className="p-6 space-y-4">
          <div className="rounded-2xl border border-titan-border bg-titan-surface p-4">
            <div className="flex items-center justify-between">
              <label className="titan-label">From</label>
              <span className="text-xs text-titan-subtext">{activeNetwork.name}</span>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
              <input
                className="titan-input"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.0"
              />
              <select
                className="titan-input min-w-[140px]"
                value={fromToken?.id || ''}
                onChange={(event) => setFromId(event.target.value)}
              >
                {networkTokens.map((token) => (
                  <option key={token.id} value={token.id}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={flipTokens}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-titan-border bg-[#0A0D14] text-titan-text transition-all hover:border-titan-accent/30"
            >
              <ArrowDownUp size={16} />
            </button>
          </div>

          <div className="rounded-2xl border border-titan-border bg-titan-surface p-4">
            <label className="titan-label">To</label>
            <div className="mt-3">
              <select
                className="titan-input"
                value={toToken?.id || ''}
                onChange={(event) => setToId(event.target.value)}
              >
                {selectableToTokens.length ? (
                  selectableToTokens.map((token) => (
                    <option key={token.id} value={token.id}>
                      {token.symbol}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No second token available
                  </option>
                )}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-titan-border bg-[#0A0D14] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-titan-subtext">Swap venue</span>
              <span className="font-semibold text-white">{route.provider}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <ArrowRightLeft size={14} className="text-titan-accent" />
              <span className="text-titan-subtext">
                {route.supported
                  ? `TITAN will run a pre-swap security check before redirecting to ${route.provider}.`
                  : route.reason}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => setShowSecurityCheck(true)}
              disabled={!canReview || !route.supported}
            >
              Review Swap
            </Button>
          </div>
        </div>
      </Modal>

      {showSecurityCheck && fromToken && toToken ? (
        <SwapSecurityCheck
          isOpen={showSecurityCheck}
          onClose={() => setShowSecurityCheck(false)}
          fromToken={fromToken}
          toToken={toToken}
          amount={amount}
          route={route}
        />
      ) : null}
    </>
  );
};

export default SwapPanel;

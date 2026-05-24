import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, LoaderCircle, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import type { Token } from '../../types';
import type { SwapRoute } from '../../services/swap';
import { auditEvaluate, checkBlacklist } from '../../services/security';
import { getTitanApiKey } from '../../config/api';
import { useWalletStore } from '../../store/useWalletStore';
import { useNetworkStore } from '../../store/useNetworkStore';

interface SwapSecurityCheckProps {
  isOpen: boolean;
  onClose: () => void;
  fromToken: Token;
  toToken: Token;
  amount: string;
  route: SwapRoute;
}

const SwapSecurityCheck: React.FC<SwapSecurityCheckProps> = ({
  isOpen,
  onClose,
  fromToken,
  toToken,
  amount,
  route,
}) => {
  const walletAddress = useWalletStore((state) => state.address);
  const environment = useNetworkStore((state) => state.environment);
  const [status, setStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [message, setMessage] = useState('Ready to run TITAN pre-swap checks.');

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setMessage('Ready to run TITAN pre-swap checks.');
      return;
    }

    let disposed = false;

    const runChecks = async () => {
      if (!route.supported) {
        setStatus('failed');
        setMessage(route.reason || 'This network does not have a verified swap route yet.');
        return;
      }

      if (!getTitanApiKey()) {
        setStatus('failed');
        setMessage('A YieldBoost API key is required before TITAN can run the blacklist and audit checks.');
        return;
      }

      try {
        setStatus('running');
        setMessage('Running blacklist screening...');
        const summary = [
          `wallet=${walletAddress || 'disconnected'}`,
          `env=${environment}`,
          `swap=${amount || '0'} ${fromToken.symbol} -> ${toToken.symbol}`,
          `from=${fromToken.contractAddress || fromToken.symbol}`,
          `to=${toToken.contractAddress || toToken.symbol}`,
        ].join(' | ');

        const blacklist = await checkBlacklist(summary);
        if (!blacklist.allowed) {
          throw new Error('Blacklist screening blocked this swap request.');
        }

        if (disposed) {
          return;
        }

        setMessage('Running audit evaluation...');
        await auditEvaluate({
          plaintext: summary,
          metadata: {
            wallet_address: walletAddress,
            environment,
            from_token: fromToken.symbol,
            to_token: toToken.symbol,
            amount,
            provider: route.provider,
          },
        });

        if (!disposed) {
          setStatus('passed');
          setMessage('Blacklist and audit checks passed. You can continue to the swap venue.');
        }
      } catch (error) {
        if (!disposed) {
          setStatus('failed');
          setMessage(error instanceof Error ? error.message : 'Swap security checks failed.');
        }
      }
    };

    void runChecks();

    return () => {
      disposed = true;
    };
  }, [amount, environment, fromToken, isOpen, route, toToken, walletAddress]);

  const handleContinue = () => {
    if (!route.url) {
      return;
    }

    window.open(route.url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="TITAN Pre-Swap Check" size="md">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">{route.provider}</Badge>
          <Badge variant={status === 'passed' ? 'success' : status === 'failed' ? 'danger' : 'accent'} size="sm">
            {status === 'running' ? 'Checking' : status === 'passed' ? 'Passed' : status === 'failed' ? 'Blocked' : 'Queued'}
          </Badge>
        </div>

        <div className="rounded-2xl border border-titan-border bg-titan-surface p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-titan-subtext">Route</span>
            <span className="font-semibold text-white">{amount || '0'} {fromToken.symbol} → {toToken.symbol}</span>
          </div>
          <div className="mt-3 flex items-start gap-3">
            {status === 'running' ? (
              <LoaderCircle size={16} className="mt-0.5 animate-spin text-titan-accent" />
            ) : status === 'passed' ? (
              <ShieldCheck size={16} className="mt-0.5 text-titan-success" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 text-titan-warning" />
            )}
            <p className="text-sm text-titan-subtext">{message}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleContinue}
            disabled={status !== 'passed' || !route.url}
          >
            <ExternalLink size={15} /> Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SwapSecurityCheck;

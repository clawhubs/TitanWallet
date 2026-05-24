import React, { useEffect, useMemo, useState } from 'react';
import { isAddress } from 'ethers';
import { ExternalLink, Fuel, LoaderCircle, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SecurityBadge from '../ui/SecurityBadge';
import { getTitanApiKey } from '../../config/api';
import { useTitanSecurity } from '../../hooks/useTitanSecurity';
import { useWallet } from '../../hooks/useWallet';
import { getNativeTransferQuote } from '../../services/blockchain';
import { createChallenge, seal } from '../../services/integrity';
import { proofRun, auditEvaluate, checkBlacklist, governanceEvaluate } from '../../services/security';
import { useNetworkStore } from '../../store/useNetworkStore';
import { formatAddress } from '../../utils/cn';

interface SendTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CheckState = 'idle' | 'running' | 'passed' | 'warning' | 'blocked';

interface SecurityCheckRow {
  label: string;
  description: string;
  state: CheckState;
}

const EMPTY_CHECKS: Record<'blacklist' | 'audit' | 'governance' | 'proof' | 'seal', CheckState> = {
  blacklist: 'idle',
  audit: 'idle',
  governance: 'idle',
  proof: 'idle',
  seal: 'idle',
};

type ReceiptState = 'idle' | 'broadcasted' | 'confirming' | 'confirmed' | 'failed';

const SendTransactionModal: React.FC<SendTransactionModalProps> = ({ isOpen, onClose }) => {
  const { address: walletAddress, sendNativeAsset, signTextMessage, waitForTxReceipt } = useWallet();
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const { getLayer, liveMode } = useTitanSecurity(isOpen);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<{
    gasLimitLabel: string;
    estimatedFeeNative: string;
    gasPriceGwei: string | null;
    maxFeePerGasGwei: string | null;
    maxPriorityFeePerGasGwei: string | null;
  } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Fill in a destination and amount to prepare a live transfer.');
  const [checks, setChecks] = useState(EMPTY_CHECKS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [signedTransaction, setSignedTransaction] = useState<string | null>(null);
  const [receiptState, setReceiptState] = useState<ReceiptState>('idle');
  const [receiptBlockNumber, setReceiptBlockNumber] = useState<number | null>(null);

  const securityRows: SecurityCheckRow[] = [
    {
      label: 'Blacklist',
      description: 'Screens the destination before signing.',
      state: checks.blacklist,
    },
    {
      label: 'Audit',
      description: 'Builds a signed audit trail for this transfer.',
      state: checks.audit,
    },
    {
      label: 'Governance',
      description: 'Applies policy throttles before broadcast.',
      state: checks.governance,
    },
    {
      label: 'Proof',
      description: 'Generates a live proof envelope for the transfer.',
      state: checks.proof,
    },
    {
      label: 'Seal',
      description: 'Seals the transfer record into YieldBoost storage.',
      state: checks.seal,
    },
  ];

  const liveLayers = [
    getLayer('Integrity Auditor'),
    getLayer('Programmable Governance'),
    getLayer('Secure Compute'),
    getLayer('Proof Anchor'),
  ];

  const hasApiKey = Boolean(getTitanApiKey());
  const parsedAmount = Number.parseFloat(amount || '0');
  const isValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const isValidRecipient = isAddress(to.trim());
  const transferSummary = useMemo(
    () =>
      walletAddress
        ? `${walletAddress} sends ${amount || '0'} ${activeNetwork.symbol} to ${to || 'unknown'} on ${activeNetwork.name}`
        : '',
    [activeNetwork.name, activeNetwork.symbol, amount, to, walletAddress],
  );

  useEffect(() => {
    if (!isOpen) {
      setTo('');
      setAmount('');
      setQuote(null);
      setQuoteError(null);
      setSubmitError(null);
      setStatusMessage('Fill in a destination and amount to prepare a live transfer.');
      setChecks(EMPTY_CHECKS);
      setIsSubmitting(false);
      setTxHash(null);
      setSignedTransaction(null);
      setReceiptState('idle');
      setReceiptBlockNumber(null);
      return;
    }

    if (!walletAddress || !isValidRecipient || !isValidAmount) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    let disposed = false;

    const hydrateQuote = async () => {
      try {
        setQuoteLoading(true);
        setQuoteError(null);
        const nextQuote = await getNativeTransferQuote({
          from: walletAddress,
          to: to.trim(),
          valueEth: amount,
          rpcUrl: activeNetwork.rpcUrl,
        });
        if (!disposed) {
          setQuote(nextQuote);
        }
      } catch (error) {
        if (!disposed) {
          setQuote(null);
          setQuoteError(error instanceof Error ? error.message : 'Unable to estimate gas on this network.');
        }
      } finally {
        if (!disposed) {
          setQuoteLoading(false);
        }
      }
    };

    void hydrateQuote();

    return () => {
      disposed = true;
    };
  }, [activeNetwork.rpcUrl, amount, isOpen, isValidAmount, isValidRecipient, to, walletAddress]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!walletAddress) {
      setStatusMessage('Connect or import a wallet before sending funds.');
      return;
    }

    if (!to.trim()) {
      setStatusMessage('Enter a destination address to prepare the transfer.');
      return;
    }

    if (!isValidRecipient) {
      setStatusMessage('Destination address format is invalid.');
      return;
    }

    if (!amount.trim()) {
      setStatusMessage('Enter the amount of native asset to send.');
      return;
    }

    if (!isValidAmount) {
      setStatusMessage('Amount must be greater than zero.');
      return;
    }

    if (quoteLoading) {
      setStatusMessage('Estimating gas and preparing the live transfer...');
      return;
    }

    if (quoteError) {
      setStatusMessage('Gas estimation failed. Adjust the transaction or network settings.');
      return;
    }

    if (receiptState === 'confirmed' && txHash) {
      setStatusMessage(`Transfer confirmed on ${activeNetwork.name}.`);
      return;
    }

    if (receiptState === 'confirming' && txHash) {
      setStatusMessage(`Transaction broadcasted. Waiting for a mined receipt on ${activeNetwork.name}...`);
      return;
    }

    if (receiptState === 'broadcasted' && txHash) {
      setStatusMessage(`Transfer broadcasted successfully on ${activeNetwork.name}.`);
      return;
    }

    setStatusMessage('Transaction is ready to sign and broadcast.');
  }, [
    activeNetwork.name,
    amount,
    isOpen,
    isValidAmount,
    isValidRecipient,
    quoteError,
    quoteLoading,
    receiptState,
    to,
    txHash,
    walletAddress,
  ]);

  const setCheckState = (
    key: keyof typeof EMPTY_CHECKS,
    state: CheckState,
    message?: string,
  ) => {
    setChecks((current) => ({
      ...current,
      [key]: state,
    }));
    if (message) {
      setStatusMessage(message);
    }
  };

  const apiNetwork = activeNetwork.isTestnet ? 'testnet' : 'mainnet';
  const txExplorerUrl = txHash ? `${activeNetwork.explorerUrl}/tx/${txHash}` : null;
  const canSubmit =
    Boolean(walletAddress) &&
    isValidRecipient &&
    isValidAmount &&
    !quoteLoading &&
    !isSubmitting;

  const handleConfirm = async () => {
    if (!walletAddress) {
      setSubmitError('Connect or import a wallet before sending funds.');
      return;
    }

    if (!isValidRecipient) {
      setSubmitError('Enter a valid recipient address.');
      return;
    }

    if (!isValidAmount) {
      setSubmitError('Enter a valid amount greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setTxHash(null);
      setSignedTransaction(null);
      setReceiptState('idle');
      setReceiptBlockNumber(null);
      setChecks(EMPTY_CHECKS);

      if (hasApiKey) {
        setCheckState('blacklist', 'running', 'Running blacklist screening...');
        const blacklist = await checkBlacklist(to.trim());
        if (!blacklist.allowed) {
          setCheckState('blacklist', 'blocked', 'TITAN blocked this destination address.');
          throw new Error('This destination was blocked by the TITAN blacklist.');
        }
        setCheckState('blacklist', 'passed', 'Blacklist screening passed.');

        setCheckState('audit', 'running', 'Building a transfer audit snapshot...');
        await auditEvaluate({
          plaintext: transferSummary,
          metadata: {
            from: walletAddress,
            to: to.trim(),
            amount,
            network: activeNetwork.name,
            chain_id: activeNetwork.chainId,
          },
        });
        setCheckState('audit', 'passed', 'Audit snapshot generated.');

        setCheckState('governance', 'running', 'Evaluating governance throttle...');
        const governance = await governanceEvaluate({
          walletAddress,
          recentRequestCount: parsedAmount >= 1000 ? 3 : 1,
        });
        if (!governance.allowed) {
          setCheckState('governance', 'blocked', 'Governance policy blocked this transfer.');
          throw new Error('Governance policy rejected this transfer.');
        }
        setCheckState('governance', 'passed', 'Governance policy approved the transfer.');
      } else {
        setChecks({
          blacklist: 'warning',
          audit: 'warning',
          governance: 'warning',
          proof: 'warning',
          seal: 'warning',
        });
        setStatusMessage('No YieldBoost API key is configured, so security services will be skipped and the wallet will send onchain only.');
      }

      setStatusMessage('Signing and broadcasting transaction to the active network...');
      const sent = await sendNativeAsset({
        to: to.trim(),
        amount,
      });
      setTxHash(sent.hash);
      setSignedTransaction(sent.signedTransaction);
      setReceiptState('broadcasted');
      setStatusMessage(`Transaction broadcasted. Waiting for confirmation on ${activeNetwork.name}...`);
      setReceiptState('confirming');

      const receipt = await waitForTxReceipt(sent.hash, 120000);
      if (receipt.status !== 1) {
        setReceiptState('failed');
        throw new Error('Transaction reached the chain but failed on execution.');
      }
      setReceiptBlockNumber(Number(receipt.blockNumber));
      setReceiptState('confirmed');

      if (hasApiKey) {
        setCheckState('proof', 'running', 'Generating transfer proof envelope...');
        try {
          await proofRun({
            commitment: {
              wallet_address: walletAddress,
              type: 'send-transaction',
              to: to.trim(),
              amount,
              tx_hash: sent.hash,
              chain_id: activeNetwork.chainId,
              network: activeNetwork.name,
            },
          });
          setCheckState('proof', 'passed', 'Transfer proof generated.');
        } catch (error) {
          setCheckState(
            'proof',
            'warning',
            error instanceof Error ? error.message : 'Proof generation failed after broadcast.',
          );
        }

        setCheckState('seal', 'running', 'Sealing transfer record to YieldBoost...');
        try {
          const challenge = await createChallenge({
            operation: 'seal',
            walletAddress,
            network: apiNetwork,
          });
          const signature = await signTextMessage(challenge.message);
          await seal({
            walletAddress,
            network: apiNetwork,
            challengeId: challenge.challenge_id,
            message: challenge.message,
            signature,
            transactionHash: sent.hash,
            plaintext: JSON.stringify({
              from: walletAddress,
              to: to.trim(),
              amount,
              network: activeNetwork.name,
              chain_id: activeNetwork.chainId,
              tx_hash: sent.hash,
              signed_transaction: sent.signedTransaction,
              created_at: new Date().toISOString(),
            }),
            metadata: {
              event_type: 'Native Transfer',
              description: `Sent ${amount} ${activeNetwork.symbol} to ${to.trim()}.`,
              layer_name: 'Proof Anchor',
              from: walletAddress,
              to: to.trim(),
              amount,
              amount_usd: 0,
              asset_symbol: activeNetwork.symbol,
              network: activeNetwork.name,
              activity_type: 'send',
              tx_hash: sent.hash,
              chain_id: activeNetwork.chainId,
            },
          });
          setCheckState('seal', 'passed', 'Transfer record sealed.');
        } catch (error) {
          setCheckState(
            'seal',
            'warning',
            error instanceof Error ? error.message : 'Transfer broadcast succeeded, but sealing failed.',
          );
        }
      }

      setStatusMessage(`Transfer confirmed on ${activeNetwork.name}.`);
    } catch (error) {
      setReceiptState((current) => (current === 'confirming' || current === 'broadcasted' ? 'failed' : current));
      setSubmitError(error instanceof Error ? error.message : 'Unable to send this transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Native Asset" size="md">
      <div className="space-y-5 p-6">
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>
            {activeNetwork.name}
          </Badge>
          <Badge variant={hasApiKey ? 'accent' : 'warning'} size="sm">
            {hasApiKey ? 'YieldBoost checks enabled' : 'Onchain send only'}
          </Badge>
          <Badge variant={liveMode ? 'success' : 'neutral'} size="sm">
            {liveMode ? 'Live layer status' : 'Layer fallback'}
          </Badge>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">Recipient</label>
            <input
              className="titan-input font-mono"
              placeholder="0x..."
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">Amount</label>
            <div className="flex gap-3">
              <input
                className="titan-input"
                placeholder={`0.0 ${activeNetwork.symbol}`}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              <div className="min-w-24 rounded-xl border border-titan-border bg-titan-surface px-3 py-3 text-center text-sm font-semibold text-white">
                {activeNetwork.symbol}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-titan-border bg-titan-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-titan-subtext">From</span>
            <span className="text-xs font-mono text-white">
              {walletAddress ? formatAddress(walletAddress, 10) : 'No wallet connected'}
            </span>
          </div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-titan-subtext">To</span>
            <span className="text-xs font-mono text-white">
              {to ? formatAddress(to, 10) : 'Waiting for recipient'}
            </span>
          </div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-titan-subtext">Amount</span>
            <span className="text-sm font-semibold text-white">
              {isValidAmount ? `${amount} ${activeNetwork.symbol}` : `0 ${activeNetwork.symbol}`}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-titan-border pt-3">
            <div className="flex items-center gap-1.5">
              {quoteLoading ? (
                <LoaderCircle size={12} className="animate-spin text-titan-subtext" />
              ) : (
                <Fuel size={12} className="text-titan-subtext" />
              )}
              <span className="text-xs text-titan-subtext">Estimated fee</span>
            </div>
            <span className="text-xs font-mono text-white">
              {quote ? `${Number.parseFloat(quote.estimatedFeeNative).toFixed(6)} ${activeNetwork.symbol}` : 'Waiting for quote'}
            </span>
          </div>
          {quote ? (
            <div className="mt-3 grid gap-2 text-xs text-titan-subtext">
              <div className="flex items-center justify-between">
                <span>Gas limit</span>
                <span className="font-mono text-white">{quote.gasLimitLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fee market</span>
                <span className="font-mono text-white">
                  {quote.maxFeePerGasGwei
                    ? `${Number.parseFloat(quote.maxFeePerGasGwei).toFixed(2)} gwei max`
                    : quote.gasPriceGwei
                      ? `${Number.parseFloat(quote.gasPriceGwei).toFixed(2)} gwei`
                      : 'RPC did not return fee data'}
                </span>
              </div>
            </div>
          ) : null}
          {quoteError ? <p className="mt-3 text-xs text-titan-warning">{quoteError}</p> : null}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-titan-subtext">
            TITAN security path
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {liveLayers.map((layer) => (
              <SecurityBadge key={layer.id} layer={layer} compact />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-titan-border bg-[#0A0D14] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Live review</p>
            <span className="text-xs text-titan-subtext">{statusMessage}</span>
          </div>
          <div className="space-y-2">
            {securityRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3 rounded-lg border border-titan-border/70 bg-titan-surface px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-white">{row.label}</p>
                  <p className="text-xs text-titan-subtext">{row.description}</p>
                </div>
                <Badge
                  variant={
                    row.state === 'passed'
                      ? 'success'
                      : row.state === 'blocked'
                        ? 'danger'
                        : row.state === 'warning'
                          ? 'warning'
                          : row.state === 'running'
                            ? 'accent'
                            : 'neutral'
                  }
                  size="sm"
                >
                  {row.state}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {submitError ? (
          <div className="rounded-xl border border-titan-danger/30 bg-titan-danger/10 px-4 py-3 text-sm text-titan-danger">
            {submitError}
          </div>
        ) : null}

        {txHash ? (
          <div className="rounded-xl border border-titan-success/20 bg-titan-success/10 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {receiptState === 'confirmed' ? 'Transaction confirmed' : receiptState === 'failed' ? 'Broadcast failed' : 'Broadcast successful'}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-titan-subtext">{txHash}</p>
                {receiptBlockNumber ? (
                  <p className="mt-2 text-xs text-titan-subtext">Included in block {receiptBlockNumber}</p>
                ) : null}
                {signedTransaction ? (
                  <p className="mt-2 text-xs text-titan-subtext">
                    Signed raw transaction length: {signedTransaction.length} chars
                  </p>
                ) : null}
              </div>
              {txExplorerUrl ? (
                <a
                  href={txExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-titan-accent hover:text-white"
                >
                  Explorer <ExternalLink size={12} />
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {txHash ? 'Done' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => void handleConfirm()}
            disabled={!canSubmit}
            loading={isSubmitting}
          >
            <ShieldCheck size={15} /> Send on {activeNetwork.symbol}
          </Button>
        </div>

        <p className="text-center text-xs text-titan-subtext">
          {walletAddress
            ? `Transactions are signed locally with ${formatAddress(walletAddress, 10)} and then broadcast to ${activeNetwork.name}.`
            : 'Connect a wallet before sending funds.'}
        </p>
      </div>
    </Modal>
  );
};

export default SendTransactionModal;

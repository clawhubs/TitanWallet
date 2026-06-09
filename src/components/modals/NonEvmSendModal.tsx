import React, { useState } from 'react';
import { ExternalLink, Loader2, Send, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useWalletStore } from '../../store/useWalletStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { sendSolana, sendTon } from '../../services/multichain';
import { addLocalWalletEvent } from '../../services/localActivity';

interface NonEvmSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromAddress: string | null;
}

function isLikelySolana(addr: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim());
}
function isLikelyTon(addr: string) {
  const a = addr.trim();
  return /^[UEk0Q][A-Za-z0-9_-]{47,49}$/.test(a) || /^0:[0-9a-fA-F]{64}$/.test(a);
}

const NonEvmSendModal: React.FC<NonEvmSendModalProps> = ({ isOpen, onClose, fromAddress }) => {
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const activeNetwork = useNetworkStore((state) => state.activeNetwork);
  const kind = activeNetwork.kind || 'evm';
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const parsedAmount = Number.parseFloat(amount || '0');
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const validRecipient = kind === 'solana' ? isLikelySolana(to) : kind === 'ton' ? isLikelyTon(to) : false;
  const canSend = Boolean(mnemonic) && validRecipient && validAmount && !busy && !result;

  const explorerUrl = result && kind === 'solana'
    ? `${activeNetwork.explorerUrl.replace(/\/$/, '')}/tx/${result}`
    : null;

  const submit = async () => {
    if (!mnemonic) { setError('This account has no recovery phrase, so it can’t sign on this network.'); return; }
    setBusy(true);
    setError(null);
    try {
      if (kind === 'solana') {
        const sig = await sendSolana({ to: to.trim(), amountSol: amount, mnemonic, rpcUrl: activeNetwork.rpcUrl });
        setResult(sig);
      } else if (kind === 'ton') {
        const ref = await sendTon({ to: to.trim(), amountTon: amount, mnemonic, rpcBase: activeNetwork.rpcUrl });
        setResult(ref);
      }
      if (fromAddress) {
        addLocalWalletEvent({
          walletAddress: fromAddress,
          network: activeNetwork.name,
          activity: {
            id: `local-send-${activeNetwork.id}-${Date.now()}`,
            type: 'send', status: 'confirmed', amount, symbol: activeNetwork.symbol, amountUSD: 0,
            from: fromAddress, to: to.trim(), hash: '', timestamp: new Date(), network: activeNetwork.name, fee: '0',
          },
          proofs: [],
          securityEvents: [{ type: `${activeNetwork.symbol} Transfer Submitted`, desc: `Sent ${amount} ${activeNetwork.symbol} to ${to.trim().slice(0, 8)}…`, time: new Date(), level: 'success' }],
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transfer failed. Check balance, address, and network.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Send ${activeNetwork.symbol}`} size="md">
      <div className="space-y-5 p-6">
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>{activeNetwork.name}</Badge>
          <Badge variant="neutral" size="sm">Native transfer</Badge>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-titan-text">Recipient</label>
          <input
            className="titan-input font-mono"
            placeholder={kind === 'solana' ? 'Solana address…' : 'TON address (UQ… / EQ…)'}
            value={to}
            onChange={(e) => { setTo(e.target.value); setError(null); }}
          />
          {to && !validRecipient ? <p className="mt-1 text-xs text-titan-warning">That doesn’t look like a valid {activeNetwork.name} address.</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-titan-text">Amount</label>
          <div className="flex gap-3">
            <input className="titan-input" placeholder={`0.0 ${activeNetwork.symbol}`} value={amount} onChange={(e) => { setAmount(e.target.value); setError(null); }} />
            <div className="min-w-24 rounded-xl border border-titan-border bg-titan-surface px-3 py-3 text-center text-sm font-semibold text-titan-text">{activeNetwork.symbol}</div>
          </div>
        </div>

        <div className="rounded-xl border border-titan-border bg-titan-surface p-4 space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-titan-subtext">From</span><span className="font-mono text-titan-text">{fromAddress ? `${fromAddress.slice(0, 8)}…${fromAddress.slice(-6)}` : '—'}</span></div>
          <div className="flex justify-between"><span className="text-titan-subtext">Network</span><span className="text-titan-text">{activeNetwork.name}</span></div>
        </div>

        {error ? <div className="rounded-xl border border-titan-danger/30 bg-titan-danger/10 px-4 py-3 text-sm text-titan-danger">{error}</div> : null}

        {result ? (
          <div className="rounded-xl border border-titan-success/20 bg-titan-success/10 px-4 py-4">
            <p className="text-sm font-semibold text-titan-text">Transfer submitted</p>
            <p className="mt-1 break-all font-mono text-xs text-titan-subtext">{result}</p>
            {explorerUrl ? (
              <a href={explorerUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-titan-accent hover:text-titan-text">
                View on explorer <ExternalLink size={12} />
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>{result ? 'Done' : 'Cancel'}</Button>
          {!result ? (
            <Button variant="primary" className="flex-1" onClick={() => void submit()} disabled={!canSend} loading={busy}>
              {busy ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={15} /> Send {activeNetwork.symbol}</>}
            </Button>
          ) : null}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-titan-subtext">
          <ShieldCheck size={12} className="text-titan-accent" /> Signed locally with your recovery phrase. Double-check the address and network.
        </p>
      </div>
    </Modal>
  );
};

export default NonEvmSendModal;

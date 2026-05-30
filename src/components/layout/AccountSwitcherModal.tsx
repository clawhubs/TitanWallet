import React, { useMemo, useState } from 'react';
import { Check, Copy, MoreVertical, Plus, Search, Trash2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import { useWalletStore } from '../../store/useWalletStore';
import { formatAddress, formatUSD } from '../../utils/cn';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const accounts = useWalletStore((state) => state.accounts);
  const activeAccountId = useWalletStore((state) => state.activeAccountId);
  const switchAccount = useWalletStore((state) => state.switchAccount);
  const removeAccount = useWalletStore((state) => state.removeAccount);
  const [search, setSearch] = useState('');
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);
  const [menuAccountId, setMenuAccountId] = useState<string | null>(null);

  const filteredAccounts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return accounts;
    }

    return accounts.filter((account) =>
      account.walletName.toLowerCase().includes(keyword)
      || account.address.toLowerCase().includes(keyword),
    );
  }, [accounts, search]);

  const handleCopyAddress = async (accountId: string, address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAccountId(accountId);
    window.setTimeout(() => setCopiedAccountId(null), 2000);
  };

  const handleSwitchAccount = (accountId: string) => {
    switchAccount(accountId);
    setMenuAccountId(null);
    onClose();
  };

  const handleRemoveAccount = (accountId: string) => {
    removeAccount(accountId);
    setMenuAccountId(null);
  };

  const openCreateAccount = () => {
    onClose();
    navigate('/create-wallet?intent=add-account&returnTo=/dashboard');
  };

  const openImportWallet = () => {
    onClose();
    navigate('/create-wallet?mode=import&intent=add-wallet&returnTo=/dashboard');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Accounts" size="md">
      <div className="space-y-4 p-5" data-testid="account-switcher-modal">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-titan-subtext" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your accounts"
            className="titan-input h-12 pl-11"
            data-testid="account-search-input"
          />
        </div>

        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {filteredAccounts.map((account) => {
            const isActive = account.id === activeAccountId;
            const monogram = account.walletName.trim().slice(0, 2).toUpperCase() || 'TW';

            return (
              <div
                key={account.id}
                className={`rounded-2xl border px-4 py-3 transition-colors ${
                  isActive ? 'border-titan-accent/40 bg-titan-accent/5' : 'border-titan-border bg-[#11141B]'
                }`}
                data-testid={`account-row-${account.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleSwitchAccount(account.id)}
                      className="flex w-full min-w-0 items-center gap-3 text-left"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-titan-accent/20 to-cyan-400/10 text-sm font-semibold text-white">
                        {monogram}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-semibold text-white">{account.walletName}</p>
                          {isActive ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-titan-success/15 text-titan-success">
                              <Check size={12} />
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                    <div className="mt-1 flex items-center gap-2 pl-14 text-xs text-titan-subtext">
                      <span className="rounded-full bg-white/5 px-2 py-1 font-mono">{formatAddress(account.address, 8)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          void handleCopyAddress(account.id, account.address);
                        }}
                        className="inline-flex items-center gap-1 text-titan-subtext transition-colors hover:text-white"
                      >
                        <Copy size={12} />
                        {copiedAccountId === account.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-2">
                    <div className="pt-1 text-right">
                      <p className="text-lg font-semibold text-white">
                        {account.balanceUSD > 0 ? formatUSD(account.balanceUSD) : '$0.00'}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-titan-subtext">
                        {account.source === 'managed'
                          ? 'Managed'
                          : account.source === 'google'
                            ? 'Google linked'
                            : 'Local'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMenuAccountId((current) => (current === account.id ? null : account.id))}
                      className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl text-titan-subtext transition-colors hover:bg-white/5 hover:text-white"
                      aria-label={`Account actions for ${account.walletName}`}
                    >
                      <MoreVertical size={15} />
                    </button>

                    {menuAccountId === account.id ? (
                      <div className="absolute right-0 top-10 z-10 min-w-[150px] rounded-2xl border border-titan-border bg-[#11141B] p-1.5 shadow-titan">
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(account.id)}
                          disabled={accounts.length === 1 || account.source === 'managed' || account.source === 'google'}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-titan-danger transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                          {account.source === 'managed'
                            ? 'Managed account'
                            : account.source === 'google'
                              ? 'Bound to Google'
                              : 'Remove account'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          {!filteredAccounts.length ? (
            <div className="rounded-2xl border border-dashed border-titan-border px-4 py-10 text-center text-sm text-titan-subtext">
              No accounts match that search yet.
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={openCreateAccount}
          className="flex w-full items-center gap-3 rounded-2xl border border-titan-border bg-[#11141B] px-4 py-4 text-left transition-colors hover:border-titan-accent/30 hover:bg-white/[0.02]"
          data-testid="add-account-button"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-titan-accent/10 text-titan-accent">
            <Plus size={18} />
          </div>
          <div>
            <p className="text-base font-semibold text-white">Add account</p>
            <p className="text-sm text-titan-subtext">Create another self-custodial account in this wallet.</p>
          </div>
        </button>

        <button
          type="button"
          onClick={openImportWallet}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-titan-border bg-[#1A1C21] px-4 py-4 text-base font-semibold text-white transition-colors hover:border-titan-accent/30 hover:bg-white/[0.02]"
          data-testid="add-wallet-button"
        >
          <Wallet size={17} />
          Add wallet
        </button>
      </div>
    </Modal>
  );
};

export default AccountSwitcherModal;

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, MoreVertical, Pencil, Plus, Search, Trash2, Wallet } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useWallet } from '../../hooks/useWallet';
import { useWalletStore } from '../../store/useWalletStore';
import { formatAddress, formatUSD } from '../../utils/cn';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AccountModalView = 'list' | 'import' | 'rename';

function getNextAccountName(existingNames: string[]) {
  const numberedAccounts = existingNames
    .map((name) => {
      const match = /^account\s+(\d+)$/i.exec(name.trim());
      return match ? Number.parseInt(match[1], 10) : null;
    })
    .filter((value): value is number => Number.isFinite(value));

  const nextNumber = numberedAccounts.length
    ? Math.max(...numberedAccounts) + 1
    : existingNames.length + 1;

  return `Account ${nextNumber}`;
}

const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({ isOpen, onClose }) => {
  const {
    accounts,
    createWallet,
    importWallet,
    renameGoogleLinkedWallet,
  } = useWallet();
  const activeAccountId = useWalletStore((state) => state.activeAccountId);
  const switchAccount = useWalletStore((state) => state.switchAccount);
  const renameAccount = useWalletStore((state) => state.renameAccount);
  const removeAccount = useWalletStore((state) => state.removeAccount);
  const [search, setSearch] = useState('');
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);
  const [menuAccountId, setMenuAccountId] = useState<string | null>(null);
  const [view, setView] = useState<AccountModalView>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [importSecret, setImportSecret] = useState('');
  const [importWalletName, setImportWalletName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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

  const renameTarget = useMemo(
    () => accounts.find((account) => account.id === renameTargetId) || null,
    [accounts, renameTargetId],
  );

  const modalTitle = view === 'rename'
    ? 'Rename account'
    : view === 'import'
      ? 'Add wallet'
      : 'Accounts';

  const resetTransientState = () => {
    setView('list');
    setMenuAccountId(null);
    setRenameTargetId(null);
    setRenameValue('');
    setImportSecret('');
    setImportWalletName('');
    setFormError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetTransientState();
    onClose();
  };

  const handleCopyAddress = async (accountId: string, address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAccountId(accountId);
    window.setTimeout(() => setCopiedAccountId(null), 2000);
  };

  const handleSwitchAccount = (accountId: string) => {
    switchAccount(accountId);
    setMenuAccountId(null);
    handleClose();
  };

  const handleRemoveAccount = (accountId: string) => {
    removeAccount(accountId);
    setMenuAccountId(null);
  };

  const handleQuickAddAccount = async () => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      createWallet(getNextAccountName(accounts.map((account) => account.walletName)));
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create another account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportWallet = async () => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      importWallet(importSecret, importWalletName || undefined);
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to import this wallet right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameAccount = async () => {
    if (!renameTarget) {
      return;
    }

    const nextName = renameValue.trim();
    if (!nextName) {
      setFormError('Account name cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      if (renameTarget.source === 'google') {
        await renameGoogleLinkedWallet(nextName);
      }
      renameAccount(renameTarget.id, nextName);
      handleClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to rename this account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRenameView = (accountId: string) => {
    const target = accounts.find((account) => account.id === accountId);
    if (!target) {
      return;
    }

    setRenameTargetId(accountId);
    setRenameValue(target.walletName);
    setMenuAccountId(null);
    setFormError(null);
    setView('rename');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="md">
      <div className="space-y-4 p-5" data-testid="account-switcher-modal">
        {view === 'list' ? (
          <>
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
                          <div className="absolute right-0 top-10 z-10 min-w-[170px] rounded-2xl border border-titan-border bg-[#11141B] p-1.5 shadow-titan">
                            <button
                              type="button"
                              onClick={() => openRenameView(account.id)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white transition-colors hover:bg-white/5"
                            >
                              <Pencil size={14} />
                              Rename account
                            </button>
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

            {formError ? (
              <div className="rounded-2xl border border-titan-danger/30 bg-titan-danger/5 px-4 py-3 text-xs text-titan-danger">
                {formError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleQuickAddAccount()}
              disabled={isSubmitting}
              className="flex w-full items-center gap-3 rounded-2xl border border-titan-border bg-[#11141B] px-4 py-4 text-left transition-colors hover:border-titan-accent/30 hover:bg-white/[0.02] disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="add-account-button"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-titan-accent/10 text-titan-accent">
                {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Plus size={18} />}
              </div>
              <div>
                <p className="text-base font-semibold text-white">Add account</p>
                <p className="text-sm text-titan-subtext">Create another account instantly in this wallet.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setView('import');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-titan-border bg-[#1A1C21] px-4 py-4 text-base font-semibold text-white transition-colors hover:border-titan-accent/30 hover:bg-white/[0.02]"
              data-testid="add-wallet-button"
            >
              <Wallet size={17} />
              Add wallet
            </button>
          </>
        ) : null}

        {view === 'import' ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setView('list');
              }}
              className="inline-flex items-center gap-2 text-sm text-titan-subtext transition-colors hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to accounts
            </button>

            <div className="rounded-2xl border border-titan-border bg-[#11141B] p-4">
              <p className="text-sm font-semibold text-white">Import a wallet directly</p>
              <p className="mt-1 text-xs text-titan-subtext">
                Paste a recovery phrase or private key and TITAN will add it straight into this wallet list.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-titan-subtext">Wallet name</label>
              <input
                value={importWalletName}
                onChange={(event) => setImportWalletName(event.target.value)}
                placeholder="Optional custom name"
                className="titan-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-titan-subtext">Recovery phrase or private key</label>
              <textarea
                value={importSecret}
                onChange={(event) => setImportSecret(event.target.value)}
                rows={4}
                placeholder="Paste your 12-word phrase or 0x private key"
                className="titan-input min-h-[120px] resize-none py-3"
              />
            </div>

            {formError ? (
              <div className="rounded-2xl border border-titan-danger/30 bg-titan-danger/5 px-4 py-3 text-xs text-titan-danger">
                {formError}
              </div>
            ) : null}

            <Button
              variant="primary"
              className="w-full"
              size="lg"
              loading={isSubmitting}
              disabled={!importSecret.trim()}
              onClick={() => void handleImportWallet()}
            >
              Import Wallet
            </Button>
          </div>
        ) : null}

        {view === 'rename' ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setView('list');
              }}
              className="inline-flex items-center gap-2 text-sm text-titan-subtext transition-colors hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to accounts
            </button>

            <div className="rounded-2xl border border-titan-border bg-[#11141B] p-4">
              <p className="text-sm font-semibold text-white">Rename wallet</p>
              <p className="mt-1 text-xs text-titan-subtext">
                {renameTarget?.source === 'google'
                  ? 'This new name will stay tied to your linked Google wallet too.'
                  : 'Update how this wallet appears in your account list and dashboard.'}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-titan-subtext">Wallet name</label>
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                placeholder="Account name"
                className="titan-input"
              />
            </div>

            {formError ? (
              <div className="rounded-2xl border border-titan-danger/30 bg-titan-danger/5 px-4 py-3 text-xs text-titan-danger">
                {formError}
              </div>
            ) : null}

            <Button
              variant="primary"
              className="w-full"
              size="lg"
              loading={isSubmitting}
              disabled={!renameValue.trim()}
              onClick={() => void handleRenameAccount()}
            >
              Save Name
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

export default AccountSwitcherModal;

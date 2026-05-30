interface WalletStatsResponse {
  totalWalletsCreated: number;
}

export async function getWalletStats() {
  const response = await fetch('/api/consumer-auth/wallet-stats', {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to load TITAN wallet stats.');
  }

  return response.json() as Promise<WalletStatsResponse>;
}

export async function registerWalletOpened(input: {
  address: string;
  source: 'create' | 'import' | 'google' | 'add-account' | 'add-wallet';
  walletName?: string | null;
}) {
  await fetch('/api/consumer-auth/wallet-opened', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  }).catch(() => {
    // Public stats should never block wallet creation.
  });
}

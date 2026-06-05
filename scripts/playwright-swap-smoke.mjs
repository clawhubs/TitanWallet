import { chromium } from 'playwright';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';
const STORAGE_KEYS = {
  wallet: 'titan-wallet-session-store',
  network: 'titan-wallet-network-store',
  token: 'titan-wallet-token-store',
};

const networks = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    symbol: 'ETH',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
    isActive: false,
    isDefault: true,
    provider: 'Uniswap',
  },
  {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    symbol: 'ETH',
    rpcUrl: 'https://base-rpc.publicnode.com',
    explorerUrl: 'https://basescan.org',
    isTestnet: false,
    isActive: false,
    isDefault: true,
    provider: 'Uniswap',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    chainId: 42161,
    symbol: 'ETH',
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    explorerUrl: 'https://arbiscan.io',
    isTestnet: false,
    isActive: false,
    isDefault: true,
    provider: 'Uniswap',
  },
  {
    id: 'optimism',
    name: 'Optimism',
    chainId: 10,
    symbol: 'ETH',
    rpcUrl: 'https://optimism-rpc.publicnode.com',
    explorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
    isActive: false,
    isDefault: true,
    provider: 'Uniswap',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    symbol: 'POL',
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    explorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    isActive: false,
    isDefault: true,
    provider: 'Uniswap',
  },
  {
    id: 'bnb',
    name: 'BNB Chain',
    chainId: 56,
    symbol: 'BNB',
    rpcUrl: 'https://bsc-rpc.publicnode.com',
    explorerUrl: 'https://bscscan.com',
    isTestnet: false,
    isActive: false,
    isDefault: true,
    provider: 'Uniswap',
  },
];

const walletAddress = '0x1111111111111111111111111111111111111111';
const timestamp = new Date().toISOString();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildWalletState() {
  return {
    state: {
      accounts: [
        {
          id: walletAddress.toLowerCase(),
          address: walletAddress,
          mnemonic: null,
          privateKey: null,
          walletName: 'Playwright Swap Wallet',
          source: 'local',
          authProvider: null,
          balanceETH: '0',
          balanceUSD: 0,
          createdAt: timestamp,
          lastUsedAt: timestamp,
        },
      ],
      activeAccountId: walletAddress.toLowerCase(),
      address: walletAddress,
      isConnected: true,
      mnemonic: null,
      privateKey: null,
      walletName: 'Playwright Swap Wallet',
      walletSource: 'local',
      authProvider: null,
      balanceETH: '0',
      balanceUSD: 0,
    },
    version: 2,
  };
}

function buildNetworkState(activeNetwork) {
  return {
    state: {
      activeNetwork,
      networks: networks.map(({ provider, ...network }) => ({
        ...network,
        isActive: network.id === activeNetwork.id,
      })),
      environment: 'mainnet',
    },
    version: 2,
  };
}

function buildTokenState() {
  return {
    state: {
      tokenScopes: {},
    },
    version: 3,
  };
}

async function installMocks(context) {
  await context.route('**/api/dev/store/military-grade', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        request_id: `playwright-swap-${Date.now()}`,
        selected_layers: [],
      }),
    });
  });

  await context.route('**/api/v1/integrity/challenge', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        challenge_id: 'playwright-swap-challenge',
        message: 'Playwright swap challenge',
      }),
    });
  });

  await context.route('**/api/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, status: 'ok', request_id: 'playwright-swap-api' }),
    });
  });

  await context.route('**/api/consumer-auth/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        path.endsWith('/config')
          ? {
              provider: 'none',
              label: 'TITAN Managed',
              loginMethods: {
                google: false,
                apple: false,
              },
              managedWallet: {
                ready: false,
                label: 'Google-linked local wallet',
                message: 'Managed wallet provisioning is disabled in Playwright.',
              },
              errors: [],
            }
          : { authenticated: false, provider: null, user: null, linkedWallet: null },
      ),
    });
  });

  await context.route('https://**/*', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x0' }),
      });
      return;
    }

    await route.continue();
  });
}

async function seedState(context, activeNetwork) {
  await context.addInitScript(
    ({ keys, wallet, network, token }) => {
      try {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(keys.wallet, JSON.stringify(wallet));
      window.sessionStorage.setItem(keys.wallet, JSON.stringify(wallet));
      window.localStorage.setItem(keys.network, JSON.stringify(network));
      window.localStorage.setItem(keys.token, JSON.stringify(token));
      window.sessionStorage.setItem(keys.token, JSON.stringify(token));
      } catch {
        // Some browser-created documents have opaque origins before app navigation.
      }
    },
    {
      keys: STORAGE_KEYS,
      wallet: buildWalletState(),
      network: buildNetworkState(activeNetwork),
      token: buildTokenState(),
    },
  );
}

async function assertSwapFlow(page, network) {
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('account-switcher-trigger').waitFor({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Swap', exact: true }).first().click();
  await page.getByRole('heading', { name: 'Swap Assets' }).waitFor();
  await page.locator('span.text-titan-subtext', { hasText: network.name }).first().waitFor();

  const fromOptions = await page.locator('select').first().locator('option').allTextContents();
  const toOptions = await page.locator('select').nth(1).locator('option').allTextContents();
  assert(fromOptions.length >= 2, `${network.name} should expose at least two source swap tokens.`);
  assert(toOptions.length >= 1, `${network.name} should expose at least one destination swap token.`);

  await page.getByPlaceholder('0.0').fill('0.01');
  await page.getByText('Swap venue').waitFor();
  await page.locator('span.font-semibold.text-titan-text', { hasText: network.provider }).first().waitFor();

  const reviewButton = page.getByRole('button', { name: 'Review Swap' });
  assert(await reviewButton.isEnabled(), `${network.name} Review Swap button should be enabled.`);
  await reviewButton.click();

  await page.getByRole('heading', { name: 'TITAN Pre-Swap Check' }).waitFor();
  await page.getByRole('button', { name: new RegExp(`Continue to ${network.provider}`) }).waitFor();
  await page.getByText('Passed', { exact: true }).waitFor({ timeout: 10_000 });

  console.log(`PASS swap ${network.name}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    for (const network of networks) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await installMocks(context);
      await seedState(context, network);
      const page = await context.newPage();
      await assertSwapFlow(page, network);
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

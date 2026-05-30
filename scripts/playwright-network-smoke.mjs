import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:5173';
const STORAGE_KEYS = {
  wallet: 'titan-wallet-session-store',
  network: 'titan-wallet-network-store',
  token: 'titan-wallet-token-store',
};

const walletState = {
  state: {
    address: '0x1111111111111111111111111111111111111111',
    isConnected: true,
    mnemonic: null,
    privateKey: null,
    walletName: 'Playwright Wallet',
    balanceETH: '0',
    balanceUSD: 0,
  },
  version: 1,
};

const networks = [
  {
    id: '0g-mainnet',
    name: '0G',
    chainId: 16661,
    symbol: '0G',
    rpcUrl: 'https://evmrpc.0g.ai',
    explorerUrl: 'https://chainscan.0g.ai',
    isTestnet: false,
    isActive: false,
    isDefault: true,
  },
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
  },
  {
    id: '0g-galileo',
    name: '0G Galileo Testnet',
    chainId: 16602,
    symbol: '0G',
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    explorerUrl: 'https://chainscan-galileo.0g.ai',
    isTestnet: true,
    isActive: false,
    isDefault: true,
  },
  {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    symbol: 'ETH',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    isActive: false,
    isDefault: true,
  },
  {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    symbol: 'ETH',
    rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.basescan.org',
    isTestnet: true,
    isActive: false,
    isDefault: true,
  },
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    symbol: 'ETH',
    rpcUrl: 'https://arbitrum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.arbiscan.io',
    isTestnet: true,
    isActive: false,
    isDefault: true,
  },
  {
    id: 'optimism-sepolia',
    name: 'Optimism Sepolia',
    chainId: 11155420,
    symbol: 'ETH',
    rpcUrl: 'https://optimism-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    isTestnet: true,
    isActive: false,
    isDefault: true,
  },
];

const rpcMocks = {
  'https://evmrpc.0g.ai': {
    chainId: 16661,
    nativeBalance: toUnitHex('12.3456', 18),
    tokenBalances: {},
  },
  'https://ethereum-rpc.publicnode.com': {
    chainId: 1,
    nativeBalance: toUnitHex('1.25', 18),
    tokenBalances: {
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': toUnitHex('250', 6),
      '0xdac17f958d2ee523a2206206994597c13d831ec7': toUnitHex('90', 6),
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': toUnitHex('0.05', 8),
    },
  },
  'https://base-rpc.publicnode.com': {
    chainId: 8453,
    nativeBalance: toUnitHex('0.8', 18),
    tokenBalances: {
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': toUnitHex('120', 6),
      '0x940181a94a35a4569e4529a3cdfb74e38fd98631': toUnitHex('900', 18),
    },
  },
  'https://arbitrum-one-rpc.publicnode.com': {
    chainId: 42161,
    nativeBalance: toUnitHex('0.33', 18),
    tokenBalances: {
      '0xaf88d065e77c8cc2239327c5edb3a432268e5831': toUnitHex('42', 6),
      '0x912ce59144191c1204e64559fe8253a0e49e6548': toUnitHex('1500', 18),
    },
  },
  'https://optimism-rpc.publicnode.com': {
    chainId: 10,
    nativeBalance: toUnitHex('0.44', 18),
    tokenBalances: {
      '0x0b2c639c533813f4aa9d7837caf62653d097ff85': toUnitHex('75', 6),
      '0x4200000000000000000000000000000000000042': toUnitHex('800', 18),
    },
  },
  'https://polygon-bor-rpc.publicnode.com': {
    chainId: 137,
    nativeBalance: toUnitHex('150', 18),
    tokenBalances: {
      '0xc2132d05d31c914a87c6611c10748aacbc532e8f': toUnitHex('90', 6),
      '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': toUnitHex('0.01', 8),
    },
  },
  'https://bsc-rpc.publicnode.com': {
    chainId: 56,
    nativeBalance: toUnitHex('2.5', 18),
    tokenBalances: {
      '0x55d398326f99059ff775485246999027b3197955': toUnitHex('140', 18),
      '0x7130d2a12b9bcbff4e2634d864a1ee1ce3ead9c': toUnitHex('0.02', 18),
    },
  },
  'https://evmrpc-testnet.0g.ai': {
    chainId: 16602,
    nativeBalance: toUnitHex('3', 18),
    tokenBalances: {},
  },
  'https://ethereum-sepolia-rpc.publicnode.com': {
    chainId: 11155111,
    nativeBalance: toUnitHex('0.9', 18),
    tokenBalances: {},
  },
  'https://base-sepolia-rpc.publicnode.com': {
    chainId: 84532,
    nativeBalance: toUnitHex('0.7', 18),
    tokenBalances: {},
  },
  'https://arbitrum-sepolia-rpc.publicnode.com': {
    chainId: 421614,
    nativeBalance: toUnitHex('0.5', 18),
    tokenBalances: {},
  },
  'https://optimism-sepolia-rpc.publicnode.com': {
    chainId: 11155420,
    nativeBalance: toUnitHex('0.6', 18),
    tokenBalances: {},
  },
};

const expectations = {
  '0G': [{ symbol: '0G', amount: '12.3456 0G' }],
  Ethereum: [
    { symbol: 'ETH', amount: '1.25 ETH' },
    { symbol: 'USDC', amount: '250 USDC' },
    { symbol: 'USDT', amount: '90 USDT' },
  ],
  Base: [
    { symbol: 'ETH', amount: '0.8 ETH' },
    { symbol: 'USDC', amount: '120 USDC' },
    { symbol: 'AERO', amount: '900 AERO' },
  ],
  Arbitrum: [
    { symbol: 'ETH', amount: '0.33 ETH' },
    { symbol: 'ARB', amount: '1500 ARB' },
  ],
  Optimism: [
    { symbol: 'ETH', amount: '0.44 ETH' },
    { symbol: 'OP', amount: '800 OP' },
  ],
  Polygon: [
    { symbol: 'POL', amount: '150 POL' },
    { symbol: 'USDT', amount: '90 USDT' },
  ],
  'BNB Chain': [
    { symbol: 'BNB', amount: '2.5 BNB' },
    { symbol: 'USDT', amount: '140 USDT' },
  ],
  '0G Galileo Testnet': [{ symbol: '0G', amount: '3 0G' }],
  'Ethereum Sepolia': [{ symbol: 'ETH', amount: '0.9 ETH' }],
  'Base Sepolia': [{ symbol: 'ETH', amount: '0.7 ETH' }],
  'Arbitrum Sepolia': [{ symbol: 'ETH', amount: '0.5 ETH' }],
  'Optimism Sepolia': [{ symbol: 'ETH', amount: '0.6 ETH' }],
};

function toUnitHex(value, decimals) {
  const [wholePart, decimalPart = ''] = value.split('.');
  const whole = BigInt(wholePart || '0');
  const paddedDecimals = (decimalPart + '0'.repeat(decimals)).slice(0, decimals);
  const fraction = BigInt(paddedDecimals || '0');
  const result = whole * 10n ** BigInt(decimals) + fraction;
  return `0x${result.toString(16)}`;
}

function padHex(hexValue) {
  return `0x${hexValue.replace(/^0x/, '').padStart(64, '0')}`;
}

function buildRpcResponse(url, payload) {
  const match = Object.keys(rpcMocks).find((candidate) => url.startsWith(candidate));
  const config = match ? rpcMocks[match] : null;
  if (!config) {
    return {
      jsonrpc: '2.0',
      id: payload.id,
      result: '0x0',
    };
  }

  switch (payload.method) {
    case 'eth_chainId':
      return { jsonrpc: '2.0', id: payload.id, result: `0x${config.chainId.toString(16)}` };
    case 'net_version':
      return { jsonrpc: '2.0', id: payload.id, result: String(config.chainId) };
    case 'eth_getBalance':
      return { jsonrpc: '2.0', id: payload.id, result: config.nativeBalance };
    case 'eth_call': {
      const contractAddress = payload.params?.[0]?.to?.toLowerCase?.() || '';
      const balanceHex = config.tokenBalances[contractAddress] || '0x0';
      return { jsonrpc: '2.0', id: payload.id, result: padHex(balanceHex) };
    }
    case 'eth_blockNumber':
      return { jsonrpc: '2.0', id: payload.id, result: '0x1' };
    default:
      return { jsonrpc: '2.0', id: payload.id, result: '0x0' };
  }
}

async function seedState(page, activeNetwork) {
  const networkState = {
    state: {
      activeNetwork,
      networks: networks.map((network) => ({
        ...network,
        isActive: network.id === activeNetwork.id,
      })),
      environment: activeNetwork.isTestnet ? 'testnet' : 'mainnet',
    },
    version: 2,
  };

  const tokenState = {
    state: {
      tokenScopes: {},
    },
    version: 3,
  };

  await page.goto(BASE_URL);
  await page.evaluate(
    ({ keys, wallet, network, token }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem(keys.wallet, JSON.stringify(wallet));
      window.sessionStorage.setItem(keys.wallet, JSON.stringify(wallet));
      window.localStorage.setItem(keys.network, JSON.stringify(network));
      window.localStorage.setItem(keys.token, JSON.stringify(token));
      window.sessionStorage.setItem(keys.token, JSON.stringify(token));
    },
    {
      keys: STORAGE_KEYS,
      wallet: walletState,
      network: networkState,
      token: tokenState,
    },
  );
}

async function assertNetwork(page, network) {
  await seedState(page, network);
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  const checks = expectations[network.name] || [];
  for (const check of checks) {
    const row = page.locator(`[data-token-network="${network.name}"][data-token-symbol="${check.symbol}"]`).first();
    await row.waitFor({ state: 'visible', timeout: 5000 });
    const text = await waitForRowText(row, check.amount);
    if (!text || !text.includes(check.amount)) {
      throw new Error(`Expected ${network.name} ${check.symbol} row to include "${check.amount}", got "${text || ''}"`);
    }
  }

  const visibleCount = page.locator('text=/\\d+ visible/i').first();
  await visibleCount.waitFor({ state: 'visible', timeout: 3000 });

  console.log(`PASS ${network.name}`);
}

async function waitForRowText(locator, expected) {
  const startedAt = Date.now();
  let latestText = '';

  while (Date.now() - startedAt < 8000) {
    latestText = (await locator.textContent()) || '';
    if (latestText.includes(expected)) {
      return latestText;
    }
    await locator.page().waitForTimeout(250);
  }

  return latestText;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    const rpcUrl = Object.keys(rpcMocks).find((candidate) => url.startsWith(candidate));
    if (request.method() === 'POST' && rpcUrl) {
      const payload = request.postDataJSON();
      const response = Array.isArray(payload)
        ? payload.map((entry) => buildRpcResponse(rpcUrl, entry))
        : buildRpcResponse(rpcUrl, payload);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
      return;
    }

    await route.continue();
  });

  try {
    for (const network of networks) {
      await assertNetwork(page, network);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { chromium } from 'playwright';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createHealthPayload() {
  const ok = { status: 'ok', detail: 'mocked by playwright' };

  return {
    success: true,
    status: 'ok',
    request_id: 'playwright-health',
    active_network: 'mainnet',
    infrastructure: {
      storage: ok,
      runtime: ok,
      nitro: { status: 'ok', detail: 'AWS Nitro continuity mocked by playwright' },
    },
    layers: {
      L1: ok,
      L2: ok,
      L3: ok,
      L4: ok,
      L5: ok,
      L6: ok,
      L7: ok,
      L8: ok,
      L9: ok,
    },
  };
}

async function installRoutes(page) {
  await page.route('**/api/dev/store/military-grade', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        request_id: 'playwright-military-grade',
        selected_layers: [
          { id: 'L2', slug: 'integrity-auditor', label: 'Integrity Auditor', proof: 'Mocked live rail.', status: 'approved' },
          { id: 'L3', slug: 'secure-compute', label: 'Secure Compute / TEE', proof: 'Mocked TEE receipt.', status: 'approved' },
          { id: 'L4', slug: 'sovereign-memory', label: 'Sovereign Memory', proof: 'Mocked memory receipt.', status: 'approved' },
          { id: 'L5', slug: '0g-storage', label: '0G Storage Proof Layer', proof: 'Mocked storage receipt.', status: 'approved' },
          { id: 'L6', slug: 'zk-proof', label: 'Zero-Knowledge Proof Layer', proof: 'Mocked proof receipt.', status: 'approved' },
          { id: 'L7', slug: 'proof-anchor', label: 'ProofRegistry Anchor', proof: 'Mocked anchor receipt.', status: 'approved' },
          { id: 'L9', slug: 'nitro', label: 'AWS Nitro Enclaves', proof: 'Mocked Nitro continuity.', status: 'approved' },
        ],
      }),
    });
  });

  await page.route('**/api/v1/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createHealthPayload()),
    });
  });

  await page.route('**/api/v1/status/layers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createHealthPayload()),
    });
  });

  await page.route('**/api/v1/integrity/records**', async (route) => {
    const url = new URL(route.request().url());
    const walletAddress = url.searchParams.get('wallet_address') || '0x0';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        request_id: 'playwright-records',
        network: 'mainnet',
        wallet_address: walletAddress,
        items: [],
        total: 0,
      }),
    });
  });

  await page.route('**/api/v1/auth/challenge', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        request_id: 'playwright-challenge',
        challenge_id: 'challenge-1',
        operation: 'seal',
        network: 'mainnet',
        wallet_address: '0x0000000000000000000000000000000000000000',
        storage_id: null,
        message: 'Sign this mock challenge',
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      }),
    });
  });

  await page.route('**/api/v1/integrity/seal', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        request_id: 'playwright-seal',
        network: 'mainnet',
        storage_id: 'playwright-storage-id',
        storage_root_hash: '0x0',
        storage_tx_hash: null,
        storage_explorer_url: null,
        integrity_hash: '0x0',
        judge_url: 'https://example.com/judge',
        anchor_tx_hash: null,
        anchor_explorer_url: null,
        layer_statuses: {},
      }),
    });
  });
}

async function createWallet(page, { name, password }) {
  console.log(`Creating wallet: ${name}`);
  await page.getByPlaceholder(/My TITAN Wallet|Imported TITAN Wallet/).fill(name);
  await page.getByPlaceholder('At least 8 characters').fill(password);
  await page.getByPlaceholder('Repeat your password').fill(password);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Create Wallet' }).click();
  await page.getByRole('button', { name: 'Reveal seed phrase' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: "I've saved it safely" }).click();
  await page.getByRole('button', { name: 'Open Dashboard' }).click();
  await page.waitForURL('**/dashboard');
  console.log(`Wallet ready: ${name}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await installRoutes(page);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  assert(
    (await page.getByRole('banner').getByRole('link', { name: 'Dashboard', exact: true }).count()) === 0,
    'The header Dashboard link should stay hidden before a wallet session exists.',
  );
  assert(
    await page.getByRole('banner').getByRole('link', { name: 'Create Wallet' }).isVisible(),
    'The header should show Create Wallet before a wallet session exists.',
  );

  console.log('Opening first create-wallet flow');
  await page.goto(`${BASE_URL}/create-wallet`, { waitUntil: 'domcontentloaded' });

  await createWallet(page, {
    name: 'YieldBoostAi',
    password: 'supersecure123',
  });

  const accountTrigger = page.getByTestId('account-switcher-trigger');
  await accountTrigger.waitFor();
  const firstAccountSummary = ((await accountTrigger.textContent()) || '').replace(/\s+/g, ' ').trim();
  assert(firstAccountSummary.includes('YieldBoostAi'), 'The first account did not become active.');
  await page.getByText('Wallet Creation Proof').first().waitFor();
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('banner').getByRole('link', { name: 'Dashboard', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: /Open Dashboard/ }).first().click();
  await page.waitForURL('**/dashboard');
  await page.goto(`${BASE_URL}/create-wallet`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/dashboard');
  console.log('First account active');

  await accountTrigger.click();
  await page.getByTestId('account-switcher-modal').waitFor();
  await page.getByTestId('add-account-button').click();
  await page.waitForURL('**/create-wallet?intent=add-account**');
  console.log('Opening add-account flow');

  await createWallet(page, {
    name: 'Trade Lock',
    password: 'supersecure123',
  });

  await accountTrigger.waitFor();
  const secondAccountSummary = ((await accountTrigger.textContent()) || '').replace(/\s+/g, ' ').trim();
  assert(secondAccountSummary.includes('Trade Lock'), 'The second account did not become active after creation.');
  await page.getByText('Wallet Creation Proof').first().waitFor();
  console.log('Second account active');

  await accountTrigger.click();
  const modal = page.getByTestId('account-switcher-modal');
  await modal.waitFor();

  await modal.getByText('YieldBoostAi').waitFor();
  await modal.getByText('Trade Lock').waitFor();

  const accountRows = modal.locator('[data-testid^="account-row-"]');
  assert((await accountRows.count()) >= 2, 'Expected at least two wallet accounts in the switcher.');

  await page.getByTestId('account-search-input').fill('Yield');
  assert(await modal.getByText('YieldBoostAi').isVisible(), 'Search should still show the first account.');
  assert(!(await modal.getByText('Trade Lock').isVisible()), 'Search should filter out the second account.');
  console.log('Search works');

  await page.getByTestId('account-search-input').fill('');
  await modal.getByText('YieldBoostAi').click();
  await modal.waitFor({ state: 'hidden' });

  const switchedSummary = ((await accountTrigger.textContent()) || '').replace(/\s+/g, ' ').trim();
  assert(switchedSummary.includes('YieldBoostAi'), 'Switching back to the first account failed.');
  assert(switchedSummary !== secondAccountSummary, 'The account switcher did not change the active account summary.');

  console.log('Playwright account switcher smoke test passed.');
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { chromium } from 'playwright';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';
const EXPECT_PRIVY_READY = process.env.PLAYWRIGHT_EXPECT_PRIVY_READY === '1';
const IMPORT_MNEMONIC = 'test test test test test test test test test test test junk';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function installApiMocks(context) {
  await context.route('**/api/dev/store/military-grade', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        request_id: `playwright-wallet-proof-${Date.now()}`,
        selected_layers: [
          { id: 'L2', slug: 'integrity-auditor', label: 'Integrity Auditor', proof: 'Mocked approval.', status: 'approved' },
          { id: 'L4', slug: 'sovereign-memory', label: 'Sovereign Memory', proof: 'Mocked memory seal.', status: 'approved' },
          { id: 'L5', slug: '0g-storage', label: '0G Storage Proof Layer', proof: 'Mocked storage receipt.', status: 'approved' },
        ],
        '0g_storage_url': 'playwright-storage-proof',
      }),
    });
  });

  await context.route('**/api/v1/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, status: 'ok', request_id: 'playwright-health' }),
    });
  });

  await context.route('**/api/v1/status/layers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, status: 'ok', request_id: 'playwright-layers', layers: {} }),
    });
  });

  await context.route('**/api/v1/integrity/records**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, request_id: 'playwright-records', items: [], total: 0 }),
    });
  });
}

async function assertSocialEntry(page) {
  await page.getByText('Google login unlocks a local TITAN wallet flow').waitFor();

  if (!EXPECT_PRIVY_READY) {
    return;
  }

  await page.getByText('TITAN Managed').waitFor({ timeout: 20_000 });
  await expectEnabled(page.getByRole('button', { name: 'Login Google' }), 'Login Google should be enabled when TITAN managed auth is configured.');
}

async function expectEnabled(locator, message) {
  await locator.waitFor();
  assert(await locator.isEnabled(), message);
}

async function createWalletFlow(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  assert(
    (await page.getByRole('banner').getByRole('link', { name: 'Dashboard', exact: true }).count()) === 0,
    'Dashboard header link should be hidden before a wallet exists.',
  );

  await page.getByRole('banner').getByRole('link', { name: 'Create Wallet' }).click();
  await page.waitForURL('**/onboarding');
  await page.getByText('Create a new wallet').click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForURL('**/create-wallet');
  await assertSocialEntry(page);

  await page.getByPlaceholder('My TITAN Wallet').fill('Playwright Create');
  await page.getByPlaceholder('At least 8 characters').fill('supersecure123');
  await page.getByPlaceholder('Repeat your password').fill('supersecure123');
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: 'Create Wallet' }).click();
  await page.getByRole('button', { name: 'Reveal seed phrase' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: "I've saved it safely" }).click();

  await page.getByText('Wallet created.').waitFor();
  await page.getByText(/Wallet proof sealed successfully: playwright-wallet-proof-/).waitFor();
  assert((await page.getByText('null').count()) === 0, 'Create success screen should not render a null proof id.');

  await page.getByRole('button', { name: /Open Dashboard/ }).click();
  await page.waitForURL('**/dashboard');
  await page.getByTestId('account-switcher-trigger').waitFor();
}

async function importWalletFlow(page) {
  await page.goto(`${BASE_URL}/create-wallet?mode=import`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Import your wallet').waitFor();
  await page.getByPlaceholder('Imported TITAN Wallet').fill('Playwright Import');
  await page.getByPlaceholder(/word1 word2/).fill(IMPORT_MNEMONIC);
  await page.getByRole('button', { name: 'Import Wallet' }).click();

  await page.getByText('Wallet imported.').waitFor();
  await page.getByText(/Wallet proof sealed successfully: playwright-wallet-proof-/).waitFor();
  assert((await page.getByText('null').count()) === 0, 'Import success screen should not render a null proof id.');

  await page.getByRole('button', { name: /Open Dashboard/ }).click();
  await page.waitForURL('**/dashboard');
  await page.getByTestId('account-switcher-trigger').waitFor();
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  const createContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await installApiMocks(createContext);
  const createPage = await createContext.newPage();
  await createWalletFlow(createPage);
  await createContext.close();
  console.log('Create wallet UI smoke passed.');

  const importContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await installApiMocks(importContext);
  const importPage = await importContext.newPage();
  await importWalletFlow(importPage);
  await importContext.close();
  console.log('Import wallet UI smoke passed.');

  await browser.close();
  console.log('Playwright onboarding smoke test passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

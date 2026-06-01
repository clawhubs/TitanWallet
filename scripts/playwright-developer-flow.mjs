import { chromium } from 'playwright';
import { Wallet } from 'ethers';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const PRIVATE_KEY = '0x59c6995e998f97a5a0044976f7d8dc8ecfb11cf4904c7d9d6366f4c6c7b3b9a1';
const WALLET_ADDRESS = new Wallet(PRIVATE_KEY).address;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildWalletState() {
  const timestamp = new Date().toISOString();
  const account = {
    id: WALLET_ADDRESS.toLowerCase(),
    address: WALLET_ADDRESS,
    mnemonic: null,
    privateKey: PRIVATE_KEY,
    walletName: 'Developer Owner',
    source: 'local',
    authProvider: null,
    balanceETH: '0.0',
    balanceUSD: 0,
    createdAt: timestamp,
    lastUsedAt: timestamp,
  };

  return {
    state: {
      accounts: [account],
      activeAccountId: account.id,
      address: WALLET_ADDRESS,
      isConnected: true,
      balanceETH: '0.0',
      balanceUSD: 0,
      mnemonic: null,
      privateKey: PRIVATE_KEY,
      walletName: 'Developer Owner',
      walletSource: 'local',
      authProvider: null,
    },
    version: 2,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
  const walletState = buildWalletState();

  await context.addInitScript(({ walletState }) => {
    localStorage.setItem('titan-wallet-session-store', JSON.stringify(walletState));
    sessionStorage.setItem('titan-wallet-session-store', JSON.stringify(walletState));
  }, { walletState });

  const page = await context.newPage();
  await page.goto(`${BASE_URL}/settings?tab=developer`, { waitUntil: 'domcontentloaded' });

  await page.getByRole('heading', { name: 'Developer API' }).waitFor();
  await page.getByText('Owner verified').waitFor({ timeout: 15000 });

  const createProjectButton = page.getByRole('button', { name: /Create project/i });
  await waitUntilEnabled(createProjectButton);
  await createProjectButton.click();
  await page.getByText(/^proj_/).first().waitFor();

  const createAgentWalletButton = page.getByRole('button', { name: /Create agent wallet/i });
  await waitUntilEnabled(createAgentWalletButton);
  await createAgentWalletButton.click();
  await page.getByText(/^aw_/).first().waitFor();

  const issueCapabilityButton = page.getByRole('button', { name: /Issue capability/i });
  await waitUntilEnabled(issueCapabilityButton);
  await issueCapabilityButton.click();
  await page.getByText(/titan_cap_/).first().waitFor();

  await page.getByRole('button', { name: /^Rotate$/ }).first().click();
  await page.getByText(/Capability rotated and a new runtime token is active/i).waitFor({ timeout: 15000 });

  await page.getByRole('button', { name: /^Pause$/ }).click();
  await page.getByRole('button', { name: /^Resume$/ }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /^Resume$/ }).click();
  await page.getByRole('button', { name: /^Pause$/ }).waitFor({ timeout: 15000 });

  await page.getByRole('button', { name: /^Disable$/ }).click();
  await page.getByRole('button', { name: /^Enable$/ }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /^Enable$/ }).click();
  await page.getByRole('button', { name: /^Disable$/ }).waitFor({ timeout: 15000 });

  await page.getByText('Proof log').waitFor();
  const proofLogCards = page.locator('text=Capability Issued');
  assert(await proofLogCards.count(), 'Expected at least one capability proof log entry.');

  const pageText = await page.textContent('body');
  assert(pageText?.includes('TITAN_AGENT_WALLET_CAPABILITY'), 'Expected the page to include TITAN_AGENT_WALLET_CAPABILITY in the runtime env block.');

  console.log('Playwright developer flow smoke test passed.');
  await browser.close();
}

async function waitUntilEnabled(locator) {
  for (let index = 0; index < 30; index += 1) {
    if (await locator.isEnabled()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Expected control to become enabled.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

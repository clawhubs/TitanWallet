import { chromium } from 'playwright';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/developer/demo`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /AI agents should not get unlimited wallet access/i }).waitFor();

  await page.getByRole('button', { name: /Generate demo API key/i }).first().click();
  await page.getByText(/Simulation API key created/i).waitFor({ timeout: 15000 });
  await page.getByText(/titan_demo_/i).first().waitFor();

  await page.getByRole('button', { name: /Run Allowed Demo/i }).click();
  await page.getByText(/Allowed demo recorded/i).waitFor({ timeout: 15000 });
  await page.getByText(/Intent matches capability policy/i).first().waitFor();

  await page.getByRole('button', { name: /Run Blocked Demo/i }).click();
  await page.getByText(/Blocked demo recorded/i).waitFor({ timeout: 15000 });
  await page.getByText(/outside the invoice-payment capability/i).first().waitFor();

  await page.getByRole('heading', { name: 'Proof Logs' }).waitFor();
  await page.getByRole('heading', { name: 'Security Logs' }).waitFor();
  await page.getByText(/Agent Intent Policy Check/i).first().waitFor();
  await page.getByText(/Blocked Intent Security Log/i).first().waitFor();

  const bodyText = await page.textContent('body');
  assert(bodyText && !/currentApyBps|optimizedApyBps|Current APY|Optimized APY/.test(bodyText), 'Demo page must not show APY fields.');
  assert(bodyText.includes('10-Layer Rail Evidence'), 'Demo page should show 10-layer evidence.');
  assert(bodyText.includes('No real funds moved'), 'Demo page should clearly say public simulation moves no funds.');

  await browser.close();
  console.log('Playwright developer API demo smoke test passed.');
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});

import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy — Titan Alpha' };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="June 2026">
      <LegalSection heading="1. Overview">
        <p>Titan Alpha is an AI-powered Web3 intelligence feed. We aggregate publicly available data about projects and opportunities. Browsing the feed does not require connecting a wallet or signing anything.</p>
      </LegalSection>
      <LegalSection heading="2. Information we process">
        <p>We process public project data from third-party sources (e.g. DefiLlama, public RSS, GitHub, on-chain explorers) and any details you voluntarily submit through the Community Submission form (project name, links, description). We may store anonymous, aggregated usage metrics to improve the product.</p>
      </LegalSection>
      <LegalSection heading="3. What we do not collect">
        <p>We do not take custody of funds, request private keys or seed phrases, or sell your data.</p>
      </LegalSection>
      <LegalSection heading="4. Third-party services">
        <p>Security checks may use a third-party security API and AI analysis uses a third-party model provider. These services receive only the data necessary to return a result (e.g. a public token address or submission text).</p>
      </LegalSection>
      <LegalSection heading="5. Contact">
        <p>Questions? Email <a href="mailto:hallo@titanwallet.net" className="text-[var(--xray-accent)] hover:underline">hallo@titanwallet.net</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}

import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — Titan X-Ray',
  description: 'How Titan X-Ray handles data. Read-only, privacy-first wallet scanning.',
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="June 2026">
      <LegalSection heading="1. Privacy-first by design">
        <p>Titan X-Ray is a read-only scanner. We never ask you to connect a wallet, sign a transaction, or share a private key or seed phrase. All you provide is a public wallet address — the same information visible on any block explorer.</p>
      </LegalSection>
      <LegalSection heading="2. What we do not collect">
        <p>We do not collect or store your private keys or recovery phrases. We do not sell your data. Scans are processed in real time and the address you scan is not retained as part of a personal profile.</p>
      </LegalSection>
      <LegalSection heading="3. What we may process">
        <p>To return a result we process the public address you submit, make read-only requests to public RPC and block-explorer endpoints, and may use third-party security and AI providers to generate risk insights. These providers receive only the data needed to return a result, such as a public address or contract source you choose to audit.</p>
      </LegalSection>
      <LegalSection heading="4. Local storage">
        <p>Preferences such as your theme are stored locally in your browser and never sent to us.</p>
      </LegalSection>
      <LegalSection heading="5. Security">
        <p>We apply reasonable safeguards, but no method of transmission or storage is fully secure. Blockchain data is public and outside our control.</p>
      </LegalSection>
      <LegalSection heading="6. Contact">
        <p>Questions? Email <a href="mailto:hallo@titanwallet.net" className="text-[var(--xray-accent)] hover:underline">hallo@titanwallet.net</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}

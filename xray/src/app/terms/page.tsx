import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — Titan X-Ray',
  description: 'Terms governing the use of the Titan X-Ray wallet scanner.',
};

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="June 2026">
      <LegalSection heading="1. Acceptance">
        <p>By using Titan X-Ray (the &ldquo;Service&rdquo;) you agree to these Terms. If you do not agree, do not use the Service.</p>
      </LegalSection>
      <LegalSection heading="2. Read-only service">
        <p>The Service scans public on-chain data and never takes custody of your assets, keys, or wallet. It cannot move, freeze, or recover funds.</p>
      </LegalSection>
      <LegalSection heading="3. Informational only">
        <p>All scan results, scores, and AI narratives are provided for informational purposes only and do not constitute financial, investment, legal, or security advice. Always verify findings independently before acting.</p>
      </LegalSection>
      <LegalSection heading="4. No warranty">
        <p>The Service is provided &ldquo;as is&rdquo; without warranties of any kind. Explorer and RPC coverage varies by network, and results may be incomplete or change over time.</p>
      </LegalSection>
      <LegalSection heading="5. Limitation of liability">
        <p>To the maximum extent permitted by law, Titan X-Ray and its affiliates are not liable for any loss arising from use of the Service, including decisions made based on scan results.</p>
      </LegalSection>
      <LegalSection heading="6. Contact">
        <p>Questions? Email <a href="mailto:hallo@titanwallet.net" className="text-[var(--xray-accent)] hover:underline">hallo@titanwallet.net</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}

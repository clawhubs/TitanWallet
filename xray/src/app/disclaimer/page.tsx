import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Disclaimer — Titan X-Ray',
  description: 'Important disclaimer for the Titan X-Ray wallet scanner.',
};

export default function Disclaimer() {
  return (
    <LegalPage title="Disclaimer" updated="June 2026">
      <LegalSection heading="Not financial advice">
        <p>Titan X-Ray provides automated, read-only analysis of public blockchain data. Nothing in the Service constitutes financial, investment, legal, tax, or security advice.</p>
      </LegalSection>
      <LegalSection heading="Accuracy and coverage">
        <p>Results are based on publicly available on-chain data and third-party intelligence. Coverage varies by network and provider, and findings may be incomplete, delayed, or subject to change. A clean result does not guarantee safety, and a flagged result is not a definitive judgment.</p>
      </LegalSection>
      <LegalSection heading="Your responsibility">
        <p>You are responsible for your own decisions. Always verify approvals, contracts, and counterparties yourself before taking any action such as revoking, signing, or transacting.</p>
      </LegalSection>
      <LegalSection heading="AI-generated content">
        <p>AI narratives are generated automatically and may contain errors. Treat them as a starting point for your own research, not as authoritative conclusions.</p>
      </LegalSection>
    </LegalPage>
  );
}

import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Terms of Service — Titan Alpha' };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="June 2026">
      <LegalSection heading="1. Acceptance">
        <p>By using Titan Alpha (the &ldquo;Service&rdquo;) you agree to these Terms. If you do not agree, do not use the Service.</p>
      </LegalSection>
      <LegalSection heading="2. Informational only">
        <p>All scores, rankings, and AI narratives are generated automatically for informational purposes only and are <strong>not</strong> financial, investment, legal, or tax advice. Opportunities such as airdrops and points programs are speculative and may never materialize.</p>
      </LegalSection>
      <LegalSection heading="3. No guarantees">
        <p>AI scoring and third-party data can be incomplete, delayed, or wrong. A high score is not a recommendation, and a security check is not an audit. Always verify independently — including with Titan X-Ray — before interacting with any contract.</p>
      </LegalSection>
      <LegalSection heading="4. Community submissions">
        <p>Submitted content must be accurate and lawful. We may analyze, edit, reject, or remove submissions at our discretion.</p>
      </LegalSection>
      <LegalSection heading="5. Limitation of liability">
        <p>To the maximum extent permitted by law, Titan Alpha and its affiliates are not liable for any loss arising from use of the Service or actions taken based on its content.</p>
      </LegalSection>
      <LegalSection heading="6. Contact">
        <p>Questions? Email <a href="mailto:hallo@titanwallet.net" className="text-[var(--xray-accent)] hover:underline">hallo@titanwallet.net</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}

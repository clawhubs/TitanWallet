import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Disclaimer — Titan Alpha' };

export default function Disclaimer() {
  return (
    <LegalPage title="Disclaimer" updated="June 2026">
      <LegalSection heading="Not financial advice">
        <p>Titan Alpha surfaces and scores Web3 opportunities using AI and public data. Nothing here is financial, investment, legal, or tax advice.</p>
      </LegalSection>
      <LegalSection heading="Speculative by nature">
        <p>Airdrops, points, testnets, and incentive programs are speculative. Participation may require time, gas, or capital with no guaranteed reward, and some programs change rules or never distribute anything.</p>
      </LegalSection>
      <LegalSection heading="AI and data limits">
        <p>Scores and narratives are AI-generated and may be inaccurate. Third-party data may be delayed or incomplete. Treat everything as a starting point for your own research.</p>
      </LegalSection>
      <LegalSection heading="Verify before you act">
        <p>Always verify contracts and permissions yourself — for example with Titan X-Ray — and never sign transactions you do not understand.</p>
      </LegalSection>
    </LegalPage>
  );
}

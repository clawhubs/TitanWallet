import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Contact — Titan Alpha' };

export default function Contact() {
  return (
    <LegalPage title="Contact" updated="June 2026">
      <LegalSection heading="Get in touch">
        <p>Questions, partnerships, or want a project listed? Reach the Titan team at <a href="mailto:hallo@titanwallet.net" className="text-[var(--xray-accent)] hover:underline">hallo@titanwallet.net</a>.</p>
      </LegalSection>
      <LegalSection heading="Submit an opportunity">
        <p>Anyone can submit a project from the home page&rsquo;s <Link href="/#submit" className="text-[var(--xray-accent)] hover:underline">Submit</Link> section. Submissions run through AI analysis and an automated security check before review.</p>
      </LegalSection>
      <LegalSection heading="The Titan ecosystem">
        <p>Discover on <strong>Titan Alpha</strong>, verify on <a href="https://xray.titanwallet.net" className="text-[var(--xray-accent)] hover:underline">Titan X-Ray</a>, and execute with <a href="https://titanwallet.net" className="text-[var(--xray-accent)] hover:underline">TitanWallet</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}

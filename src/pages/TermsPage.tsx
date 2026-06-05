import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LandingFooter from '../components/layout/LandingFooter';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-titan-bg flex flex-col">
      <header className="border-b border-titan-border">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-titan-accent/10 border border-titan-accent/30 flex items-center justify-center overflow-hidden">
              <img src="/titan-logo-transparent.png" alt="TITAN Logo" className="h-full w-full object-cover scale-[1.45]" />
            </div>
            <span className="font-bold text-titan-text">TITAN Wallet</span>
          </Link>
          <Link to="/" className="text-sm text-titan-subtext hover:text-titan-text flex items-center gap-1.5">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-14 w-full">
        <h1 className="text-3xl font-extrabold text-titan-text mb-2">Terms of Service</h1>
        <p className="text-sm text-titan-tertiary mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-[15px] leading-7 text-titan-subtext">
          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using TITAN Wallet (the &ldquo;Service&rdquo;), you agree to these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">2. Non-Custodial Service</h2>
            <p>TITAN Wallet is a non-custodial wallet. Your private keys and recovery phrase are generated and stored on your own device and are never transmitted to or held by us. We have no access to your keys, funds, or assets, and we cannot move, freeze, or recover them on your behalf.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">3. Your Responsibilities</h2>
            <p>You are solely responsible for safeguarding your recovery phrase, private keys, and device. Loss of your recovery phrase may result in permanent and irreversible loss of access to your assets. You are responsible for all activity conducted through your wallet.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">4. No Financial Advice</h2>
            <p>The Service, including any risk analysis or security insights, is provided for informational purposes only and does not constitute financial, investment, legal, or tax advice. Always do your own research before making decisions involving digital assets.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">5. Disclaimer of Warranties</h2>
            <p>The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind. We do not warrant that the Service will be uninterrupted, error-free, or secure. Blockchain transactions are irreversible and outside our control.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, TITAN Wallet and its affiliates shall not be liable for any loss of assets, profits, or data arising from your use of the Service, including loss resulting from compromised keys, phishing, or smart-contract approvals you authorize.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">7. Changes</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">8. Contact</h2>
            <p>Questions about these Terms? Email <a href="mailto:hallo@titanwallet.net" className="text-titan-accent hover:underline">hallo@titanwallet.net</a>.</p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default TermsPage;

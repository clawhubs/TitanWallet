import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LandingFooter from '../components/layout/LandingFooter';

const PrivacyPage: React.FC = () => {
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
        <h1 className="text-3xl font-extrabold text-titan-text mb-2">Privacy Policy</h1>
        <p className="text-sm text-titan-tertiary mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-[15px] leading-7 text-titan-subtext">
          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">1. Our Approach</h2>
            <p>TITAN Wallet is built privacy-first. Because the wallet is non-custodial, your private keys and recovery phrase never leave your device and are never sent to our servers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">2. Information We Do Not Collect</h2>
            <p>We do not collect or store your private keys, recovery phrases, or fund balances. We do not sell your data. Wallet creation and key management happen locally in your browser.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">3. Information We May Process</h2>
            <p>To operate the Service we may process limited technical data such as public wallet addresses you choose to scan, network requests to public RPC and explorer endpoints, and anonymous, aggregated usage metrics to improve reliability. Wallet scans are read-only and processed in real time.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">4. Third-Party Services</h2>
            <p>The Service interacts with public blockchain infrastructure (RPC providers and block explorers) and may use third-party risk and AI providers to generate security insights. These providers receive only the data necessary to return a result, such as a public address.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">5. Local Storage</h2>
            <p>Wallet data and preferences are stored locally on your device (for example, in your browser&rsquo;s storage). Clearing your browser data may remove access to a wallet if you have not backed up your recovery phrase.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">6. Security</h2>
            <p>We apply reasonable measures to protect the Service, but no method of transmission or storage is completely secure. You remain responsible for protecting your recovery phrase and device.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">7. Changes</h2>
            <p>We may update this Privacy Policy from time to time. Material changes will be reflected by the &ldquo;Last updated&rdquo; date above.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-titan-text mb-2">8. Contact</h2>
            <p>Privacy questions? Email <a href="mailto:hallo@titanwallet.net" className="text-titan-accent hover:underline">hallo@titanwallet.net</a>.</p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default PrivacyPage;

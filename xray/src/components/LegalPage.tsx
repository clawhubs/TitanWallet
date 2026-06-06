'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import type { ReactNode } from 'react';

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--xray-subtext)] hover:text-[var(--xray-text)] mb-8">
          <ArrowLeft size={15} /> Back to home
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--xray-text)] tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-[var(--xray-tertiary)]">Last updated: {updated}</p>
        <div className="mt-10 space-y-8 text-[15px] leading-7 text-[var(--xray-subtext)]">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[var(--xray-text)] mb-2">{heading}</h2>
      {children}
    </section>
  );
}

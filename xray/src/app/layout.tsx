import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Titan X-Ray — Wallet Health Scanner",
  description:
    "Free, read-only wallet health scanner. Detect risky token approvals, known drainer contracts, and get actionable security insights without connecting your wallet.",
  keywords: ["wallet scanner", "token approvals", "revoke", "drainer", "web3 security", "titan wallet"],
  icons: {
    icon: "/titan-logo-transparent.png",
    apple: "/titan-logo-transparent.png",
  },
  openGraph: {
    title: "Titan X-Ray — Know Your Wallet's True Health",
    description: "Paste any wallet address to scan for risky approvals and exposure — free, read-only, no connection needed.",
    type: "website",
    url: "https://xray.titanwallet.net",
    siteName: "Titan X-Ray",
  },
  twitter: {
    card: "summary_large_image",
    title: "Titan X-Ray — Wallet Health Scanner",
    description: "Free, read-only wallet health scanner with AI-powered risk analysis.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent FOUC for theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('xray-theme');
                  if (t === 'dark' || t === 'light') {
                    document.documentElement.setAttribute('data-theme', t);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

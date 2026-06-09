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
  title: "Titan Alpha — AI Web3 Opportunity Intelligence",
  description:
    "Titan Alpha uses AI to continuously discover, verify, score, and explain Web3 opportunities — airdrops, testnets, points, and incentive programs — before they go mainstream.",
  keywords: ["airdrop", "testnet", "web3 alpha", "crypto opportunities", "points program", "titan wallet", "ai web3"],
  icons: {
    icon: "/titan-logo-transparent.png",
    apple: "/titan-logo-transparent.png",
  },
  openGraph: {
    title: "Titan Alpha — Discover Alpha Before Everyone Else",
    description: "AI continuously monitors Web3 ecosystems to discover, verify, score, and explain opportunities before they become mainstream.",
    type: "website",
    url: "https://alpha.titanwallet.net",
    siteName: "Titan Alpha",
  },
  twitter: {
    card: "summary_large_image",
    title: "Titan Alpha — AI Web3 Opportunity Intelligence",
    description: "Discover, verify, score, and explain Web3 opportunities with AI.",
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
        {/* Prevent FOUC; default to dark unless the user explicitly chose light. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('alpha-theme');
                  document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
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

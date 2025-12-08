import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'AvaAgent - The Agentic OS for Avalanche',
  description:
    'Autonomous AI agents for DeFi trading, data analysis, and real-world commerce on Avalanche L1s.',
  keywords: [
    'Avalanche',
    'AI Agents',
    'DeFi',
    'Blockchain',
    'Trading',
    'x402',
    'Kite',
  ],
  authors: [{ name: 'AvaAgent Team' }],
  openGraph: {
    title: 'AvaAgent - The Agentic OS for Avalanche',
    description:
      'Autonomous AI agents for DeFi trading, data analysis, and real-world commerce on Avalanche L1s.',
    url: 'https://avaagent.ai',
    siteName: 'AvaAgent',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AvaAgent - The Agentic OS for Avalanche',
    description:
      'Autonomous AI agents for DeFi trading, data analysis, and real-world commerce on Avalanche L1s.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <body className="min-h-screen bg-background font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

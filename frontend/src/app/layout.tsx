import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { SmoothScroll } from '@/components/providers/smooth-scroll';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'AvaAgent - The Agentic OS for Avalanche',
  description:
    'Deploy autonomous AI agents that trade, analyze, and transact across Avalanche L1s. Powered by x402 payments, Kite network, and Gemini AI.',
  keywords: [
    'Avalanche',
    'AI Agents',
    'DeFi',
    'Blockchain',
    'Trading',
    'x402',
    'Kite',
    'Autonomous Agents',
    'Smart Contracts',
    'Account Abstraction',
  ],
  authors: [{ name: 'AvaAgent Team' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.svg',
  },
  openGraph: {
    title: 'AvaAgent - The Agentic OS for Avalanche',
    description:
      'Deploy autonomous AI agents that trade, analyze, and transact across Avalanche L1s.',
    url: 'https://avaagent.ai',
    siteName: 'AvaAgent',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AvaAgent - Autonomous AI Agents on Avalanche',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AvaAgent - The Agentic OS for Avalanche',
    description:
      'Deploy autonomous AI agents that trade, analyze, and transact across Avalanche L1s.',
    images: ['/og-image.png'],
    creator: '@avaagent',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0b' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
  width: 'device-width',
  initialScale: 1,
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
        className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      >
        <body className="min-h-screen bg-background font-sans antialiased selection:bg-avalanche-500/30 selection:text-white">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            disableTransitionOnChange
          >
            <SmoothScroll>
              <QueryProvider>
                {children}
                <Toaster />
              </QueryProvider>
            </SmoothScroll>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

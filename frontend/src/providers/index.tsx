'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { type ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { Toaster } from '@/components/ui/toaster';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#09090b',
          colorInputBackground: '#18181b',
          colorInputText: '#fafafa',
        },
        elements: {
          formButtonPrimary:
            'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
          card: 'bg-zinc-900 border border-zinc-800',
          headerTitle: 'text-zinc-100',
          headerSubtitle: 'text-zinc-400',
          socialButtonsBlockButton:
            'bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700',
          formFieldLabel: 'text-zinc-300',
          formFieldInput:
            'bg-zinc-800 border-zinc-700 text-zinc-100 focus:ring-indigo-500',
          footerActionLink: 'text-indigo-400 hover:text-indigo-300',
        },
      }}
    >
      <QueryProvider>
        {children}
        <Toaster />
      </QueryProvider>
    </ClerkProvider>
  );
}

'use client';

import React from 'react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { AuthProvider } from '@/context/AuthContext';
import { AuthGate } from '@/components/auth/AuthGate';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
      </AuthProvider>
    </NuqsAdapter>
  );
}

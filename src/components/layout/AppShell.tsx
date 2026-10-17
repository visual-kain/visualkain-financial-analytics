'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  /** Halaman dengan footer lengket sendiri (form) butuh ruang bawah ekstra di HP. */
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#E8ECF2] text-slate-900">
      <Toaster richColors position="top-right" />
      <Sidebar />
      <MobileBottomNav />
      <main className={cn('min-w-0 flex-1 px-3.5 py-4 pb-28 sm:px-6 sm:py-6 md:pb-8 lg:px-8 lg:py-8', className)}>
        <div className="mx-auto w-full max-w-[1920px] space-y-4 sm:space-y-6">{children}</div>
      </main>
    </div>
  );
}

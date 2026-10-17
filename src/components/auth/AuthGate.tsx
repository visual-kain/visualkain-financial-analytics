'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { homeRouteFor } from '@/lib/user-roles';
import { ShieldCheck, Loader2 } from 'lucide-react';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  // Pratinjau fixture hanya ada di `next dev`; di build produksi route ini notFound dan tetap di balik login.
  const isDevPreview = process.env.NODE_ENV === 'development' && pathname.startsWith('/dev-preview');

  useEffect(() => {
    if (loading || isDevPreview) return;

    if (!isAuthenticated && !isLoginPage) {
      router.replace('/login');
    }
    if (isAuthenticated && isLoginPage) {
      router.replace(homeRouteFor(profile?.email));
    }
  }, [isAuthenticated, loading, isLoginPage, isDevPreview, router, profile?.email]);

  if (isDevPreview) return <>{children}</>;

  // Loading state with executive styling
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#E8ECF2] p-4 text-slate-900 select-none">
        <div className="flex flex-col items-center max-w-sm w-full text-center">
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-md">
            <img
              src="/img/logo.jpg"
              alt="Logo VisualKain"
              className="h-full w-full object-cover rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-bold tracking-wide text-teal-800">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              SISTEM OTENTIKASI RESMI
            </span>
          </div>

          <h2 className="text-base font-bold text-slate-800">
            Memverifikasi Otoritas Finansial...
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Menghubungkan ke basis data terenkripsi VisualKain
          </p>

          <div className="mt-6 flex items-center justify-center text-teal-600">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated & not login page: don't render dashboard while redirecting
  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}

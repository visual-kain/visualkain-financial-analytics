'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/modal';

/**
 * Menahan klik tautan internal (sidebar, bottom nav, tombol kembali) saat form belum disimpan.
 * `beforeunload` hanya menangkap refresh/tutup tab, bukan navigasi client-side Next.
 */
export function useDirtyNavigationGuard(isDirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      // Fase capture di document berjalan sebelum handler onClick milik <Link>, jadi navigasi bisa dibatalkan di sini.
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(`${url.pathname}${url.search}${url.hash}`);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [isDirty]);

  const cancel = useCallback(() => setPendingHref(null), []);
  const proceed = useCallback(() => {
    const href = pendingHref;
    setPendingHref(null);
    if (href) router.push(href);
  }, [pendingHref, router]);

  const dialog = (
    <ConfirmDialog
      open={pendingHref !== null}
      title="Tinggalkan halaman?"
      description="Perubahan pada form ini belum disimpan dan akan hilang."
      confirmLabel="Tinggalkan"
      cancelLabel="Tetap di sini"
      onConfirm={proceed}
      onClose={cancel}
    />
  );

  return { dialog };
}

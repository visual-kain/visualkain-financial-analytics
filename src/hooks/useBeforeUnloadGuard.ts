'use client';

import { useEffect } from 'react';

/** Peringatan browser saat refresh, tutup tab, atau navigasi keluar ketika form belum disimpan. */
export function useBeforeUnloadGuard(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome lama hanya menampilkan dialog bila returnValue diisi.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}

'use client';

import { useEffect, useRef } from 'react';

/**
 * Menjalankan `init` sekali untuk setiap nilai `key` baru.
 * Snapshot Firestore membuat objek order baru setiap ada perubahan, jadi form harus terikat ke ID, bukan ke identitas objek.
 */
export function useInitOnce(
  key: string | null | undefined,
  init: () => void,
  options: { skip?: boolean } = {}
): void {
  const initializedKeyRef = useRef<string | null>(null);
  const initRef = useRef(init);
  initRef.current = init;
  const skip = Boolean(options.skip);

  useEffect(() => {
    if (!key || skip || initializedKeyRef.current === key) return;
    initializedKeyRef.current = key;
    initRef.current();
  }, [key, skip]);
}

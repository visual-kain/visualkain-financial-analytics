'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  COST_PROFIT_COLLECTIONS,
  normalizeBahan,
  normalizeMarkup,
  sortBahan,
  sortMarkup,
  type BahanDoc,
  type MarkupDoc,
} from '@/lib/cost-profit';

export type CostProfitLoadState = 'loading' | 'ready' | 'error';

/**
 * Bahan dan aturan markup. Kategori sudah dilanggan oleh OpsDataProvider (`useOpsData().kategoriList`).
 * Urutan dilakukan di klien agar dokumen tanpa field urut tidak hilang diam-diam; dokumen yang rusak disaring di normalizer.
 */
export function useCostProfitData() {
  const [bahanList, setBahanList] = useState<BahanDoc[]>([]);
  const [markupList, setMarkupList] = useState<MarkupDoc[]>([]);
  const [bahanState, setBahanState] = useState<CostProfitLoadState>('loading');
  const [markupState, setMarkupState] = useState<CostProfitLoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setBahanState('loading');
    setMarkupState('loading');
    setError(null);

    const unsubBahan = onSnapshot(
      collection(db, COST_PROFIT_COLLECTIONS.bahan),
      (snap) => {
        const list = snap.docs.flatMap((d) => {
          const item = normalizeBahan(d.id, d.data());
          return item ? [item] : [];
        });
        setBahanList(sortBahan(list));
        setBahanState('ready');
      },
      (err) => {
        console.warn('[Firebase] Listener cp_bahan gagal:', err.message);
        setError(err.message);
        setBahanState('error');
      }
    );

    const unsubMarkup = onSnapshot(
      collection(db, COST_PROFIT_COLLECTIONS.markup),
      (snap) => {
        const list = snap.docs.flatMap((d) => {
          const item = normalizeMarkup(d.id, d.data());
          return item ? [item] : [];
        });
        setMarkupList(sortMarkup(list));
        setMarkupState('ready');
      },
      (err) => {
        console.warn('[Firebase] Listener cp_markup gagal:', err.message);
        setError(err.message);
        setMarkupState('error');
      }
    );

    return () => {
      unsubBahan();
      unsubMarkup();
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const state: CostProfitLoadState =
    bahanState === 'error' || markupState === 'error' ? 'error' : bahanState === 'loading' || markupState === 'loading' ? 'loading' : 'ready';

  return { bahanList, markupList, state, error, retry };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Unsubscribe } from 'firebase/firestore';
import {
  getKerjasama,
  getPenawaran,
  subscribeKerjasama,
  subscribePenawaran,
} from '@/lib/firestore/letters-repo';
import type { KerjasamaDoc, PenawaranDoc } from '@/lib/letters';

export type LetterLoadState = 'loading' | 'ready' | 'error';

type Subscribe<T> = (onData: (docs: T[]) => void, onError: (error: Error) => void) => Unsubscribe;

function useLetterSubscription<T>(subscribe: Subscribe<T>, label: string) {
  const [items, setItems] = useState<T[]>([]);
  const [state, setState] = useState<LetterLoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setState('loading');
    setError(null);
    return subscribe(
      (docs) => {
        setItems(docs);
        setState('ready');
      },
      (err) => {
        console.warn(`[Firebase] Listener ${label} gagal:`, err.message);
        setError(err.message);
        setState('error');
      }
    );
  }, [subscribe, label, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { items, state, error, retry };
}

export function useKerjasamaList() {
  return useLetterSubscription<KerjasamaDoc>(subscribeKerjasama, 'kerjasama');
}

export function usePenawaranList() {
  return useLetterSubscription<PenawaranDoc>(subscribePenawaran, 'penawaran');
}

export type LetterDocState<T> = { status: 'loading' | 'missing' | 'error'; doc: null } | { status: 'ready'; doc: T };

function useLetterDoc<T>(id: string, fetcher: (id: string) => Promise<T | null>) {
  const [result, setResult] = useState<LetterDocState<T>>({ status: 'loading', doc: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setResult({ status: 'loading', doc: null });
    fetcher(id)
      .then((doc) => {
        if (!cancelled) setResult(doc ? { status: 'ready', doc } : { status: 'missing', doc: null });
      })
      .catch((err: Error) => {
        console.warn('[Firebase] Memuat dokumen surat gagal:', err.message);
        if (!cancelled) setResult({ status: 'error', doc: null });
      });
    return () => {
      cancelled = true;
    };
  }, [id, fetcher, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { ...result, retry };
}

export function useKerjasamaDoc(id: string) {
  return useLetterDoc<KerjasamaDoc>(id, getKerjasama);
}

export function usePenawaranDoc(id: string) {
  return useLetterDoc<PenawaranDoc>(id, getPenawaran);
}

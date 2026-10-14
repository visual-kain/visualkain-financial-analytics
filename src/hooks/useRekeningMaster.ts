'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  DEFAULT_REKENING,
  REKENING_COLLECTION,
  mergeRekening,
  rekeningDocId,
  toAccountOptions,
  validateRekeningInput,
  type RekeningAccount,
  type RekeningDoc,
  type RekeningInput,
} from '@/lib/rekening-master';

export interface UseRekeningMasterResult {
  accounts: RekeningAccount[];
  options: Array<{ value: string; label: string; badge?: string }>;
  saveRekening: (input: RekeningInput, editingKode?: string | null) => Promise<RekeningAccount>;
}

/**
 * Listener terpisah dari useFirebaseFinance: koleksi ini baru dan mungkin belum diizinkan rules,
 * sehingga kegagalannya hanya membuat form memakai daftar default tanpa menandai dashboard error.
 */
export function useRekeningMaster(): UseRekeningMasterResult {
  const [docs, setDocs] = useState<RekeningDoc[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(
        collection(db, REKENING_COLLECTION),
        (snapshot) => {
          setDocs(
            snapshot.docs
              .map((d) => {
                const data = d.data();
                return {
                  kode: String(data.kode || ''),
                  namaBank: String(data.namaBank || ''),
                  nomor: String(data.nomor || ''),
                  atasNama: String(data.atasNama || ''),
                };
              })
              .filter((d) => d.kode && d.namaBank)
          );
        },
        (err) => console.warn('[Firebase] Listener rekening gagal, memakai daftar default:', err.message)
      );
    } catch (e: unknown) {
      console.warn('[Firebase] Listener rekening tidak dapat dipasang:', e instanceof Error ? e.message : e);
    }
    return () => unsubscribe?.();
  }, []);

  const accounts = useMemo(() => mergeRekening(DEFAULT_REKENING, docs), [docs]);
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;
  const options = useMemo(() => toAccountOptions(accounts), [accounts]);

  const saveRekening = useCallback(async (input: RekeningInput, editingKode?: string | null): Promise<RekeningAccount> => {
    const invalid = validateRekeningInput(input, accountsRef.current, editingKode);
    if (invalid) throw new Error(invalid);

    const clean: RekeningInput = {
      namaBank: input.namaBank.trim().replace(/\s+/g, ' '),
      nomor: input.nomor.trim(),
      atasNama: input.atasNama.trim(),
    };
    const kode = editingKode || clean.namaBank;
    const existing = accountsRef.current.find((a) => a.kode === kode);
    await setDoc(doc(db, REKENING_COLLECTION, rekeningDocId(kode)), { kode, ...clean, updatedAt: serverTimestamp() });

    const saved: RekeningAccount = { ...(existing ?? { isDefault: false }), kode, ...clean };
    setDocs((prev) => [...prev.filter((d) => d.kode !== kode), { kode, ...clean }]);
    return saved;
  }, []);

  return { accounts, options, saveRekening };
}

import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { counterId, formatDocumentNumber, type DocumentPrefix } from '@/lib/document-number';

export const COUNTER_COLLECTION = 'document_counters';

/**
 * Mengambil nomor urut berikutnya lewat transaction sehingga dua perangkat yang menyimpan bersamaan
 * tidak mendapat nomor yang sama (US-13.11).
 */
export async function reserveDocumentNumber(prefix: DocumentPrefix, year: number): Promise<{ nomor: string; urut: number }> {
  const ref = doc(db, COUNTER_COLLECTION, counterId(prefix, year));
  const urut = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const last = snap.exists() ? Number(snap.data().last || 0) : 0;
    const next = last + 1;
    tx.set(ref, { prefix, year, last: next, updatedAt: serverTimestamp() }, { merge: true });
    return next;
  });
  return { nomor: formatDocumentNumber(prefix, year, urut), urut };
}

import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { documentYear } from '@/lib/document-number';
import { reserveDocumentNumber } from '@/lib/firestore/document-counters';
import { updatedStamp } from '@/lib/audit';
import { currentActor } from '@/lib/firestore/actor';
import {
  buildKerjasamaCreatePayload,
  buildKerjasamaUpdatePayload,
  buildPenawaranCreatePayload,
  buildPenawaranUpdatePayload,
  normalizeKerjasamaDoc,
  normalizePenawaranDoc,
  omitUndefined,
  type KerjasamaDoc,
  type KerjasamaFormState,
  type LetterAuthor,
  type PenawaranDoc,
  type PenawaranFormState,
  type PenawaranItem,
} from '@/lib/letters';

export const KERJASAMA_COLLECTION = 'kerjasama';
export const PENAWARAN_COLLECTION = 'penawaran';

export interface CreatedLetter {
  id: string;
  nomor: string;
}

/**
 * Nomor dipesan lebih dulu lewat transaction. Bila penulisan dokumen gagal sesudahnya, nomor itu hangus
 * (ada celah urutan) dan tidak dipakai ulang, sama seperti dokumen yang dihapus.
 */
export async function createKerjasama(form: KerjasamaFormState, author: LetterAuthor): Promise<CreatedLetter> {
  const tahun = documentYear(form.tanggal);
  const { nomor, urut } = await reserveDocumentNumber('SK', tahun);
  const now = Timestamp.now();
  const payload = omitUndefined({
    ...buildKerjasamaCreatePayload(form, { nomor, urut, tahun }, author),
    createdAt: now,
    updatedAt: now,
  });
  const ref = await addDoc(collection(db, KERJASAMA_COLLECTION), payload);
  return { id: ref.id, nomor };
}

export async function updateKerjasama(id: string, form: KerjasamaFormState): Promise<void> {
  await updateDoc(doc(db, KERJASAMA_COLLECTION, id), omitUndefined({ ...buildKerjasamaUpdatePayload(form), updatedAt: Timestamp.now(), ...updatedStamp(currentActor()) }));
}

export async function deleteKerjasama(id: string): Promise<void> {
  await deleteDoc(doc(db, KERJASAMA_COLLECTION, id));
}

export async function getKerjasama(id: string): Promise<KerjasamaDoc | null> {
  const snap = await getDoc(doc(db, KERJASAMA_COLLECTION, id));
  return snap.exists() ? normalizeKerjasamaDoc(snap.id, snap.data()) : null;
}

export function subscribeKerjasama(onData: (docs: KerjasamaDoc[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(
    collection(db, KERJASAMA_COLLECTION),
    (snap) => onData(snap.docs.map((d) => normalizeKerjasamaDoc(d.id, d.data()))),
    onError
  );
}

export async function createPenawaran(form: PenawaranFormState, items: PenawaranItem[], author: LetterAuthor): Promise<CreatedLetter> {
  const tahun = documentYear(form.tanggal);
  const { nomor, urut } = await reserveDocumentNumber('PH', tahun);
  const now = Timestamp.now();
  const payload = omitUndefined({
    ...buildPenawaranCreatePayload(form, items, { nomor, urut, tahun }, author),
    createdAt: now,
    updatedAt: now,
  });
  const ref = await addDoc(collection(db, PENAWARAN_COLLECTION), payload);
  return { id: ref.id, nomor };
}

export async function updatePenawaran(id: string, form: PenawaranFormState, items: PenawaranItem[]): Promise<void> {
  await updateDoc(
    doc(db, PENAWARAN_COLLECTION, id),
    omitUndefined({ ...buildPenawaranUpdatePayload(form, items), updatedAt: Timestamp.now(), ...updatedStamp(currentActor()) })
  );
}

export async function deletePenawaran(id: string): Promise<void> {
  await deleteDoc(doc(db, PENAWARAN_COLLECTION, id));
}

export async function getPenawaran(id: string): Promise<PenawaranDoc | null> {
  const snap = await getDoc(doc(db, PENAWARAN_COLLECTION, id));
  return snap.exists() ? normalizePenawaranDoc(snap.id, snap.data()) : null;
}

export function subscribePenawaran(onData: (docs: PenawaranDoc[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(
    collection(db, PENAWARAN_COLLECTION),
    (snap) => onData(snap.docs.map((d) => normalizePenawaranDoc(d.id, d.data()))),
    onError
  );
}

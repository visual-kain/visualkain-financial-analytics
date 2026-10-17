import { Timestamp, addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COST_PROFIT_COLLECTIONS, buildBahanPayload, buildMarkupPayload, type BahanInput, type MarkupInput } from '@/lib/cost-profit';

export async function deleteKategori(id: string): Promise<void> {
  await deleteDoc(doc(db, COST_PROFIT_COLLECTIONS.kategori, id));
}

export async function addBahan(input: BahanInput): Promise<string> {
  const ref = await addDoc(collection(db, COST_PROFIT_COLLECTIONS.bahan), { ...buildBahanPayload(input), createdAt: Timestamp.now() });
  return ref.id;
}

export async function updateBahan(id: string, input: BahanInput): Promise<void> {
  await updateDoc(doc(db, COST_PROFIT_COLLECTIONS.bahan, id), { ...buildBahanPayload(input), updatedAt: Timestamp.now() });
}

export async function deleteBahan(id: string): Promise<void> {
  await deleteDoc(doc(db, COST_PROFIT_COLLECTIONS.bahan, id));
}

export async function addMarkup(input: MarkupInput): Promise<string> {
  const ref = await addDoc(collection(db, COST_PROFIT_COLLECTIONS.markup), { ...buildMarkupPayload(input), createdAt: Timestamp.now() });
  return ref.id;
}

export async function updateMarkup(id: string, input: MarkupInput): Promise<void> {
  await updateDoc(doc(db, COST_PROFIT_COLLECTIONS.markup, id), { ...buildMarkupPayload(input), updatedAt: Timestamp.now() });
}

export async function deleteMarkup(id: string): Promise<void> {
  await deleteDoc(doc(db, COST_PROFIT_COLLECTIONS.markup, id));
}

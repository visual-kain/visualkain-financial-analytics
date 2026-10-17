import { Timestamp, addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SIZES } from '@/lib/legacy/calculations';
import type { SizeChartData } from '@/lib/legacy/types';
import { createdStamp, updatedStamp } from '@/lib/audit';
import { currentActor } from '@/lib/firestore/actor';

export function emptySizeChartSizes(): Record<string, SizeChartData> {
  const sizes: Record<string, SizeChartData> = {};
  SIZES.forEach((s) => (sizes[s] = { panjang: 0, lebar: 0 }));
  return sizes;
}

export async function addSizeChart(nama: string, sizes: Record<string, SizeChartData>): Promise<string> {
  const ref = await addDoc(collection(db, 'sizecharts'), { nama, sizes, createdAt: Timestamp.now(), ...createdStamp(currentActor()) });
  return ref.id;
}

export async function updateSizeChart(id: string, nama: string, sizes: Record<string, SizeChartData>): Promise<void> {
  await updateDoc(doc(db, 'sizecharts', id), { nama, sizes, ...updatedStamp(currentActor()) });
}

export async function deleteSizeChart(id: string): Promise<void> {
  await deleteDoc(doc(db, 'sizecharts', id));
}

export async function addKategori(nama: string): Promise<string> {
  const ref = await addDoc(collection(db, 'cp_kategori'), { nama, createdAt: Timestamp.now(), ...createdStamp(currentActor()) });
  return ref.id;
}

import { Timestamp, addDoc, collection, deleteDoc, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { buildVendorPayload, type VendorFormValues } from '@/lib/vendors';

export const VENDORS_COLLECTION = 'vendors';

/** Dilempar bila hapus vendor ditolak karena masih ada order yang merujuknya. */
export class VendorInUseError extends Error {
  constructor() {
    super('Vendor masih dipakai order');
    this.name = 'VendorInUseError';
  }
}

export async function createVendor(values: VendorFormValues): Promise<string> {
  const ref = await addDoc(collection(db, VENDORS_COLLECTION), { ...buildVendorPayload(values), createdAt: Timestamp.now() });
  return ref.id;
}

export async function updateVendor(id: string, values: VendorFormValues): Promise<void> {
  await updateDoc(doc(db, VENDORS_COLLECTION, id), { ...buildVendorPayload(values), updatedAt: Timestamp.now() });
}

/**
 * Cek ke server tepat sebelum hapus, karena daftar order di layar bisa tertinggal. Kueri satu field tidak butuh
 * composite index. Bila cek gagal (misalnya offline), hapus ikut gagal dan tidak dilanjutkan.
 */
export async function deleteVendor(id: string): Promise<void> {
  const used = await getDocs(query(collection(db, 'orders'), where('vendorId', '==', id), limit(1)));
  if (!used.empty) throw new VendorInUseError();
  await deleteDoc(doc(db, VENDORS_COLLECTION, id));
}

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { countPcs } from '@/lib/legacy/calculations';
import { generateInvoiceNumber } from '@/lib/legacy/formatters';
import { STATUS_LABELS, isOrderStatus, type LegacyOrder, type OrderStatus } from '@/lib/legacy/types';

interface TrackingSource {
  noInv: string;
  namaCustomer?: unknown;
  namaProject?: unknown;
  kategoriOrder?: unknown;
  warna?: unknown;
  deadline?: unknown;
  status?: unknown;
  [key: string]: unknown;
}

type StatusHistory = Array<{ status: OrderStatus; at: string }>;

/**
 * Salin data minim (tanpa harga/profit/vendor) ke `tracking/{noInv}` untuk web publik. Riwayat status
 * dibaca dari dokumen tracking yang ada lalu ditambah, karena `orders` tidak menyimpan riwayat.
 */
export async function syncTracking(source: TrackingSource, previousStatus: OrderStatus | null): Promise<void> {
  if (!source.noInv) return;
  const status: OrderStatus = isOrderStatus(source.status) ? source.status : 'received';
  const ref = doc(db, 'tracking', source.noInv);

  let history: StatusHistory = [];
  try {
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data().statusHistory : null;
    if (Array.isArray(existing)) history = existing as StatusHistory;
  } catch {
    // Gagal membaca riwayat tidak boleh menggagalkan simpan order; riwayat dimulai ulang dari status ini.
  }
  if (history.length === 0 || previousStatus !== status) {
    history = [...history, { status, at: new Date().toISOString() }];
  }

  await setDoc(
    ref,
    {
      noInv: source.noInv,
      namaCustomer: String(source.namaCustomer || ''),
      namaProject: String(source.namaProject || ''),
      kategoriOrder: String(source.kategoriOrder || ''),
      warna: String(source.warna || ''),
      deadline: String(source.deadline || ''),
      status,
      statusLabel: STATUS_LABELS[status],
      statusHistory: history,
      totalPesanan: countPcs(source),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function invoiceNumberTaken(noInv: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, 'orders'), where('noInv', '==', noInv), limit(1)));
  return !snap.empty;
}

/** Nomor invoice tertinggi tahun itu langsung dari Firestore, agar tidak bergantung pada daftar order yang termuat di layar. */
async function latestInvoiceNumber(prefix: string): Promise<string | null> {
  // Batas atas rentang = prefix tahun berikutnya (VK26 sampai sebelum VK27).
  const upperBound = `VK${String(Number(prefix.slice(2)) + 1).padStart(2, '0')}`;
  const snap = await getDocs(
    query(collection(db, 'orders'), where('noInv', '>=', prefix), where('noInv', '<', upperBound), orderBy('noInv', 'desc'), limit(1))
  );
  return snap.empty ? null : String(snap.docs[0].data().noInv || '');
}

/** Dicek ulang ke Firestore sesaat sebelum simpan karena dua perangkat bisa membuat order bersamaan. */
export async function resolveUniqueInvoiceNumber(tanggalInv: string, knownInvs: ReadonlyArray<string>): Promise<string> {
  const date = tanggalInv ? new Date(`${tanggalInv}T00:00:00`) : new Date();
  const prefix = `VK${String(date.getFullYear()).slice(-2)}`;
  const seen = [...knownInvs];
  try {
    const latest = await latestInvoiceNumber(prefix);
    if (latest) seen.push(latest);
  } catch (err) {
    // Query rentang gagal (mis. offline): tetap lanjut dengan daftar yang termuat lalu cek keunikan per kandidat.
    console.warn('[orders] Gagal membaca nomor invoice terakhir:', err);
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateInvoiceNumber(date, seen);
    if (!(await invoiceNumberTaken(candidate))) return candidate;
    seen.push(candidate);
  }
  throw new Error('Gagal membuat No. Invoice unik. Coba simpan lagi.');
}

export async function createOrder(data: Record<string, unknown>): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), { ...data, createdAt: Timestamp.now() });
  try {
    await syncTracking(data as TrackingSource, null);
  } catch (err) {
    console.error('[orders] Sinkron tracking gagal:', err);
  }
  return ref.id;
}

export async function updateOrder(existing: LegacyOrder, data: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, 'orders', existing.id), { ...data, updatedAt: Timestamp.now() });
  try {
    await syncTracking({ ...existing, ...data, noInv: existing.noInv } as TrackingSource, existing.status);
  } catch (err) {
    console.error('[orders] Sinkron tracking gagal:', err);
  }
}

export async function deleteOrder(order: LegacyOrder): Promise<void> {
  await deleteDoc(doc(db, 'orders', order.id));
  if (order.noInv) {
    try {
      await deleteDoc(doc(db, 'tracking', order.noInv));
    } catch (err) {
      console.error('[orders] Gagal hapus tracking:', err);
    }
  }
}

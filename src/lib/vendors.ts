import type { LegacyOrder, VendorDoc } from '@/lib/legacy/types';
import { validateVendorName } from '@/lib/vendor-ref';
import { normalizeWaNumber } from '@/lib/utils';

export interface VendorFormValues {
  nama: string;
  alamat: string;
  wa: string;
  pic: string;
}

export const EMPTY_VENDOR_FORM: VendorFormValues = { nama: '', alamat: '', wa: '', pic: '' };

export function vendorToFormValues(vendor: Pick<VendorDoc, 'nama' | 'alamat' | 'wa' | 'pic'> | null | undefined): VendorFormValues {
  return {
    nama: vendor?.nama ?? '',
    alamat: vendor?.alamat ?? '',
    wa: vendor?.wa ?? '',
    pic: vendor?.pic ?? '',
  };
}

/** Semua kolom dipangkas; spasi ganda di nama dirapatkan agar "Vendor  A" dan "Vendor A" dianggap sama. */
export function normalizeVendorForm(input: Partial<VendorFormValues>): VendorFormValues {
  return {
    nama: (input.nama ?? '').trim().replace(/\s+/g, ' '),
    alamat: (input.alamat ?? '').trim(),
    wa: (input.wa ?? '').trim(),
    pic: (input.pic ?? '').trim(),
  };
}

export type VendorValidation =
  | { ok: true; values: VendorFormValues }
  | { ok: false; errors: { nama: string } };

/** Nama wajib, bukan nama pengganti, dan unik tanpa beda huruf besar/kecil; `excludeId` membebaskan vendor yang sedang diedit. */
export function validateVendorForm(
  input: Partial<VendorFormValues>,
  vendors: ReadonlyArray<Pick<VendorDoc, 'id' | 'nama'>>,
  excludeId?: string | null
): VendorValidation {
  const values = normalizeVendorForm(input);
  const nama = validateVendorName(values.nama, vendors, excludeId);
  return nama ? { ok: false, errors: { nama } } : { ok: true, values };
}

/** Isi dokumen `vendors` tanpa field waktu; repo menambahkan `createdAt` atau `updatedAt`. Semua nilai string, tidak ada `undefined`. */
export function buildVendorPayload(values: VendorFormValues): VendorFormValues {
  return { nama: values.nama, alamat: values.alamat, wa: values.wa, pic: values.pic };
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, '');
}

/** Cari di nama, PIC, WhatsApp, dan alamat. Nomor dicocokkan juga tanpa spasi atau tanda hubung. */
export function filterVendors<T extends Pick<VendorDoc, 'nama' | 'alamat' | 'wa' | 'pic'>>(vendors: ReadonlyArray<T>, term: string): T[] {
  const q = term.trim().toLowerCase();
  if (!q) return [...vendors];
  const qDigits = digitsOf(q);
  return vendors.filter((v) => {
    if ([v.nama, v.pic, v.wa, v.alamat].some((field) => (field ?? '').toLowerCase().includes(q))) return true;
    return qDigits.length >= 3 && digitsOf(v.wa ?? '').includes(qDigits);
  });
}

/** Jumlah order per `vendorId`; order tanpa vendor tidak dihitung. */
export function countOrdersByVendor(orders: ReadonlyArray<Pick<LegacyOrder, 'vendorId'>>): Map<string, number> {
  const counts = new Map<string, number>();
  orders.forEach((o) => {
    if (!o.vendorId) return;
    counts.set(o.vendorId, (counts.get(o.vendorId) ?? 0) + 1);
  });
  return counts;
}

/**
 * Alasan hapus diblokir, atau `null` bila boleh. Selama data order belum siap, jumlah pemakaian tidak diketahui
 * sehingga hapus ikut diblokir (gagal aman).
 */
export function getVendorDeleteBlockReason(orderCount: number, ordersReady: boolean): string | null {
  if (!ordersReady) return 'Data order belum selesai dimuat, jadi pemakaian vendor ini belum bisa dipastikan. Tunggu sebentar lalu coba lagi.';
  if (orderCount > 0) {
    return `${orderCount} order masih memakai vendor ini. Ganti vendor di order tersebut lewat Edit Order, lalu hapus vendor ini.`;
  }
  return null;
}

/** Tautan chat WhatsApp, atau `null` bila nomor kosong atau terlalu pendek. */
export function buildWaChatUrl(wa: string | null | undefined): string | null {
  const normalized = normalizeWaNumber(wa);
  return normalized ? `https://wa.me/${normalized}` : null;
}

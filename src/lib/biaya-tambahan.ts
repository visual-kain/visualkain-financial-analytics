import type { BiayaTambahanItem, BiayaTambahanSumber } from '@/types';

export const BIAYA_TAMBAHAN_SUMBER_OPTIONS: ReadonlyArray<{ value: BiayaTambahanSumber; label: string; hint: string }> = [
  { value: 'customer', label: 'Dari Customer', hint: 'Ditagihkan ke customer, menambah nilai invoice' },
  { value: 'vendor', label: 'Dari Vendor', hint: 'Tagihan tambahan vendor, menambah HPP' },
  { value: 'lainnya', label: 'Lainnya', hint: 'Biaya internal, menambah biaya operasional order' },
];

export interface BiayaTambahanSummary {
  customer: number;
  vendor: number;
  lainnya: number;
  /** Bagian VisualKain dari biaya tambahan. Sengaja bukan jumlah ketiganya: tagihan customer uang masuk, vendor dan lainnya uang keluar. */
  selisih: number;
}

interface BiayaTambahanSource {
  biayaTambahanList?: unknown;
  biayaTambahanCustomer?: number;
  biayaTambahanVendor?: number;
  biayaOperasional?: number;
  biayaOperasionalDasar?: number;
  totalHpp?: number;
}

export function summarizeBiayaTambahan(items: ReadonlyArray<BiayaTambahanItem>): BiayaTambahanSummary {
  const sum: BiayaTambahanSummary = { customer: 0, vendor: 0, lainnya: 0, selisih: 0 };
  for (const item of items) {
    sum[item.sumber] += Number(item.nominal) || 0;
  }
  sum.selisih = sum.customer - sum.vendor - sum.lainnya;
  return sum;
}

function sanitizeList(raw: unknown): BiayaTambahanItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && (r.sumber === 'customer' || r.sumber === 'vendor' || r.sumber === 'lainnya') && Number(r.nominal) > 0)
    .map((r, idx) => ({
      id: String(r.id || `bt-${idx + 1}`),
      keterangan: String(r.keterangan || '').trim() || 'Biaya tambahan',
      nominal: Number(r.nominal),
      sumber: r.sumber as BiayaTambahanSumber,
    }));
}

function isOpexBreakdownValid(order: BiayaTambahanSource, lainnya: number): boolean {
  if (order.biayaOperasionalDasar === undefined || order.biayaOperasionalDasar === null) return false;
  return Number(order.biayaOperasionalDasar) + lainnya === Number(order.biayaOperasional || 0);
}

/**
 * Field skalar order adalah sumber kebenaran; list hanya rincian. List dipakai bila jumlah per sumbernya
 * cocok, supaya perubahan dari aplikasi operasional (yang hanya menulis skalar) tidak tertimpa rincian lama.
 */
export function deriveBiayaTambahanItems(order: BiayaTambahanSource): BiayaTambahanItem[] {
  const scalarCustomer = Number(order.biayaTambahanCustomer || 0);
  const scalarVendor = Number(order.biayaTambahanVendor || 0);
  const list = sanitizeList(order.biayaTambahanList);
  const sum = summarizeBiayaTambahan(list);

  const customerVendorItems =
    list.length > 0 && sum.customer === scalarCustomer && sum.vendor === scalarVendor
      ? list.filter((i) => i.sumber !== 'lainnya')
      : [
          ...(scalarCustomer > 0
            ? [{ id: 'bt-customer-lama', keterangan: 'Biaya tambahan customer', nominal: scalarCustomer, sumber: 'customer' as const }]
            : []),
          ...(scalarVendor > 0
            ? [{ id: 'bt-vendor-lama', keterangan: 'Biaya tambahan vendor', nominal: scalarVendor, sumber: 'vendor' as const }]
            : []),
        ];

  const lainnyaItems = isOpexBreakdownValid(order, sum.lainnya) ? list.filter((i) => i.sumber === 'lainnya') : [];
  return [...customerVendorItems, ...lainnyaItems];
}

/** HPP dan biaya operasional sebelum biaya tambahan, sehingga dasar + tambahan = nilai tersimpan. */
export function deriveCostBase(
  order: BiayaTambahanSource,
  items: ReadonlyArray<BiayaTambahanItem>
): { hppDasar: number; opexDasar: number } {
  const sum = summarizeBiayaTambahan(items);
  return {
    hppDasar: Math.max(0, Number(order.totalHpp || 0) - sum.vendor),
    opexDasar: Math.max(0, Number(order.biayaOperasional || 0) - sum.lainnya),
  };
}

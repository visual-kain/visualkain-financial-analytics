import type { CashOutflowCategory } from '@/types';

/**
 * Konstanta Standar Akuntansi & Finansial VisualKain 2026
 * Sumber Acuan: Dokumen Konfirmasi Fitur & Arsitektur Finansial VisualKain (Oktober 2026)
 */

export const FINANCE_START_DATE = '2026-10-01';

// Hanya proses transaksi mulai 1 Oktober 2026 ke atas sesuai kesepakatan pembukuan klien.
export function isFromFinanceStartDate(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return dateStr.slice(0, 10) >= FINANCE_START_DATE;
}

/** Tanggal hari ini (YYYY-MM-DD) di zona Asia/Jakarta; toISOString() memakai UTC sehingga 00.00–07.00 WIB terbaca kemarin. */
export function todayInJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

export function getDefaultFinanceDate(): string {
  const today = todayInJakarta();
  return today >= FINANCE_START_DATE ? today : FINANCE_START_DATE;
}

export const CURRENCY_CONFIG = {
  locale: 'id-ID',
  prefix: 'Rp ',
  thousandSeparator: '.',
  decimalSeparator: ',',
  currencyCode: 'IDR',
} as const;

export const SOP_FINANCE = {
  /** Ambang batas minimal pembayaran konsumen agar bahan boleh dipotong & dijahit */
  DP_THRESHOLD_PERCENT: 70,
  /** Persentase pelunasan akhir saat barang selesai sebelum pengiriman */
  PELUNASAN_PERCENT: 30,
  /** Target margin laba kotor minimal perusahaan */
  TARGET_MINIMUM_MARGIN_PERCENT: 30,
} as const;

export const REKENING_RESMI = {
  bca: {
    bank: 'Bank Central Asia (BCA)',
    rekening: '8830-1928-41',
    atasNama: 'PT VISUAL KAIN INDONESIA',
    badge: 'Utama',
  },
  mandiri: {
    bank: 'Bank Mandiri',
    rekening: '137-00-1928-11',
    atasNama: 'PT VISUAL KAIN INDONESIA',
    badge: 'Operasional',
  },
} as const;

export const REKENING_OPTIONS = [
  { value: 'bca', label: 'Bank Central Asia (BCA) - 8830-1928-41', badge: 'Utama' },
  { value: 'mandiri', label: 'Bank Mandiri - 137-00-1928-11', badge: 'Operasional' },
  { value: 'kas_tunai', label: 'Kas Tunai Operasional' },
] as const;

export const DEFAULT_VENDOR_OPTIONS = [
  { value: 'AMRIN', label: 'AMRIN (Kaos Polos & Sablon)', badge: 'Termurah Kaos' },
  { value: 'CAHAYA BORDIR', label: 'CAHAYA BORDIR (Kemeja & Polo)', badge: 'Termurah Kemeja' },
  { value: 'FJ MERCHANDISE', label: 'FJ MERCHANDISE (Jaket & Jersey)', badge: 'Termurah Jaket' },
  { value: 'CITITEX', label: 'CITITEX (Hoodie & Crewneck)', badge: 'Termurah Hoodie' },
  { value: 'VENDOR TOPI PK UCI', label: 'VENDOR TOPI PK UCI', badge: 'Termurah Topi' },
  { value: 'Vendor Wisnu', label: 'Vendor Wisnu (Kemeja & Celana)', badge: 'Mitra Konveksi' },
  { value: 'LAJUWARNA', label: 'LAJUWARNA (Sublim & Printing)', badge: 'Mitra Printing' },
  { value: 'LAINNYA', label: 'Mitra Vendor Lainnya' },
] as const;

export const DEFAULT_PAYMENT_CHANNELS = [
  { value: 'Transfer BCA', label: 'Bank BCA (8830-1928-41)', badge: 'Utama' },
  { value: 'Transfer Mandiri', label: 'Bank Mandiri (137-00-1928-11)' },
  { value: 'Transfer BRI', label: 'Bank BRI' },
  { value: 'Tokopedia', label: 'Marketplace Tokopedia' },
  { value: 'Tunai / Cash', label: 'Kasir / Tunai Operasional' },
] as const;

/** Kategori yang bisa dipilih di form Dana Keluar non-order; juga sumber opsi filter tab Kas Keluar. */
export const KATEGORI_KAS_KELUAR_OPTIONS: ReadonlyArray<{ value: CashOutflowCategory; label: string }> = [
  { value: 'Operasional', label: 'Biaya Operasional Umum (Listrik, Sewa, Admin)' },
  { value: 'Gaji/Upah', label: 'Gaji, Upah Jahit & Tim' },
  { value: 'Pembayaran Vendor Lainnya', label: 'Pembayaran Vendor Lainnya (Di Luar Pesanan)' },
  { value: 'Sponsorship/Sosial', label: 'Sponsorship & Kegiatan Sosial' },
  { value: 'Iklan/Marketing', label: 'Iklan & Marketing (Ads, Promosi)' },
  { value: 'Bahan Baku', label: 'Belanja Bahan Baku & Aksesoris' },
  { value: 'Perawatan Web/Sistem', label: 'Perawatan Web & Sistem IT' },
  { value: 'Transport/Ongkir', label: 'Transportasi, Kurir & Ongkir' },
  { value: 'Pajak/Retribusi', label: 'Pajak & Retribusi Usaha' },
  { value: 'Keuangan', label: 'Biaya Keuangan & Administrasi Bank' },
  { value: 'Biaya Lain', label: 'Beban Pengeluaran Lainnya' },
];

export function buildOutflowCategoryOptions(dataCategories: ReadonlyArray<string>): Array<{ value: string; label: string; badge?: string }> {
  const options: Array<{ value: string; label: string; badge?: string }> = [
    { value: 'all', label: 'Semua Kategori Beban', badge: 'Semua' },
    { value: 'Pembayaran Vendor', label: 'Pembayaran Vendor (Order)' },
    { value: 'Biaya Operasional Order', label: 'Biaya Operasional Order' },
    ...KATEGORI_KAS_KELUAR_OPTIONS,
  ];
  const known = new Set(options.map((o) => o.value));
  for (const kategori of dataCategories) {
    if (kategori && !known.has(kategori)) {
      known.add(kategori);
      options.push({ value: kategori, label: kategori });
    }
  }
  return options;
}

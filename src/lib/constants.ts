/**
 * Konstanta Standar Akuntansi & Finansial VisualKain 2026
 * Sumber Acuan: Dokumen Konfirmasi Fitur & Arsitektur Finansial VisualKain (Oktober 2026)
 */

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

/**
 * Bentuk dokumen Firestore yang dipakai bersama `visualkaindb`. Field dibiarkan longgar karena dokumen lama
 * bisa tidak lengkap; pembacaan selalu memakai fallback.
 */

export type OrderStatus =
  | 'received'
  | 'payment'
  | 'production'
  | 'finishing'
  | 'qc'
  | 'packing'
  | 'delivery'
  | 'completed';

export const STATUS_ORDER: OrderStatus[] = [
  'received',
  'payment',
  'production',
  'finishing',
  'qc',
  'packing',
  'delivery',
  'completed',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Pesanan Diterima',
  payment: 'Pembayaran Dikonfirmasi',
  production: 'Produksi',
  finishing: 'Finishing',
  qc: 'Quality Control',
  packing: 'Packing',
  delivery: 'Delivery',
  completed: 'Selesai',
};

/** Label chip filter, sama dengan `visualkaindb` FilterSection. */
export const STATUS_FILTER_LABELS: Record<OrderStatus, string> = {
  received: 'Diterima',
  payment: 'Pembayaran',
  production: 'Produksi',
  finishing: 'Finishing',
  qc: 'QC',
  packing: 'Packing',
  delivery: 'Delivery',
  completed: 'Selesai',
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (STATUS_ORDER as string[]).includes(value);
}

export interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds?: number;
  toDate?: () => Date;
}

export interface LegacyOrder {
  id: string;
  noInv: string;
  tanggalInv?: string;
  namaCustomer: string;
  noWaCustomer?: string;
  namaProject?: string;
  jenisMetodeProduksi?: string;
  kategoriOrder?: string;
  jenisBahan?: string;
  warna?: string;
  deadline?: string;
  notes?: string;
  prodDetail1?: string;
  prodDetail2?: string;
  prodDetail3?: string;
  prodDetail4?: string;
  hargaPendek?: number;
  hargaPanjang?: number;
  hargaTanpaLengan?: number;
  hargaTigaPerempat?: number;
  diskonHarga?: number;
  hargaVendorPendek?: number;
  hargaVendorPanjang?: number;
  hargaVendorTanpaLengan?: number;
  hargaVendorTigaPerempat?: number;
  biayaOperasional?: number;
  dpPersen?: number;
  dpPersenPO?: number;
  dpNominal?: number;
  dpNominalPO?: number;
  dp1Nominal?: number;
  dp1Tanggal?: string;
  dp2Nominal?: number;
  dp2Tanggal?: string;
  pelunasanNominal?: number;
  pelunasanTanggal?: string;
  targetDpPersen?: number;
  status: OrderStatus;
  vendorId?: string;
  sizeChartId?: string;
  accCustUrl?: string | null;
  createdBy?: string;
  createdByEmail?: string;
  isManualFinanceOverride?: boolean;
  createdAt?: FirestoreTimestampLike | null;
  updatedAt?: FirestoreTimestampLike | null;
  [key: string]: unknown;
}

export interface BankAccountInfo {
  bankName: string;
  noRekening: string;
  atasNama: string;
}

export interface SizeChartData {
  panjang: number;
  lebar: number;
}

export interface SizeChart {
  id: string;
  nama: string;
  sizes: Record<string, SizeChartData>;
  createdAt?: FirestoreTimestampLike | null;
}

export interface KategoriDoc {
  id: string;
  nama: string;
}

export interface VendorDoc {
  id: string;
  nama: string;
  alamat?: string;
  wa?: string;
  pic?: string;
}

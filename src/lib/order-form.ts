import {
  CATEGORIES,
  SIZES,
  calculateTotals,
  priceKey,
  qtyKey,
  vendorPriceKey,
  type CategoryType,
} from '@/lib/legacy/calculations';
import { computeEditableNet } from '@/lib/calculations';
import { deriveOrderVendorPaid } from '@/lib/order-payments';
import { mapFinanceOrderDoc } from '@/lib/finance-order-mapper';
import { formatRupiah } from '@/lib/utils';
import { calculateOrderTotals } from '@/lib/calculations';
import { FINANCE_START_DATE } from '@/lib/constants';
import { isOrderStatus, type LegacyOrder, type OrderStatus } from '@/lib/legacy/types';

export interface OrderFormState {
  tanggalInv: string;
  noInv: string;
  namaCustomer: string;
  noWaCustomer: string;
  namaProject: string;
  jenisMetodeProduksi: string;
  kategoriOrder: string;
  jenisBahan: string;
  warna: string;
  deadline: string;
  notes: string;
  accCustUrl: string;
  sizeChartId: string;
  prodDetail1: string;
  prodDetail2: string;
  prodDetail3: string;
  prodDetail4: string;
  harga: Record<CategoryType, number>;
  hargaVendor: Record<CategoryType, number>;
  vendorId: string;
  diskonHarga: number;
  status: OrderStatus;
  qty: Record<string, number>;
}

function emptyByCategory(): Record<CategoryType, number> {
  return { pendek: 0, panjang: 0, tanpaLengan: 0, tigaPerempat: 0 };
}

export function emptyQty(): Record<string, number> {
  const qty: Record<string, number> = {};
  CATEGORIES.forEach((cat) => SIZES.forEach((s) => (qty[qtyKey(cat, s)] = 0)));
  return qty;
}

export function createEmptyOrderForm(tanggalInv: string, noInv: string): OrderFormState {
  return {
    tanggalInv,
    noInv,
    namaCustomer: '',
    noWaCustomer: '',
    namaProject: '',
    jenisMetodeProduksi: '',
    kategoriOrder: '',
    jenisBahan: '',
    warna: '',
    deadline: '',
    notes: '',
    accCustUrl: '',
    sizeChartId: '',
    prodDetail1: '',
    prodDetail2: '',
    prodDetail3: '',
    prodDetail4: '',
    harga: emptyByCategory(),
    hargaVendor: emptyByCategory(),
    vendorId: '',
    diskonHarga: 0,
    status: 'received',
    qty: emptyQty(),
  };
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function n(value: unknown): number {
  const v = Number(value);
  return Number.isFinite(v) ? v : 0;
}

export function orderToForm(order: LegacyOrder): OrderFormState {
  const harga = emptyByCategory();
  const hargaVendor = emptyByCategory();
  const qty = emptyQty();
  CATEGORIES.forEach((cat) => {
    harga[cat] = n(order[priceKey(cat)]);
    hargaVendor[cat] = n(order[vendorPriceKey(cat)]);
    SIZES.forEach((s) => (qty[qtyKey(cat, s)] = n(order[qtyKey(cat, s)])));
  });
  return {
    tanggalInv: str(order.tanggalInv),
    noInv: str(order.noInv),
    namaCustomer: str(order.namaCustomer),
    noWaCustomer: str(order.noWaCustomer),
    namaProject: str(order.namaProject),
    jenisMetodeProduksi: str(order.jenisMetodeProduksi),
    kategoriOrder: str(order.kategoriOrder),
    jenisBahan: str(order.jenisBahan),
    warna: str(order.warna),
    deadline: str(order.deadline),
    notes: str(order.notes),
    accCustUrl: str(order.accCustUrl),
    sizeChartId: str(order.sizeChartId),
    prodDetail1: str(order.prodDetail1),
    prodDetail2: str(order.prodDetail2),
    prodDetail3: str(order.prodDetail3),
    prodDetail4: str(order.prodDetail4),
    harga,
    hargaVendor,
    vendorId: str(order.vendorId),
    diskonHarga: n(order.diskonHarga),
    status: isOrderStatus(order.status) ? order.status : 'received',
    qty,
  };
}

/** Field datar dengan nama kolom `visualkaindb` (tanpa field DP/pembayaran, K-16). */
export function formToOrderFields(form: OrderFormState): Record<string, string | number | null> {
  const fields: Record<string, string | number | null> = {
    sizeChartId: form.sizeChartId || '',
    tanggalInv: form.tanggalInv,
    noInv: form.noInv,
    namaCustomer: form.namaCustomer.trim(),
    noWaCustomer: form.noWaCustomer.trim(),
    namaProject: form.namaProject.trim(),
    jenisMetodeProduksi: form.jenisMetodeProduksi.trim(),
    kategoriOrder: form.kategoriOrder,
    jenisBahan: form.jenisBahan.trim(),
    warna: form.warna.trim(),
    deadline: form.deadline,
    notes: form.notes,
    accCustUrl: form.accCustUrl || null,
    prodDetail1: form.prodDetail1,
    prodDetail2: form.prodDetail2,
    prodDetail3: form.prodDetail3,
    prodDetail4: form.prodDetail4,
    diskonHarga: form.diskonHarga || 0,
    status: form.status,
    vendorId: form.vendorId,
  };
  CATEGORIES.forEach((cat) => {
    fields[priceKey(cat)] = form.harga[cat] || 0;
    fields[vendorPriceKey(cat)] = form.hargaVendor[cat] || 0;
    SIZES.forEach((s) => (fields[qtyKey(cat, s)] = form.qty[qtyKey(cat, s)] || 0));
  });
  return fields;
}

export interface FormSummary {
  totalPesanan: number;
  qtyPerKategori: Record<CategoryType, number>;
  jumlahSemua: number;
  modalVendor: number;
  biayaOperasional: number;
  profit: number;
  profitPercent: number;
}

/** Ringkasan footer form; profit memakai rumus tabel (dikurangi biaya operasional, K-17). */
export function summarizeForm(form: OrderFormState, biayaOperasional: number): FormSummary {
  const totals = calculateTotals({ ...formToOrderFields(form), biayaOperasional });
  return {
    totalPesanan: totals.totalPesanan,
    qtyPerKategori: totals.qtyPerKategori,
    jumlahSemua: totals.jumlahSemua,
    modalVendor: totals.grossModal,
    biayaOperasional,
    profit: totals.profit,
    profitPercent: totals.profitPercent,
  };
}

export interface CreatedBy {
  name: string;
  email: string;
}

/** Field tambahan order baru supaya modul finansial membaca order belum dibayar (K-16). */
export function buildCreateExtras(createdBy: CreatedBy): Record<string, unknown> {
  return {
    dpPersen: 70,
    dpNominal: 0,
    dpPersenPO: 0,
    dpNominalPO: 0,
    biayaOperasional: 0,
    pembayaranList: [],
    createdBy: createdBy.name,
    createdByEmail: createdBy.email,
  };
}

const PRICING_KEYS: string[] = (() => {
  const keys = ['diskonHarga'];
  CATEGORIES.forEach((cat) => {
    keys.push(priceKey(cat), vendorPriceKey(cat));
    SIZES.forEach((s) => keys.push(qtyKey(cat, s)));
  });
  return keys;
})();

export function pricingChanged(existing: Record<string, unknown>, next: Record<string, unknown>): boolean {
  return PRICING_KEYS.some((k) => n(existing[k]) !== n(next[k]));
}

/**
 * Untuk order yang totalnya pernah dikunci editor finansial, hitung ulang total dengan rumus editor finansial
 * agar perubahan qty/harga di Data Customer ikut tercermin (K-16, design §3.3).
 */
export function buildOverrideSync(existing: Record<string, unknown>, next: Record<string, unknown>): Record<string, number> {
  if (existing.isManualFinanceOverride !== true || !pricingChanged(existing, next)) return {};
  const legacy = calculateTotals(next);
  const btCustomer = n(existing.biayaTambahanCustomer ?? existing.biayaTambahanCust);
  const btVendor = n(existing.biayaTambahanVendor ?? existing.biayaLainnya);
  const diskon = n(next.diskonHarga);
  const net = computeEditableNet(legacy.grossTotal, diskon, btCustomer);
  const hpp = legacy.grossModal + btVendor;
  const profit = net - hpp - n(existing.biayaOperasional);
  return {
    grossTotal: legacy.grossTotal,
    totalInvoice: net,
    jumlahSemua: net,
    diskon,
    totalHpp: hpp,
    totalBiayaVendor: hpp,
    hppAktual: hpp,
    profitAktual: profit,
    targetMargin: profit,
  };
}

export function isArchivedOrder(order: Pick<LegacyOrder, 'tanggalInv'>): boolean {
  const tgl = typeof order.tanggalInv === 'string' ? order.tanggalInv.slice(0, 10) : '';
  return !tgl || tgl < FINANCE_START_DATE;
}

export interface PaymentSnapshot {
  customerPaid: number;
  vendorPaid: number;
}

/** Uang masuk customer dan pembayaran vendor persis seperti yang dibaca modul finansial. */
export function paymentSnapshot(order: LegacyOrder): PaymentSnapshot {
  const mapped = mapFinanceOrderDoc(order.id, order, () => undefined);
  return { customerPaid: mapped.totalUangMasukCustomer, vendorPaid: mapped.totalDibayarKeVendor };
}

/**
 * Edit qty/harga tidak boleh membuat total tagihan lebih kecil dari uang yang sudah diterima, sama seperti
 * pengecekan di editor finansial. Mengembalikan pesan galat atau null.
 */
export function paidExceedsTotalError(existing: LegacyOrder, next: Record<string, unknown>): string | null {
  const paid = paymentSnapshot(existing).customerPaid;
  if (paid <= 0) return null;
  const newTotal = mapFinanceOrderDoc(existing.id, { ...existing, ...next }, () => undefined).totalInvoice;
  if (paid <= newTotal) return null;
  return `Total tagihan baru (${formatRupiah(newTotal)}) lebih kecil dari pembayaran yang sudah diterima (${formatRupiah(paid)}). Periksa qty/harga atau koreksi pembayaran di modul finansial.`;
}

/** Nama vendor ikut ditulis saat vendor berubah karena modul finansial memakai `vendorName` sebagai cadangan. */
export function vendorNameUpdate(prevVendorId: string | undefined, nextVendorId: string, vendors: ReadonlyArray<{ id: string; nama: string }>): Record<string, string> {
  if ((prevVendorId || '') === nextVendorId) return {};
  return { vendorName: nextVendorId ? vendors.find((v) => v.id === nextVendorId)?.nama || '' : '' };
}

/** Tanggal invoice wajib dan tidak boleh sebelum 1 Okt 2026, karena order lebih lama diperlakukan sebagai arsip. */
export function invoiceDateError(tanggalInv: string): string | null {
  if (!tanggalInv) return 'Tanggal invoice wajib diisi';
  if (tanggalInv.slice(0, 10) < FINANCE_START_DATE) return 'Tanggal invoice minimal 1 Oktober 2026';
  return null;
}

/** Alasan hapus diblokir, atau null bila order boleh dihapus (K-18). */
export function getDeleteBlockReason(order: LegacyOrder): string | null {
  const { customerPaid, vendorPaid } = paymentSnapshot(order);
  const parts: string[] = [];
  if (customerPaid > 0) parts.push('pembayaran customer di Dana Masuk');
  if (vendorPaid > 0) parts.push('pembayaran vendor di Dana Keluar');
  if (parts.length === 0) return null;
  return `Order ini sudah punya ${parts.join(' dan ')}. Hapus pembayarannya dulu di modul finansial, baru order bisa dihapus.`;
}

/** Sisa utang vendor untuk dialog pelunasan vendor saat status Selesai dipilih. */
export function vendorOutstanding(order: Record<string, unknown>): number {
  const totals = calculateOrderTotals(order);
  return Math.max(0, totals.totalHpp - deriveOrderVendorPaid(order, totals.totalHpp));
}

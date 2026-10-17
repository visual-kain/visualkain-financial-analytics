import { calculateTotals } from '@/lib/legacy/calculations';
import { timestampToDate } from '@/lib/legacy/formatters';
import { STATUS_ORDER, type LegacyOrder, type OrderStatus } from '@/lib/legacy/types';
import { isArchivedOrder } from '@/lib/order-form';

export type DataCustomerScope = 'current' | 'archive';
export type StatusFilter = OrderStatus | 'all';

export interface DataCustomerRow {
  order: LegacyOrder;
  id: string;
  noInv: string;
  namaCustomer: string;
  namaProject: string;
  deadline: string;
  jenisMetodeProduksi: string;
  kategoriOrder: string;
  jenisBahan: string;
  warna: string;
  createdBy: string;
  accCustUrl: string;
  qtyTotal: number;
  qtyTanpaLengan: number;
  qtyPendek: number;
  qtyTigaPerempat: number;
  qtyPanjang: number;
  vendorName: string;
  createdAt: Date | null;
  status: OrderStatus;
  archived: boolean;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function toDataCustomerRow(order: LegacyOrder, vendorName: string): DataCustomerRow {
  const totals = calculateTotals(order);
  return {
    order,
    id: order.id,
    noInv: order.noInv,
    namaCustomer: text(order.namaCustomer),
    namaProject: text(order.namaProject),
    deadline: text(order.deadline),
    jenisMetodeProduksi: text(order.jenisMetodeProduksi),
    kategoriOrder: text(order.kategoriOrder),
    jenisBahan: text(order.jenisBahan),
    warna: text(order.warna),
    createdBy: text(order.createdBy),
    accCustUrl: text(order.accCustUrl),
    qtyTotal: totals.totalPesanan,
    qtyTanpaLengan: totals.qtyPerKategori.tanpaLengan,
    qtyPendek: totals.qtyPerKategori.pendek,
    qtyTigaPerempat: totals.qtyPerKategori.tigaPerempat,
    qtyPanjang: totals.qtyPerKategori.panjang,
    vendorName,
    createdAt: timestampToDate(order.createdAt),
    status: order.status,
    archived: isArchivedOrder(order),
  };
}

/** Pencarian sama dengan `visualkaindb`: customer, No. Invoice, project, metode produksi. */
export function matchesSearch(row: DataCustomerRow, term: string): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return [row.namaCustomer, row.noInv, row.namaProject, row.jenisMetodeProduksi].some((v) => v.toLowerCase().includes(q));
}

export function scopeRows(rows: DataCustomerRow[], scope: DataCustomerScope): DataCustomerRow[] {
  return rows.filter((r) => (scope === 'archive' ? r.archived : !r.archived));
}

export function countByStatus(rows: DataCustomerRow[]): Record<StatusFilter, number> {
  const counts = { all: rows.length } as Record<StatusFilter, number>;
  STATUS_ORDER.forEach((s) => (counts[s] = 0));
  rows.forEach((r) => (counts[r.status] = (counts[r.status] || 0) + 1));
  return counts;
}

export interface DataCustomerFilter {
  search: string;
  status: StatusFilter;
  scope: DataCustomerScope;
}

export function filterDataCustomerRows(rows: DataCustomerRow[], filter: DataCustomerFilter): DataCustomerRow[] {
  return scopeRows(rows, filter.scope).filter(
    (r) => (filter.status === 'all' || r.status === filter.status) && matchesSearch(r, filter.search)
  );
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** "2026-10-20" → "20 Okt 2026". */
export function formatShortIsoDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
  if (!match) return value || '-';
  return `${Number(match[3])} ${MONTH_SHORT[Number(match[2]) - 1] ?? match[2]} ${match[1]}`;
}

/** Deadline lewat dan order belum selesai. */
export function isDeadlineOverdue(row: Pick<DataCustomerRow, 'deadline' | 'status'>, today: string): boolean {
  return !!row.deadline && row.status !== 'completed' && row.deadline.slice(0, 10) < today;
}

export interface QtySummary {
  total: number;
  tanpaLengan: number;
  pendek: number;
  tigaPerempat: number;
  panjang: number;
}

export function summarizeQty(rows: DataCustomerRow[]): QtySummary {
  return rows.reduce<QtySummary>(
    (acc, r) => ({
      total: acc.total + r.qtyTotal,
      tanpaLengan: acc.tanpaLengan + r.qtyTanpaLengan,
      pendek: acc.pendek + r.qtyPendek,
      tigaPerempat: acc.tigaPerempat + r.qtyTigaPerempat,
      panjang: acc.panjang + r.qtyPanjang,
    }),
    { total: 0, tanpaLengan: 0, pendek: 0, tigaPerempat: 0, panjang: 0 }
  );
}

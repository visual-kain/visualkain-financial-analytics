import { CATEGORIES, SIZES, calculateTotals, qtyKey, type CategoryType, type SizeType } from '@/lib/legacy/calculations';
import { STATUS_ORDER, type LegacyOrder, type OrderStatus } from '@/lib/legacy/types';

/**
 * Ringkasan produksi (Fase 3, pengganti kartu operasional beranda visualkaindb: StatsGrid, ProductionPortfolioMix,
 * OperationalRadarCard, leaderboard bahan). Hanya angka operasional; angka uang ada di Ringkasan Finansial.
 */

export const IN_PRODUCTION: OrderStatus[] = ['production', 'finishing', 'qc', 'packing'];
export const QUEUE: OrderStatus[] = ['received', 'payment'];

export interface StatusBucket {
  count: number;
  pcs: number;
}

export interface ProductionKpi {
  aktif: StatusBucket;
  antrean: StatusBucket;
  produksi: StatusBucket;
  pengiriman: StatusBucket;
  selesai: StatusBucket;
  lewatDeadline: number;
}

function pcs(order: LegacyOrder): number {
  return calculateTotals(order).totalPesanan;
}

function bucket(orders: LegacyOrder[]): StatusBucket {
  return { count: orders.length, pcs: orders.reduce((acc, o) => acc + pcs(o), 0) };
}

/** Selisih hari kalender antara deadline dan hari ini (negatif = lewat). */
export function daysUntil(deadline: string, today: string): number {
  const d = Date.UTC(Number(deadline.slice(0, 4)), Number(deadline.slice(5, 7)) - 1, Number(deadline.slice(8, 10)));
  const t = Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)));
  return Math.round((d - t) / 86400000);
}

function hasDeadline(o: LegacyOrder): boolean {
  return typeof o.deadline === 'string' && /^\d{4}-\d{2}-\d{2}/.test(o.deadline);
}

export function computeKpi(orders: LegacyOrder[], today: string): ProductionKpi {
  const active = orders.filter((o) => o.status !== 'completed');
  return {
    aktif: bucket(active),
    antrean: bucket(orders.filter((o) => QUEUE.includes(o.status))),
    produksi: bucket(orders.filter((o) => IN_PRODUCTION.includes(o.status))),
    pengiriman: bucket(orders.filter((o) => o.status === 'delivery')),
    selesai: bucket(orders.filter((o) => o.status === 'completed')),
    lewatDeadline: active.filter((o) => hasDeadline(o) && daysUntil(String(o.deadline), today) < 0).length,
  };
}

export function pipelineCounts(orders: LegacyOrder[]): Array<{ status: OrderStatus; count: number; pcs: number }> {
  return STATUS_ORDER.map((status) => ({ status, ...bucket(orders.filter((o) => o.status === status)) }));
}

export type DeadlineTone = 'lewat' | 'mendesak' | 'aman';

export interface DeadlineItem {
  order: LegacyOrder;
  days: number;
  tone: DeadlineTone;
  label: string;
}

/** Ambang H-3 dari OperationalRadarCard visualkaindb: ≤ 3 hari mendesak, lewat bila negatif. */
export function deadlineTone(days: number): DeadlineTone {
  if (days < 0) return 'lewat';
  if (days <= 3) return 'mendesak';
  return 'aman';
}

export function deadlineLabel(days: number): string {
  if (days < 0) return `Telat ${Math.abs(days)} hari`;
  if (days === 0) return 'Hari ini';
  return `Sisa ${days} hari`;
}

export function deadlineRadar(
  orders: LegacyOrder[],
  today: string
): { items: DeadlineItem[]; counts: Record<DeadlineTone, number>; tanpaDeadline: number; undated: LegacyOrder[] } {
  const active = orders.filter((o) => o.status !== 'completed');
  const items = active
    .filter(hasDeadline)
    .map((order) => {
      const days = daysUntil(String(order.deadline), today);
      return { order, days, tone: deadlineTone(days), label: deadlineLabel(days) };
    })
    .sort((a, b) => a.days - b.days);
  const counts: Record<DeadlineTone, number> = { lewat: 0, mendesak: 0, aman: 0 };
  items.forEach((i) => (counts[i.tone] += 1));
  const undated = active.filter((o) => !hasDeadline(o));
  return { items, counts, tanpaDeadline: undated.length, undated };
}

export interface ShareRow {
  label: string;
  count: number;
  pcs: number;
  share: number;
}

/** Peringkat berdasarkan jumlah order (bukan omzet), dengan sisa digabung menjadi "Lainnya". */
export function rankBy(orders: LegacyOrder[], key: (o: LegacyOrder) => string, limit = 5): ShareRow[] {
  const map = new Map<string, { count: number; pcs: number }>();
  orders.forEach((o) => {
    const label = key(o).trim() || 'Tanpa keterangan';
    const cur = map.get(label) || { count: 0, pcs: 0 };
    map.set(label, { count: cur.count + 1, pcs: cur.pcs + pcs(o) });
  });
  const total = orders.length || 1;
  const sorted = [...map.entries()].map(([label, v]) => ({ label, ...v, share: v.count / total })).sort((a, b) => b.count - a.count || b.pcs - a.pcs);
  if (sorted.length <= limit) return sorted;
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const lainnya = rest.reduce((acc, r) => ({ label: 'Lainnya', count: acc.count + r.count, pcs: acc.pcs + r.pcs, share: acc.share + r.share }), { label: 'Lainnya', count: 0, pcs: 0, share: 0 });
  return [...top, lainnya];
}

export function sleeveTotals(orders: LegacyOrder[]): { tanpaLengan: number; pendek: number; tigaPerempat: number; panjang: number; total: number } {
  return orders.reduce(
    (acc, o) => {
      const q = calculateTotals(o).qtyPerKategori;
      return {
        tanpaLengan: acc.tanpaLengan + q.tanpaLengan,
        pendek: acc.pendek + q.pendek,
        tigaPerempat: acc.tigaPerempat + q.tigaPerempat,
        panjang: acc.panjang + q.panjang,
        total: acc.total + q.tanpaLengan + q.pendek + q.tigaPerempat + q.panjang,
      };
    },
    { tanpaLengan: 0, pendek: 0, tigaPerempat: 0, panjang: 0, total: 0 }
  );
}

export const MONTH_LABELS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'] as const;

/** Bulan acuan tren, sama dengan FinancialTrendChart visualkaindb: tanggal invoice, lalu tanggal dibuat. */
export function orderMonth(o: LegacyOrder): { year: number; month0: number } | null {
  const inv = typeof o.tanggalInv === 'string' ? o.tanggalInv.trim() : '';
  const iso = /^(d{4})-(d{2})/.exec(inv);
  if (iso) return { year: Number(iso[1]), month0: Number(iso[2]) - 1 };
  if (inv) {
    const d = new Date(inv);
    if (!Number.isNaN(d.getTime())) return { year: d.getFullYear(), month0: d.getMonth() };
  }
  const seconds = o.createdAt?.seconds;
  if (typeof seconds !== 'number') return null;
  // Digeser ke WIB supaya order yang dibuat dini hari tanggal 1 tidak jatuh ke bulan sebelumnya.
  const d = new Date(seconds * 1000 + 7 * 3600 * 1000);
  return { year: d.getUTCFullYear(), month0: d.getUTCMonth() };
}

export interface MonthVolume {
  month0: number;
  label: string;
  count: number;
  pcs: number;
}

export function orderYears(orders: LegacyOrder[]): number[] {
  const years = new Set<number>();
  orders.forEach((o) => {
    const m = orderMonth(o);
    if (m) years.add(m.year);
  });
  return [...years].sort((a, b) => b - a);
}

export function monthlyVolume(orders: LegacyOrder[], year: number): MonthVolume[] {
  const months = MONTH_LABELS.map((label, month0) => ({ month0, label, count: 0, pcs: 0 }));
  orders.forEach((o) => {
    const m = orderMonth(o);
    if (!m || m.year !== year) return;
    months[m.month0].count += 1;
    months[m.month0].pcs += pcs(o);
  });
  return months;
}

export interface YearVolume {
  count: number;
  pcs: number;
  activeMonths: number;
  avgPcsPerMonth: number;
  avgCountPerMonth: number;
  avgPcsPerOrder: number;
}

/** Rata-rata dibagi bulan yang punya order (minimal 1), seperti kartu "Rata-rata / Bulan" visualkaindb. */
export function summarizeYear(months: MonthVolume[]): YearVolume {
  const count = months.reduce((acc, m) => acc + m.count, 0);
  const total = months.reduce((acc, m) => acc + m.pcs, 0);
  const activeMonths = months.filter((m) => m.count > 0).length || 1;
  return {
    count,
    pcs: total,
    activeMonths,
    avgPcsPerMonth: Math.round(total / activeMonths),
    avgCountPerMonth: Math.round((count / activeMonths) * 10) / 10,
    avgPcsPerOrder: count > 0 ? Math.round(total / count) : 0,
  };
}

export function peakMonth(months: MonthVolume[], metric: 'pcs' | 'count'): MonthVolume | null {
  const top = [...months].sort((a, b) => b[metric] - a[metric])[0];
  return top && top[metric] > 0 ? top : null;
}

/** Tick skala adaptif (akar) dari visualkaindb agar bulan bervolume kecil tetap terbaca di samping lonjakan. */
export function adaptiveTicks(max: number, floor: number): number[] {
  const m = Math.max(max, floor);
  return [...new Set([0, Math.round(m * 0.05), Math.round(m * 0.2), Math.round(m * 0.5), Math.round(m)])];
}

export interface CategorySlice {
  name: string;
  count: number;
  pcs: number;
  /** Persentase jumlah order, satu desimal. */
  percentage: number;
}

/** Donut ProductionPortfolioMix: urut pcs terbanyak, persen dari jumlah order, kosong menjadi "Lainnya". */
export function categoryMix(orders: LegacyOrder[]): CategorySlice[] {
  const map = new Map<string, { count: number; pcs: number }>();
  orders.forEach((o) => {
    const name = String(o.kategoriOrder || '') || 'Lainnya';
    const cur = map.get(name) || { count: 0, pcs: 0 };
    map.set(name, { count: cur.count + 1, pcs: cur.pcs + pcs(o) });
  });
  const total = orders.length || 1;
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v, percentage: Number(((v.count / total) * 100).toFixed(1)) }))
    .sort((a, b) => b.pcs - a.pcs);
}

export interface LeaderRow {
  label: string;
  count: number;
  pcs: number;
  /** Panjang bar relatif terhadap peringkat pertama (0-100). */
  ratio: number;
  /** Porsi pcs terhadap seluruh pcs, satu desimal. */
  sharePct: number;
}

/** Leaderboard visualkaindb (tab Bahan Baku): urut jumlah order, label kosong dilewati, maksimal 6 baris. */
export function leaderboard(orders: LegacyOrder[], key: (o: LegacyOrder) => string, limit = 6): LeaderRow[] {
  const map = new Map<string, { count: number; pcs: number }>();
  orders.forEach((o) => {
    const label = key(o).trim();
    if (!label) return;
    const cur = map.get(label) || { count: 0, pcs: 0 };
    map.set(label, { count: cur.count + 1, pcs: cur.pcs + pcs(o) });
  });
  const totalPcs = orders.reduce((acc, o) => acc + pcs(o), 0) || 1;
  const maxCount = Math.max(1, ...[...map.values()].map((v) => v.count));
  return [...map.entries()]
    .map(([label, v]) => ({
      label,
      ...v,
      ratio: Math.round((v.count / maxCount) * 100),
      sharePct: Number(((v.pcs / totalPcs) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count || b.pcs - a.pcs)
    .slice(0, limit);
}

export type SizeRow = { size: SizeType; total: number } & Record<CategoryType, number>;

export function sizeDistribution(orders: LegacyOrder[]): SizeRow[] {
  return SIZES.map((size) => {
    const row = { size, total: 0, pendek: 0, panjang: 0, tanpaLengan: 0, tigaPerempat: 0 } as SizeRow;
    orders.forEach((o) => {
      CATEGORIES.forEach((cat) => {
        const qty = (o[qtyKey(cat, size)] as number) || 0;
        row[cat] += qty;
        row.total += qty;
      });
    });
    return row;
  });
}

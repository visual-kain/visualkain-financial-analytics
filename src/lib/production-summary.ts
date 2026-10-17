import { calculateTotals } from '@/lib/legacy/calculations';
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

export function pipelineCounts(orders: LegacyOrder[]): Array<{ status: OrderStatus; count: number }> {
  return STATUS_ORDER.map((status) => ({ status, count: orders.filter((o) => o.status === status).length }));
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

export function deadlineRadar(orders: LegacyOrder[], today: string): { items: DeadlineItem[]; counts: Record<DeadlineTone, number>; tanpaDeadline: number } {
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
  return { items, counts, tanpaDeadline: active.length - items.length };
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

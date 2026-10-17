import { describe, expect, it } from 'vitest';
import {
  adaptiveTicks,
  categoryMix,
  computeKpi,
  daysUntil,
  deadlineLabel,
  deadlineRadar,
  leaderboard,
  monthlyVolume,
  orderMonth,
  orderYears,
  peakMonth,
  pipelineCounts,
  rankBy,
  sizeDistribution,
  sleeveTotals,
  summarizeYear,
} from './production-summary';
import type { LegacyOrder } from './legacy/types';

const o = (id: string, extra: Partial<LegacyOrder>): LegacyOrder =>
  ({ id, noInv: `VK26${id}`, namaCustomer: 'C', status: 'received', tanggalInv: '2026-10-10', ...extra }) as LegacyOrder;

const orders = [
  o('01', { status: 'production', deadline: '2026-10-15', pendekM: 10, kategoriOrder: 'Kaos', jenisBahan: 'COMBED 30S' }),
  o('02', { status: 'received', deadline: '2026-10-19', panjangL: 5, kategoriOrder: 'Kemeja', jenisBahan: 'DRILL' }),
  o('03', { status: 'production', deadline: '2026-10-30', tigaPerempatS: 4, kategoriOrder: 'Kaos', jenisBahan: 'COMBED 30S' }),
  o('04', { status: 'completed', deadline: '2026-10-01', tanpaLenganM: 2, kategoriOrder: 'Rompi' }),
  o('05', { status: 'delivery', pendekL: 1, kategoriOrder: 'Kaos' }),
];
const TODAY = '2026-10-17';

describe('production summary', () => {
  it('KPI memisahkan antrean, produksi, pengiriman, selesai, dan lewat deadline', () => {
    const k = computeKpi(orders, TODAY);
    expect(k.aktif).toEqual({ count: 4, pcs: 20 });
    expect(k.antrean.count).toBe(1);
    expect(k.produksi).toEqual({ count: 2, pcs: 14 });
    expect(k.pengiriman.count).toBe(1);
    expect(k.selesai).toEqual({ count: 1, pcs: 2 });
    expect(k.lewatDeadline).toBe(1);
  });

  it('pipeline 6 tahap', () => {
    const p = pipelineCounts(orders);
    expect(p).toHaveLength(6);
    expect(p.find((x) => x.status === 'production')).toMatchObject({ count: 2, pcs: 14 });
  });

  it('radar deadline memakai ambang H-3 dan urut dari yang paling mendesak', () => {
    expect(daysUntil('2026-10-15', TODAY)).toBe(-2);
    expect(deadlineLabel(-2)).toBe('Telat 2 hari');
    expect(deadlineLabel(0)).toBe('Hari ini');
    const r = deadlineRadar(orders, TODAY);
    expect(r.items.map((i) => i.order.id)).toEqual(['01', '02', '03']);
    expect(r.counts).toEqual({ lewat: 1, mendesak: 1, aman: 1 });
    expect(r.tanpaDeadline).toBe(1);
    expect(r.undated.map((x) => x.id)).toEqual(['05']);
  });

  it('peringkat berdasarkan jumlah order dengan sisa digabung', () => {
    const k = rankBy(orders, (x) => String(x.kategoriOrder || ''), 2);
    expect(k[0]).toMatchObject({ label: 'Kaos', count: 3 });
    expect(k[k.length - 1]).toMatchObject({ label: 'Lainnya', count: 1 });
  });

  it('total qty per jenis lengan termasuk 3/4', () => {
    expect(sleeveTotals(orders)).toEqual({ tanpaLengan: 2, pendek: 11, tigaPerempat: 4, panjang: 5, total: 22 });
  });

  it('bulan acuan memakai tanggal invoice lalu createdAt (WIB)', () => {
    expect(orderMonth(o('a', { tanggalInv: '2026-11-03' }))).toEqual({ year: 2026, month0: 10 });
    // 30 Sep 2026 18:00 UTC = 1 Okt 2026 01:00 WIB.
    const created = o('b', { tanggalInv: '', createdAt: { seconds: Date.UTC(2026, 8, 30, 18) / 1000 } });
    expect(orderMonth(created)).toEqual({ year: 2026, month0: 9 });
    expect(orderMonth(o('c', { tanggalInv: '' }))).toBeNull();
  });

  it('tren bulanan 12 bulan dengan rata-rata per bulan aktif dan puncak', () => {
    const list = [...orders, o('06', { tanggalInv: '2026-11-02', pendekS: 30 }), o('07', { tanggalInv: '2025-12-01', pendekS: 3 })];
    expect(orderYears(list)).toEqual([2026, 2025]);
    const months = monthlyVolume(list, 2026);
    expect(months).toHaveLength(12);
    expect(months[9]).toMatchObject({ label: 'Oktober', count: 5, pcs: 22 });
    expect(months[10]).toMatchObject({ count: 1, pcs: 30 });
    const y = summarizeYear(months);
    expect(y).toMatchObject({ count: 6, pcs: 52, activeMonths: 2, avgPcsPerMonth: 26, avgPcsPerOrder: 9 });
    expect(peakMonth(months, 'pcs')?.label).toBe('November');
    expect(peakMonth(months, 'count')?.label).toBe('Oktober');
    expect(peakMonth(monthlyVolume([], 2026), 'pcs')).toBeNull();
  });

  it('tick adaptif memakai batas bawah dan tanpa duplikat', () => {
    expect(adaptiveTicks(40, 100)).toEqual([0, 5, 20, 50, 100]);
    expect(adaptiveTicks(3, 10)).toEqual([0, 1, 2, 5, 10]);
  });

  it('donut kategori urut pcs dengan persen dari jumlah order', () => {
    const mix = categoryMix([...orders, o('08', { kategoriOrder: '' })]);
    expect(mix[0]).toEqual({ name: 'Kaos', count: 3, pcs: 15, percentage: 50 });
    expect(mix.find((m) => m.name === 'Lainnya')).toMatchObject({ count: 1, percentage: 16.7 });
  });

  it('leaderboard urut jumlah order, melewati label kosong, porsi dari total pcs', () => {
    const rows = leaderboard(orders, (x) => String(x.jenisBahan || ''));
    expect(rows).toEqual([
      { label: 'COMBED 30S', count: 2, pcs: 14, ratio: 100, sharePct: 63.6 },
      { label: 'DRILL', count: 1, pcs: 5, ratio: 50, sharePct: 22.7 },
    ]);
  });

  it('distribusi ukuran per jenis lengan', () => {
    const rows = sizeDistribution(orders);
    expect(rows.map((r) => r.size)).toEqual(['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']);
    expect(rows.find((r) => r.size === 'M')).toMatchObject({ pendek: 10, tanpaLengan: 2, total: 12 });
    expect(rows.reduce((acc, r) => acc + r.total, 0)).toBe(22);
  });
});

import { describe, expect, it } from 'vitest';
import { computeKpi, daysUntil, deadlineLabel, deadlineRadar, pipelineCounts, rankBy, sleeveTotals } from './production-summary';
import type { LegacyOrder } from './legacy/types';

const o = (id: string, extra: Partial<LegacyOrder>): LegacyOrder =>
  ({ id, noInv: `VK26${id}`, namaCustomer: 'C', status: 'received', tanggalInv: '2026-10-10', ...extra }) as LegacyOrder;

const orders = [
  o('01', { status: 'production', deadline: '2026-10-15', pendekM: 10, kategoriOrder: 'Kaos', jenisBahan: 'COMBED 30S' }),
  o('02', { status: 'received', deadline: '2026-10-19', panjangL: 5, kategoriOrder: 'Kemeja', jenisBahan: 'DRILL' }),
  o('03', { status: 'qc', deadline: '2026-10-30', tigaPerempatS: 4, kategoriOrder: 'Kaos', jenisBahan: 'COMBED 30S' }),
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

  it('pipeline 8 tahap', () => {
    const p = pipelineCounts(orders);
    expect(p).toHaveLength(8);
    expect(p.find((x) => x.status === 'production')?.count).toBe(1);
  });

  it('radar deadline memakai ambang H-3 dan urut dari yang paling mendesak', () => {
    expect(daysUntil('2026-10-15', TODAY)).toBe(-2);
    expect(deadlineLabel(-2)).toBe('Telat 2 hari');
    expect(deadlineLabel(0)).toBe('Hari ini');
    const r = deadlineRadar(orders, TODAY);
    expect(r.items.map((i) => i.order.id)).toEqual(['01', '02', '03']);
    expect(r.counts).toEqual({ lewat: 1, mendesak: 1, aman: 1 });
    expect(r.tanpaDeadline).toBe(1);
  });

  it('peringkat berdasarkan jumlah order dengan sisa digabung', () => {
    const k = rankBy(orders, (x) => String(x.kategoriOrder || ''), 2);
    expect(k[0]).toMatchObject({ label: 'Kaos', count: 3 });
    expect(k[k.length - 1]).toMatchObject({ label: 'Lainnya', count: 1 });
  });

  it('total qty per jenis lengan termasuk 3/4', () => {
    expect(sleeveTotals(orders)).toEqual({ tanpaLengan: 2, pendek: 11, tigaPerempat: 4, panjang: 5, total: 22 });
  });
});

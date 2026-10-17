import { describe, expect, it } from 'vitest';
import { invoicePaymentsForOrder, summarizeInvoicePayments } from './invoice-payments';

describe('summarizeInvoicePayments', () => {
  it('memetakan pembayaran ke DP 1, DP 2, termin berikutnya, dan pelunasan', () => {
    const s = summarizeInvoicePayments([
      { id: 'a', nominal: 300000, jenis: 'dp', label: 'DP Awal', tanggal: '2026-10-02' },
      { id: 'b', nominal: 400000, jenis: 'termin', tanggal: '2026-10-05' },
      { id: 'c', nominal: 100000, jenis: 'termin', label: 'Termin 3', tanggal: '2026-10-07' },
      { id: 'd', nominal: 200000, jenis: 'pelunasan', tanggal: '2026-10-09' },
    ]);
    expect(s.dp1).toBe(300000);
    expect(s.dp2).toBe(500000);
    expect(s.totalDpDiterima).toBe(1000000);
    expect(s.pelunasan).toBe(200000);
    expect(s.totalUangMasuk).toBe(1000000);
    expect(s.rows.map((r) => r.label)).toEqual(['DP 1', 'DP 2', 'Termin 3', 'Pelunasan']);
  });

  it('mengabaikan nominal nol', () => {
    const s = summarizeInvoicePayments([{ id: 'a', nominal: 0, jenis: 'dp', tanggal: '' }]);
    expect(s.rows).toHaveLength(0);
    expect(s.totalUangMasuk).toBe(0);
  });
});

describe('pelunasan dari ledger finansial', () => {
  it('transfer 100% sekaligus yang ditandai pelunasan tetap memenuhi target DP', () => {
    const s = summarizeInvoicePayments([{ id: 'a', nominal: 1000000, jenis: 'pelunasan', tanggal: '2026-10-10' }]);
    expect(s.totalDpDiterima).toBe(1000000);
    expect(s.totalUangMasuk).toBe(1000000);
    expect(s.rows[0].label).toBe('Pelunasan');
  });

  it('DP 50% lalu pelunasan 50% tidak menyisakan kekurangan DP', () => {
    const s = summarizeInvoicePayments([
      { id: 'a', nominal: 500000, jenis: 'dp', tanggal: '2026-10-10' },
      { id: 'b', nominal: 500000, jenis: 'pelunasan', tanggal: '2026-10-12' },
    ]);
    expect(Math.max(0, 700000 - s.totalDpDiterima)).toBe(0);
  });
});

describe('invoicePaymentsForOrder', () => {
  it('memakai pembayaranList modul finansial bila ada', () => {
    const s = invoicePaymentsForOrder({ id: 'o', noInv: 'VK1', pembayaranList: [{ id: 'p', nominal: 250000, jenis: 'dp', tanggal: '2026-10-03' }], dp1Nominal: 999 });
    expect(s.dp1).toBe(250000);
    expect(s.rows).toHaveLength(1);
  });

  it('order lama tanpa daftar modern memakai field dp1/dp2/pelunasan', () => {
    const s = invoicePaymentsForOrder({ id: 'o', noInv: 'VK1', dp1Nominal: 100000, dp2Nominal: 50000, pelunasanNominal: 25000 });
    expect([s.dp1, s.dp2, s.pelunasan]).toEqual([100000, 50000, 25000]);
  });

  it('pembayaranList kosong berarti belum ada pembayaran (bukan DP 35% palsu)', () => {
    const s = invoicePaymentsForOrder({ id: 'o', noInv: 'VK1', hargaPendek: 100000, pendekM: 10, dpPersen: 70, pembayaranList: [] });
    expect(s.totalUangMasuk).toBe(0);
  });
});

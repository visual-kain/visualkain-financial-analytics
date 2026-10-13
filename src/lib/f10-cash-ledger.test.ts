import { describe, it, expect } from 'vitest';
import type { Order, CashTransaction } from '@/types';
import { buildCashEntries, summarizeCashPeriod, collectYearOptions, matchPeriod } from './cash-ledger';
import { calculateFinancialSummary, applyCashPeriod } from './financial-calculator';
import { initialOrdersData, initialCashTransactions } from '@/test/fixtures/seed-data';

function makeOrder(partial: Partial<Order> & { id: string; tanggalOrder: string }): Order {
  return {
    noInv: partial.id.toUpperCase(),
    customerName: 'Customer',
    totalInvoice: 0,
    totalHpp: 0,
    targetMargin: 0,
    pembayaranList: [],
    totalUangMasukCustomer: 0,
    statusPembayaran: 'belum_bayar',
    totalDibayarKeVendor: 0,
    statusPembayaranVendor: 'belum_bayar',
    ...partial,
  };
}

const JT = 1_000_000;

const orderA = makeOrder({
  id: 'ord-a',
  tanggalOrder: '2026-10-20',
  totalInvoice: 100 * JT,
  totalHpp: 60 * JT,
  totalUangMasukCustomer: 70 * JT,
  pembayaranList: [
    { id: 'pa1', orderId: 'ord-a', noInv: 'A', tanggal: '2026-10-20', nominal: 30 * JT, jenis: 'dp', createdAt: '1' },
    { id: 'pa2', orderId: 'ord-a', noInv: 'A', tanggal: '2026-11-05', nominal: 40 * JT, jenis: 'termin', createdAt: '2' },
  ],
  totalDibayarKeVendor: 20 * JT,
  vendorPembayaranList: [
    { id: 'va1', vendorName: 'AMRIN', tanggal: '2026-11-10', nominal: 20 * JT, jenis: 'dp_vendor' },
  ],
  biayaOperasional: 1 * JT,
});

const kas: CashTransaction[] = [
  { id: 'k-saldo', tanggal: '2026-10-01', tipe: 'masuk', nominal: 5 * JT, kategori: 'Saldo Awal', keterangan: 'Saldo rekening per 1 Okt' },
  { id: 'k-listrik', tanggal: '2026-10-15', tipe: 'keluar', nominal: 2 * JT, kategori: 'Operasional', keterangan: 'Listrik' },
  { id: 'k-lama', tanggal: '2026-09-30', tipe: 'masuk', nominal: 99 * JT, kategori: 'Saldo Awal', keterangan: 'Sebelum cutoff' },
];

const entries = buildCashEntries([orderA], kas);

describe('mesin periode kas (cash basis, K-1)', () => {
  it('Dana Masuk per bulan mengikuti tanggal pembayaran, bukan tanggal order', () => {
    expect(summarizeCashPeriod(entries, { bulan: '10', tahun: '2026' }).masukPeriode).toBe(35 * JT);
    expect(summarizeCashPeriod(entries, { bulan: '11', tahun: '2026' }).masukPeriode).toBe(40 * JT);
  });

  it('Dana Keluar per bulan mengikuti tanggal pembayaran vendor dan transaksi kas', () => {
    const okt = summarizeCashPeriod(entries, { bulan: '10', tahun: '2026' });
    const nov = summarizeCashPeriod(entries, { bulan: '11', tahun: '2026' });
    expect(okt.keluarPeriode).toBe(3 * JT);
    expect(nov.keluarPeriode).toBe(20 * JT);
    expect(nov.keluarVendor).toBe(20 * JT);
  });

  it('mengabaikan transaksi sebelum 1 Oktober 2026', () => {
    expect(entries.some((e) => e.id === 'k-lama')).toBe(false);
    expect(summarizeCashPeriod(entries, { bulan: 'all', tahun: 'all' }).masukPeriode).toBe(75 * JT);
  });
});

describe('saldo kas kumulatif sejak cutoff (K-2)', () => {
  it('saldo November membawa saldo akhir Oktober termasuk transaksi Saldo Awal', () => {
    const nov = summarizeCashPeriod(entries, { bulan: '11', tahun: '2026' });
    expect(nov.saldoAwalPeriode).toBe(5 * JT + 30 * JT - 2 * JT - 1 * JT);
    expect(nov.saldoKas).toBe(nov.saldoAwalPeriode + 40 * JT - 20 * JT);
  });

  it.each([
    { bulan: 'all', tahun: 'all' },
    { bulan: '10', tahun: '2026' },
    { bulan: '11', tahun: '2026' },
    { bulan: '12', tahun: '2026' },
    { bulan: 'all', tahun: '2026' },
    { bulan: '10', tahun: 'all' },
  ])('memenuhi saldo = saldo awal periode + masuk - keluar untuk %o', (period) => {
    const s = summarizeCashPeriod(entries, period);
    expect(s.saldoKas).toBe(s.saldoAwalPeriode + s.masukPeriode - s.keluarPeriode);
  });

  it('rincian keluar menjumlah ke total keluar', () => {
    const s = summarizeCashPeriod(entries, { bulan: 'all', tahun: 'all' });
    expect(s.keluarVendor + s.keluarOpexOrder + s.keluarKas).toBe(s.keluarPeriode);
  });
});

describe('opsi tahun bersama', () => {
  it('mencakup tahun pembayaran yang berbeda dari tahun order', () => {
    const desOrder = makeOrder({
      id: 'ord-des',
      tanggalOrder: '2026-12-20',
      totalInvoice: 10 * JT,
      totalUangMasukCustomer: 10 * JT,
      pembayaranList: [{ id: 'pd', orderId: 'ord-des', noInv: 'D', tanggal: '2027-01-05', nominal: 10 * JT, jenis: 'pelunasan', createdAt: '1' }],
    });
    expect(collectYearOptions([desOrder], [])).toEqual(['2027', '2026']);
  });
});

describe('matchPeriod', () => {
  it('menolak tanggal sebelum cutoff dan mencocokkan bulan/tahun', () => {
    expect(matchPeriod('2026-09-30', 'all', 'all')).toBe(false);
    expect(matchPeriod('2026-10-05', '10', '2026')).toBe(true);
    expect(matchPeriod('2026-10-05', '11', 'all')).toBe(false);
  });
});

describe('invariant total Rupiah dan definisi lunas (K-5, 3.5)', () => {
  it('total Rupiah ringkasan pada fixture tidak berubah', () => {
    const s = calculateFinancialSummary(0, initialCashTransactions, initialOrdersData);
    expect(s.omzetTotal).toBe(13_257_000);
    expect(s.totalPiutangCustomer).toBe(6_720_500);
    expect(s.totalProfitRealtime).toBe(4_102_000);
    expect(s.totalUtangVendor).toBe(4_455_000);
    expect(s.estimasiProfitBersih).toBeCloseTo(447_559.18, 1);
  });

  it('order completed yang baru dibayar sebagian dihitung berjalan, bukan lunas', () => {
    const underpaid = makeOrder({
      id: 'ord-u',
      tanggalOrder: '2026-10-10',
      totalInvoice: 1000,
      totalHpp: 600,
      totalUangMasukCustomer: 300,
      statusOrder: 'completed',
      statusPembayaran: 'parsial',
    });
    const s = calculateFinancialSummary(0, [], [underpaid]);
    expect(s.omzetLunasCount).toBe(0);
    expect(s.omzetBerjalanCount).toBe(1);
    expect(s.unpaidCustomerCount).toBe(1);
  });
});

describe('applyCashPeriod', () => {
  it('mengganti metrik kas dengan angka cash basis dan mempertahankan metrik order', () => {
    const base = calculateFinancialSummary(0, kas, [orderA]);
    const nov = summarizeCashPeriod(entries, { bulan: '11', tahun: '2026' });
    const merged = applyCashPeriod(base, nov);

    expect(merged.totalKasMasuk).toBe(40 * JT);
    expect(merged.totalKasKeluar).toBe(20 * JT);
    expect(merged.saldoKasRiil).toBe(nov.saldoKas);
    expect(merged.saldoAwalPeriode).toBe(nov.saldoAwalPeriode);
    expect(merged.totalDibayarKeVendor).toBe(20 * JT);
    expect(merged.bebanOperasionalNonVendor).toBe(0);
    expect(merged.kasKeluarCount).toBe(1);
    expect(merged.omzetTotal).toBe(base.omzetTotal);
    expect(merged.totalPiutangCustomer).toBe(base.totalPiutangCustomer);
    expect(merged.estimasiProfitBersih).toBe(base.estimasiProfitBersih);
  });
});

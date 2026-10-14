import { describe, it, expect } from 'vitest';
import type { Order, CashTransaction } from '@/types';
import {
  buildCashEntries,
  buildCashInflowEntries,
  summarizeCashPeriod,
  groupBebanKasByKategori,
} from './cash-ledger';
import { calculateFinancialSummary, applyCashPeriod, aggregateOrders } from './financial-calculator';
import { KATEGORI_INVESTOR } from './investor-ledger';

const JT = 1_000_000;

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

const order = makeOrder({
  id: 'ord-a',
  tanggalOrder: '2026-10-05',
  totalInvoice: 10 * JT,
  totalHpp: 6 * JT,
  biayaOperasional: 500_000,
  totalUangMasukCustomer: 7 * JT,
  pembayaranList: [{ id: 'pa1', orderId: 'ord-a', noInv: 'A', tanggal: '2026-10-05', nominal: 7 * JT, jenis: 'dp', createdAt: '1' }],
  totalDibayarKeVendor: 3 * JT,
  vendorPembayaranList: [{ id: 'va1', vendorName: 'AMRIN', tanggal: '2026-10-06', nominal: 3 * JT, jenis: 'dp_vendor' }],
});

const kas: CashTransaction[] = [
  { id: 'k-modal', tanggal: '2026-10-01', tipe: 'masuk', nominal: 2 * JT, kategori: 'Saldo Awal', keterangan: 'Modal' },
  { id: 'k-inv', tanggal: '2026-10-02', tipe: 'masuk', nominal: 20 * JT, kategori: KATEGORI_INVESTOR.masuk, keterangan: 'Dana Pak Budi', investorNama: 'Pak Budi' },
  { id: 'k-gaji', tanggal: '2026-10-10', tipe: 'keluar', nominal: 1 * JT, kategori: 'Gaji/Upah', keterangan: 'Gaji' },
  { id: 'k-listrik', tanggal: '2026-10-11', tipe: 'keluar', nominal: 250_000, kategori: 'Operasional', keterangan: 'Listrik' },
  { id: 'k-bagi', tanggal: '2026-10-20', tipe: 'keluar', nominal: 200_000, kategori: KATEGORI_INVESTOR.bagiHasil, keterangan: 'Bagi hasil', investorNama: 'Pak Budi' },
  { id: 'k-kembali', tanggal: '2026-11-03', tipe: 'keluar', nominal: 5 * JT, kategori: KATEGORI_INVESTOR.pengembalian, keterangan: 'Cicil pokok', investorNama: 'Pak Budi' },
];

const entries = buildCashEntries([order], kas);
const okt = summarizeCashPeriod(entries, { bulan: '10', tahun: '2026' });
const nov = summarizeCashPeriod(entries, { bulan: '11', tahun: '2026' });
const semua = summarizeCashPeriod(entries, { bulan: 'all', tahun: 'all' });

describe('F-12 cash ledger memisahkan dana investor', () => {
  it('dana investor tidak masuk ke pemasukan usaha non-order', () => {
    expect(okt.masukOrder).toBe(7 * JT);
    expect(okt.masukNonOrder).toBe(2 * JT);
    expect(okt.masukInvestor).toBe(20 * JT);
    expect(okt.masukPeriode).toBe(29 * JT);
  });

  it('pengembalian pokok bukan beban kas, bagi hasil adalah beban kas', () => {
    expect(nov.keluarInvestor).toBe(5 * JT);
    expect(nov.keluarKas).toBe(0);
    expect(okt.keluarKas).toBe(1_450_000);
    expect(okt.keluarVendor + okt.keluarOpexOrder + okt.keluarKas + okt.keluarInvestor).toBe(okt.keluarPeriode);
  });

  it('saldo kas tetap mencakup dana investor dan pengembaliannya', () => {
    // 2 + 20 + 7 - 3 - 0.5 - 1 - 0.25 - 0.2 - 5
    expect(semua.saldoKas).toBe(19_050_000);
    expect(nov.saldoKas).toBe(semua.saldoKas);
  });

  it('kewajiban investor kumulatif sampai akhir periode', () => {
    expect(okt.kewajibanInvestor).toBe(20 * JT);
    expect(nov.kewajibanInvestor).toBe(15 * JT);
    expect(semua.kewajibanInvestor).toBe(15 * JT);
  });

  it('entri kas masuk investor diberi jenis investor dengan nama investor', () => {
    const inv = buildCashInflowEntries([order], kas).find((e) => e.id === 'k-inv')!;
    expect(inv.jenis).toBe('investor');
    expect(inv.customerName).toBe('Pak Budi');
  });

  it('rincian beban kas per kategori sama dengan keluarKas', () => {
    const groups = groupBebanKasByKategori(entries, { bulan: '10', tahun: '2026' });
    const total = groups.reduce((acc, g) => acc + g.total, 0);
    expect(total).toBe(okt.keluarKas);
    expect(groups.map((g) => g.kategori)).toEqual(['Gaji/Upah', 'Operasional', KATEGORI_INVESTOR.bagiHasil]);
  });
});

describe('F-12 laba bersih', () => {
  it('laba bersih = laba kotor - beban kas periode', () => {
    const merged = applyCashPeriod(calculateFinancialSummary(0, kas, [order]), okt);
    expect(merged.totalProfitRealtime).toBe(3_500_000);
    expect(merged.labaBersih).toBe(3_500_000 - 1_450_000);
    expect(merged.labaBersihMarginPercent).toBeCloseTo(20.5, 5);
  });

  it('dana investor dan pengembalian pokok tidak memengaruhi laba', () => {
    const tanpaInvestor = kas.filter((t) => t.id !== 'k-inv' && t.id !== 'k-kembali');
    const a = applyCashPeriod(calculateFinancialSummary(0, kas, [order]), semua);
    const b = applyCashPeriod(
      calculateFinancialSummary(0, tanpaInvestor, [order]),
      summarizeCashPeriod(buildCashEntries([order], tanpaInvestor), { bulan: 'all', tahun: 'all' })
    );
    expect(a.labaBersih).toBe(b.labaBersih);
    expect(a.estimasiProfitBersih).toBe(b.estimasiProfitBersih);
  });

  it('kartu dana masuk usaha tidak termasuk investor, total kas masuk tetap utuh', () => {
    const merged = applyCashPeriod(calculateFinancialSummary(0, kas, [order]), okt);
    expect(merged.totalKasMasukUsaha).toBe(9 * JT);
    expect(merged.danaInvestorMasuk).toBe(20 * JT);
    expect(merged.totalKasMasuk).toBe(29 * JT);
    expect(merged.kewajibanInvestor).toBe(20 * JT);
  });

  it('ringkasan tanpa periode juga mengecualikan pengembalian pokok dari beban', () => {
    const s = calculateFinancialSummary(0, kas, [order]);
    expect(s.bebanOperasionalKas).toBe(1_450_000);
    expect(s.labaBersih).toBe(3_500_000 - 1_450_000);
    expect(s.kewajibanInvestor).toBe(15 * JT);
  });
});

describe('F-12 agregat pesanan per vendor', () => {
  it('menjumlah dua pesanan dari vendor yang sama', () => {
    const a = makeOrder({ id: 'a', tanggalOrder: '2026-10-07', vendorName: 'Vendor Wisnu', totalInvoice: 3 * JT, totalHpp: 2_400_000, totalDibayarKeVendor: 1 * JT });
    const b = makeOrder({ id: 'b', tanggalOrder: '2026-10-06', vendorName: 'Vendor Wisnu', totalInvoice: 8_835_000, totalHpp: 5_735_000, totalDibayarKeVendor: 4 * JT });
    const agg = aggregateOrders([a, b]);
    expect(agg.count).toBe(2);
    expect(agg.totalInvoice).toBe(11_835_000);
    expect(agg.totalHpp).toBe(8_135_000);
    expect(agg.totalDibayarVendor).toBe(5 * JT);
    expect(agg.sisaUtangVendor).toBe(3_135_000);
    expect(agg.netProfit).toBe(3_700_000);
  });
});

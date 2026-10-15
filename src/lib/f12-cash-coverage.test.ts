import { describe, it, expect } from 'vitest';
import type { Order, CashTransaction } from '@/types';
import { buildCashEntries, summarizeCashPeriod, projectCashCoverage, type CashPeriod } from './cash-ledger';
import { KATEGORI_INVESTOR } from './investor-ledger';

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

function pay(orderId: string, tanggal: string, nominal: number) {
  return { id: `${orderId}-${tanggal}`, orderId, noInv: orderId, tanggal, nominal, jenis: 'dp' as const, createdAt: '1' };
}

// Data produksi per audit 14 Okt 2026 (requirements §7); pembayaran vendor belum punya tanggal sehingga memakai tanggal order.
const vk260039 = makeOrder({
  id: 'VK260039',
  tanggalOrder: '2026-10-06',
  totalInvoice: 8_835_000,
  totalHpp: 5_735_000,
  pembayaranList: [pay('VK260039', '2026-10-07', 2_900_000), pay('VK260039', '2026-10-09', 2_654_500)],
  totalUangMasukCustomer: 5_554_500,
  totalDibayarKeVendor: 4_000_000,
});
const vk260040 = makeOrder({
  id: 'VK260040',
  tanggalOrder: '2026-10-07',
  totalInvoice: 3_000_000,
  totalHpp: 2_400_000,
  pembayaranList: [pay('VK260040', '2026-10-13', 600_000)],
  totalUangMasukCustomer: 600_000,
  totalDibayarKeVendor: 1_000_000,
});
const vk260041 = makeOrder({
  id: 'VK260041',
  tanggalOrder: '2026-10-07',
  totalInvoice: 1_422_000,
  totalHpp: 1_020_000,
  pembayaranList: [pay('VK260041', '2026-10-12', 1_092_000)],
  totalUangMasukCustomer: 1_092_000,
  totalDibayarKeVendor: 700_000,
});

const bebanOktober: Array<[string, number]> = [
  ['2026-10-02', 14_000],
  ['2026-10-06', 102_500],
  ['2026-10-08', 100_000],
  ['2026-10-09', 177_500],
  ['2026-10-09', 201_000],
  ['2026-10-10', 300_000],
  ['2026-10-10', 484_000],
  ['2026-10-10', 300_000],
  ['2026-10-11', 50_000],
  ['2026-10-12', 50_000],
  ['2026-10-13', 250_000],
  ['2026-10-14', 519_520],
];
const kas: CashTransaction[] = [
  ...bebanOktober.map(([tanggal, nominal], i) => ({
    id: `beban-${i}`,
    tanggal,
    tipe: 'keluar' as const,
    nominal,
    kategori: 'Biaya Lain' as const,
    keterangan: 'Beban',
  })),
  { id: 'inv-1', tanggal: '2026-10-13', tipe: 'masuk', nominal: 2_000_000, kategori: KATEGORI_INVESTOR.masuk, keterangan: 'Investasi' },
];

const orders = [vk260039, vk260040, vk260041];

function coverage(o: Order[], tx: CashTransaction[], period: CashPeriod) {
  const entries = buildCashEntries(o, tx);
  return projectCashCoverage(o, entries, summarizeCashPeriod(entries, period), period);
}

describe('F-12 US-12.14 proyeksi kecukupan dana', () => {
  it('data Oktober 2026: kas + pelunasan customer menutup utang vendor dan dana investor', () => {
    const c = coverage(orders, kas, { bulan: '10', tahun: '2026' });
    expect(c).toMatchObject({
      saldoKas: 997_980,
      piutangCustomer: 6_010_500,
      utangVendor: 3_455_000,
      kewajibanInvestor: 2_000_000,
      danaTersedia: 7_008_480,
      totalKewajiban: 5_455_000,
      proyeksiSisa: 1_553_480,
      sisaTanpaPelunasan: -4_457_020,
    });
  });

  it('filter bulan berikutnya tetap menghitung utang dan piutang order bulan sebelumnya', () => {
    const okt = coverage(orders, kas, { bulan: '10', tahun: '2026' });
    const nov = coverage(orders, kas, { bulan: '11', tahun: '2026' });
    expect(nov.proyeksiSisa).toBe(okt.proyeksiSisa);
    expect(nov.utangVendor).toBe(3_455_000);
  });

  it('pelunasan sesudah akhir periode masih dihitung sebagai piutang pada periode itu', () => {
    const lunasNov = makeOrder({
      ...vk260040,
      pembayaranList: [pay('VK260040', '2026-10-13', 600_000), pay('VK260040', '2026-11-05', 2_400_000)],
      totalUangMasukCustomer: 3_000_000,
    });
    const okt = coverage([lunasNov], [], { bulan: '10', tahun: '2026' });
    const nov = coverage([lunasNov], [], { bulan: '11', tahun: '2026' });
    expect(okt.piutangCustomer).toBe(2_400_000);
    expect(nov.piutangCustomer).toBe(0);
    expect(okt.proyeksiSisa).toBe(nov.proyeksiSisa);
  });

  it('order sesudah akhir periode tidak ikut, kelebihan bayar tidak menjadi piutang atau utang negatif', () => {
    const desember = makeOrder({ id: 'des', tanggalOrder: '2026-12-01', totalInvoice: 5_000_000, totalHpp: 3_000_000 });
    const lebihBayar = makeOrder({
      id: 'lebih',
      tanggalOrder: '2026-10-03',
      totalInvoice: 1_000_000,
      totalHpp: 500_000,
      pembayaranList: [pay('lebih', '2026-10-03', 1_200_000)],
      totalUangMasukCustomer: 1_200_000,
      totalDibayarKeVendor: 700_000,
    });
    const c = coverage([desember, lebihBayar], [], { bulan: '10', tahun: '2026' });
    expect(c.piutangCustomer).toBe(0);
    expect(c.utangVendor).toBe(0);
    expect(c.saldoKas).toBe(500_000);
    expect(c.proyeksiSisa).toBe(500_000);
  });

  it('pengembalian pokok investor mengurangi kas dan kewajiban sama besar, proyeksi tidak berubah', () => {
    const kembali: CashTransaction = {
      id: 'kembali',
      tanggal: '2026-10-20',
      tipe: 'keluar',
      nominal: 500_000,
      kategori: KATEGORI_INVESTOR.pengembalian,
      keterangan: 'Cicil pokok',
    };
    const sebelum = coverage(orders, kas, { bulan: '10', tahun: '2026' });
    const sesudah = coverage(orders, [...kas, kembali], { bulan: '10', tahun: '2026' });
    expect(sesudah.saldoKas).toBe(sebelum.saldoKas - 500_000);
    expect(sesudah.kewajibanInvestor).toBe(1_500_000);
    expect(sesudah.proyeksiSisa).toBe(sebelum.proyeksiSisa);
  });
});

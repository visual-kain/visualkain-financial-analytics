import type {
  Order,
  CashTransaction,
  FinancialSummary,
  EscrowAllocation,
} from '@/types';

/**
 * Menghitung alokasi proporsional kantong dana pokok vendor (HPP) vs margin VisualKain
 * untuk pesanan tertentu berdasarkan uang yang sudah masuk dari konsumen.
 */
export function calculateEscrowAllocation(order: Order): EscrowAllocation {
  const { totalInvoice, totalHpp, totalUangMasukCustomer, totalDibayarKeVendor } = order;
  const marginTarget = totalInvoice - totalHpp;

  if (totalInvoice <= 0) {
    return {
      totalInvoice: 0,
      totalHpp: 0,
      marginTarget: 0,
      uangMasukRiil: 0,
      alokasiHakVendor: 0,
      alokasiMarginVisualKain: 0,
      sisaUtangVendor: 0,
      sisaPiutangCustomer: 0,
    };
  }

  const rasioHpp = totalHpp / totalInvoice;
  const rasioMargin = marginTarget / totalInvoice;

  const alokasiHakVendor = totalUangMasukCustomer * rasioHpp;
  const alokasiMarginVisualKain = totalUangMasukCustomer * rasioMargin;

  const sisaUtangVendor = Math.max(0, totalHpp - totalDibayarKeVendor);
  const sisaPiutangCustomer = Math.max(0, totalInvoice - totalUangMasukCustomer);

  return {
    totalInvoice,
    totalHpp,
    marginTarget,
    uangMasukRiil: totalUangMasukCustomer,
    alokasiHakVendor,
    alokasiMarginVisualKain,
    sisaUtangVendor,
    sisaPiutangCustomer,
  };
}

/**
 * Menghitung ringkasan finansial eksekutif secara global (6 Kartu Metrik Finansial)
 */
export function calculateFinancialSummary(
  saldoAwal: number,
  transactions: CashTransaction[],
  orders: Order[]
): FinancialSummary {
  let totalKasMasuk = 0;
  let totalKasKeluar = 0;
  let bebanOperasional = 0;

  for (const tx of transactions) {
    if (tx.tipe === 'masuk') {
      totalKasMasuk += tx.nominal;
    } else {
      totalKasKeluar += tx.nominal;
      if (tx.kategori !== 'Pembayaran Vendor') {
        bebanOperasional += tx.nominal;
      }
    }
  }

  const saldoKasRiil = saldoAwal + totalKasMasuk - totalKasKeluar;

  let totalUtangVendor = 0;
  let totalPiutangCustomer = 0;
  let totalMarginTerealisasi = 0;

  for (const order of orders) {
    const allocation = calculateEscrowAllocation(order);
    totalUtangVendor += allocation.sisaUtangVendor;
    totalPiutangCustomer += allocation.sisaPiutangCustomer;
    totalMarginTerealisasi += allocation.alokasiMarginVisualKain;
  }

  const estimasiProfitBersih = totalMarginTerealisasi - bebanOperasional;

  return {
    saldoKasRiil,
    totalKasMasuk,
    totalKasKeluar,
    totalUtangVendor,
    totalPiutangCustomer,
    estimasiProfitBersih,
  };
}

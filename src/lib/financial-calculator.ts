import type {
  Order,
  CashTransaction,
  FinancialSummary,
  EscrowAllocation,
  VendorDebtBreakdown,
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
 * Menghitung ringkasan finansial eksekutif secara global (6 Kartu Metrik Finansial VisualKainDB)
 */
export function calculateFinancialSummary(
  saldoAwal: number,
  transactions: CashTransaction[],
  orders: Order[]
): FinancialSummary {
  let totalKasMasuk = 0;
  let totalKasKeluar = 0;
  let bebanOperasional = 0;
  let kasKeluarCount = 0;

  for (const tx of transactions) {
    if (tx.tipe === 'masuk') {
      totalKasMasuk += tx.nominal;
    } else {
      totalKasKeluar += tx.nominal;
      kasKeluarCount++;
      if (tx.kategori !== 'Pembayaran Vendor') {
        bebanOperasional += tx.nominal;
      }
    }
  }

  const saldoKasRiil = saldoAwal + totalKasMasuk - totalKasKeluar;

  let totalUtangVendor = 0;
  let totalPiutangCustomer = 0;
  let totalMarginTerealisasi = 0;
  let omzetTotal = 0;
  let omzetLunasCount = 0;
  let omzetBerjalanCount = 0;
  let totalProfitRealtime = 0;
  let vendorDebtCount = 0;
  let unpaidCustomerCount = 0;
  let totalDibayarKeVendor = 0;

  for (const order of orders) {
    const allocation = calculateEscrowAllocation(order);
    totalUtangVendor += allocation.sisaUtangVendor;
    totalPiutangCustomer += allocation.sisaPiutangCustomer;
    totalMarginTerealisasi += allocation.alokasiMarginVisualKain;
    totalDibayarKeVendor += order.totalDibayarKeVendor || 0;

    omzetTotal += order.totalInvoice;

    const opEx = order.biayaOperasional || 0;
    const profitOrder = order.profitAktual ?? (order.totalInvoice - order.totalHpp - opEx);
    totalProfitRealtime += profitOrder;

    const isLunas = order.statusPembayaran === 'lunas' || order.totalUangMasukCustomer >= order.totalInvoice;
    if (isLunas) {
      omzetLunasCount++;
    } else {
      omzetBerjalanCount++;
    }

    if (allocation.sisaUtangVendor > 0) {
      vendorDebtCount++;
    }

    if (allocation.sisaPiutangCustomer > 0) {
      unpaidCustomerCount++;
    }
  }

  const profitMarginPercent = omzetTotal > 0 ? (totalProfitRealtime / omzetTotal) * 100 : 0;
  const estimasiProfitBersih = totalMarginTerealisasi - bebanOperasional;

  return {
    saldoKasRiil,
    totalKasMasuk,
    totalKasKeluar,
    totalUtangVendor,
    totalPiutangCustomer,
    estimasiProfitBersih,
    omzetTotal,
    omzetLunasCount,
    omzetBerjalanCount,
    totalProfitRealtime,
    profitMarginPercent,
    kasKeluarCount,
    vendorDebtCount,
    unpaidCustomerCount,
    totalDibayarKeVendor,
    bebanOperasionalNonVendor: bebanOperasional,
  };
}

/**
 * Mengelompokkan utang vendor per mitra untuk inspeksi drilldown
 */
export function computeVendorDebtBreakdown(orders: Order[]): VendorDebtBreakdown[] {
  const map = new Map<string, VendorDebtBreakdown>();

  for (const order of orders) {
    const sisaUtang = Math.max(0, order.totalHpp - order.totalDibayarKeVendor);
    const vendorName = order.vendorName || (order.vendorPembayaranList?.[0]?.vendorName) || 'Mitra Konveksi';

    const current = map.get(vendorName) ?? {
      vendorName,
      totalHpp: 0,
      totalDibayar: 0,
      sisaUtang: 0,
      orderCount: 0,
      orders: [],
    };

    current.totalHpp += order.totalHpp;
    current.totalDibayar += order.totalDibayarKeVendor;
    current.sisaUtang += sisaUtang;
    current.orderCount += 1;
    current.orders.push(order);

    map.set(vendorName, current);
  }

  return Array.from(map.values()).sort((a, b) => b.sisaUtang - a.sisaUtang);
}

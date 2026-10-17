import type {
  Order,
  CashTransaction,
  CashOutflowEntry,
  CashOutflowCategory,
  FinancialSummary,
  EscrowAllocation,
  VendorDebtBreakdown,
  EscrowLiquidityCalculation,
  MasterFinanceRow,
} from '@/types';
import type { CashPeriodSummary } from './cash-ledger';
import { isInvestorInflow, isInvestorRepayment, isInvestorTransaction } from './investor-ledger';
import { pickAudit } from './audit';

function isDuplicateOrderVendorTx(tx: CashTransaction, orders: Order[]): boolean {
  if (tx.kategori !== 'Pembayaran Vendor') return false;
  return orders.some((o) => {
    if ((o.totalDibayarKeVendor || 0) <= 0) return false;
    if (tx.orderId && tx.orderId === o.id) return true;
    if (tx.refInvoice && tx.refInvoice === o.noInv) return true;
    const ketLower = (tx.keterangan || '').toLowerCase();
    const orderNumAlias = o.id.toLowerCase().replace('ord-', 'order ');
    if (
      o.totalDibayarKeVendor === tx.nominal &&
      ((o.noInv && ketLower.includes(o.noInv.toLowerCase())) || ketLower.includes(orderNumAlias))
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Menggabungkan seluruh arus uang keluar dari:
 * 1. Pembayaran / DP ke Vendor pada Order (totalDibayarKeVendor / vendorPembayaranList)
 * 2. Biaya Operasional Produksi pada Order (biayaOperasional)
 * 3. Pengeluaran Kas Umum / Operasional Non-Order pada koleksi `kas` (tipe === 'keluar')
 */
export function buildCashOutflowEntries(
  orders: Order[],
  transactions: CashTransaction[]
): CashOutflowEntry[] {
  const entries: CashOutflowEntry[] = [];

  for (const order of orders) {
    const dibayarVendor = order.totalDibayarKeVendor || 0;
    const vpList = order.vendorPembayaranList || [];
    const vpListValid = vpList.filter((vp) => (vp.nominal || 0) > 0);

    if (vpListValid.length > 0) {
      let sumList = 0;
      vpListValid.forEach((vp, idx) => {
        sumList += vp.nominal;
        const targetVendor = vp.vendorName || order.vendorName || 'Mitra Produksi';
        const stepLabel = vp.label || (vp.terminKe ? `Pembayaran ke-${vp.terminKe}` : '');
        const rawNote = vp.keterangan || vp.catatan || '';
        const formattedKeterangan = rawNote
          ? stepLabel && !rawNote.toLowerCase().includes(stepLabel.toLowerCase())
            ? `${stepLabel} (${targetVendor} - ${order.noInv}): ${rawNote}`
            : rawNote
          : `${stepLabel || 'Pembayaran'} ke Vendor (${targetVendor}) - ${order.projectName || order.customerName} (${order.noInv})`;

        entries.push({
          id: vp.id || `vp-${order.id}-${idx + 1}`,
          tanggal: vp.tanggal || order.tanggalOrder,
          nominal: vp.nominal,
          kategori: 'Pembayaran Vendor',
          keterangan: formattedKeterangan,
          sumber: 'order',
          noInv: order.noInv,
          vendorOrTargetName: targetVendor,
          rawOrder: order,
          ...pickAudit(vp),
        });
      });

      const remainder = dibayarVendor - sumList;
      if (remainder > 0) {
        const targetVendor = order.vendorName || 'Mitra Produksi';
        entries.push({
          id: `vp-rem-${order.id}`,
          tanggal: order.tanggalOrder,
          nominal: remainder,
          kategori: 'Pembayaran Vendor',
          keterangan: `DP / Pembayaran ke Vendor (${targetVendor}) - ${order.projectName || order.customerName} (${order.noInv})`,
          sumber: 'order',
          noInv: order.noInv,
          vendorOrTargetName: targetVendor,
          rawOrder: order,
        });
      }
    } else if (dibayarVendor > 0) {
      const targetVendor = order.vendorName || 'Mitra Produksi';
      entries.push({
        id: `vp-${order.id}`,
        tanggal: order.tanggalOrder,
        nominal: dibayarVendor,
        kategori: 'Pembayaran Vendor',
        keterangan: `DP / Pembayaran ke Vendor (${targetVendor}) - ${order.projectName || order.customerName} (${order.noInv})`,
        sumber: 'order',
        noInv: order.noInv,
        vendorOrTargetName: targetVendor,
        rawOrder: order,
      });
    }

    const opEx = order.biayaOperasional || 0;
    if (opEx > 0) {
      entries.push({
        id: `opex-${order.id}`,
        tanggal: order.tanggalOrder,
        nominal: opEx,
        kategori: 'Biaya Operasional Order',
        keterangan: `Biaya Operasional Produksi - ${order.projectName || order.customerName} (${order.noInv})`,
        sumber: 'order',
        noInv: order.noInv,
        vendorOrTargetName: order.customerName,
        rawOrder: order,
      });
    }
  }

  for (const tx of transactions) {
    if (tx.tipe !== 'keluar') continue;
    if (isDuplicateOrderVendorTx(tx, orders)) {
      continue;
    }

    entries.push({
      id: tx.id,
      tanggal: tx.tanggal,
      nominal: tx.nominal,
      kategori: (tx.kategori as CashOutflowCategory) || 'Operasional',
      keterangan: tx.keterangan || 'Pengeluaran Kas Operasional',
      sumber: 'manual',
      noInv: tx.refInvoice || 'KAS-KELUAR',
      vendorOrTargetName: isInvestorTransaction(tx)
        ? tx.investorNama?.trim() || 'Investor'
        : tx.kategori === 'Pembayaran Vendor' || tx.kategori === 'Pembayaran Vendor Lainnya'
        ? 'Mitra Vendor (Non-Order)'
        : 'Kas Operasional',
      rawTransaction: tx,
      ...pickAudit(tx),
    });
  }

  return entries.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

/**
 * Menghitung alokasi 2 kantong likuiditas bank (Escrow Liquidity Invariant)
 * Memastikan persentase selalu valid dan menangani saldo kas negatif (defisit) secara matematis & visual.
 */
export function calculateEscrowLiquidity(
  saldoKasRiil: number,
  totalUtangVendor: number
): EscrowLiquidityCalculation {
  const isDefisit = saldoKasRiil < 0;

  if (isDefisit) {
    return {
      kasAmanDitarik: 0,
      danaTerkunciVendor: 0,
      percentBebas: 0,
      percentTerkunci: 0,
      percentDefisit: 100,
      isDefisit: true,
      isHealthy: false,
      statusLabel: 'Defisit Kas Riil',
      coverageLabel: 'Dana Belum Tercover',
    };
  }

  if (saldoKasRiil === 0) {
    return {
      kasAmanDitarik: 0,
      danaTerkunciVendor: 0,
      percentBebas: 0,
      percentTerkunci: 0,
      percentDefisit: 0,
      isDefisit: false,
      isHealthy: false,
      statusLabel: '0% Aman Ditarik',
      coverageLabel: totalUtangVendor > 0 ? 'Utang Belum Tercover' : 'Tanpa Beban Utang',
    };
  }

  const safeUtangVendor = Math.max(0, totalUtangVendor);
  const danaTerkunciVendor = Math.min(saldoKasRiil, safeUtangVendor);
  const kasAmanDitarik = Math.max(0, saldoKasRiil - danaTerkunciVendor);

  const percentBebas = Number(Math.max(0, Math.min(100, (kasAmanDitarik / saldoKasRiil) * 100)).toFixed(1));
  const percentTerkunci = Number(Math.max(0, Math.min(100, (danaTerkunciVendor / saldoKasRiil) * 100)).toFixed(1));

  const isHealthy = percentBebas >= 25;
  const isFullyCovered = danaTerkunciVendor >= safeUtangVendor;

  return {
    kasAmanDitarik,
    danaTerkunciVendor,
    percentBebas,
    percentTerkunci,
    percentDefisit: 0,
    isDefisit: false,
    isHealthy,
    statusLabel: `${percentBebas}% Aman Ditarik`,
    coverageLabel: isFullyCovered
      ? 'Utang Tercover 100%'
      : `Utang Tercover ${((danaTerkunciVendor / Math.max(1, safeUtangVendor)) * 100).toFixed(0)}%`,
  };
}

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
  let kasMasukNonOrder = 0;
  let bebanOperasional = 0;
  let manualVendorPayments = 0;
  let danaInvestorMasuk = 0;
  let danaInvestorKembali = 0;

  for (const tx of transactions) {
    if (tx.tipe === 'masuk') {
      if (isInvestorInflow(tx)) {
        danaInvestorMasuk += tx.nominal;
      } else if (tx.kategori !== 'Penerimaan Konsumen') {
        kasMasukNonOrder += tx.nominal;
      }
    } else {
      if (isInvestorRepayment(tx)) {
        danaInvestorKembali += tx.nominal;
      } else if (tx.kategori === 'Pembayaran Vendor') {
        if (!isDuplicateOrderVendorTx(tx, orders)) {
          manualVendorPayments += tx.nominal;
        }
      } else {
        bebanOperasional += tx.nominal;
      }
    }
  }

  let totalUtangVendor = 0;
  let totalPiutangCustomer = 0;
  let totalMarginTerealisasi = 0;
  let omzetTotal = 0;
  let omzetLunasCount = 0;
  let omzetBerjalanCount = 0;
  let totalProfitRealtime = 0;
  let vendorDebtCount = 0;
  let unpaidCustomerCount = 0;
  let totalDibayarKeVendor = manualVendorPayments;
  let totalUangMasukOrders = 0;
  let totalBiayaOperasionalOrders = 0;

  for (const order of orders) {
    const sisaUtangVendor = Math.max(0, order.totalHpp - (order.totalDibayarKeVendor || 0));
    const sisaPiutangCustomer = Math.max(0, order.totalInvoice - (order.totalUangMasukCustomer || 0));

    totalUtangVendor += sisaUtangVendor;
    totalPiutangCustomer += sisaPiutangCustomer;
    totalDibayarKeVendor += order.totalDibayarKeVendor || 0;
    totalUangMasukOrders += order.totalUangMasukCustomer || 0;

    omzetTotal += order.totalInvoice;

    const opEx = order.biayaOperasional || 0;
    totalBiayaOperasionalOrders += opEx;
    const profitOrder = order.totalInvoice - order.totalHpp - opEx;
    totalProfitRealtime += profitOrder;

    const allocation = calculateEscrowAllocation(order);
    totalMarginTerealisasi += allocation.alokasiMarginVisualKain;

    // Lunas murni berbasis pembayaran; status produksi 'completed' tidak berarti tagihan sudah dibayar.
    const isLunas = sisaPiutangCustomer <= 0;
    if (isLunas) {
      omzetLunasCount++;
    } else {
      omzetBerjalanCount++;
    }

    if (sisaUtangVendor > 0) {
      vendorDebtCount++;
    }

    if (sisaPiutangCustomer > 0) {
      unpaidCustomerCount++;
    }
  }

  const outflowEntries = buildCashOutflowEntries(orders, transactions);
  const totalKasMasukUsaha = totalUangMasukOrders + kasMasukNonOrder;
  const totalKasMasuk = totalKasMasukUsaha + danaInvestorMasuk;
  const totalBebanOperasional = bebanOperasional + totalBiayaOperasionalOrders;
  const totalKasKeluar = totalDibayarKeVendor + totalBebanOperasional + danaInvestorKembali;
  const kasKeluarCount = outflowEntries.length;
  const saldoKasRiil = saldoAwal + totalKasMasuk - totalKasKeluar;
  const profitMarginPercent = omzetTotal > 0 ? (totalProfitRealtime / omzetTotal) * 100 : 0;
  const estimasiProfitBersih = totalMarginTerealisasi - totalBebanOperasional;
  const labaBersih = totalProfitRealtime - bebanOperasional;

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
    bebanOperasionalNonVendor: totalBebanOperasional,
    bebanOperasionalOrders: totalBiayaOperasionalOrders,
    bebanOperasionalKas: bebanOperasional,
    totalKasMasukUsaha,
    danaInvestorMasuk,
    danaInvestorKembali,
    kewajibanInvestor: danaInvestorMasuk - danaInvestorKembali,
    labaBersih,
    labaBersihMarginPercent: omzetTotal > 0 ? (labaBersih / omzetTotal) * 100 : 0,
  };
}


/** Metrik kas memakai cash basis per tanggal entri (F-10 K-1/K-2); metrik omzet, piutang, utang, dan laba tetap berbasis order. */
export function applyCashPeriod(summary: FinancialSummary, cash: CashPeriodSummary): FinancialSummary {
  const labaBersih = summary.totalProfitRealtime - cash.keluarKas;
  return {
    ...summary,
    saldoKasRiil: cash.saldoKas,
    saldoAwalPeriode: cash.saldoAwalPeriode,
    totalKasMasuk: cash.masukPeriode,
    totalKasKeluar: cash.keluarPeriode,
    totalDibayarKeVendor: cash.keluarVendor,
    bebanOperasionalNonVendor: cash.keluarOpexOrder + cash.keluarKas,
    bebanOperasionalOrders: cash.keluarOpexOrder,
    bebanOperasionalKas: cash.keluarKas,
    kasKeluarCount: cash.keluarCount,
    totalKasMasukUsaha: cash.masukOrder + cash.masukNonOrder,
    danaInvestorMasuk: cash.masukInvestor,
    danaInvestorKembali: cash.keluarInvestor,
    kewajibanInvestor: cash.kewajibanInvestor,
    labaBersih,
    labaBersihMarginPercent: summary.omzetTotal > 0 ? (labaBersih / summary.omzetTotal) * 100 : 0,
  };
}

export interface OrderAggregate {
  count: number;
  totalInvoice: number;
  totalHpp: number;
  totalBiayaOperasional: number;
  totalDibayarVendor: number;
  sisaUtangVendor: number;
  netProfit: number;
}

/** Total gabungan beberapa pesanan, dipakai saat drawer difilter ke satu vendor. */
export function aggregateOrders(orders: ReadonlyArray<Order>): OrderAggregate {
  return orders.reduce<OrderAggregate>(
    (acc, o) => {
      const opex = o.biayaOperasional || 0;
      acc.count += 1;
      acc.totalInvoice += o.totalInvoice;
      acc.totalHpp += o.totalHpp;
      acc.totalBiayaOperasional += opex;
      acc.totalDibayarVendor += o.totalDibayarKeVendor || 0;
      acc.sisaUtangVendor += Math.max(0, o.totalHpp - (o.totalDibayarKeVendor || 0));
      acc.netProfit += o.totalInvoice - o.totalHpp - opex;
      return acc;
    },
    { count: 0, totalInvoice: 0, totalHpp: 0, totalBiayaOperasional: 0, totalDibayarVendor: 0, sisaUtangVendor: 0, netProfit: 0 }
  );
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

/**
 * Mengonversi daftar Order menjadi MasterFinanceRow dengan metrik 70% threshold & referensi originalOrder
 */
export function transformToMasterRows(orders: Order[]): MasterFinanceRow[] {
  return orders.map((o) => {
    const totalJumlah = o.totalInvoice;
    const nominalDpCustomer = o.totalUangMasukCustomer;
    const dpPersenCustomer = totalJumlah > 0 ? (nominalDpCustomer / totalJumlah) * 100 : 0;
    const sisaPelunasanCustomer = Math.max(0, totalJumlah - nominalDpCustomer);
    const sisaPembayaranVendor = Math.max(0, o.totalHpp - o.totalDibayarKeVendor);
    const biayaOperasional = o.biayaOperasional || 0;
    const profitBersih = totalJumlah - o.totalHpp - biayaOperasional;
    const profitPercent = totalJumlah > 0 ? (profitBersih / totalJumlah) * 100 : 0;

    let statusDpThreshold: 'belum_dp' | 'dp1_parsial' | 'dp2_siap_produksi' | 'lunas_total' = 'belum_dp';
    let sisaMenujuDp70 = 0;

    if (dpPersenCustomer >= 100) {
      statusDpThreshold = 'lunas_total';
    } else if (dpPersenCustomer >= 70) {
      statusDpThreshold = 'dp2_siap_produksi';
    } else if (dpPersenCustomer > 0) {
      statusDpThreshold = 'dp1_parsial';
      sisaMenujuDp70 = Math.max(0, 0.7 * totalJumlah - nominalDpCustomer);
    }

    const statusOrder =
      o.statusOrder ||
      (o.statusPembayaran === 'lunas' || dpPersenCustomer >= 100
        ? 'SELESAI'
        : dpPersenCustomer >= 70
        ? 'PRODUKSI'
        : 'PEMBAYARAN');

    return {
      ...o,
      originalOrder: o,
      id: o.id,
      noInv: o.noInv,
      tanggalInv: o.tanggalOrder,
      namaCustomer: o.customerName,
      ...pickAudit(o),
      namaProject: o.projectName || '-',
      noWaCustomer: o.noWaCustomer,
      totalBiayaVendor: o.totalHpp,
      dpVendor: o.totalDibayarKeVendor,
      sisaPembayaranVendor,
      totalQty: o.totalQty || 1,
      totalJumlah,
      dpPersenCustomer,
      nominalDpCustomer,
      sisaPelunasanCustomer,
      biayaOperasional,
      biayaTambahanVendor: o.biayaTambahanVendor || 0,
      biayaTambahanCustomer: o.biayaTambahanCustomer || 0,
      diskon: o.diskon || 0,
      profitBersih,
      profitPercent,
      statusDpThreshold,
      sisaMenujuDp70,
      statusOrder,
      pembayaranList: o.pembayaranList,
      vendorName: o.vendorName || '-',
    };
  });
}


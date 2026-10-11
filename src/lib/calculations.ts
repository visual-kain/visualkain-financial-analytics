/**
 * Perhitungan Standar Finansial VisualKain 2026
 * Porting langsung dari visualkaindb untuk kalkulasi presisi 100% identik dengan Single Source of Truth (SSOT).
 */

import type {
  Order,
  VendorPerformanceItem,
  CheapestByCategory,
  VendorPerformanceResult,
} from '@/types';

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'] as const;
export type SizeType = typeof SIZES[number];

export const CATEGORIES = ['pendek', 'panjang', 'tanpaLengan'] as const;
export type CategoryType = typeof CATEGORIES[number];

export function getSizeExtraPrice(size: string): number {
  switch (size) {
    case 'XS': return 0;
    case '2XL': return 5000;
    case '3XL': return 10000;
    case '4XL': return 15000;
    case '5XL': return 20000;
    default: return 0;
  }
}

function capitalize(str: string): string {
  if (str === 'tanpaLengan') return 'TanpaLengan';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export interface CalculatedOrderTotals {
  totalPesanan: number;
  grossTotal: number;
  diskon: number;
  biayaTambahanCust: number;
  biayaLainnya: number;      // Biaya tambahan vendor (bordir, sablon, packaging)
  jumlahSemua: number;       // totalInvoice net ke customer
  totalHpp: number;          // total beban vendor (modal dasar + biaya lainnya)
  dpVendor: number;          // pembayaran DP ke vendor
  sisaVendor: number;        // utang vendor yang belum dibayar
  dpPersen: number;
  nominalDP: number;         // uang masuk customer terkunci
  sisaPelunasan: number;     // sisa tagihan customer (outstanding piutang)
  profit: number;            // keuntungan bersih pesanan
  profitPercent: number;
}

export function calculateOrderTotals(order: Record<string, any>): CalculatedOrderTotals {
  let grandTotalQty = 0;
  let grandTotalJual = 0;
  let grandTotalModal = 0;

  // 1. Cek apakah dokumen memiliki rincian size per kategori
  let hasSizeBreakdown = false;

  CATEGORIES.forEach((cat) => {
    const baseJual = Number(order[`harga${capitalize(cat)}`] || 0);
    const baseModal = Number(order[`hargaVendor${capitalize(cat)}`] || 0);

    SIZES.forEach((s) => {
      const qty = Number(order[`${cat}${s}`] || 0);
      if (qty > 0) hasSizeBreakdown = true;
      const extra = getSizeExtraPrice(s);

      grandTotalQty += qty;
      grandTotalJual += qty * (baseJual + extra);
      grandTotalModal += qty * (baseModal + extra);
    });
  });

  const opEx = Number(order.biayaOperasional || 0);
  const discount = Number(order.diskonHarga || order.diskon || 0);
  const dpPersen = Number(order.dpPersen || 0);
  const dpPersenPO = Number(order.dpPersenPO || 0);

  const biayaTambahanCust = Number(order.biayaTambahanCust || order.biayaTambahanCustomer || 0);
  const biayaLainnya = Number(order.biayaLainnya || order.biayaTambahanVendor || 0);

  // Jika tidak memiliki data breakdown size, gunakan field total agregat yang ada
  if (!hasSizeBreakdown) {
    const fallBackJual = Number(order.totalInvoice || order.jumlahSemua || order.grossTotal || 0);
    const fallBackModal = Number(order.totalBiayaVendor || order.hpp || order.totalHpp || 0);
    const fallBackQty = Number(order.totalPesanan || order.totalQty || 1);

    const netTotal = fallBackJual > 0 ? fallBackJual - discount + biayaTambahanCust : 0;
    const nominalDP = order.dpNominal && Number(order.dpNominal) > 0
      ? Number(order.dpNominal)
      : Math.round(netTotal * (dpPersen / 100));
    const sisaPelunasan = netTotal - nominalDP;
    const profit = netTotal - fallBackModal - opEx - biayaLainnya;
    const totalHpp = netTotal - opEx - profit;

    const dpVendor = order.dpNominalPO && Number(order.dpNominalPO) > 0
      ? Number(order.dpNominalPO)
      : Math.round(totalHpp * (dpPersenPO / 100));
    const sisaVendor = Math.max(totalHpp - dpVendor, 0);

    return {
      totalPesanan: fallBackQty,
      grossTotal: fallBackJual,
      diskon: discount,
      biayaTambahanCust,
      biayaLainnya,
      jumlahSemua: netTotal,
      totalHpp,
      dpVendor,
      sisaVendor,
      dpPersen,
      nominalDP,
      sisaPelunasan,
      profit,
      profitPercent: netTotal > 0 ? (profit / netTotal) * 100 : 0,
    };
  }

  // Formula SSOT VisualKainDB:
  // netTotal = grandTotalJual - discount + biayaTambahanCust
  const netTotal = grandTotalJual - discount + biayaTambahanCust;
  const nominalDP = order.dpNominal && Number(order.dpNominal) > 0
    ? Number(order.dpNominal)
    : Math.round(netTotal * (dpPersen / 100));
  const sisaPelunasan = netTotal - nominalDP;

  // Profit = netTotal - grandTotalModal - opEx - biayaLainnya
  const profit = netTotal - grandTotalModal - opEx - biayaLainnya;

  // HPP = netTotal - opEx - profit (Secara matematis sama dengan grandTotalModal + biayaLainnya)
  const totalHpp = netTotal - opEx - profit;

  const dpVendor = order.dpNominalPO && Number(order.dpNominalPO) > 0
    ? Number(order.dpNominalPO)
    : Math.round(totalHpp * (dpPersenPO / 100));
  const sisaVendor = Math.max(totalHpp - dpVendor, 0);

  return {
    totalPesanan: grandTotalQty,
    grossTotal: grandTotalJual,
    diskon: discount,
    biayaTambahanCust,
    biayaLainnya,
    jumlahSemua: netTotal,
    totalHpp,
    dpVendor,
    sisaVendor,
    dpPersen,
    nominalDP,
    sisaPelunasan,
    profit,
    profitPercent: netTotal > 0 ? (profit / netTotal) * 100 : 0,
  };
}

export const calculateTotals = calculateOrderTotals;

export function computeVendorPerformance(
  orders: Order[],
  vendors: Array<{ id: string; nama: string }>
): VendorPerformanceResult {
  const map = new Map<
    string,
    {
      vendorId: string;
      vendorNama: string;
      orderCount: number;
      pcsTotal: number;
      totalHpp: number;
      hppAktualTotal: number;
      revenue: number;
      profit: number;
    }
  >();

  // Inisialisasi semua vendor terdaftar (termasuk yang belum punya order)
  vendors.forEach((v) => {
    map.set(v.id, {
      vendorId: v.id,
      vendorNama: v.nama,
      orderCount: 0,
      pcsTotal: 0,
      totalHpp: 0,
      hppAktualTotal: 0,
      revenue: 0,
      profit: 0,
    });
  });

  /* PASS 1: agregat per order */
  orders.forEach((o) => {
    const t = calculateOrderTotals(o);
    const opEx = Number(o.biayaOperasional || 0);
    const hpp = t.jumlahSemua - opEx - t.profit;
    const key = o.vendorId || 'none';
    const vp = map.get(key) ?? {
      vendorId: key,
      vendorNama: o.vendorName || 'Tanpa Vendor',
      orderCount: 0,
      pcsTotal: 0,
      totalHpp: 0,
      hppAktualTotal: 0,
      revenue: 0,
      profit: 0,
    };

    vp.orderCount++;
    vp.pcsTotal += t.totalPesanan;
    vp.totalHpp += hpp;
    const hppAktual = o.hppAktual != null ? Number(o.hppAktual) : hpp;
    vp.hppAktualTotal += hppAktual;
    vp.revenue += t.jumlahSemua;
    const pAktual = o.profitAktual != null ? Number(o.profitAktual) : t.profit;
    vp.profit += pAktual;
    map.set(key, vp);
  });

  /* PASS 2: rata-rata harga vendor per kategori lengan */
  const sums = new Map<
    string,
    { pendek: number; pendekN: number; panjang: number; panjangN: number; tl: number; tlN: number }
  >();
  orders.forEach((o) => {
    const key = o.vendorId || 'none';
    const s = sums.get(key) ?? { pendek: 0, pendekN: 0, panjang: 0, panjangN: 0, tl: 0, tlN: 0 };
    const hpPendek = Number(o.hargaVendorPendek || 0);
    const hpPanjang = Number(o.hargaVendorPanjang || 0);
    const hpTL = Number(o.hargaVendorTanpaLengan || 0);
    if (hpPendek > 0) {
      s.pendek += hpPendek;
      s.pendekN++;
    }
    if (hpPanjang > 0) {
      s.panjang += hpPanjang;
      s.panjangN++;
    }
    if (hpTL > 0) {
      s.tl += hpTL;
      s.tlN++;
    }
    sums.set(key, s);
  });

  const list: VendorPerformanceItem[] = [...map.values()].map((vp) => {
    const s = sums.get(vp.vendorId);
    const avg = (total: number, n: number) => (n > 0 ? Math.round(total / n) : 0);
    const selisihQuotation = vp.hppAktualTotal - vp.totalHpp;
    const marginPercent = vp.revenue > 0 ? Number(((vp.profit / vp.revenue) * 100).toFixed(1)) : 0;
    return {
      vendorId: vp.vendorId,
      vendorNama: vp.vendorNama,
      orderCount: vp.orderCount,
      pcsTotal: vp.pcsTotal,
      avgLenganPendek: s ? avg(s.pendek, s.pendekN) : 0,
      avgLenganPanjang: s ? avg(s.panjang, s.panjangN) : 0,
      avgTanpaLengan: s ? avg(s.tl, s.tlN) : 0,
      hppQuotation: vp.totalHpp,
      hppAktual: vp.hppAktualTotal,
      selisihQuotation,
      profit: vp.profit,
      marginPercent,
    };
  });

  const withOrders = list.filter((v) => v.orderCount > 0).sort((a, b) => b.orderCount - a.orderCount);
  const tanpaOrder = list
    .filter((v) => v.orderCount === 0)
    .map((v) => ({ vendorId: v.vendorId, vendorNama: v.vendorNama }));

  // Vendor termurah per tipe lengan
  const cheapest = {
    pendek: withOrders
      .filter((v) => v.avgLenganPendek > 0)
      .sort((a, b) => a.avgLenganPendek - b.avgLenganPendek)[0],
    panjang: withOrders
      .filter((v) => v.avgLenganPanjang > 0)
      .sort((a, b) => a.avgLenganPanjang - b.avgLenganPanjang)[0],
    tanpaLengan: withOrders
      .filter((v) => v.avgTanpaLengan > 0)
      .sort((a, b) => a.avgTanpaLengan - b.avgTanpaLengan)[0],
  };

  return {
    vendors: withOrders,
    cheapest,
    mostUsed: withOrders[0],
    tanpaOrder,
  };
}

export function computeCheapestByKategori(
  orders: Order[],
  getVendorName: (id: string) => string
): CheapestByCategory[] {
  const map = new Map<
    string,
    { kategori: string; vendorId: string; hpp: number; pcs: number; orderCount: number }
  >();

  orders.forEach((o) => {
    const t = calculateOrderTotals(o);
    if (t.totalPesanan <= 0) return;
    const opEx = Number(o.biayaOperasional || 0);
    const hpp = t.jumlahSemua - opEx - t.profit;
    const rawKategori = (o.kategoriOrder || '—').trim();
    const kategori = rawKategori || '—';
    const vendorId = o.vendorId || 'none';
    const key = `${kategori}|${vendorId}`;
    const g = map.get(key) ?? { kategori, vendorId, hpp: 0, pcs: 0, orderCount: 0 };
    g.hpp += hpp;
    g.pcs += t.totalPesanan;
    g.orderCount++;
    map.set(key, g);
  });

  const best = new Map<
    string,
    { kategori: string; vendorId: string; avgCost: number; orderCount: number; pcs: number }
  >();
  [...map.values()].forEach((g) => {
    const avgCost = Math.round(g.hpp / g.pcs);
    const cur = best.get(g.kategori);
    if (!cur || avgCost < cur.avgCost) {
      best.set(g.kategori, {
        kategori: g.kategori,
        vendorId: g.vendorId,
        avgCost,
        orderCount: g.orderCount,
        pcs: g.pcs,
      });
    }
  });

  return [...best.values()]
    .map((b) => ({
      kategori: b.kategori,
      vendorNama: getVendorName(b.vendorId),
      avgCost: b.avgCost,
      orderCount: b.orderCount,
      pcs: b.pcs,
    }))
    .sort((a, b) => a.kategori.localeCompare(b.kategori));
}

/**
 * Perhitungan Standar Finansial VisualKain 2026
 * Porting langsung dari visualkaindb untuk kalkulasi presisi 100% identik.
 */

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
  jumlahSemua: number;       // totalInvoice net
  totalHpp: number;          // grandTotalModal
  dpPersen: number;
  nominalDP: number;
  sisaPelunasan: number;
  profit: number;
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

  // Jika tidak memiliki data breakdown size, gunakan field total agregat yang ada
  if (!hasSizeBreakdown) {
    const fallBackJual = Number(order.totalInvoice || order.jumlahSemua || order.grossTotal || 0);
    const fallBackModal = Number(order.totalBiayaVendor || order.hpp || order.totalHpp || 0);
    const fallBackQty = Number(order.totalPesanan || order.totalQty || 1);

    const netTotal = fallBackJual > 0 ? fallBackJual - discount : 0;
    const nominalDP = order.dpNominal && Number(order.dpNominal) > 0
      ? Number(order.dpNominal)
      : Math.round(netTotal * (dpPersen / 100));
    const sisaPelunasan = netTotal - nominalDP;
    const profit = netTotal - fallBackModal - opEx;

    return {
      totalPesanan: fallBackQty,
      grossTotal: fallBackJual,
      diskon: discount,
      jumlahSemua: netTotal,
      totalHpp: fallBackModal,
      dpPersen,
      nominalDP,
      sisaPelunasan,
      profit,
      profitPercent: netTotal > 0 ? (profit / netTotal) * 100 : 0,
    };
  }

  const netTotal = grandTotalJual - discount;
  const nominalDP = order.dpNominal && Number(order.dpNominal) > 0
    ? Number(order.dpNominal)
    : Math.round(netTotal * (dpPersen / 100));
  const sisaPelunasan = netTotal - nominalDP;
  const profit = netTotal - grandTotalModal - opEx;

  return {
    totalPesanan: grandTotalQty,
    grossTotal: grandTotalJual,
    diskon: discount,
    jumlahSemua: netTotal,
    totalHpp: grandTotalModal,
    dpPersen,
    nominalDP,
    sisaPelunasan,
    profit,
    profitPercent: netTotal > 0 ? (profit / netTotal) * 100 : 0,
  };
}

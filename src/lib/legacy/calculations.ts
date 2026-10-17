/**
 * Rumus order dari `visualkaindb/src/lib/calculations.ts`, disalin tanpa perubahan kecuali kategori
 * `tigaPerempat` (3/4 Tangan, K-13) yang memakai aturan harga dan tambahan ukuran besar yang sama.
 */

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'] as const;
export type SizeType = (typeof SIZES)[number];

export const CATEGORIES = ['pendek', 'panjang', 'tanpaLengan', 'tigaPerempat'] as const;
export type CategoryType = (typeof CATEGORIES)[number];

/** Urutan tampil di form dan detail (dari lengan terpendek tanpa mengubah urutan hitung). */
export const CATEGORY_DISPLAY_ORDER: CategoryType[] = ['pendek', 'tigaPerempat', 'panjang', 'tanpaLengan'];

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  pendek: 'Pendek',
  panjang: 'Panjang',
  tanpaLengan: 'Tanpa Lengan',
  tigaPerempat: '3/4 Tangan',
};

export const CATEGORY_TECHPACK_LABELS: Record<CategoryType, string> = {
  pendek: 'Lengan Pendek',
  panjang: 'Lengan Panjang',
  tanpaLengan: 'Tanpa Lengan',
  tigaPerempat: 'Lengan 3/4',
};

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

export function capitalize(str: string): string {
  if (str === 'tanpaLengan') return 'TanpaLengan';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function priceKey(cat: CategoryType): string {
  return `harga${capitalize(cat)}`;
}

export function vendorPriceKey(cat: CategoryType): string {
  return `hargaVendor${capitalize(cat)}`;
}

export function qtyKey(cat: CategoryType, size: string): string {
  return `${cat}${size}`;
}

type OrderLike = Record<string, unknown>;

function num(order: OrderLike, key: string): number {
  return (order[key] as number) || 0;
}

export interface CategoryBreakdown {
  qty: number;
  jual: number;
  modal: number;
}

export interface LegacyTotals {
  totalPesanan: number;
  totalJualPendek: number;
  totalJualPanjang: number;
  totalJualTanpaLengan: number;
  totalJualTigaPerempat: number;
  qtyPerKategori: Record<CategoryType, number>;
  grossTotal: number;
  grossModal: number;
  diskon: number;
  jumlahSemua: number;
  dpPersen: number;
  nominalDP: number;
  sisaPelunasan: number;
  profit: number;
  profitPercent: number;
}

export function calculateTotals(order: OrderLike): LegacyTotals {
  const totalsBreakdown: Record<CategoryType, CategoryBreakdown> = {
    pendek: { qty: 0, jual: 0, modal: 0 },
    panjang: { qty: 0, jual: 0, modal: 0 },
    tanpaLengan: { qty: 0, jual: 0, modal: 0 },
    tigaPerempat: { qty: 0, jual: 0, modal: 0 },
  };

  let grandTotalQty = 0;
  let grandTotalJual = 0;
  let grandTotalModal = 0;

  CATEGORIES.forEach((cat) => {
    const baseJual = num(order, priceKey(cat));
    const baseModal = num(order, vendorPriceKey(cat));

    SIZES.forEach((s) => {
      const qty = num(order, qtyKey(cat, s));
      const extra = getSizeExtraPrice(s);

      totalsBreakdown[cat].qty += qty;
      totalsBreakdown[cat].jual += qty * (baseJual + extra);
      totalsBreakdown[cat].modal += qty * (baseModal + extra);
    });

    grandTotalQty += totalsBreakdown[cat].qty;
    grandTotalJual += totalsBreakdown[cat].jual;
    grandTotalModal += totalsBreakdown[cat].modal;
  });

  const opEx = num(order, 'biayaOperasional');
  const discount = num(order, 'diskonHarga');
  const dpPersen = num(order, 'dpPersen');

  const netTotal = grandTotalJual - discount;
  const nominalDP = Math.round(netTotal * (dpPersen / 100));
  const sisaPelunasan = netTotal - nominalDP;
  const profit = netTotal - grandTotalModal - opEx;

  return {
    totalPesanan: grandTotalQty,
    totalJualPendek: totalsBreakdown.pendek.jual,
    totalJualPanjang: totalsBreakdown.panjang.jual,
    totalJualTanpaLengan: totalsBreakdown.tanpaLengan.jual,
    totalJualTigaPerempat: totalsBreakdown.tigaPerempat.jual,
    qtyPerKategori: {
      pendek: totalsBreakdown.pendek.qty,
      panjang: totalsBreakdown.panjang.qty,
      tanpaLengan: totalsBreakdown.tanpaLengan.qty,
      tigaPerempat: totalsBreakdown.tigaPerempat.qty,
    },
    grossTotal: grandTotalJual,
    grossModal: grandTotalModal,
    diskon: discount,
    jumlahSemua: netTotal,
    dpPersen,
    nominalDP,
    sisaPelunasan,
    profit,
    profitPercent: netTotal > 0 ? (profit / netTotal) * 100 : 0,
  };
}

/** Total modal vendor (harga modal + tambahan ukuran besar), sama dengan `vendorGrandTotal` di OrderForm lama. */
export function calculateVendorGrandTotal(order: OrderLike): number {
  let total = 0;
  CATEGORIES.forEach((cat) => {
    const basePrice = num(order, vendorPriceKey(cat));
    SIZES.forEach((size) => {
      const qty = num(order, qtyKey(cat, size));
      if (qty > 0) total += qty * (basePrice + getSizeExtraPrice(size));
    });
  });
  return total;
}

export interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

export function getInvoiceItems(order: OrderLike): InvoiceItem[] {
  const items: InvoiceItem[] = [];
  const kategoriOrder = (order.kategoriOrder as string) ?? '';

  CATEGORIES.forEach((cat) => {
    const basePrice = num(order, priceKey(cat));

    SIZES.forEach((size) => {
      const qty = num(order, qtyKey(cat, size));
      if (qty > 0) {
        const extra = getSizeExtraPrice(size);
        const finalPrice = basePrice + extra;
        items.push({
          name: `${kategoriOrder} ${CATEGORY_LABELS[cat]} (${size})`,
          qty,
          price: finalPrice,
          total: qty * finalPrice,
        });
      }
    });
  });

  return items;
}

/** Item PO memakai harga modal vendor + tambahan ukuran besar (POPaper lama). */
export function getVendorItems(order: OrderLike): InvoiceItem[] {
  const items: InvoiceItem[] = [];
  const kategoriOrder = (order.kategoriOrder as string) ?? '';
  CATEGORIES.forEach((cat) => {
    const basePrice = num(order, vendorPriceKey(cat));
    SIZES.forEach((size) => {
      const qty = num(order, qtyKey(cat, size));
      if (qty > 0) {
        const finalPrice = basePrice + getSizeExtraPrice(size);
        items.push({
          name: `${kategoriOrder} ${CATEGORY_LABELS[cat]} (${size})`,
          qty,
          price: finalPrice,
          total: qty * finalPrice,
        });
      }
    });
  });
  return items;
}

/** Total pcs untuk koleksi `tracking` (hitungPcs lama, kini termasuk 3/4). */
export function countPcs(order: OrderLike): number {
  let total = 0;
  CATEGORIES.forEach((cat) => {
    SIZES.forEach((s) => {
      total += num(order, qtyKey(cat, s));
    });
  });
  return total;
}

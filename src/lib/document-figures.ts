import { calculateOrderTotals } from '@/lib/calculations';
import { getInvoiceItems, type InvoiceItem } from '@/lib/legacy/calculations';
import { deriveOrderVendorPaid } from '@/lib/order-payments';

/**
 * Angka kertas invoice dan PO diambil dari rumus modul finansial (`calculateOrderTotals`) supaya sama dengan
 * Data Table, termasuk biaya tambahan customer, biaya tambahan vendor, dan hasil Edit Finansial (K-32).
 */

type OrderDoc = Record<string, unknown>;

export interface InvoiceFigures {
  items: InvoiceItem[];
  subtotal: number;
  diskon: number;
  biayaTambahan: number;
  biayaTambahanNotes: string;
  /** Selisih tagihan bersih hasil Edit Finansial terhadap subtotal − diskon + biaya tambahan. */
  penyesuaian: number;
  total: number;
}

export function invoiceFigures(order: OrderDoc): InvoiceFigures {
  const t = calculateOrderTotals(order);
  const items = getInvoiceItems(order);
  const itemsSum = items.reduce((acc, i) => acc + i.total, 0);
  const gap = t.grossTotal - itemsSum;
  // Tagihan kotor bisa diganti di Edit Finansial atau order tanpa rincian ukuran; selisihnya jadi baris item
  // agar jumlah baris tetap sama dengan subtotal.
  if (gap !== 0) {
    items.push({ name: itemsSum === 0 ? 'Nilai pesanan' : 'Penyesuaian harga', qty: 1, price: gap, total: gap });
  }
  return {
    items,
    subtotal: t.grossTotal,
    diskon: t.diskon,
    biayaTambahan: t.biayaTambahanCust,
    biayaTambahanNotes: String(order.biayaTambahanCustNotes || order.biayaTambahanCustomerNotes || '').trim(),
    penyesuaian: t.jumlahSemua - (t.grossTotal - t.diskon + t.biayaTambahanCust),
    total: t.jumlahSemua,
  };
}

export interface PoFigures {
  itemsTotal: number;
  biayaTambahan: number;
  biayaTambahanNotes: string;
  /** Selisih HPP hasil Edit Finansial terhadap jumlah item + biaya tambahan vendor. */
  penyesuaian: number;
  total: number;
  sudahDibayar: number;
  sisa: number;
}

/** `itemsTotal` = jumlah baris PO (harga modal vendor + tambahan ukuran besar). */
export function poFigures(order: OrderDoc, itemsTotal: number): PoFigures {
  const t = calculateOrderTotals(order);
  const sudahDibayar = deriveOrderVendorPaid(order, t.totalHpp);
  return {
    itemsTotal,
    biayaTambahan: t.biayaLainnya,
    biayaTambahanNotes: String(order.biayaLainnyaNotes || order.biayaTambahanVendorNotes || '').trim(),
    penyesuaian: t.totalHpp - itemsTotal - t.biayaLainnya,
    total: t.totalHpp,
    sudahDibayar,
    sisa: Math.max(t.totalHpp - sudahDibayar, 0),
  };
}

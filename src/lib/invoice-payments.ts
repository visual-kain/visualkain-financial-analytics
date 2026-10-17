import type { CustomerPayment } from '@/types';
import { calculateOrderTotals } from '@/lib/calculations';
import { deriveOrderPayments } from '@/lib/order-payments';
import { formatIsoDateLong } from '@/lib/legacy/formatters';

export interface InvoicePaymentRow {
  key: string;
  label: string;
  tanggal: string;
  nominal: number;
}

export interface InvoicePaymentSummary {
  dp1: number;
  dp2: number;
  totalDpDiterima: number;
  pelunasan: number;
  totalUangMasuk: number;
  rows: InvoicePaymentRow[];
}

/**
 * Mengubah pembayaran customer (sumber yang sama dengan modul finansial, K-15) menjadi nilai yang dipakai
 * kertas invoice lama: DP 1, DP 2 (+ termin berikutnya), dan pelunasan.
 */
export function summarizeInvoicePayments(payments: ReadonlyArray<Pick<CustomerPayment, 'id' | 'nominal' | 'jenis' | 'label' | 'tanggal'>>): InvoicePaymentSummary {
  const rows: InvoicePaymentRow[] = [];
  let dpIndex = 0;
  let dp1 = 0;
  let dp2 = 0;
  let pelunasan = 0;

  payments.forEach((p, idx) => {
    const nominal = Number(p.nominal) || 0;
    if (nominal <= 0) return;
    const customLabel = typeof p.label === 'string' ? p.label.trim() : '';
    if (p.jenis === 'pelunasan') {
      pelunasan += nominal;
      rows.push({ key: p.id || `pel-${idx}`, label: customLabel || 'Pelunasan', tanggal: p.tanggal || '', nominal });
      return;
    }
    dpIndex += 1;
    if (dpIndex === 1) dp1 += nominal;
    else dp2 += nominal;
    const fallback = `DP ${dpIndex}`;
    rows.push({ key: p.id || `dp-${idx}`, label: dpIndex <= 2 ? fallback : customLabel || fallback, tanggal: p.tanggal || '', nominal });
  });

  // Ledger finansial menandai pembayaran yang melunasi tagihan sebagai pelunasan, termasuk transfer 100% sekaligus.
  // Uang itu tetap dihitung ke target DP produksi agar kertas tidak menagih "Sisa DP" untuk invoice yang sudah lunas.
  const totalDpDiterima = dp1 + dp2 + pelunasan;
  return { dp1, dp2, totalDpDiterima, pelunasan, totalUangMasuk: dp1 + dp2 + pelunasan, rows };
}

export function invoicePaymentsForOrder(order: Record<string, any> & { id: string }): InvoicePaymentSummary {
  const totals = calculateOrderTotals(order);
  const { payments } = deriveOrderPayments(order.id, order, totals.nominalDP);
  return summarizeInvoicePayments(payments);
}

/** Tanggal di baris pembayaran: ISO menjadi "13 Oktober 2026", teks bebas data lama dibiarkan. */
export function invoicePaymentDateLabel(tanggal: string): string {
  return formatIsoDateLong(tanggal);
}

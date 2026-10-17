import type { Order } from '@/types';
import { calculateOrderTotals } from '@/lib/calculations';
import { deriveOrderPayments, deriveOrderVendorPaid } from '@/lib/order-payments';

/**
 * Pemetaan dokumen `orders` mentah ke model finansial. Dipindah dari listener `useFirebaseFinance` (F-13)
 * agar layar Data Customer bisa menampilkan angka yang identik dengan Data Table.
 */
export function mapFinanceOrderDoc(
  id: string,
  d: Record<string, any>,
  vendorNameById: (vendorId: string) => string | undefined
): Order {
  const totals = calculateOrderTotals(d);

  const totalInv = totals.jumlahSemua;
  const totalHpp = totals.totalHpp;

  const dpVendor = deriveOrderVendorPaid(d, totalHpp);
  const { payments, hasModernPaymentRecord } = deriveOrderPayments(id, d, totals.nominalDP);

  const sumPayments = payments.reduce((acc, p) => acc + p.nominal, 0);
  const fallbackPaidCust = Number(d.totalUangMasukCustomer || d.dpNominal || 0);
  const lockedDpCustomer = hasModernPaymentRecord
    ? (sumPayments > 0 ? sumPayments : fallbackPaidCust)
    : (d.dpNominal !== undefined && Number(d.dpNominal) >= 0
        ? Number(d.dpNominal)
        : (sumPayments > 0 ? sumPayments : totals.nominalDP));
  const isOrderCompleted = (d.status === 'completed' || d.statusOrder === 'SELESAI' || d.statusPembayaran === 'lunas') && lockedDpCustomer >= totalInv;
  const totalMasuk = isOrderCompleted ? totalInv : lockedDpCustomer;

  const resolvedVendorName =
    (d.vendorId && vendorNameById(d.vendorId)) ||
    d.vendorName ||
    (d.vendorId ? 'Vendor Mitra' : 'Tanpa Vendor');

  const tanggalInv = d.tanggalInv || d.tanggalOrder || '2026-10-01';

  return {
    ...d,
    rawOrder: d,
    id: id,
    noInv: d.noInv || `INV-${id.slice(0, 6)}`,
    customerName: d.namaCustomer || d.customerName || 'Customer',
    projectName: d.namaProject || d.projectName || '-',
    noWaCustomer: d.noWaCustomer || '',
    tanggalOrder: tanggalInv,
    grossTotal: totals.grossTotal,
    totalInvoice: totalInv,
    totalHpp: totalHpp,
    targetMargin: totals.profit,
    totalQty: totals.totalPesanan,
    biayaOperasional: Number(d.biayaOperasional || 0),
    biayaTambahanVendor: Number(d.biayaTambahanVendor || d.biayaLainnya || 0),
    biayaTambahanCustomer: Number(d.biayaTambahanCustomer || d.biayaTambahanCust || 0),
    diskon: totals.diskon,
    kategoriOrder: (d.kategoriOrder || '').trim(),
    hargaVendorPendek: Number(d.hargaVendorPendek || 0),
    hargaVendorPanjang: Number(d.hargaVendorPanjang || 0),
    hargaVendorTanpaLengan: Number(d.hargaVendorTanpaLengan || 0),
    hppAktual: d.hppAktual !== undefined ? Number(d.hppAktual) : totalHpp,
    profitAktual: d.profitAktual !== undefined && d.profitAktual !== null ? Number(d.profitAktual) : totals.profit,
    catatanFinance: d.catatanFinance || '',
    vendorId: d.vendorId || '',
    vendorName: resolvedVendorName,
    pembayaranList: payments,
    dpNominal: lockedDpCustomer,
    dpNominalPO: dpVendor,
    totalUangMasukCustomer: totalMasuk,
    statusPembayaran: totalMasuk >= totalInv && totalInv > 0 ? 'lunas' : totalMasuk > 0 ? 'parsial' : 'belum_bayar',
    totalDibayarKeVendor: dpVendor,
    statusPembayaranVendor: dpVendor >= totalHpp && totalHpp > 0 ? 'lunas_vendor' : dpVendor > 0 ? 'dp_vendor' : 'belum_bayar',
    statusOrder: d.status || d.statusOrder || 'production',
  };
}

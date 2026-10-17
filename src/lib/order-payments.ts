import type { CustomerPayment } from '@/types';

/**
 * Derivasi pembayaran customer dan vendor dari dokumen `orders` mentah. Dipindah dari `useFirebaseFinance`
 * (F-13) tanpa perubahan perilaku supaya invoice, detail order, dan guard hapus membaca angka yang sama
 * dengan modul finansial.
 */

type RawOrderDoc = Record<string, any>;

// Entri riwayat berlabel pinjaman bukan pembayaran customer: dikecualikan saat dibaca, tetapi wajib dipertahankan saat ditulis ulang.
export function isPinjamanEntry(p: { catatan?: unknown } | null | undefined): boolean {
  return String(p?.catatan || '').toLowerCase().includes('pinjaman');
}

/** Total yang sudah dibayar ke vendor sesuai pemetaan hook finansial (prioritas nilai positif). */
export function deriveOrderVendorPaid(d: RawOrderDoc, totalHpp: number): number {
  const rawPaidVendor = Number(d.totalDibayarKeVendor || 0);
  const rawDpPo = Number(d.dpNominalPO || 0);
  return Array.isArray(d.vendorPembayaranList) && d.totalDibayarKeVendor !== undefined
    ? rawPaidVendor
    : rawPaidVendor > 0
    ? rawPaidVendor
    : rawDpPo > 0
    ? rawDpPo
    : d.totalDibayarKeVendor !== undefined
    ? rawPaidVendor
    : Math.round(totalHpp * (Number(d.dpPersenPO || 0) / 100));
}

export interface DerivedOrderPayments {
  payments: CustomerPayment[];
  hasModernPaymentRecord: boolean;
}

/**
 * Daftar pembayaran customer: `pembayaranList`/`riwayatPembayaran` bila ada; selain itu field lama
 * `dp1Nominal`, `dp2Nominal`, `pelunasanNominal`, lalu `dpNominal` terkunci.
 */
export function deriveOrderPayments(docId: string, d: RawOrderDoc, nominalDpFallback: number): DerivedOrderPayments {
  const payments: CustomerPayment[] = [];
  let hasModernPaymentRecord = false;

  const validPembayaranList = Array.isArray(d.pembayaranList)
    ? d.pembayaranList.filter((p: any) => Number(p?.nominal || p?.jumlah || 0) > 0)
    : [];
  const validRiwayatList = Array.isArray(d.riwayatPembayaran)
    ? d.riwayatPembayaran.filter((p: any) => {
        const nom = Number(p?.jumlah || p?.nominal || 0);
        return nom > 0 && !isPinjamanEntry(p);
      })
    : [];

  // Gunakan array pembayaran yang memiliki entri bernominal > 0 agar riwayatPembayaran: [] tidak mengabaikan pembayaranList yang terisi.
  if (validPembayaranList.length > 0 && validPembayaranList.length >= validRiwayatList.length) {
    hasModernPaymentRecord = true;
    validPembayaranList.forEach((p: any, idx: number) => {
      const nominal = Number(p.nominal || p.jumlah || 0);
      payments.push({
        id: p.id || `${docId}-p-${idx}`,
        orderId: docId,
        noInv: d.noInv || 'INV',
        tanggal: p.tanggal || d.tanggalInv || '2026-10-01',
        nominal,
        jenis: (p.jenis as any) || (idx === 0 ? 'dp' : 'termin'),
        terminKe: typeof p.terminKe === 'number' ? p.terminKe : undefined,
        label: typeof p.label === 'string' ? p.label : undefined,
        keterangan: p.keterangan || p.catatan || 'Pembayaran Termin',
        createdAt: p.createdAt || new Date().toISOString(),
      });
    });
  } else if (validRiwayatList.length > 0) {
    hasModernPaymentRecord = true;
    validRiwayatList.forEach((p: any, idx: number) => {
      const nominal = Number(p.jumlah || p.nominal || 0);
      payments.push({
        id: `${docId}-p-${idx}`,
        orderId: docId,
        noInv: d.noInv || 'INV',
        tanggal: p.tanggal || d.tanggalInv || '2026-10-01',
        nominal,
        jenis: (p.jenis as any) || (idx === 0 ? 'dp' : 'termin'),
        terminKe: typeof p.terminKe === 'number' ? p.terminKe : undefined,
        label: typeof p.label === 'string' ? p.label : undefined,
        keterangan: p.catatan || (idx === 0 ? 'DP Pembayaran' : 'Pembayaran Termin'),
        createdAt: new Date().toISOString(),
      });
    });
  } else if (Array.isArray(d.riwayatPembayaran) || Array.isArray(d.pembayaranList)) {
    hasModernPaymentRecord = true;
  }

  if (!hasModernPaymentRecord) {
    const dp1 = Number(d.dp1Nominal || 0);
    const dp2 = Number(d.dp2Nominal || 0);
    const pelunasan = Number(d.pelunasanNominal || 0);
    const legacyDp = Number(d.dpNominal || nominalDpFallback || 0);

    if (dp1 > 0) {
      payments.push({
        id: `${docId}-dp1`,
        orderId: docId,
        noInv: d.noInv || 'INV',
        tanggal: d.dp1Tanggal || d.tanggalInv || '2026-10-07',
        nominal: dp1,
        jenis: 'dp',
        keterangan: d.dp1Notes || 'DP 1 Transfer',
        createdAt: new Date().toISOString(),
      });
    }

    if (dp2 > 0) {
      payments.push({
        id: `${docId}-dp2`,
        orderId: docId,
        noInv: d.noInv || 'INV',
        tanggal: d.dp2Tanggal || d.tanggalInv || '2026-10-07',
        nominal: dp2,
        jenis: 'termin',
        keterangan: d.dp2Notes || 'DP 2 (70% Produksi)',
        createdAt: new Date().toISOString(),
      });
    }

    if (pelunasan > 0) {
      payments.push({
        id: `${docId}-pelunasan`,
        orderId: docId,
        noInv: d.noInv || 'INV',
        tanggal: d.pelunasanTanggal || d.tanggalInv || '2026-10-07',
        nominal: pelunasan,
        jenis: 'pelunasan',
        keterangan: 'Pelunasan Penuh',
        createdAt: new Date().toISOString(),
      });
    }

    if (payments.length === 0 && legacyDp > 0) {
      payments.push({
        id: `${docId}-dp-legacy`,
        orderId: docId,
        noInv: d.noInv || 'INV',
        tanggal: d.tanggalInv || '2026-10-07',
        nominal: legacyDp,
        jenis: 'dp',
        keterangan: 'DP Terkunci',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return { payments, hasModernPaymentRecord };
}

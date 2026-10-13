import { describe, it, expect } from 'vitest';
import { calculateOrderTotals, deriveEditableInvoice, computeEditableNet, deriveVendorPaid } from './calculations';

// Meniru bentuk order setelah dipetakan useFirebaseFinance (grossTotal, totalInvoice = net, diskon, biaya tambahan).
function asMappedOrder(raw: Record<string, unknown>) {
  const t = calculateOrderTotals(raw);
  return {
    grossTotal: t.grossTotal,
    totalInvoice: t.jumlahSemua,
    diskon: t.diskon,
    biayaTambahanCustomer: t.biayaTambahanCust,
  };
}

describe('Net invoice halaman edit order', () => {
  it('menyertakan biaya tambahan customer pada order dengan rincian ukuran', () => {
    const raw = {
      hargaPendek: 100_000,
      hargaVendorPendek: 60_000,
      pendekM: 10,
      diskon: 50_000,
      biayaTambahanCustomer: 500_000,
    };
    const editable = deriveEditableInvoice(asMappedOrder(raw));
    expect(computeEditableNet(editable.gross, editable.diskon, editable.biayaTambahanCustomer)).toBe(
      calculateOrderTotals(raw).jumlahSemua
    );
    expect(calculateOrderTotals(raw).jumlahSemua).toBe(1_450_000);
  });

  it('menyertakan biaya tambahan customer pada order tanpa rincian ukuran', () => {
    const raw = { totalInvoice: 2_000_000, totalBiayaVendor: 1_200_000, biayaTambahanCust: 300_000 };
    const editable = deriveEditableInvoice(asMappedOrder(raw));
    expect(computeEditableNet(editable.gross, editable.diskon, editable.biayaTambahanCustomer)).toBe(
      calculateOrderTotals(raw).jumlahSemua
    );
  });

  it('tidak mengubah order tanpa biaya tambahan', () => {
    const raw = { hargaPendek: 80_000, pendekL: 5, diskon: 0 };
    const editable = deriveEditableInvoice(asMappedOrder(raw));
    expect(computeEditableNet(editable.gross, editable.diskon, editable.biayaTambahanCustomer)).toBe(400_000);
  });

  it('net tidak pernah negatif', () => {
    expect(computeEditableNet(100_000, 500_000, 0)).toBe(0);
  });
});

describe('deriveVendorPaid (DP vendor read-only di halaman edit)', () => {
  it('menjumlah vendorPembayaranList', () => {
    expect(
      deriveVendorPaid({
        totalDibayarKeVendor: 0,
        vendorPembayaranList: [
          { id: 'a', vendorName: 'X', tanggal: '2026-10-02', nominal: 300, jenis: 'dp_vendor' },
          { id: 'b', vendorName: 'X', tanggal: '2026-10-03', nominal: 200, jenis: 'termin_vendor' },
        ],
      })
    ).toBe(500);
  });

  it('memakai totalDibayarKeVendor bila lebih besar dari daftar (sisa data lama, sama seperti tabel Dana Keluar)', () => {
    expect(
      deriveVendorPaid({
        totalDibayarKeVendor: 800,
        vendorPembayaranList: [{ id: 'a', vendorName: 'X', tanggal: '2026-10-02', nominal: 300, jenis: 'dp_vendor' }],
      })
    ).toBe(800);
    expect(deriveVendorPaid({ totalDibayarKeVendor: 450 })).toBe(450);
  });
});

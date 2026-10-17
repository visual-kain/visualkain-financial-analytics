import { describe, expect, it } from 'vitest';
import { invoiceFigures, poFigures } from './document-figures';

const base = { kategoriOrder: 'Kaos', hargaPendek: 100000, hargaVendorPendek: 60000, pendekM: 10, pendek2XL: 2 };

describe('invoiceFigures', () => {
  it('tagihan bersih memasukkan biaya tambahan customer seperti Data Table', () => {
    const f = invoiceFigures({ ...base, diskonHarga: 20000, biayaTambahanCust: 900000, biayaTambahanCustNotes: 'Revisi desain' });
    // 10 × 100.000 + 2 × (100.000 + 5.000)
    expect(f.subtotal).toBe(1210000);
    expect(f.diskon).toBe(20000);
    expect(f.biayaTambahan).toBe(900000);
    expect(f.biayaTambahanNotes).toBe('Revisi desain');
    expect(f.total).toBe(2090000);
    expect(f.penyesuaian).toBe(0);
    expect(f.items.reduce((a, i) => a + i.total, 0)).toBe(f.subtotal);
  });

  it('hasil Edit Finansial dipakai dan selisihnya terlihat di kertas', () => {
    const f = invoiceFigures({ ...base, isManualFinanceOverride: true, grossTotal: 1300000, totalInvoice: 1250000, diskonHarga: 20000 });
    expect(f.subtotal).toBe(1300000);
    expect(f.items.at(-1)).toMatchObject({ name: 'Penyesuaian harga', total: 90000 });
    expect(f.items.reduce((a, i) => a + i.total, 0)).toBe(1300000);
    expect(f.total).toBe(1250000);
    expect(f.penyesuaian).toBe(1250000 - (1300000 - 20000));
  });

  it('order tanpa rincian ukuran memakai nilai pesanan dari finansial', () => {
    const f = invoiceFigures({ kategoriOrder: 'Jaket', grossTotal: 3000000, totalPesanan: 12 });
    expect(f.items).toEqual([{ name: 'Nilai pesanan', qty: 1, price: 3000000, total: 3000000 }]);
    expect(f.total).toBe(3000000);
  });
});

describe('poFigures', () => {
  it('total PO = HPP finansial termasuk biaya tambahan vendor, dibayar dari catatan pembayaran vendor', () => {
    const itemsTotal = 10 * 60000 + 2 * 65000;
    const f = poFigures({ ...base, biayaLainnya: 50000, biayaLainnyaNotes: 'Plastik packing', totalDibayarKeVendor: 300000 }, itemsTotal);
    expect(f.biayaTambahan).toBe(50000);
    expect(f.biayaTambahanNotes).toBe('Plastik packing');
    expect(f.total).toBe(itemsTotal + 50000);
    expect(f.penyesuaian).toBe(0);
    expect(f.sudahDibayar).toBe(300000);
    expect(f.sisa).toBe(itemsTotal + 50000 - 300000);
  });

  it('HPP hasil Edit Finansial muncul sebagai penyesuaian', () => {
    const itemsTotal = 10 * 60000 + 2 * 65000;
    const f = poFigures({ ...base, isManualFinanceOverride: true, totalHpp: 800000, grossTotal: 1210000 }, itemsTotal);
    expect(f.total).toBe(800000);
    expect(f.penyesuaian).toBe(800000 - itemsTotal);
    expect(f.sudahDibayar).toBe(0);
    expect(f.sisa).toBe(800000);
  });
});

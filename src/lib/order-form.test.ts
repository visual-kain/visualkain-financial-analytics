import { describe, expect, it } from 'vitest';
import { mapFinanceOrderDoc } from '@/lib/finance-order-mapper';
import {
  buildCreateExtras,
  buildOverrideSync,
  createEmptyOrderForm,
  formToOrderFields,
  getDeleteBlockReason,
  isArchivedOrder,
  orderToForm,
  pricingChanged,
  summarizeForm,
  vendorOutstanding,
} from './order-form';
import type { LegacyOrder } from '@/lib/legacy/types';

function baseOrder(extra: Partial<LegacyOrder> = {}): LegacyOrder {
  return {
    id: 'o1',
    noInv: 'VK260050',
    tanggalInv: '2026-10-16',
    namaCustomer: 'BU SARI',
    status: 'received',
    hargaPendek: 100000,
    hargaVendorPendek: 60000,
    pendekM: 10,
    ...extra,
  } as LegacyOrder;
}

describe('order form mapping', () => {
  it('orderToForm lalu formToOrderFields mempertahankan field visualkaindb', () => {
    const order = baseOrder({ hargaTigaPerempat: 80000, tigaPerempatXL: 4, diskonHarga: 5000, vendorId: 'v1', accCustUrl: null });
    const fields = formToOrderFields(orderToForm(order));
    expect(fields.hargaPendek).toBe(100000);
    expect(fields.hargaTigaPerempat).toBe(80000);
    expect(fields.tigaPerempatXL).toBe(4);
    expect(fields.pendekM).toBe(10);
    expect(fields.diskonHarga).toBe(5000);
    expect(fields.accCustUrl).toBeNull();
    expect(fields).not.toHaveProperty('dpPersen');
    expect(fields).not.toHaveProperty('biayaOperasional');
    expect(Object.values(fields).some((v) => v === undefined)).toBe(false);
  });

  it('summarizeForm memakai rumus tabel (profit dikurangi biaya operasional)', () => {
    const form = orderToForm(baseOrder());
    const s = summarizeForm(form, 50000);
    expect(s.jumlahSemua).toBe(1_000_000);
    expect(s.modalVendor).toBe(600_000);
    expect(s.profit).toBe(350_000);
  });
});

describe('order baru', () => {
  it('ditandai belum dibayar sehingga modul finansial tidak membaca DP 70% sebagai uang masuk', () => {
    const fields = formToOrderFields({ ...createEmptyOrderForm('2026-10-17', 'VK260051'), namaCustomer: 'X', kategoriOrder: 'Kaos', harga: { pendek: 100000, panjang: 0, tanpaLengan: 0, tigaPerempat: 0 } , qty: { ...createEmptyOrderForm('', '').qty, pendekM: 10 } });
    const doc = { ...fields, ...buildCreateExtras({ name: 'Sari', email: 'sari@x.com' }) };
    expect(doc.dpPersen).toBe(70);
    const mapped = mapFinanceOrderDoc('new', doc, () => undefined);
    expect(mapped.totalInvoice).toBe(1_000_000);
    expect(mapped.totalUangMasukCustomer).toBe(0);
    expect(mapped.statusPembayaran).toBe('belum_bayar');
    expect(doc.createdBy).toBe('Sari');
  });
});

describe('sinkron override finansial', () => {
  const override = baseOrder({
    isManualFinanceOverride: true,
    biayaTambahanCustomer: 50000,
    biayaTambahanVendor: 20000,
    biayaOperasional: 10000,
    totalInvoice: 999,
    totalHpp: 999,
  });

  it('tidak menulis apa pun bila order bukan override atau harga/qty tidak berubah', () => {
    expect(buildOverrideSync(baseOrder(), { ...formToOrderFields(orderToForm(baseOrder())), pendekM: 12 })).toEqual({});
    expect(buildOverrideSync(override, formToOrderFields(orderToForm(override)))).toEqual({});
  });

  it('menghitung ulang total seperti editor finansial saat qty berubah', () => {
    const next = { ...formToOrderFields(orderToForm(override)), pendekM: 12 };
    expect(pricingChanged(override, next)).toBe(true);
    const sync = buildOverrideSync(override, next);
    expect(sync.grossTotal).toBe(1_200_000);
    expect(sync.totalInvoice).toBe(1_250_000);
    expect(sync.totalHpp).toBe(720_000 + 20_000);
    expect(sync.profitAktual).toBe(1_250_000 - 740_000 - 10_000);
    const mapped = mapFinanceOrderDoc('o1', { ...override, ...next, ...sync }, () => undefined);
    expect(mapped.totalInvoice).toBe(1_250_000);
    expect(mapped.totalHpp).toBe(740_000);
  });
});

describe('guard hapus dan pelunasan vendor', () => {
  it('order tanpa pembayaran boleh dihapus', () => {
    expect(getDeleteBlockReason(baseOrder({ pembayaranList: [], dpNominal: 0 }))).toBeNull();
  });

  it('order dengan pembayaran customer atau vendor diblokir', () => {
    expect(getDeleteBlockReason(baseOrder({ pembayaranList: [{ id: 'p', nominal: 300000, tanggal: '2026-10-16' }] }))).toContain('Dana Masuk');
    expect(getDeleteBlockReason(baseOrder({ pembayaranList: [], dpNominal: 0, totalDibayarKeVendor: 100000 }))).toContain('Dana Keluar');
  });

  it('dpNominal lama dihitung sebagai pembayaran seperti modul finansial', () => {
    expect(getDeleteBlockReason(baseOrder({ dpNominal: 700000 }))).not.toBeNull();
  });

  it('sisa utang vendor dari HPP dikurangi pembayaran vendor', () => {
    expect(vendorOutstanding({ ...baseOrder(), pembayaranList: [] })).toBe(600_000);
    expect(vendorOutstanding({ ...baseOrder(), totalDibayarKeVendor: 600_000 })).toBe(0);
  });
});

describe('arsip', () => {
  it('order sebelum 1 Okt 2026 atau tanpa tanggal adalah arsip', () => {
    expect(isArchivedOrder({ tanggalInv: '2026-09-30' })).toBe(true);
    expect(isArchivedOrder({ tanggalInv: '' })).toBe(true);
    expect(isArchivedOrder({ tanggalInv: '2026-10-01' })).toBe(false);
  });
});

describe('guard simpan dari review', () => {
  it('tanggal invoice wajib dan minimal 1 Oktober 2026', async () => {
    const { invoiceDateError } = await import('./order-form');
    expect(invoiceDateError('')).toContain('wajib');
    expect(invoiceDateError('2026-09-30')).toContain('1 Oktober 2026');
    expect(invoiceDateError('2026-10-17')).toBeNull();
  });

  it('menolak edit yang membuat total di bawah uang yang sudah diterima', async () => {
    const { paidExceedsTotalError } = await import('./order-form');
    const paid = baseOrder({ pembayaranList: [{ id: 'p', nominal: 900000, tanggal: '2026-10-16' }] });
    expect(paidExceedsTotalError(paid, { pendekM: 5 })).toContain('lebih kecil');
    expect(paidExceedsTotalError(paid, { pendekM: 10 })).toBeNull();
    expect(paidExceedsTotalError(baseOrder({ pembayaranList: [] }), { pendekM: 1 })).toBeNull();
  });

  it('nama vendor ikut ditulis hanya saat vendor berubah', async () => {
    const { vendorNameUpdate } = await import('./order-form');
    const vendors = [{ id: 'v1', nama: 'MAJU' }];
    expect(vendorNameUpdate('v1', 'v1', vendors)).toEqual({});
    expect(vendorNameUpdate('', 'v1', vendors)).toEqual({ vendorName: 'MAJU' });
    expect(vendorNameUpdate('v1', '', vendors)).toEqual({ vendorName: '' });
  });

  it('URL gambar ACC hanya https', async () => {
    const { safeImageUrl } = await import('@/lib/safe-url');
    expect(safeImageUrl('https://res.cloudinary.com/x.webp')).toBe('https://res.cloudinary.com/x.webp');
    expect(safeImageUrl('javascript:alert(1)')).toBe('');
    expect(safeImageUrl('http://insecure/x.jpg')).toBe('');
  });
});

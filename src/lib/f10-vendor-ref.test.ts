import { describe, it, expect } from 'vitest';
import { resolveVendorRef, isPlaceholderVendorName, validateVendorName } from './vendor-ref';

const vendors = [
  { id: 'v-amrin', nama: 'AMRIN' },
  { id: 'v-wisnu', nama: 'Vendor Wisnu' },
];

describe('resolveVendorRef', () => {
  it('mengisi vendorId bila nama cocok dengan dokumen vendors (tanpa peduli huruf besar)', () => {
    expect(resolveVendorRef('vendor wisnu', vendors)).toEqual({ vendorId: 'v-wisnu', vendorName: 'Vendor Wisnu' });
  });

  it('mengosongkan vendorId bila nama tidak ada di koleksi vendors', () => {
    expect(resolveVendorRef('LAJUWARNA', vendors)).toEqual({ vendorId: '', vendorName: 'LAJUWARNA' });
  });

  it.each(['Tanpa Vendor', 'Vendor Mitra', '-', '', '  '])('tidak menyimpan placeholder "%s" sebagai nama maupun ID', (name) => {
    expect(resolveVendorRef(name, vendors)).toEqual({ vendorId: '', vendorName: '' });
  });
});

describe('isPlaceholderVendorName', () => {
  it('mengenali placeholder dari pemetaan hook', () => {
    expect(isPlaceholderVendorName('Tanpa Vendor')).toBe(true);
    expect(isPlaceholderVendorName('vendor mitra')).toBe(true);
    expect(isPlaceholderVendorName('AMRIN')).toBe(false);
  });
});

describe('F-12 validateVendorName', () => {
  const vendors = [{ id: 'v-1', nama: 'Vendor Wisnu' }];
  it('menolak nama kosong, placeholder, dan duplikat', () => {
    expect(validateVendorName('  ', vendors)).toMatch(/wajib/);
    expect(validateVendorName('Tanpa Vendor', vendors)).toMatch(/tidak valid/);
    expect(validateVendorName('vendor wisnu', vendors)).toMatch(/sudah terdaftar/);
  });
  it('mengizinkan nama baru dan rename ke nama sendiri', () => {
    expect(validateVendorName('LAJUWARNA', vendors)).toBeNull();
    expect(validateVendorName('Vendor Wisnu', vendors, 'v-1')).toBeNull();
  });
});

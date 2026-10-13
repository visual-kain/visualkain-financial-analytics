import { describe, it, expect } from 'vitest';
import { resolveVendorRef, isPlaceholderVendorName } from './vendor-ref';

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

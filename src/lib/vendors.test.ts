import { describe, expect, it } from 'vitest';
import {
  buildVendorPayload,
  buildWaChatUrl,
  countOrdersByVendor,
  filterVendors,
  getVendorDeleteBlockReason,
  normalizeVendorForm,
  validateVendorForm,
  vendorToFormValues,
} from '@/lib/vendors';

const vendors = [
  { id: 'v1', nama: 'CV Maju Jaya', alamat: 'Jl. Merdeka No. 5, Bandung', wa: '0812-3456-7890', pic: 'Pak Andi' },
  { id: 'v2', nama: 'Garmen Sentosa', alamat: 'Cimahi', wa: '+62 813 9999 0000', pic: 'Bu Sari' },
  { id: 'v3', nama: 'Konveksi Cepat', alamat: '', wa: '', pic: '' },
];

describe('normalizeVendorForm', () => {
  it('trims every field and collapses repeated spaces in the name only', () => {
    expect(normalizeVendorForm({ nama: '  CV   Maju  Jaya ', alamat: ' Jl. A  No 1 ', wa: ' 0812 ', pic: ' Andi ' })).toEqual({
      nama: 'CV Maju Jaya',
      alamat: 'Jl. A  No 1',
      wa: '0812',
      pic: 'Andi',
    });
  });

  it('fills missing fields with empty strings', () => {
    expect(normalizeVendorForm({ nama: 'X' })).toEqual({ nama: 'X', alamat: '', wa: '', pic: '' });
  });
});

describe('validateVendorForm', () => {
  it('requires a name', () => {
    const result = validateVendorForm({ nama: '   ' }, vendors);
    expect(result).toEqual({ ok: false, errors: { nama: 'Nama vendor wajib diisi' } });
  });

  it('rejects a duplicate name regardless of case and spacing', () => {
    const result = validateVendorForm({ nama: '  cv  MAJU jaya ' }, vendors);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.nama).toContain('sudah terdaftar');
  });

  it('allows keeping the same name while editing that vendor', () => {
    const result = validateVendorForm({ nama: 'cv maju jaya', pic: 'Pak Budi' }, vendors, 'v1');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values).toEqual({ nama: 'cv maju jaya', alamat: '', wa: '', pic: 'Pak Budi' });
  });

  it('still rejects a name that belongs to another vendor while editing', () => {
    expect(validateVendorForm({ nama: 'Garmen Sentosa' }, vendors, 'v1').ok).toBe(false);
  });

  it('rejects placeholder names the finance module uses for missing vendors', () => {
    expect(validateVendorForm({ nama: 'Tanpa Vendor' }, vendors).ok).toBe(false);
  });

  it('returns normalized values for a new vendor', () => {
    const result = validateVendorForm({ nama: ' Vendor Baru ', alamat: ' Bogor ' }, vendors);
    expect(result).toEqual({ ok: true, values: { nama: 'Vendor Baru', alamat: 'Bogor', wa: '', pic: '' } });
  });
});

describe('buildVendorPayload', () => {
  it('contains only the four vendor fields and no undefined values', () => {
    const payload = buildVendorPayload(normalizeVendorForm({ nama: 'Vendor Baru' }));
    expect(Object.keys(payload).sort()).toEqual(['alamat', 'nama', 'pic', 'wa']);
    expect(Object.values(payload).every((v) => typeof v === 'string')).toBe(true);
  });

  it('prefills the edit form from a vendor document with missing fields', () => {
    expect(vendorToFormValues({ nama: 'Konveksi Cepat' })).toEqual({ nama: 'Konveksi Cepat', alamat: '', wa: '', pic: '' });
    expect(vendorToFormValues(null)).toEqual({ nama: '', alamat: '', wa: '', pic: '' });
  });
});

describe('filterVendors', () => {
  it('returns every vendor for an empty search', () => {
    expect(filterVendors(vendors, '  ')).toHaveLength(3);
  });

  it('matches name, PIC, address, and WhatsApp case-insensitively', () => {
    expect(filterVendors(vendors, 'maju').map((v) => v.id)).toEqual(['v1']);
    expect(filterVendors(vendors, 'BU SARI').map((v) => v.id)).toEqual(['v2']);
    expect(filterVendors(vendors, 'cimahi').map((v) => v.id)).toEqual(['v2']);
    expect(filterVendors(vendors, 'merdeka').map((v) => v.id)).toEqual(['v1']);
  });

  it('matches phone numbers typed without separators', () => {
    expect(filterVendors(vendors, '081234567890').map((v) => v.id)).toEqual(['v1']);
    expect(filterVendors(vendors, '6281399990000').map((v) => v.id)).toEqual(['v2']);
  });

  it('does not treat one or two digits as a phone search', () => {
    // "23" ada di nomor 0812-3456 hanya jika tanda hubung dibuang; dua digit tidak boleh memicu pencocokan itu.
    expect(filterVendors(vendors, '99').map((v) => v.id)).toEqual(['v2']);
    expect(filterVendors(vendors, '23')).toEqual([]);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterVendors(vendors, 'tidak ada')).toEqual([]);
  });
});

describe('countOrdersByVendor', () => {
  it('counts orders per vendorId and ignores orders without a vendor', () => {
    const counts = countOrdersByVendor([{ vendorId: 'v1' }, { vendorId: 'v1' }, { vendorId: 'v2' }, { vendorId: '' }, {}]);
    expect(counts.get('v1')).toBe(2);
    expect(counts.get('v2')).toBe(1);
    expect(counts.has('')).toBe(false);
    expect(counts.get('v3')).toBeUndefined();
  });
});

describe('getVendorDeleteBlockReason', () => {
  it('allows deleting an unused vendor once orders are loaded', () => {
    expect(getVendorDeleteBlockReason(0, true)).toBeNull();
  });

  it('blocks deletion and states the count when orders still use the vendor', () => {
    const reason = getVendorDeleteBlockReason(3, true);
    expect(reason).toContain('3 order');
    expect(reason).toContain('Ganti vendor');
  });

  it('blocks deletion while order data is not ready, even when the count is zero', () => {
    expect(getVendorDeleteBlockReason(0, false)).toContain('belum selesai dimuat');
  });
});

describe('buildWaChatUrl', () => {
  it('normalizes local numbers to the 62 prefix', () => {
    expect(buildWaChatUrl('0812-3456-7890')).toBe('https://wa.me/6281234567890');
    expect(buildWaChatUrl('+62 813 9999 0000')).toBe('https://wa.me/6281399990000');
  });

  it('returns null for empty or too short numbers', () => {
    expect(buildWaChatUrl('')).toBeNull();
    expect(buildWaChatUrl('123')).toBeNull();
    expect(buildWaChatUrl(undefined)).toBeNull();
  });
});

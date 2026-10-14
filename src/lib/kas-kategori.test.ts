import { describe, it, expect } from 'vitest';
import {
  KATEGORI_KAS_MASUK_OPTIONS,
  KATEGORI_KAS_KELUAR_OPTIONS,
  KATEGORI_PENDAPATAN_LAIN,
  normalizeKategoriKasMasuk,
} from './constants';

describe('F-12 F2: kategori kas masuk Pendapatan Lain', () => {
  it('membaca kategori lama "Biaya Lain" pada kas masuk sebagai Pendapatan Lain', () => {
    expect(normalizeKategoriKasMasuk('Biaya Lain')).toBe(KATEGORI_PENDAPATAN_LAIN);
  });

  it('kategori kas masuk tanpa nilai dianggap Pendapatan Lain', () => {
    expect(normalizeKategoriKasMasuk(undefined)).toBe(KATEGORI_PENDAPATAN_LAIN);
    expect(normalizeKategoriKasMasuk('')).toBe(KATEGORI_PENDAPATAN_LAIN);
  });

  it('kategori kas masuk lain tidak diubah', () => {
    expect(normalizeKategoriKasMasuk('Saldo Awal')).toBe('Saldo Awal');
    expect(normalizeKategoriKasMasuk('Dana Investor')).toBe('Dana Investor');
    expect(normalizeKategoriKasMasuk('Pendapatan Lain')).toBe('Pendapatan Lain');
  });

  it('opsi form kas masuk tidak lagi memakai nilai yang sama dengan kategori beban', () => {
    const masuk = KATEGORI_KAS_MASUK_OPTIONS.map((o) => o.value);
    const keluar = new Set<string>(KATEGORI_KAS_KELUAR_OPTIONS.map((o) => o.value));
    expect(masuk).toContain(KATEGORI_PENDAPATAN_LAIN);
    expect(masuk.filter((v) => keluar.has(v))).toEqual([]);
  });
});

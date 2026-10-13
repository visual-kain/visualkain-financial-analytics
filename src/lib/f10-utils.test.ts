import { describe, it, expect, vi, afterEach } from 'vitest';
import { normalizeWaNumber, formatCompactRupiah } from './utils';
import { getDefaultFinanceDate } from './constants';
import { buildOutflowCategoryOptions, KATEGORI_KAS_KELUAR_OPTIONS } from './constants';

describe('normalizeWaNumber', () => {
  it.each([
    ['081234567890', '6281234567890'],
    ['+62 812-3456-7890', '6281234567890'],
    ['6281234567890', '6281234567890'],
    ['81234567890', '6281234567890'],
  ])('mengubah %s menjadi format internasional', (input, expected) => {
    expect(normalizeWaNumber(input)).toBe(expected);
  });

  it.each([undefined, null, '', '   ', '-', '12'])('mengembalikan null untuk nomor kosong atau tidak valid (%s)', (input) => {
    expect(normalizeWaNumber(input)).toBeNull();
  });
});

describe('buildOutflowCategoryOptions', () => {
  it('mencakup semua kategori yang bisa dibuat di form Dana Keluar', () => {
    const values = buildOutflowCategoryOptions([]).map((o) => o.value);
    for (const opt of KATEGORI_KAS_KELUAR_OPTIONS) expect(values).toContain(opt.value);
    expect(values).toContain('Keuangan');
    expect(values[0]).toBe('all');
  });

  it('menambahkan kategori lama yang muncul di data tanpa duplikat', () => {
    const values = buildOutflowCategoryOptions(['Logistik', 'Pajak', 'Operasional', 'Logistik']).map((o) => o.value);
    expect(values.filter((v) => v === 'Logistik')).toHaveLength(1);
    expect(values).toContain('Pajak');
    expect(values.filter((v) => v === 'Operasional')).toHaveLength(1);
  });
});

describe('formatCompactRupiah', () => {
  it.each([
    [999_999, 'Rp 1 jt'],
    [1_999_999, 'Rp 2 jt'],
    [1_250_000, 'Rp 1,3 jt'],
    [2_500_000_000, 'Rp 2,5 M'],
    [999_960_000, 'Rp 1 M'],
    [1_500, 'Rp 2 rb'],
    [-1_500_000, '-Rp 1,5 jt'],
    [500, 'Rp 500'],
    [0, 'Rp 0'],
  ])('%d menjadi %s', (input, expected) => {
    expect(formatCompactRupiah(input)).toBe(expected);
  });
});

describe('getDefaultFinanceDate', () => {
  afterEach(() => vi.useRealTimers());

  it('memakai tanggal WIB, bukan UTC', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-14T18:30:00Z'));
    expect(getDefaultFinanceDate()).toBe('2026-10-15');
  });

  it('tidak pernah lebih awal dari tanggal mulai pembukuan', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-20T03:00:00Z'));
    expect(getDefaultFinanceDate()).toBe('2026-10-01');
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildBahanPayload,
  buildMarkupPayload,
  calculateCostProfit,
  findMarkupRule,
  findOverlappingRules,
  formatMarkupPersen,
  formatQtyRange,
  getKategoriDeleteBlock,
  normalizeBahan,
  normalizeMarkup,
  parseNumericField,
  sortMarkup,
  validateBahanInput,
  validateKategoriName,
  validateMarkupInput,
  type BahanDoc,
  type MarkupDoc,
} from './cost-profit';

const rules: MarkupDoc[] = [
  { id: 'm1', qtyMin: 1, qtyMax: 12, persen: 40 },
  { id: 'm2', qtyMin: 13, qtyMax: 48, persen: 30 },
  { id: 'm3', qtyMin: 49, qtyMax: 100, persen: 20 },
];

/** Salinan rumus ProfitCalculator.tsx `visualkaindb` (useMemo calculation), dipakai sebagai pembanding paritas. */
function legacyCalculation(bahan: { harga: number } | undefined, qty: number, markupList: Array<{ qtyMin: number; qtyMax: number; persen: number }>) {
  if (!bahan || qty < 1) {
    return { hargaModal: 0, rule: null, hargaJual: 0, totalModal: 0, totalJual: 0, profit: 0 };
  }
  const hargaModal = bahan.harga;
  const rule = markupList.find((r) => qty >= r.qtyMin && qty <= r.qtyMax) || { persen: 0 };
  const hargaJual = hargaModal * (1 + rule.persen / 100);
  const totalModal = hargaModal * qty;
  const totalJual = hargaJual * qty;
  const profit = totalJual - totalModal;
  return { hargaModal, rule, hargaJual, totalModal, totalJual, profit };
}

describe('F-13 Cost & Profit: kalkulator', () => {
  it('menghitung contoh angka dengan rumus legacy tanpa pembulatan', () => {
    const result = calculateCostProfit(35000, 12, rules);
    expect(result.rule?.id).toBe('m1');
    expect(result.persen).toBe(40);
    expect(result.hargaJual).toBeCloseTo(49000, 6);
    expect(result.totalModal).toBe(420000);
    expect(result.totalJual).toBeCloseTo(588000, 6);
    expect(result.profit).toBeCloseTo(168000, 6);
  });

  it('tidak membulatkan: hasil pecahan tetap utuh', () => {
    const result = calculateCostProfit(12345, 7, [{ id: 'a', qtyMin: 1, qtyMax: 10, persen: 33 }]);
    expect(result.hargaJual).toBeCloseTo(12345 * 1.33, 9);
    expect(Number.isInteger(result.hargaJual)).toBe(false);
    expect(result.profit).toBeCloseTo(12345 * 0.33 * 7, 6);
  });

  it('identik dengan rumus legacy pada kombinasi harga, qty, dan aturan', () => {
    const hargaList = [0, 1, 999, 12500, 35000, 87650, 1_234_567];
    const qtyList = [0, 1, 6, 12, 13, 25, 48, 49, 77, 100, 101, 500];
    const sets = [[], rules, [...rules].reverse(), [{ id: 'x', qtyMin: 5, qtyMax: 50, persen: 12 }, { id: 'y', qtyMin: 20, qtyMax: 60, persen: 99 }]];
    for (const set of sets) {
      const sorted = sortMarkup(set);
      for (const harga of hargaList) {
        for (const qty of qtyList) {
          const legacy = legacyCalculation({ harga }, qty, sorted);
          const next = calculateCostProfit(harga, qty, set);
          expect(next.hargaJual).toBe(legacy.hargaJual);
          expect(next.totalModal).toBe(legacy.totalModal);
          expect(next.totalJual).toBe(legacy.totalJual);
          expect(next.profit).toBe(legacy.profit);
        }
      }
    }
  });

  it('tanpa aturan yang cocok memakai +0% dan profit 0', () => {
    const result = calculateCostProfit(50000, 500, rules);
    expect(result.rule).toBeNull();
    expect(result.persen).toBe(0);
    expect(result.hargaJual).toBe(50000);
    expect(result.profit).toBe(0);
  });

  it('batas Qty Min dan Qty Max inklusif', () => {
    expect(findMarkupRule(rules, 1)?.id).toBe('m1');
    expect(findMarkupRule(rules, 12)?.id).toBe('m1');
    expect(findMarkupRule(rules, 13)?.id).toBe('m2');
    expect(findMarkupRule(rules, 100)?.id).toBe('m3');
    expect(findMarkupRule(rules, 101)).toBeNull();
  });

  it('rentang tumpang tindih: aturan dengan qtyMin terkecil yang dipakai, apa pun urutan input', () => {
    const overlapping: MarkupDoc[] = [
      { id: 'b', qtyMin: 10, qtyMax: 30, persen: 50 },
      { id: 'a', qtyMin: 1, qtyMax: 20, persen: 30 },
    ];
    expect(findMarkupRule(overlapping, 15)?.persen).toBe(30);
    expect(findMarkupRule(overlapping, 25)?.persen).toBe(50);
  });

  it('qtyMin kembar dipilih berdasarkan ID dokumen', () => {
    const tied: MarkupDoc[] = [
      { id: 'zz', qtyMin: 1, qtyMax: 10, persen: 10 },
      { id: 'aa', qtyMin: 1, qtyMax: 10, persen: 25 },
    ];
    expect(findMarkupRule(tied, 5)?.id).toBe('aa');
  });

  it('qty di bawah 1, kosong, atau bukan angka menghasilkan nol', () => {
    for (const qty of [0, -3, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = calculateCostProfit(35000, qty, rules);
      expect(result.hargaJual).toBe(0);
      expect(result.totalModal).toBe(0);
      expect(result.totalJual).toBe(0);
      expect(result.profit).toBe(0);
      expect(result.rule).toBeNull();
    }
  });

  it('belum ada bahan terpilih menghasilkan nol', () => {
    const result = calculateCostProfit(null, 12, rules);
    expect(result).toMatchObject({ hargaModal: 0, hargaJual: 0, totalModal: 0, totalJual: 0, profit: 0, rule: null });
  });

  it('harga modal tetap ditampilkan walau qty belum valid', () => {
    expect(calculateCostProfit(35000, 0, rules).hargaModal).toBe(35000);
  });

  it('format persen dan rentang qty', () => {
    expect(formatMarkupPersen(40)).toBe('+40%');
    expect(formatMarkupPersen(0)).toBe('+0%');
    expect(formatQtyRange(1, 12)).toBe('Qty 1 – 12 pcs');
  });
});

describe('F-13 Cost & Profit: normalisasi dokumen', () => {
  it('bahan tanpa nama dibuang seperti orderBy legacy, harga string dikonversi', () => {
    expect(normalizeBahan('b1', { kategoriId: 'k1', harga: 1000 })).toBeNull();
    expect(normalizeBahan('b2', { kategoriId: 'k1', nama: 'Cotton 30s', harga: '35000' })).toEqual({
      id: 'b2',
      kategoriId: 'k1',
      nama: 'Cotton 30s',
      harga: 35000,
    });
    expect(normalizeBahan('b3', { nama: 'Tanpa harga' })).toEqual({ id: 'b3', kategoriId: '', nama: 'Tanpa harga', harga: 0 });
  });

  it('markup tanpa qtyMin atau persen rusak dibuang', () => {
    expect(normalizeMarkup('m', { qtyMax: 10, persen: 5 })).toBeNull();
    expect(normalizeMarkup('m', { qtyMin: 1, qtyMax: 10 })).toBeNull();
    expect(normalizeMarkup('m', { qtyMin: '1', qtyMax: '10', persen: '5' })).toEqual({ id: 'm', qtyMin: 1, qtyMax: 10, persen: 5 });
  });
});

describe('F-13 Cost & Profit: aturan markup', () => {
  it('mendeteksi irisan termasuk batas yang bersentuhan', () => {
    expect(findOverlappingRules({ qtyMin: 12, qtyMax: 24 }, rules).map((r) => r.id)).toEqual(['m1', 'm2']);
    expect(findOverlappingRules({ qtyMin: 101, qtyMax: 200 }, rules)).toEqual([]);
  });

  it('rentang bersebelahan tanpa irisan tidak ditandai', () => {
    expect(findOverlappingRules({ qtyMin: 13, qtyMax: 20 }, [rules[0]])).toEqual([]);
  });

  it('mengabaikan aturan yang sedang diedit', () => {
    expect(findOverlappingRules({ qtyMin: 1, qtyMax: 12 }, rules, 'm1')).toEqual([]);
    expect(findOverlappingRules({ qtyMin: 1, qtyMax: 12 }, rules).map((r) => r.id)).toEqual(['m1']);
  });

  it('rentang yang membungkus aturan lain tetap terdeteksi', () => {
    expect(findOverlappingRules({ qtyMin: 1, qtyMax: 500 }, rules)).toHaveLength(3);
    expect(findOverlappingRules({ qtyMin: 20, qtyMax: 30 }, rules).map((r) => r.id)).toEqual(['m2']);
  });

  it('validasi: Qty Min harus lebih kecil dari Qty Max (sama besar ditolak)', () => {
    expect(validateMarkupInput({ qtyMin: 12, qtyMax: 12, persen: 10 }).qtyMax).toBe('Qty Min harus lebih kecil dari Qty Max');
    expect(validateMarkupInput({ qtyMin: 13, qtyMax: 12, persen: 10 }).qtyMax).toBe('Qty Min harus lebih kecil dari Qty Max');
    expect(validateMarkupInput({ qtyMin: 1, qtyMax: 12, persen: 40 })).toEqual({});
  });

  it('validasi: batas minimal, bilangan bulat, dan persen tidak minus', () => {
    expect(validateMarkupInput({ qtyMin: 0, qtyMax: 12, persen: 10 }).qtyMin).toBe('Qty Min minimal 1');
    expect(validateMarkupInput({ qtyMin: 1.5, qtyMax: 12, persen: 10 }).qtyMin).toBe('Qty Min harus bilangan bulat');
    expect(validateMarkupInput({ qtyMin: 1, qtyMax: 12, persen: -1 }).persen).toBe('Persentase tidak boleh minus');
    expect(validateMarkupInput({ qtyMin: 1, qtyMax: 12, persen: 0 })).toEqual({});
    expect(validateMarkupInput({ qtyMin: Number.NaN, qtyMax: Number.NaN, persen: Number.NaN })).toEqual({
      qtyMin: 'Qty Min wajib diisi',
      qtyMax: 'Qty Max wajib diisi',
      persen: 'Persentase wajib diisi',
    });
  });

  it('parseNumericField memperlakukan kosong sebagai NaN, bukan 0', () => {
    expect(parseNumericField('')).toBeNaN();
    expect(parseNumericField('  ')).toBeNaN();
    expect(parseNumericField('12')).toBe(12);
  });

  it('payload hanya berisi field legacy dan tidak pernah undefined', () => {
    const payload = buildMarkupPayload({ qtyMin: 1, qtyMax: 12, persen: 40 });
    expect(Object.keys(payload).sort()).toEqual(['persen', 'qtyMax', 'qtyMin']);
    expect(Object.values(payload).every((v) => v !== undefined)).toBe(true);
  });
});

describe('F-13 Cost & Profit: bahan dan kategori', () => {
  const bahan: BahanDoc[] = [
    { id: 'b1', kategoriId: 'k1', nama: 'Cotton Combed 30s', harga: 35000 },
    { id: 'b2', kategoriId: 'k1', nama: 'Cotton Combed 24s', harga: 32000 },
    { id: 'b3', kategoriId: 'k1', nama: 'Lacoste', harga: 45000 },
    { id: 'b4', kategoriId: 'k1', nama: 'Fleece', harga: 60000 },
    { id: 'b5', kategoriId: 'k2', nama: 'Dry Fit', harga: 40000 },
  ];

  it('kategori yang masih dipakai bahan diblokir dengan menyebut jumlah dan nama', () => {
    const reason = getKategoriDeleteBlock({ id: 'k2', nama: 'Olahraga' }, bahan);
    expect(reason).toContain('Olahraga');
    expect(reason).toContain('1 bahan');
    expect(reason).toContain('Dry Fit');
  });

  it('daftar nama dipotong tiga dan sisanya dihitung', () => {
    const reason = getKategoriDeleteBlock({ id: 'k1', nama: 'Kaos' }, bahan);
    expect(reason).toContain('4 bahan');
    expect(reason).toContain('dan 1 lainnya');
  });

  it('kategori kosong boleh dihapus', () => {
    expect(getKategoriDeleteBlock({ id: 'k9', nama: 'Kosong' }, bahan)).toBeNull();
  });

  it('validasi bahan: kategori, nama, dan harga wajib', () => {
    expect(validateBahanInput({ kategoriId: '', nama: ' ', harga: 0 }, { isEdit: false })).toEqual({
      kategoriId: 'Pilih kategori',
      nama: 'Nama bahan wajib diisi',
      harga: 'Harga modal wajib diisi',
    });
    expect(validateBahanInput({ kategoriId: 'k1', nama: 'Fleece', harga: 60000 }, { isEdit: false })).toEqual({});
  });

  it('harga 0 diizinkan saat edit seperti legacy, minus selalu ditolak', () => {
    expect(validateBahanInput({ kategoriId: 'k1', nama: 'Fleece', harga: 0 }, { isEdit: true })).toEqual({});
    expect(validateBahanInput({ kategoriId: 'k1', nama: 'Fleece', harga: -1 }, { isEdit: true }).harga).toBe('Harga modal tidak boleh minus');
  });

  it('nama kategori kembar (tanpa peka huruf besar) ditolak', () => {
    const existing = [{ id: 'k1', nama: 'Kaos' }];
    expect(validateKategoriName('  kaos ', existing)).toBe('Kategori "kaos" sudah ada');
    expect(validateKategoriName('', existing)).toBe('Nama kategori wajib diisi');
    expect(validateKategoriName('Polo', existing)).toBeNull();
  });

  it('payload bahan dipangkas dan hanya berisi field legacy', () => {
    const payload = buildBahanPayload({ kategoriId: 'k1', nama: '  Fleece ', harga: 60000 });
    expect(payload).toEqual({ kategoriId: 'k1', nama: 'Fleece', harga: 60000 });
    expect(Object.values(payload).every((v) => v !== undefined)).toBe(true);
  });
});

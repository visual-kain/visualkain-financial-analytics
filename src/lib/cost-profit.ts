import type { KategoriDoc } from '@/lib/legacy/types';

export const COST_PROFIT_COLLECTIONS = {
  kategori: 'cp_kategori',
  bahan: 'cp_bahan',
  markup: 'cp_markup',
} as const;

export const DEFAULT_QTY = 12;
export const DEFAULT_MARKUP_FORM = { qtyMin: 1, qtyMax: 12, persen: 40 } as const;

export interface BahanDoc {
  id: string;
  kategoriId: string;
  nama: string;
  harga: number;
}

export interface MarkupDoc {
  id: string;
  qtyMin: number;
  qtyMax: number;
  persen: number;
}

export interface BahanInput {
  kategoriId: string;
  nama: string;
  harga: number;
}

export interface MarkupInput {
  qtyMin: number;
  qtyMax: number;
  persen: number;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Legacy memakai orderBy('nama'), sehingga dokumen tanpa field nama tidak pernah tampil; perilaku itu dipertahankan. */
export function normalizeBahan(id: string, data: Record<string, unknown>): BahanDoc | null {
  if (typeof data.nama !== 'string') return null;
  return {
    id,
    kategoriId: typeof data.kategoriId === 'string' ? data.kategoriId : '',
    nama: data.nama,
    harga: finiteNumber(data.harga) ?? 0,
  };
}

/** Legacy memakai orderBy('qtyMin'); dokumen tanpa qtyMin tidak tampil. Dokumen yang qtyMax atau persennya rusak juga dibuang agar hitungan tidak menjadi NaN. */
export function normalizeMarkup(id: string, data: Record<string, unknown>): MarkupDoc | null {
  const qtyMin = finiteNumber(data.qtyMin);
  const qtyMax = finiteNumber(data.qtyMax);
  const persen = finiteNumber(data.persen);
  if (qtyMin === null || qtyMax === null || persen === null) return null;
  return { id, qtyMin, qtyMax, persen };
}

export function sortBahan(list: readonly BahanDoc[]): BahanDoc[] {
  return [...list].sort((a, b) => a.nama.localeCompare(b.nama, 'id') || a.id.localeCompare(b.id));
}

/** Urutan qtyMin naik; qtyMin kembar diurutkan per ID dokumen, sama seperti urutan implisit Firestore. */
export function sortMarkup(list: readonly MarkupDoc[]): MarkupDoc[] {
  return [...list].sort((a, b) => a.qtyMin - b.qtyMin || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Aturan pertama (qtyMin terkecil) yang rentangnya memuat qty, batas bawah dan atas inklusif. */
export function findMarkupRule(rules: readonly MarkupDoc[], qty: number): MarkupDoc | null {
  return sortMarkup(rules).find((rule) => qty >= rule.qtyMin && qty <= rule.qtyMax) ?? null;
}

export interface CostProfitResult {
  hargaModal: number;
  rule: MarkupDoc | null;
  /** Persentase yang dipakai; 0 bila tidak ada aturan yang cocok. */
  persen: number;
  hargaJual: number;
  totalModal: number;
  totalJual: number;
  profit: number;
}

const EMPTY_RESULT: CostProfitResult = { hargaModal: 0, rule: null, persen: 0, hargaJual: 0, totalModal: 0, totalJual: 0, profit: 0 };

/**
 * Rumus ProfitCalculator `visualkaindb` tanpa pembulatan: pembulatan hanya saat tampil.
 * `hargaModal` null berarti belum ada bahan terpilih.
 */
export function calculateCostProfit(hargaModal: number | null, qty: number, rules: readonly MarkupDoc[]): CostProfitResult {
  if (hargaModal === null || !Number.isFinite(qty) || qty < 1) return { ...EMPTY_RESULT, hargaModal: hargaModal ?? 0 };

  const rule = findMarkupRule(rules, qty);
  const persen = rule ? rule.persen : 0;
  const hargaJual = hargaModal * (1 + persen / 100);
  const totalModal = hargaModal * qty;
  const totalJual = hargaJual * qty;
  const profit = totalJual - totalModal;

  return { hargaModal, rule, persen, hargaJual, totalModal, totalJual, profit };
}

export function formatMarkupPersen(persen: number): string {
  return `+${persen.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;
}

export function formatQtyRange(qtyMin: number, qtyMax: number): string {
  return `Qty ${qtyMin} – ${qtyMax} pcs`;
}

/** Aturan yang rentangnya beririsan (batas inklusif, jadi 1–12 dan 12–24 beririsan di 12). */
export function findOverlappingRules(range: { qtyMin: number; qtyMax: number }, rules: readonly MarkupDoc[], excludeId?: string): MarkupDoc[] {
  return sortMarkup(rules).filter((rule) => rule.id !== excludeId && rule.qtyMin <= range.qtyMax && range.qtyMin <= rule.qtyMax);
}

export function parseNumericField(raw: string): number {
  return raw.trim() === '' ? Number.NaN : Number(raw);
}

export interface MarkupFieldErrors {
  qtyMin?: string;
  qtyMax?: string;
  persen?: string;
}

export function validateMarkupInput(input: MarkupInput): MarkupFieldErrors {
  const errors: MarkupFieldErrors = {};
  if (!Number.isFinite(input.qtyMin)) errors.qtyMin = 'Qty Min wajib diisi';
  else if (!Number.isInteger(input.qtyMin)) errors.qtyMin = 'Qty Min harus bilangan bulat';
  else if (input.qtyMin < 1) errors.qtyMin = 'Qty Min minimal 1';

  if (!Number.isFinite(input.qtyMax)) errors.qtyMax = 'Qty Max wajib diisi';
  else if (!Number.isInteger(input.qtyMax)) errors.qtyMax = 'Qty Max harus bilangan bulat';
  else if (input.qtyMax < 1) errors.qtyMax = 'Qty Max minimal 1';

  if (!errors.qtyMin && !errors.qtyMax && input.qtyMin >= input.qtyMax) {
    errors.qtyMax = 'Qty Min harus lebih kecil dari Qty Max';
  }

  if (!Number.isFinite(input.persen)) errors.persen = 'Persentase wajib diisi';
  else if (!Number.isInteger(input.persen)) errors.persen = 'Persentase harus bilangan bulat';
  else if (input.persen < 0) errors.persen = 'Persentase tidak boleh minus';
  return errors;
}

export interface BahanFieldErrors {
  kategoriId?: string;
  nama?: string;
  harga?: string;
}

/** Harga 0 hanya boleh pada edit: legacy menolak harga kosong saat tambah, tetapi mengizinkan 0 saat edit. */
export function validateBahanInput(input: BahanInput, options: { isEdit: boolean }): BahanFieldErrors {
  const errors: BahanFieldErrors = {};
  if (!input.kategoriId) errors.kategoriId = 'Pilih kategori';
  if (!input.nama.trim()) errors.nama = 'Nama bahan wajib diisi';
  if (!Number.isFinite(input.harga) || input.harga < 0) errors.harga = 'Harga modal tidak boleh minus';
  else if (!options.isEdit && input.harga === 0) errors.harga = 'Harga modal wajib diisi';
  return errors;
}

export function validateKategoriName(nama: string, existing: readonly KategoriDoc[]): string | null {
  const clean = nama.trim();
  if (!clean) return 'Nama kategori wajib diisi';
  const lower = clean.toLowerCase();
  if (existing.some((k) => k.nama.trim().toLowerCase() === lower)) return `Kategori "${clean}" sudah ada`;
  return null;
}

export function bahanInKategori(kategoriId: string, bahanList: readonly BahanDoc[]): BahanDoc[] {
  return bahanList.filter((b) => b.kategoriId === kategoriId);
}

const BLOCK_NAME_PREVIEW = 3;

/** Alasan kategori tidak boleh dihapus, atau null bila tidak ada bahan yang masih memakainya. */
export function getKategoriDeleteBlock(kategori: KategoriDoc, bahanList: readonly BahanDoc[]): string | null {
  const used = bahanInKategori(kategori.id, bahanList);
  if (used.length === 0) return null;
  const names = used.slice(0, BLOCK_NAME_PREVIEW).map((b) => b.nama);
  const rest = used.length - names.length;
  const preview = rest > 0 ? `${names.join(', ')}, dan ${rest} lainnya` : names.join(', ');
  return `Kategori "${kategori.nama}" masih dipakai ${used.length} bahan (${preview}). Hapus bahan tersebut atau pindahkan ke kategori lain dulu.`;
}

/** Field persis seperti legacy; createdAt dan updatedAt ditambahkan oleh repo. */
export function buildBahanPayload(input: BahanInput): BahanInput {
  return { kategoriId: input.kategoriId, nama: input.nama.trim(), harga: input.harga };
}

export function buildMarkupPayload(input: MarkupInput): MarkupInput {
  return { qtyMin: input.qtyMin, qtyMax: input.qtyMax, persen: input.persen };
}

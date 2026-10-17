import { documentYear, parseDocumentNumber } from '@/lib/document-number';
import type { FirestoreTimestampLike } from '@/lib/legacy/types';

export interface LetterAuthor {
  name: string;
  email: string;
}

export interface ReservedNumber {
  nomor: string;
  urut: number;
  tahun: number;
}

export interface KerjasamaFormState {
  noSurat: string;
  tanggal: string;
  lampiran: string;
  perihal: string;
  perusahaan: string;
  divisi: string;
  alamat: string;
  diTempat: string;
  pembuka: string;
  profil: string;
  keunggulan: string;
  penutup: string;
}

export interface KerjasamaContentPayload {
  tanggal: string;
  lampiran: string;
  perihal: string;
  kepadaNama: string;
  kepadaJabatan: string;
  kepadaAlamat: string;
  kepadaTempat: string;
  paragrafPembuka: string;
  paragrafProfil: string;
  paragrafKeunggulan: string;
  paragrafPenutup: string;
}

export interface KerjasamaCreatePayload extends KerjasamaContentPayload {
  noSurat: string;
  tahun: number;
  urut: number;
  createdBy: string;
  createdByEmail: string;
}

export interface KerjasamaDoc extends KerjasamaCreatePayload {
  id: string;
  createdAt?: FirestoreTimestampLike | null;
  updatedAt?: FirestoreTimestampLike | null;
}

export interface PenawaranItem {
  no: number;
  desc: string;
  qty: number;
  satuan: string;
  harga: number;
  jumlah: number;
}

export type PenawaranStoredItem = Omit<PenawaranItem, 'no'>;

export interface PenawaranFormState {
  noPenawaran: string;
  tanggal: string;
  perihal: string;
  perusahaan: string;
  cp: string;
  alamat: string;
  telpEmail: string;
  catatan: string;
}

export interface PenawaranContentPayload {
  tanggal: string;
  perihal: string;
  namaPerusahaan: string;
  contactPerson: string;
  alamat: string;
  telepon: string;
  items: PenawaranStoredItem[];
  catatan: string;
}

export interface PenawaranCreatePayload extends PenawaranContentPayload {
  noPenawaran: string;
  tahun: number;
  urut: number;
  createdBy: string;
  createdByEmail: string;
}

export interface PenawaranDoc extends PenawaranCreatePayload {
  id: string;
  createdAt?: FirestoreTimestampLike | null;
  updatedAt?: FirestoreTimestampLike | null;
}

export interface LetterRow {
  id: string;
  nomor: string;
  tanggal: string;
  perihal: string;
  perusahaan: string;
  createdBy: string;
  tahun: number;
  urut: number;
}

const ALLOWED_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'ul', 'ol', 'li', 'span']);
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'textarea', 'title', 'svg', 'math']);
const BLOCK_TAGS_RE = /\n*(<\/?(?:ul|ol|li|p)>)\n*/g;
const TAG_RE = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
const BARE_AMPERSAND_RE = /&(?!(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#\d{1,7}|#[xX][0-9a-fA-F]{1,6});)/g;

function escapeText(text: string): string {
  return text.replace(BARE_AMPERSAND_RE, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Sanitizer allowlist tanpa DOM supaya aman dipakai di SSR dan test. Surat kini disimpan dan dibagikan,
 * jadi HTML paragraf tidak boleh dirender mentah. Hanya tag teks dasar tanpa atribut yang lolos.
 */
export function sanitizeLetterHtml(raw: string): string {
  const out: string[] = [];
  const open: string[] = [];
  let cursor = 0;
  TAG_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(raw)) !== null) {
    if (match.index > cursor) out.push(escapeText(raw.slice(cursor, match.index)));
    cursor = match.index + match[0].length;

    const name = match[2]?.toLowerCase();
    if (!name) continue;
    const isClosing = match[1] === '/';

    if (DROP_WITH_CONTENT.has(name)) {
      if (isClosing) continue;
      const closeAt = raw.toLowerCase().indexOf(`</${name}`, cursor);
      if (closeAt === -1) {
        cursor = raw.length;
        TAG_RE.lastIndex = cursor;
      } else {
        const closeEnd = raw.indexOf('>', closeAt);
        cursor = closeEnd === -1 ? raw.length : closeEnd + 1;
        TAG_RE.lastIndex = cursor;
      }
      continue;
    }

    if (!ALLOWED_TAGS.has(name)) continue;

    if (name === 'br') {
      if (!isClosing) out.push('<br>');
      continue;
    }

    if (!isClosing) {
      open.push(name);
      out.push(`<${name}>`);
      continue;
    }

    const at = open.lastIndexOf(name);
    if (at === -1) continue;
    while (open.length > at) out.push(`</${open.pop()}>`);
  }

  if (cursor < raw.length) out.push(escapeText(raw.slice(cursor)));
  while (open.length > 0) out.push(`</${open.pop()}>`);
  return out.join('');
}

/**
 * HTML siap render untuk paragraf surat: disanitasi, lalu baris baru dari textarea menjadi `<br>`.
 * Mengembalikan string kosong untuk isi kosong agar kertas bisa menampilkan tanda "-".
 */
export function renderLetterHtml(raw: string | null | undefined): string {
  const clean = sanitizeLetterHtml(raw ?? '').replace(/\r\n?/g, '\n').trim();
  if (!clean) return '';
  return clean.replace(BLOCK_TAGS_RE, '$1').replace(/\n/g, '<br>');
}

/** Tanggal lokal `YYYY-MM-DD`; `toISOString` memakai UTC sehingga lewat tengah malam WIB masih mundur sehari. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// "Dengan hormat," dicetak kertas sendiri, jadi paragraf pembuka tidak lagi mengulangnya.
export const KERJASAMA_DEFAULT_TEXT = {
  pembuka:
    'Bersama surat ini kami dari <strong>VisualKain</strong> yang bergerak di bidang jasa konveksi dan produksi pakaian berlokasi di Tangerang Selatan, bermaksud mengajukan kerjasama kepada perusahaan Bapak/Ibu.',
  profil:
    '<strong>VisualKain</strong> adalah perusahaan yang bergerak di bidang produksi pakaian (konveksi) dengan pengalaman dalam melayani kebutuhan seragam kerja, kaos event, jaket, kemeja, wearpack, dan berbagai produk garmen lainnya. Kami didukung oleh tenaga produksi terampil serta menggunakan bahan baku berkualitas untuk menghasilkan produk yang rapi, nyaman, dan tepat waktu.\n\n<strong>Layanan Kami Meliputi:</strong>\n1. Produksi seragam kerja (PDL/PDH, kemeja, dll)\n2. Produksi kaos (kaos event, kaos komunitas, kaos distro)\n3. Produksi jaket (jaket hoodie, bomber, varsity, dll)\n4. Produksi wearpack dan atribut promosi\n5. Aplikasi sablon, bordir, dan printing',
  keunggulan:
    '<strong>Keunggulan VisualKain:</strong>\n• Harga kompetitif dengan kualitas terjamin\n• Tepat waktu sesuai deadline yang disepakati\n• Minimum order fleksibel (mulai dari 12 pcs per model)\n• Konsultasi desain dan pemilihan bahan gratis\n• Garansi produksi ulang jika hasil tidak sesuai spesifikasi',
  penutup:
    'Besar harapan kami agar perusahaan Bapak/Ibu berkenan untuk menjalin kerjasama dengan VisualKain. Untuk diskusi lebih lanjut, kami siap dihubungi melalui kontak di kop surat ini.\n\nAtas perhatian dan kesempatan yang diberikan, kami ucapkan terima kasih.',
} as const;

export function defaultKerjasamaForm(now: Date = new Date()): KerjasamaFormState {
  return {
    noSurat: '',
    tanggal: todayIso(now),
    lampiran: 'Company Profile & Portofolio',
    perihal: '',
    perusahaan: '',
    divisi: '',
    alamat: '',
    diTempat: 'Di Tempat',
    pembuka: KERJASAMA_DEFAULT_TEXT.pembuka,
    profil: KERJASAMA_DEFAULT_TEXT.profil,
    keunggulan: KERJASAMA_DEFAULT_TEXT.keunggulan,
    penutup: KERJASAMA_DEFAULT_TEXT.penutup,
  };
}

export function defaultPenawaranForm(now: Date = new Date()): PenawaranFormState {
  return {
    noPenawaran: '',
    tanggal: todayIso(now),
    perihal: '',
    perusahaan: '',
    cp: '',
    alamat: '',
    telpEmail: '',
    catatan: '',
  };
}

function blankItem(no: number): PenawaranItem {
  return { no, desc: '', qty: 0, satuan: 'pcs', harga: 0, jumlah: 0 };
}

export function defaultPenawaranItems(): PenawaranItem[] {
  return [blankItem(1), blankItem(2), blankItem(3)];
}

export function addPenawaranItem(items: PenawaranItem[]): PenawaranItem[] {
  return [...items, blankItem(items.length + 1)];
}

/** Baris terakhir tidak bisa dihapus; array yang sama dikembalikan agar pemanggil tahu tidak ada perubahan. */
export function removePenawaranItem(items: PenawaranItem[], index: number): PenawaranItem[] {
  if (items.length <= 1) return items;
  return items.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: i + 1 }));
}

export function updatePenawaranItem(
  items: PenawaranItem[],
  index: number,
  field: 'desc' | 'satuan' | 'qty' | 'harga',
  value: string | number
): PenawaranItem[] {
  const next = [...items];
  const updated = { ...next[index], [field]: value } as PenawaranItem;
  if (field === 'qty' || field === 'harga') updated.jumlah = updated.qty * updated.harga;
  next[index] = updated;
  return next;
}

export function validateKerjasamaForm(form: KerjasamaFormState): string | null {
  if (!form.tanggal) return 'Isi tanggal surat sebelum menyimpan.';
  if (!form.perihal.trim()) return 'Isi perihal surat sebelum menyimpan.';
  if (!form.perusahaan.trim()) return 'Isi nama perusahaan tujuan sebelum menyimpan.';
  return null;
}

export function validatePenawaranForm(form: PenawaranFormState): string | null {
  if (!form.tanggal) return 'Isi tanggal penawaran sebelum menyimpan.';
  if (!form.perihal.trim()) return 'Isi perihal penawaran sebelum menyimpan.';
  if (!form.perusahaan.trim()) return 'Isi nama perusahaan tujuan sebelum menyimpan.';
  return null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function amount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function toStoredItems(items: PenawaranItem[]): PenawaranStoredItem[] {
  return items.map((item) => {
    const qty = amount(item.qty);
    const harga = amount(item.harga);
    return { desc: text(item.desc).trim(), qty, satuan: text(item.satuan).trim(), harga, jumlah: qty * harga };
  });
}

export function buildKerjasamaUpdatePayload(form: KerjasamaFormState): KerjasamaContentPayload {
  return {
    tanggal: form.tanggal,
    lampiran: form.lampiran.trim(),
    perihal: form.perihal.trim(),
    kepadaNama: form.perusahaan.trim(),
    kepadaJabatan: form.divisi.trim(),
    kepadaAlamat: form.alamat.trim(),
    kepadaTempat: form.diTempat.trim(),
    paragrafPembuka: form.pembuka,
    paragrafProfil: form.profil,
    paragrafKeunggulan: form.keunggulan,
    paragrafPenutup: form.penutup,
  };
}

export function buildKerjasamaCreatePayload(form: KerjasamaFormState, reserved: ReservedNumber, author: LetterAuthor): KerjasamaCreatePayload {
  return {
    noSurat: reserved.nomor,
    tahun: reserved.tahun,
    urut: reserved.urut,
    ...buildKerjasamaUpdatePayload(form),
    createdBy: author.name,
    createdByEmail: author.email,
  };
}

export function buildPenawaranUpdatePayload(form: PenawaranFormState, items: PenawaranItem[]): PenawaranContentPayload {
  return {
    tanggal: form.tanggal,
    perihal: form.perihal.trim(),
    namaPerusahaan: form.perusahaan.trim(),
    contactPerson: form.cp.trim(),
    alamat: form.alamat.trim(),
    telepon: form.telpEmail.trim(),
    items: toStoredItems(items),
    catatan: form.catatan,
  };
}

export function buildPenawaranCreatePayload(
  form: PenawaranFormState,
  items: PenawaranItem[],
  reserved: ReservedNumber,
  author: LetterAuthor
): PenawaranCreatePayload {
  return {
    noPenawaran: reserved.nomor,
    tahun: reserved.tahun,
    urut: reserved.urut,
    ...buildPenawaranUpdatePayload(form, items),
    createdBy: author.name,
    createdByEmail: author.email,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Firestore menolak `undefined`; Timestamp dan objek bukan polos lainnya dibiarkan utuh. */
export function omitUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((v) => v !== undefined).map((v) => omitUndefined(v)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (v !== undefined) out[key] = omitUndefined(v);
    }
    return out as T;
  }
  return value;
}

function resolveYear(data: Record<string, unknown>, nomor: string): number {
  const stored = Number(data.tahun);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return parseDocumentNumber(nomor)?.year ?? documentYear(text(data.tanggal));
}

function resolveUrut(data: Record<string, unknown>, nomor: string): number {
  const stored = Number(data.urut);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return parseDocumentNumber(nomor)?.urut ?? 0;
}

function timestamp(value: unknown): FirestoreTimestampLike | null {
  return value && typeof value === 'object' ? (value as FirestoreTimestampLike) : null;
}

export function normalizeKerjasamaDoc(id: string, data: Record<string, unknown>): KerjasamaDoc {
  const noSurat = text(data.noSurat);
  return {
    id,
    noSurat,
    tahun: resolveYear(data, noSurat),
    urut: resolveUrut(data, noSurat),
    tanggal: text(data.tanggal),
    lampiran: text(data.lampiran),
    perihal: text(data.perihal),
    kepadaNama: text(data.kepadaNama),
    kepadaJabatan: text(data.kepadaJabatan),
    kepadaAlamat: text(data.kepadaAlamat),
    kepadaTempat: text(data.kepadaTempat),
    paragrafPembuka: text(data.paragrafPembuka),
    paragrafProfil: text(data.paragrafProfil),
    paragrafKeunggulan: text(data.paragrafKeunggulan),
    paragrafPenutup: text(data.paragrafPenutup),
    createdBy: text(data.createdBy),
    createdByEmail: text(data.createdByEmail),
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt),
  };
}

export function normalizePenawaranDoc(id: string, data: Record<string, unknown>): PenawaranDoc {
  const noPenawaran = text(data.noPenawaran);
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: PenawaranStoredItem[] = rawItems.filter(isPlainObject).map((item) => {
    const qty = amount(item.qty);
    const harga = amount(item.harga);
    return { desc: text(item.desc), qty, satuan: text(item.satuan), harga, jumlah: qty * harga };
  });
  return {
    id,
    noPenawaran,
    tahun: resolveYear(data, noPenawaran),
    urut: resolveUrut(data, noPenawaran),
    tanggal: text(data.tanggal),
    perihal: text(data.perihal),
    namaPerusahaan: text(data.namaPerusahaan),
    contactPerson: text(data.contactPerson),
    alamat: text(data.alamat),
    telepon: text(data.telepon),
    items,
    catatan: text(data.catatan),
    createdBy: text(data.createdBy),
    createdByEmail: text(data.createdByEmail),
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt),
  };
}

export function kerjasamaDocToForm(doc: KerjasamaDoc): KerjasamaFormState {
  return {
    noSurat: doc.noSurat,
    tanggal: doc.tanggal,
    lampiran: doc.lampiran,
    perihal: doc.perihal,
    perusahaan: doc.kepadaNama,
    divisi: doc.kepadaJabatan,
    alamat: doc.kepadaAlamat,
    diTempat: doc.kepadaTempat,
    pembuka: doc.paragrafPembuka,
    profil: doc.paragrafProfil,
    keunggulan: doc.paragrafKeunggulan,
    penutup: doc.paragrafPenutup,
  };
}

export function penawaranDocToForm(doc: PenawaranDoc): { form: PenawaranFormState; items: PenawaranItem[] } {
  const items = doc.items.length > 0 ? doc.items.map((item, i) => ({ ...item, no: i + 1 })) : [blankItem(1)];
  return {
    form: {
      noPenawaran: doc.noPenawaran,
      tanggal: doc.tanggal,
      perihal: doc.perihal,
      perusahaan: doc.namaPerusahaan,
      cp: doc.contactPerson,
      alamat: doc.alamat,
      telpEmail: doc.telepon,
      catatan: doc.catatan,
    },
    items,
  };
}

export function kerjasamaToRow(doc: KerjasamaDoc): LetterRow {
  return {
    id: doc.id,
    nomor: doc.noSurat,
    tanggal: doc.tanggal,
    perihal: doc.perihal,
    perusahaan: doc.kepadaNama,
    createdBy: doc.createdBy,
    tahun: doc.tahun,
    urut: doc.urut,
  };
}

export function penawaranToRow(doc: PenawaranDoc): LetterRow {
  return {
    id: doc.id,
    nomor: doc.noPenawaran,
    tanggal: doc.tanggal,
    perihal: doc.perihal,
    perusahaan: doc.namaPerusahaan,
    createdBy: doc.createdBy,
    tahun: doc.tahun,
    urut: doc.urut,
  };
}

export function sortLetterRows(rows: LetterRow[]): LetterRow[] {
  return [...rows].sort((a, b) => b.tahun - a.tahun || b.urut - a.urut || b.tanggal.localeCompare(a.tanggal));
}

export function letterYears(rows: ReadonlyArray<Pick<LetterRow, 'tahun'>>): number[] {
  return [...new Set(rows.map((r) => r.tahun))].sort((a, b) => b - a);
}

export interface LetterFilter {
  year: number | 'all';
  query: string;
}

export function filterLetterRows(rows: LetterRow[], { year, query }: LetterFilter): LetterRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (year !== 'all' && row.tahun !== year) return false;
    if (!q) return true;
    return [row.nomor, row.perihal, row.perusahaan].some((v) => v.toLowerCase().includes(q));
  });
}

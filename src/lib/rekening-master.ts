/**
 * Master rekening penerima/pencairan. `kode` ditulis sebagai prefix keterangan transaksi
 * ("Transfer BCA - catatan"), jadi tidak boleh berubah setelah dibuat agar transaksi lama tetap terbaca.
 */
export interface RekeningInput {
  namaBank: string;
  nomor: string;
  atasNama: string;
}

export interface RekeningDoc extends RekeningInput {
  kode: string;
}

export interface RekeningAccount extends RekeningDoc {
  isDefault: boolean;
  badge?: string;
}

export const REKENING_COLLECTION = 'finance_rekening';

export const DEFAULT_REKENING: ReadonlyArray<RekeningAccount> = [
  { kode: 'Transfer BCA', namaBank: 'Bank BCA', nomor: '8830-1928-41', atasNama: 'PT VISUAL KAIN INDONESIA', isDefault: true, badge: 'Utama' },
  { kode: 'Transfer Mandiri', namaBank: 'Bank Mandiri', nomor: '137-00-1928-11', atasNama: 'PT VISUAL KAIN INDONESIA', isDefault: true },
  { kode: 'Transfer BRI', namaBank: 'Bank BRI', nomor: '', atasNama: '', isDefault: true },
  { kode: 'Tokopedia', namaBank: 'Marketplace Tokopedia', nomor: '', atasNama: '', isDefault: true },
  { kode: 'Tunai / Cash', namaBank: 'Kasir / Tunai Operasional', nomor: '', atasNama: '', isDefault: true },
];

export function rekeningLabel(acc: Pick<RekeningInput, 'namaBank' | 'nomor'>): string {
  const nama = acc.namaBank.trim();
  const nomor = acc.nomor.trim();
  return nomor ? `${nama} (${nomor})` : nama;
}

export function rekeningDocId(kode: string): string {
  return kode
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function mergeRekening(
  defaults: ReadonlyArray<RekeningAccount>,
  docs: ReadonlyArray<RekeningDoc>
): RekeningAccount[] {
  const byKode = new Map(docs.map((d) => [d.kode, d]));
  const merged: RekeningAccount[] = defaults.map((def) => {
    const override = byKode.get(def.kode);
    return override
      ? { ...def, namaBank: override.namaBank || def.namaBank, nomor: override.nomor ?? '', atasNama: override.atasNama ?? '' }
      : { ...def };
  });
  const defaultKodes = new Set(defaults.map((d) => d.kode));
  const extras = docs
    .filter((d) => d.kode && !defaultKodes.has(d.kode))
    .map((d) => ({ ...d, isDefault: false }))
    .sort((a, b) => a.namaBank.localeCompare(b.namaBank));
  return [...merged, ...extras];
}

export function toAccountOptions(accounts: ReadonlyArray<RekeningAccount>): Array<{ value: string; label: string; badge?: string }> {
  return accounts.map((a) => ({ value: a.kode, label: rekeningLabel(a), badge: a.badge }));
}

/** Rekening baru memakai nama bank sebagai kode, jadi nama tidak boleh sama dengan kode atau nama rekening lain. */
export function validateRekeningInput(
  input: RekeningInput,
  existing: ReadonlyArray<RekeningAccount>,
  editingKode?: string | null
): string | null {
  const nama = input.namaBank.trim();
  if (!nama) return 'Nama bank / akun wajib diisi';
  const lower = nama.toLowerCase();
  // Kode baru = nama bank, dan doc id = slug kode; slug yang bentrok akan menimpa dokumen rekening lain.
  const docId = editingKode ? null : rekeningDocId(nama);
  if (docId === '') return 'Nama bank / akun harus mengandung huruf atau angka';
  const clash = existing.some(
    (acc) =>
      acc.kode !== editingKode &&
      (acc.kode.toLowerCase() === lower ||
        acc.namaBank.trim().toLowerCase() === lower ||
        (docId !== null && rekeningDocId(acc.kode) === docId))
  );
  return clash ? `Rekening "${nama}" sudah ada` : null;
}

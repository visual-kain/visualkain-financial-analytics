/**
 * Helper murni untuk ledger pembayaran per pesanan (piutang customer dan hutang vendor).
 * Jumlah termin tidak dibatasi: nomor urut dan label dihasilkan dari data, bukan dari daftar jenis tetap.
 */

export interface LedgerEntry {
  id: string;
  tanggal: string;
  nominal: number;
  terminKe?: number;
  label?: string;
  createdAt?: string;
}

export type LedgerKind = 'customer' | 'vendor';

export const TARGET_DP_PERCENT = 70;

export function nextTerminNumber(entries: ReadonlyArray<LedgerEntry>): number {
  return entries.length + 1;
}

/** Sisa yang masih boleh dibayar. `excludeId` dipakai saat mengedit baris yang sudah ada. */
export function outstandingAmount(
  total: number,
  entries: ReadonlyArray<LedgerEntry>,
  excludeId?: string | null
): number {
  const paid = entries.reduce((sum, e) => (e.id === excludeId ? sum : sum + (Number(e.nominal) || 0)), 0);
  return Math.max(0, Math.round(total) - paid);
}

export function suggestTerminLabel(terminKe: number, settles: boolean, kind: LedgerKind = 'customer'): string {
  if (settles) return 'Pelunasan';
  return kind === 'customer' ? `DP ${terminKe}` : `Pembayaran ke-${terminKe}`;
}

type CustomerJenis = 'dp' | 'termin' | 'pelunasan';

/** Nilai `jenis` lama yang tetap diisi demi kompatibilitas data dan laporan. */
export function deriveCustomerJenis(terminKe: number, settles: boolean): CustomerJenis {
  if (settles) return 'pelunasan';
  return terminKe === 1 ? 'dp' : 'termin';
}

export function deriveVendorJenis(terminKe: number, settles: boolean): string {
  if (settles) return 'pelunasan_vendor';
  return terminKe === 1 ? 'dp_vendor' : 'termin_vendor';
}

/**
 * Urutkan, beri nomor ulang berurutan, dan isi label untuk data lama yang belum punya `terminKe` / `label`.
 * Nomor selalu mengikuti urutan terkini supaya tetap rapi setelah ada baris yang dihapus.
 */
export function normalizeLedger<T extends LedgerEntry>(
  entries: ReadonlyArray<T>,
  total: number,
  kind: LedgerKind = 'customer'
): T[] {
  const sorted = [...entries].sort((a, b) => {
    const byDate = (a.tanggal || '').localeCompare(b.tanggal || '');
    if (byDate !== 0) return byDate;
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });

  let running = 0;
  return sorted.map((entry, index) => {
    running += Number(entry.nominal) || 0;
    const terminKe = index + 1;
    const settles = total > 0 && running >= Math.round(total);
    const hasCustomLabel = typeof entry.label === 'string' && entry.label.trim() !== '';
    return {
      ...entry,
      terminKe,
      label: hasCustomLabel ? entry.label : suggestTerminLabel(terminKe, settles, kind),
    };
  });
}

export interface LedgerSummary {
  total: number;
  dibayar: number;
  sisa: number;
  persen: number;
  target70: number;
  sisaMenuju70: number;
  isLunas: boolean;
  isOverpay: boolean;
  isReady70: boolean;
}

export function summarizeLedger(
  total: number,
  entries: ReadonlyArray<LedgerEntry>,
  nominalBaru = 0,
  excludeId?: string | null
): LedgerSummary {
  const base = Math.round(total);
  const existingPaid = entries.reduce(
    (sum, e) => (e.id === excludeId ? sum : sum + (Number(e.nominal) || 0)),
    0
  );
  const dibayar = existingPaid + Math.max(0, nominalBaru);
  const target70 = Math.round((TARGET_DP_PERCENT / 100) * base);

  return {
    total: base,
    dibayar,
    sisa: Math.max(0, base - dibayar),
    persen: base > 0 ? (dibayar / base) * 100 : 0,
    target70,
    sisaMenuju70: Math.max(0, target70 - dibayar),
    isLunas: base > 0 && dibayar >= base,
    isOverpay: dibayar > base,
    isReady70: base > 0 && dibayar >= target70,
  };
}

/** Pesan galat untuk nominal baris pembayaran, atau `null` bila valid. */
export function validateEntryNominal(
  nominal: number,
  sisaBoleh: number,
  formatRupiah: (n: number) => string
): string | null {
  if (!Number.isFinite(nominal) || nominal <= 0) return 'Nominal harus lebih dari Rp 0';
  if (sisaBoleh <= 0) return 'Pesanan sudah lunas, tidak ada sisa yang bisa dibayar';
  if (nominal > sisaBoleh) return `Nominal melebihi sisa ${formatRupiah(sisaBoleh)}`;
  return null;
}

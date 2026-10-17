/**
 * Helper murni untuk ledger pembayaran per pesanan (piutang customer dan hutang vendor).
 * Jumlah termin tidak dibatasi: nomor urut dan label dihasilkan dari data, bukan dari daftar jenis tetap.
 */

import type { AuditFields } from '@/lib/audit';

export interface LedgerEntry extends AuditFields {
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

// Label hasil saran sistem (termasuk pola lama dari hook); dihitung ulang dari urutan supaya tidak basi setelah baris dihapus.
const AUTO_LABEL_PATTERN = /^(dp \d+|termin \d+|pembayaran ke-\d+|pelunasan)$/i;

export function isAutoLabel(label: string | null | undefined): boolean {
  const text = (label || '').trim();
  return text === '' || AUTO_LABEL_PATTERN.test(text);
}

/** Label otomatis disimpan kosong; hanya label yang diketik user yang dipersist. */
export function toPersistedLabel(label: string | null | undefined): string {
  return isAutoLabel(label) ? '' : (label || '').trim();
}

/**
 * Cari baris ledger untuk ID entri dari tabel Kas Masuk/Keluar.
 * Hanya kecocokan persis atau alias deterministik; tidak pernah menebak dari posisi supaya tidak mengedit termin yang salah.
 */
export function resolveEditTarget<T extends LedgerEntry>(rows: ReadonlyArray<T>, targetId: string): T | null {
  const exact = rows.find((r) => r.id === targetId);
  if (exact) return exact;

  const aliasId = tableIdAlias(targetId);
  return aliasId ? rows.find((r) => r.id === aliasId) ?? null : null;
}

// Entri tabel tanpa ID pembayaran sendiri dipetakan ke baris awal yang dibuat halaman form (`*-init`).
function tableIdAlias(targetId: string): string | null {
  const customerSingle = /^pay-(.+)-single$/.exec(targetId);
  if (customerSingle) return `pay-${customerSingle[1]}-init`;
  const vendorAggregate = /^vp-(?:rem-)?(.+)$/.exec(targetId);
  if (vendorAggregate) return `vp-${vendorAggregate[1]}-init`;
  return null;
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
    return {
      ...entry,
      terminKe,
      label: isAutoLabel(entry.label) ? suggestTerminLabel(terminKe, settles, kind) : entry.label!.trim(),
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

/**
 * Pembayaran hasil fallback data lama: `-dp-legacy` dari dpNominal/dpPersen VisualKainDB, atau baris `*-init` saat uang tercatat tanpa daftar termin.
 * Hanya penanda tampilan; tidak mengubah perhitungan (F-10 K-3).
 */
export function isUnitemizedPaymentId(id: string): boolean {
  return id.endsWith('-dp-legacy') || /^(pay|vp)-.+-init$/.test(id);
}

export function hasUnitemizedCustomerPayment(order: {
  pembayaranList?: ReadonlyArray<{ id: string; nominal: number }>;
  totalUangMasukCustomer?: number;
}): boolean {
  const list = order.pembayaranList || [];
  if (list.length === 0) return Number(order.totalUangMasukCustomer || 0) > 0;
  return list.some((p) => isUnitemizedPaymentId(p.id));
}

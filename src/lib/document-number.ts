/**
 * Nomor dokumen berurutan per tahun (K-8): `SK-VK-2026-001` (kerjasama), `PH-VK-2026-001` (penawaran).
 * PO tidak punya penghitung sendiri karena mengikuti No. Invoice.
 */

export type DocumentPrefix = 'SK' | 'PH';

export const COMPANY_CODE = 'VK';

export function counterId(prefix: DocumentPrefix, year: number): string {
  return `${prefix}-${COMPANY_CODE}-${year}`;
}

export function formatDocumentNumber(prefix: DocumentPrefix, year: number, urut: number): string {
  return `${prefix}-${COMPANY_CODE}-${year}-${String(urut).padStart(3, '0')}`;
}

export interface ParsedDocumentNumber {
  prefix: DocumentPrefix;
  year: number;
  urut: number;
}

export function parseDocumentNumber(value: string): ParsedDocumentNumber | null {
  const match = /^(SK|PH)-VK-(\d{4})-(\d{3,})$/.exec(value.trim());
  if (!match) return null;
  return { prefix: match[1] as DocumentPrefix, year: Number(match[2]), urut: Number(match[3]) };
}

export function formatPoNumber(noInv: string): string {
  return noInv ? `PO-${noInv}` : 'PO-';
}

/** Tahun dokumen dari tanggal `YYYY-MM-DD`, atau tahun berjalan bila kosong. */
export function documentYear(tanggal: string | undefined, now: Date = new Date()): number {
  const match = /^(\d{4})-/.exec(tanggal || '');
  return match ? Number(match[1]) : now.getFullYear();
}

/** Judul file cetak invoice: `VK260052_YOGA - Kaos Aniversary` (feedback klien 18 Okt 2026); project kosong tidak ditulis. */
export function invoiceFileTitle(order: { noInv?: string; namaCustomer?: string; namaProject?: unknown }): string {
  const project = typeof order.namaProject === 'string' ? order.namaProject.trim() : '';
  const base = `${(order.noInv || '').trim()}_${(order.namaCustomer || '').trim()}`;
  return project && project !== '-' ? `${base} - ${project}` : base;
}

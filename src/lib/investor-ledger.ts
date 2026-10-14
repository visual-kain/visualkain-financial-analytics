import type { CashTransaction } from '@/types';
import { formatRupiah } from '@/lib/utils';

/** Dana investor menambah kas tetapi wajib dikembalikan, sehingga dicatat terpisah dari pemasukan usaha. */
export const KATEGORI_INVESTOR = {
  masuk: 'Dana Investor',
  pengembalian: 'Pengembalian Dana Investor',
  bagiHasil: 'Bagi Hasil Investor',
} as const;

/** Koleksi khusus investor, terpisah dari `kas` agar tidak tercampur dengan aplikasi operasional lama. */
export const INVESTOR_COLLECTION = 'finance_investor';

export type InvestorJenis = 'masuk' | 'pengembalian' | 'bagiHasil';

export function investorJenisFromKategori(kategori: string | undefined): InvestorJenis | null {
  if (kategori === KATEGORI_INVESTOR.masuk) return 'masuk';
  if (kategori === KATEGORI_INVESTOR.pengembalian) return 'pengembalian';
  if (kategori === KATEGORI_INVESTOR.bagiHasil) return 'bagiHasil';
  return null;
}

export function investorKategoriFromJenis(jenis: unknown): (typeof KATEGORI_INVESTOR)[keyof typeof KATEGORI_INVESTOR] {
  if (jenis === 'pengembalian') return KATEGORI_INVESTOR.pengembalian;
  if (jenis === 'bagiHasil') return KATEGORI_INVESTOR.bagiHasil;
  return KATEGORI_INVESTOR.masuk;
}

/** Dokumen `finance_investor` dipetakan ke bentuk CashTransaction agar ledger kas yang ada bisa dipakai apa adanya. */
export function mapInvestorDoc(id: string, d: Record<string, unknown>, fallbackDate: string): CashTransaction {
  const kategori = investorKategoriFromJenis(d.jenis);
  const tx: CashTransaction = {
    id,
    tanggal: typeof d.tanggal === 'string' && d.tanggal ? d.tanggal : fallbackDate,
    tipe: kategori === KATEGORI_INVESTOR.masuk ? 'masuk' : 'keluar',
    nominal: Number(d.nominal || 0),
    kategori,
    keterangan: typeof d.keterangan === 'string' && d.keterangan ? d.keterangan : '-',
    koleksi: 'investor',
  };
  if (typeof d.investorNama === 'string' && d.investorNama.trim()) tx.investorNama = d.investorNama.trim();
  if (typeof d.jatuhTempo === 'string' && d.jatuhTempo) tx.jatuhTempo = d.jatuhTempo;
  return tx;
}

const NAMA_TANPA_INVESTOR = 'Investor (tanpa nama)';

export interface InvestorSummary {
  key: string;
  nama: string;
  totalMasuk: number;
  totalKembali: number;
  totalBagiHasil: number;
  sisaKewajiban: number;
  jatuhTempoTerdekat?: string;
  transaksi: CashTransaction[];
}

export function isInvestorInflow(tx: Pick<CashTransaction, 'tipe' | 'kategori'>): boolean {
  return tx.tipe === 'masuk' && tx.kategori === KATEGORI_INVESTOR.masuk;
}

export function isInvestorRepayment(tx: Pick<CashTransaction, 'tipe' | 'kategori'>): boolean {
  return tx.tipe === 'keluar' && tx.kategori === KATEGORI_INVESTOR.pengembalian;
}

export function isInvestorProfitShare(tx: Pick<CashTransaction, 'tipe' | 'kategori'>): boolean {
  return tx.tipe === 'keluar' && tx.kategori === KATEGORI_INVESTOR.bagiHasil;
}

export function isInvestorTransaction(tx: Pick<CashTransaction, 'tipe' | 'kategori'>): boolean {
  return isInvestorInflow(tx) || isInvestorRepayment(tx) || isInvestorProfitShare(tx);
}

export function investorKey(nama: string | undefined | null): string {
  const clean = (nama || '').trim().replace(/\s+/g, ' ');
  return (clean || NAMA_TANPA_INVESTOR).toLowerCase();
}

/** Posisi kewajiban per investor; `until` membatasi transaksi sampai tanggal itu (inklusif). */
export function summarizeInvestors(transactions: ReadonlyArray<CashTransaction>, until?: string | null): InvestorSummary[] {
  const map = new Map<string, InvestorSummary>();

  for (const tx of transactions) {
    if (!isInvestorTransaction(tx)) continue;
    if (until && tx.tanggal > until) continue;

    const key = investorKey(tx.investorNama);
    const current = map.get(key) ?? {
      key,
      nama: (tx.investorNama || '').trim().replace(/\s+/g, ' ') || NAMA_TANPA_INVESTOR,
      totalMasuk: 0,
      totalKembali: 0,
      totalBagiHasil: 0,
      sisaKewajiban: 0,
      transaksi: [],
    };

    const nominal = Number(tx.nominal) || 0;
    if (isInvestorInflow(tx)) {
      current.totalMasuk += nominal;
      if (tx.jatuhTempo && (!current.jatuhTempoTerdekat || tx.jatuhTempo < current.jatuhTempoTerdekat)) {
        current.jatuhTempoTerdekat = tx.jatuhTempo;
      }
    } else if (isInvestorRepayment(tx)) {
      current.totalKembali += nominal;
    } else {
      current.totalBagiHasil += nominal;
    }
    current.sisaKewajiban = current.totalMasuk - current.totalKembali;
    current.transaksi.push(tx);
    map.set(key, current);
  }

  return [...map.values()]
    .map((s) => ({ ...s, transaksi: [...s.transaksi].sort((a, b) => b.tanggal.localeCompare(a.tanggal)) }))
    .sort((a, b) => b.sisaKewajiban - a.sisaKewajiban || a.nama.localeCompare(b.nama));
}

/** Sisa pokok yang boleh dikembalikan; transaksi yang sedang diedit dikeluarkan dari hitungan. */
export function investorRemaining(
  transactions: ReadonlyArray<CashTransaction>,
  nama: string,
  excludeTxId?: string | null
): number {
  const key = investorKey(nama);
  const list = transactions.filter((t) => t.id !== excludeTxId);
  return summarizeInvestors(list).find((s) => s.key === key)?.sisaKewajiban ?? 0;
}

/**
 * Menolak perubahan/hapus dana investor yang membuat pengembalian melebihi dana masuk investor itu.
 * `next = null` berarti transaksi dihapus atau diubah menjadi kas masuk biasa.
 */
export function validateInvestorInflowChange(
  transactions: ReadonlyArray<CashTransaction>,
  txId: string,
  next: { investorNama: string; nominal: number } | null
): string | null {
  const original = transactions.find((t) => t.id === txId);
  if (!original || !isInvestorInflow(original)) return null;

  const simulated = transactions.filter((t) => t.id !== txId);
  if (next) simulated.push({ ...original, investorNama: next.investorNama, nominal: next.nominal });

  const broken = summarizeInvestors(simulated).find((s) => s.sisaKewajiban < 0);
  if (!broken) return null;
  return `Dana ${broken.nama} sudah dikembalikan ${formatRupiah(broken.totalKembali)}. Total dana masuk investor ini tidak boleh lebih kecil dari jumlah tersebut.`;
}

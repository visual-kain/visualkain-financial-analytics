import { describe, it, expect } from 'vitest';
import type { CashTransaction } from '@/types';
import {
  KATEGORI_INVESTOR,
  isInvestorInflow,
  isInvestorRepayment,
  summarizeInvestors,
  investorRemaining,
  validateInvestorInflowChange,
  investorJenisFromKategori,
  investorKategoriFromJenis,
  mapInvestorDoc,
  INVESTOR_COLLECTION,
} from './investor-ledger';

function tx(partial: Partial<CashTransaction> & Pick<CashTransaction, 'id' | 'tanggal' | 'tipe' | 'nominal' | 'kategori'>): CashTransaction {
  return { keterangan: '-', ...partial };
}

const ledger: CashTransaction[] = [
  tx({ id: 'i1', tanggal: '2026-10-02', tipe: 'masuk', nominal: 10_000_000, kategori: KATEGORI_INVESTOR.masuk, investorNama: 'Pak Budi', jatuhTempo: '2027-01-31' }),
  tx({ id: 'i2', tanggal: '2026-10-05', tipe: 'masuk', nominal: 5_000_000, kategori: KATEGORI_INVESTOR.masuk, investorNama: 'pak budi ', jatuhTempo: '2026-12-31' }),
  tx({ id: 'r1', tanggal: '2026-11-01', tipe: 'keluar', nominal: 4_000_000, kategori: KATEGORI_INVESTOR.pengembalian, investorNama: 'Pak Budi' }),
  tx({ id: 'b1', tanggal: '2026-11-01', tipe: 'keluar', nominal: 300_000, kategori: KATEGORI_INVESTOR.bagiHasil, investorNama: 'Pak Budi' }),
  tx({ id: 'i3', tanggal: '2026-10-10', tipe: 'masuk', nominal: 2_000_000, kategori: KATEGORI_INVESTOR.masuk, investorNama: 'Bu Sari' }),
  tx({ id: 'x1', tanggal: '2026-10-03', tipe: 'masuk', nominal: 999, kategori: 'Saldo Awal' }),
];

describe('F-12 investor ledger', () => {
  it('mengenali transaksi dana investor dan pengembalian pokok', () => {
    expect(isInvestorInflow(ledger[0])).toBe(true);
    expect(isInvestorInflow(ledger[5])).toBe(false);
    expect(isInvestorRepayment(ledger[2])).toBe(true);
    expect(isInvestorRepayment(ledger[3])).toBe(false);
  });

  it('mengelompokkan per investor tanpa membedakan huruf besar dan spasi', () => {
    const list = summarizeInvestors(ledger);
    expect(list).toHaveLength(2);
    const budi = list.find((i) => i.key === 'pak budi')!;
    expect(budi.nama).toBe('Pak Budi');
    expect(budi.totalMasuk).toBe(15_000_000);
    expect(budi.totalKembali).toBe(4_000_000);
    expect(budi.totalBagiHasil).toBe(300_000);
    // Bagi hasil adalah beban, bukan pengurang pokok.
    expect(budi.sisaKewajiban).toBe(11_000_000);
    expect(budi.jatuhTempoTerdekat).toBe('2026-12-31');
  });

  it('menghitung posisi kewajiban sampai tanggal tertentu', () => {
    const list = summarizeInvestors(ledger, '2026-10-31');
    const budi = list.find((i) => i.key === 'pak budi')!;
    expect(budi.totalKembali).toBe(0);
    expect(budi.sisaKewajiban).toBe(15_000_000);
  });

  it('mengurutkan investor dengan sisa kewajiban terbesar lebih dulu', () => {
    const list = summarizeInvestors(ledger);
    expect(list.map((i) => i.key)).toEqual(['pak budi', 'bu sari']);
  });

  it('sisa kewajiban untuk validasi form mengabaikan transaksi yang sedang diedit', () => {
    expect(investorRemaining(ledger, 'Pak Budi')).toBe(11_000_000);
    expect(investorRemaining(ledger, 'PAK BUDI', 'r1')).toBe(15_000_000);
    expect(investorRemaining(ledger, 'Tidak Ada')).toBe(0);
  });
});

describe('F-12 guard ubah/hapus dana investor', () => {
  it('menolak menurunkan nominal di bawah total pengembalian', () => {
    // Pak Budi: masuk 15 jt, kembali 4 jt. i2 (5 jt) diturunkan ke 0,5 jt -> masuk 10,5 jt masih aman.
    expect(validateInvestorInflowChange(ledger, 'i2', { investorNama: 'Pak Budi', nominal: 500_000 })).toBeNull();
    // i1 (10 jt) dihapus -> masuk 5 jt >= kembali 4 jt, aman; i1 dan i2 sama-sama dihapus tidak mungkin sekaligus.
    expect(validateInvestorInflowChange(ledger, 'i1', null)).toBeNull();
    const kecil = ledger.filter((t) => t.id !== 'i1');
    expect(validateInvestorInflowChange(kecil, 'i2', { investorNama: 'Pak Budi', nominal: 3_000_000 })).toMatch(/sudah dikembalikan/);
    expect(validateInvestorInflowChange(kecil, 'i2', null)).toMatch(/sudah dikembalikan/);
  });

  it('menolak memindahkan dana ke investor lain bila pengembalian investor lama menjadi yatim', () => {
    const kecil = ledger.filter((t) => t.id !== 'i1');
    expect(validateInvestorInflowChange(kecil, 'i2', { investorNama: 'Bu Sari', nominal: 5_000_000 })).toMatch(/Pak Budi/);
  });

  it('mengabaikan transaksi non-investor', () => {
    expect(validateInvestorInflowChange(ledger, 'x1', null)).toBeNull();
  });
});

describe('F-12 koleksi finance_investor', () => {
  it('memakai koleksi terpisah dari kas', () => {
    expect(INVESTOR_COLLECTION).toBe('finance_investor');
  });

  it('memetakan kategori ke jenis dokumen dan sebaliknya', () => {
    expect(investorJenisFromKategori(KATEGORI_INVESTOR.masuk)).toBe('masuk');
    expect(investorJenisFromKategori(KATEGORI_INVESTOR.pengembalian)).toBe('pengembalian');
    expect(investorJenisFromKategori(KATEGORI_INVESTOR.bagiHasil)).toBe('bagiHasil');
    expect(investorJenisFromKategori('Operasional')).toBeNull();
    expect(investorKategoriFromJenis('pengembalian')).toBe(KATEGORI_INVESTOR.pengembalian);
    expect(investorKategoriFromJenis('bagiHasil')).toBe(KATEGORI_INVESTOR.bagiHasil);
    expect(investorKategoriFromJenis(undefined)).toBe(KATEGORI_INVESTOR.masuk);
  });

  it('memetakan dokumen menjadi CashTransaction dengan tipe sesuai jenis', () => {
    const masuk = mapInvestorDoc('d1', { jenis: 'masuk', tanggal: '2026-10-05', nominal: 5_000_000, investorNama: ' Pak Budi ', jatuhTempo: '2027-01-31', keterangan: 'Transfer BCA' }, '2026-10-14');
    expect(masuk).toMatchObject({ id: 'd1', tipe: 'masuk', kategori: KATEGORI_INVESTOR.masuk, nominal: 5_000_000, investorNama: 'Pak Budi', jatuhTempo: '2027-01-31', koleksi: 'investor' });

    const kembali = mapInvestorDoc('d2', { jenis: 'pengembalian', nominal: '1000000' }, '2026-10-14');
    expect(kembali).toMatchObject({ tipe: 'keluar', kategori: KATEGORI_INVESTOR.pengembalian, nominal: 1_000_000, tanggal: '2026-10-14', keterangan: '-' });
    expect(kembali.investorNama).toBeUndefined();

    expect(mapInvestorDoc('d3', { jenis: 'bagiHasil', nominal: 1 }, 'x').kategori).toBe(KATEGORI_INVESTOR.bagiHasil);
  });
});

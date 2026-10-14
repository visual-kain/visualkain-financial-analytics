import { describe, it, expect } from 'vitest';
import {
  DEFAULT_REKENING,
  mergeRekening,
  rekeningLabel,
  rekeningDocId,
  validateRekeningInput,
  toAccountOptions,
} from './rekening-master';

describe('F-12 master rekening', () => {
  it('default mempertahankan kode lama sebagai prefix keterangan', () => {
    const kodes = DEFAULT_REKENING.map((r) => r.kode);
    expect(kodes).toContain('Transfer BCA');
    expect(kodes).toContain('Tunai / Cash');
    expect(rekeningLabel(DEFAULT_REKENING[0])).toBe('Bank BCA (8830-1928-41)');
  });

  it('override dokumen mengganti nomor rekening default tanpa mengubah kode', () => {
    const merged = mergeRekening(DEFAULT_REKENING, [
      { kode: 'Transfer BCA', namaBank: 'Bank BCA', nomor: '123-456-789', atasNama: 'Glora Sawita' },
    ]);
    const bca = merged.find((r) => r.kode === 'Transfer BCA')!;
    expect(bca.nomor).toBe('123-456-789');
    expect(bca.atasNama).toBe('Glora Sawita');
    expect(bca.isDefault).toBe(true);
    expect(merged).toHaveLength(DEFAULT_REKENING.length);
  });

  it('rekening baru ditambahkan setelah default', () => {
    const merged = mergeRekening(DEFAULT_REKENING, [{ kode: 'Bank Jago', namaBank: 'Bank Jago', nomor: '1000', atasNama: '' }]);
    expect(merged[merged.length - 1]).toMatchObject({ kode: 'Bank Jago', isDefault: false });
    expect(toAccountOptions(merged).at(-1)).toEqual({ value: 'Bank Jago', label: 'Bank Jago (1000)', badge: undefined });
  });

  it('doc id aman untuk Firestore', () => {
    expect(rekeningDocId('Tunai / Cash')).toBe('tunai-cash');
    expect(rekeningDocId('Transfer BCA')).toBe('transfer-bca');
  });

  it('validasi menolak nama kosong dan nama yang bentrok dengan rekening lain', () => {
    expect(validateRekeningInput({ namaBank: ' ', nomor: '', atasNama: '' }, DEFAULT_REKENING)).toMatch(/wajib/);
    expect(validateRekeningInput({ namaBank: 'bank bca', nomor: '', atasNama: '' }, DEFAULT_REKENING)).toMatch(/sudah ada/);
    expect(validateRekeningInput({ namaBank: 'Bank Jago', nomor: '', atasNama: '' }, DEFAULT_REKENING)).toBeNull();
    // Slug bentrok dengan doc id rekening default ("transfer-bca") atau slug kosong.
    expect(validateRekeningInput({ namaBank: 'Transfer-BCA', nomor: '', atasNama: '' }, DEFAULT_REKENING)).toMatch(/sudah ada/);
    expect(validateRekeningInput({ namaBank: '***', nomor: '', atasNama: '' }, DEFAULT_REKENING)).toMatch(/huruf atau angka/);
    // Mengedit rekening sendiri dengan nama yang sama boleh.
    expect(validateRekeningInput({ namaBank: 'Bank BCA', nomor: '9', atasNama: '' }, DEFAULT_REKENING, 'Transfer BCA')).toBeNull();
  });
});

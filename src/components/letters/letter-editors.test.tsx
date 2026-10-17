import { describe, it, expect, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { normalizeKerjasamaDoc, normalizePenawaranDoc } from '@/lib/letters';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  createKerjasama: vi.fn(),
  updateKerjasama: vi.fn(),
  deleteKerjasama: vi.fn(),
  createPenawaran: vi.fn(),
  updatePenawaran: vi.fn(),
  deletePenawaran: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace, push: vi.fn() }), usePathname: () => '/kerjasama' }));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ profile: { name: 'Raja', email: 'raja@visualkain.id' } }),
}));
vi.mock('@/lib/firestore/letters-repo', () => ({
  createKerjasama: mocks.createKerjasama,
  updateKerjasama: mocks.updateKerjasama,
  deleteKerjasama: mocks.deleteKerjasama,
  createPenawaran: mocks.createPenawaran,
  updatePenawaran: mocks.updatePenawaran,
  deletePenawaran: mocks.deletePenawaran,
}));

import { KerjasamaEditor } from './KerjasamaEditor';
import { PenawaranEditor } from './PenawaranEditor';

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

beforeEach(() => {
  window.print = vi.fn();
  mocks.createKerjasama.mockResolvedValue({ id: 'ks-1', nomor: 'SK-VK-2026-001' });
  mocks.updateKerjasama.mockResolvedValue(undefined);
  mocks.deleteKerjasama.mockResolvedValue(undefined);
  mocks.createPenawaran.mockResolvedValue({ id: 'ph-1', nomor: 'PH-VK-2026-001' });
  mocks.updatePenawaran.mockResolvedValue(undefined);
  mocks.deletePenawaran.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const savedKerjasama = normalizeKerjasamaDoc('ks-9', {
  noSurat: 'SK-VK-2026-009',
  tahun: 2026,
  urut: 9,
  tanggal: '2026-10-10',
  lampiran: 'Profil',
  perihal: 'Pengajuan Kerjasama',
  kepadaNama: 'PT Satu',
  kepadaJabatan: 'HRD',
  kepadaAlamat: 'Jl. A',
  kepadaTempat: 'Di Tempat',
  paragrafPembuka: 'Pembuka',
  paragrafProfil: 'Profil',
  paragrafKeunggulan: 'Unggul',
  paragrafPenutup: 'Penutup',
  createdBy: 'Raja',
});

function fillKerjasama() {
  fireEvent.change(screen.getByLabelText('Perihal'), { target: { value: 'Pengajuan Seragam' } });
  fireEvent.change(screen.getByLabelText('Nama Perusahaan / Brand'), { target: { value: 'PT Maju' } });
}

const saveButtons = () => screen.getAllByRole('button', { name: /^Simpan$/ });

describe('KerjasamaEditor, surat baru', () => {
  it('menampilkan nomor otomatis, menonaktifkan Cetak, dan tidak menyediakan Hapus', () => {
    render(<KerjasamaEditor />);
    expect((screen.getByLabelText('No. Surat') as HTMLInputElement).value).toBe('Otomatis saat disimpan');
    expect((screen.getByRole('button', { name: 'Cetak' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Hapus' })).toBeNull();
    expect(screen.getAllByText('Belum disimpan').length).toBeGreaterThan(0);
  });

  it('menolak simpan tanpa perihal dan perusahaan, tidak memesan nomor', () => {
    render(<KerjasamaEditor />);
    fireEvent.click(saveButtons()[0]);
    expect(screen.getByRole('alert').textContent).toContain('Isi perihal surat sebelum menyimpan.');
    expect(mocks.createKerjasama).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith('Isi perihal surat sebelum menyimpan.');
  });

  it('simpan pertama membuat dokumen dengan pembuat dari profil, menampilkan nomor, dan pindah ke /kerjasama/[id]', async () => {
    render(<KerjasamaEditor />);
    fillKerjasama();
    fireEvent.click(saveButtons()[0]);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/kerjasama/ks-1'));
    expect(mocks.createKerjasama).toHaveBeenCalledTimes(1);
    const [form, author] = mocks.createKerjasama.mock.calls[0];
    expect(form).toMatchObject({ perihal: 'Pengajuan Seragam', perusahaan: 'PT Maju' });
    expect(author).toEqual({ name: 'Raja', email: 'raja@visualkain.id' });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Surat tersimpan dengan nomor SK-VK-2026-001');
    expect((screen.getByLabelText('No. Surat') as HTMLInputElement).value).toBe('SK-VK-2026-001');
    expect((screen.getByRole('button', { name: 'Cetak' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('klik ganda pada Simpan hanya memesan satu nomor', async () => {
    let resolveCreate: (value: { id: string; nomor: string }) => void = () => {};
    mocks.createKerjasama.mockReturnValue(new Promise((resolve) => (resolveCreate = resolve)));
    render(<KerjasamaEditor />);
    fillKerjasama();
    const [header, bottom] = saveButtons();
    fireEvent.click(header);
    fireEvent.click(header);
    fireEvent.click(bottom);
    expect(mocks.createKerjasama).toHaveBeenCalledTimes(1);
    resolveCreate({ id: 'ks-1', nomor: 'SK-VK-2026-001' });
    await waitFor(() => expect(mocks.replace).toHaveBeenCalled());
  });

  it('gagal menyimpan menampilkan galat berbahasa Indonesia dan nomor tetap kosong', async () => {
    mocks.createKerjasama.mockRejectedValue(new Error('network'));
    render(<KerjasamaEditor />);
    fillKerjasama();
    fireEvent.click(saveButtons()[0]);
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('Surat belum tersimpan. Periksa koneksi internet lalu coba lagi.'));
    expect((screen.getByLabelText('No. Surat') as HTMLInputElement).value).toBe('Otomatis saat disimpan');
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

describe('KerjasamaEditor, surat tersimpan', () => {
  it('simpan berikutnya hanya memperbarui dokumen dan tidak mengubah nomor', async () => {
    render(<KerjasamaEditor doc={savedKerjasama} />);
    expect((screen.getByLabelText('No. Surat') as HTMLInputElement).value).toBe('SK-VK-2026-009');
    fireEvent.change(screen.getByLabelText('Perihal'), { target: { value: 'Perihal baru' } });
    fireEvent.click(saveButtons()[0]);

    await waitFor(() => expect(mocks.updateKerjasama).toHaveBeenCalledTimes(1));
    expect(mocks.updateKerjasama.mock.calls[0][0]).toBe('ks-9');
    expect(mocks.updateKerjasama.mock.calls[0][1]).toMatchObject({ perihal: 'Perihal baru', noSurat: 'SK-VK-2026-009' });
    expect(mocks.createKerjasama).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect((screen.getByLabelText('No. Surat') as HTMLInputElement).value).toBe('SK-VK-2026-009');
  });

  it('mengubah tanggal ke tahun lain tidak mengubah nomor', async () => {
    render(<KerjasamaEditor doc={savedKerjasama} />);
    fireEvent.change(screen.getByLabelText('Tanggal'), { target: { value: '2027-01-02' } });
    fireEvent.click(saveButtons()[0]);
    await waitFor(() => expect(mocks.updateKerjasama).toHaveBeenCalled());
    expect((screen.getByLabelText('No. Surat') as HTMLInputElement).value).toBe('SK-VK-2026-009');
  });

  it('Cetak memanggil window.print dan kertas cetak dirender di luar pratinjau', () => {
    render(<KerjasamaEditor doc={savedKerjasama} />);
    expect(document.querySelectorAll('#ksPaper')).toHaveLength(2);
    expect(document.body.querySelector(':scope > .vk-print-root #ksPaper')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cetak' }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('Hapus meminta konfirmasi, menghapus dokumen, dan kembali ke daftar', async () => {
    render(<KerjasamaEditor doc={savedKerjasama} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('SK-VK-2026-009');
    expect(dialog.textContent).toContain('PT Satu');
    expect(mocks.deleteKerjasama).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ya, hapus surat' }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/kerjasama'));
    expect(mocks.deleteKerjasama).toHaveBeenCalledWith('ks-9');
  });
});

describe('PenawaranEditor', () => {
  const savedPenawaran = normalizePenawaranDoc('ph-9', {
    noPenawaran: 'PH-VK-2026-009',
    tahun: 2026,
    urut: 9,
    tanggal: '2026-10-10',
    perihal: 'Seragam',
    namaPerusahaan: 'PT Dua',
    items: [{ desc: 'Kaos', qty: 2, satuan: 'pcs', harga: 1000, jumlah: 2000 }],
  });

  it('dimulai dengan 3 baris item dan nomor otomatis', () => {
    render(<PenawaranEditor />);
    expect((screen.getByLabelText('No. Penawaran') as HTMLInputElement).value).toBe('Otomatis saat disimpan');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect((screen.getByRole('button', { name: 'Cetak' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('simpan pertama mengirim item dengan jumlah terhitung lalu pindah ke /penawaran/[id]', async () => {
    render(<PenawaranEditor />);
    fireEvent.change(screen.getByLabelText('Perihal'), { target: { value: 'Seragam Kantor' } });
    fireEvent.change(screen.getByLabelText('Nama Perusahaan'), { target: { value: 'PT Maju' } });
    fireEvent.change(screen.getAllByLabelText('Qty')[0], { target: { value: '5' } });
    fireEvent.click(saveButtons()[0]);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/penawaran/ph-1'));
    expect(mocks.createPenawaran).toHaveBeenCalledTimes(1);
    const [form, items, author] = mocks.createPenawaran.mock.calls[0];
    expect(form).toMatchObject({ perihal: 'Seragam Kantor', perusahaan: 'PT Maju' });
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ qty: 5, harga: 0, jumlah: 0 });
    expect(author).toEqual({ name: 'Raja', email: 'raja@visualkain.id' });
  });

  it('baris tersisa satu tidak bisa dihapus dan penawaran tersimpan hanya diperbarui', async () => {
    render(<PenawaranEditor doc={savedPenawaran} />);
    expect((screen.getByRole('button', { name: 'Hapus baris 1' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Perihal'), { target: { value: 'Seragam baru' } });
    fireEvent.click(saveButtons()[0]);
    await waitFor(() => expect(mocks.updatePenawaran).toHaveBeenCalledTimes(1));
    expect(mocks.updatePenawaran.mock.calls[0][0]).toBe('ph-9');
    expect(mocks.createPenawaran).not.toHaveBeenCalled();
    expect((screen.getByLabelText('No. Penawaran') as HTMLInputElement).value).toBe('PH-VK-2026-009');
  });
});

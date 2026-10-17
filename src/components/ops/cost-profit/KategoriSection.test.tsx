import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { KategoriSection } from './KategoriSection';
import type { BahanDoc } from '@/lib/cost-profit';

const deleteKategori = vi.fn(async () => undefined);
const addKategori = vi.fn(async () => 'new-id');

vi.mock('@/lib/firestore/cost-profit-repo', () => ({ deleteKategori: (...args: unknown[]) => deleteKategori(...(args as [])) }));
vi.mock('@/lib/firestore/master-repo', () => ({ addKategori: (...args: unknown[]) => addKategori(...(args as [])) }));

afterEach(() => {
  cleanup();
  deleteKategori.mockClear();
  addKategori.mockClear();
});

const kategori = [
  { id: 'k1', nama: 'Kaos' },
  { id: 'k2', nama: 'Kosong' },
];
const bahan: BahanDoc[] = [{ id: 'b1', kategoriId: 'k1', nama: 'Cotton Combed 30s', harga: 35000 }];

function setup() {
  return render(<KategoriSection kategoriList={kategori} bahanList={bahan} loading={false} />);
}

describe('KategoriSection', () => {
  it('menghapus kategori yang masih dipakai bahan diblokir tanpa tombol konfirmasi', () => {
    setup();
    fireEvent.click(screen.getByLabelText('Hapus kategori Kaos'));
    expect(screen.getByText(/masih dipakai 1 bahan/)).toBeTruthy();
    expect(screen.queryByText('Hapus', { selector: 'button' })).toBeNull();
    expect(deleteKategori).not.toHaveBeenCalled();
  });

  it('kategori tanpa bahan bisa dihapus setelah konfirmasi', async () => {
    setup();
    fireEvent.click(screen.getByLabelText('Hapus kategori Kosong'));
    fireEvent.click(screen.getByText('Hapus', { selector: 'button' }));
    await waitFor(() => expect(deleteKategori).toHaveBeenCalledWith('k2'));
  });

  it('menambah kategori memangkas spasi dan memanggil addKategori', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('Nama kategori baru'), { target: { value: '  Polo  ' } });
    fireEvent.click(screen.getByText('Tambah'));
    await waitFor(() => expect(addKategori).toHaveBeenCalledWith('Polo'));
  });

  it('nama kategori yang sudah ada ditolak tanpa menulis ke Firestore', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Nama kategori baru'), { target: { value: 'kaos' } });
    fireEvent.click(screen.getByText('Tambah'));
    expect(screen.getByRole('alert').textContent).toContain('sudah ada');
    expect(addKategori).not.toHaveBeenCalled();
  });
});

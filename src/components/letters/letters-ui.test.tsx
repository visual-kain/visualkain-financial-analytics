import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { defaultPenawaranForm, defaultPenawaranItems, type LetterRow } from '@/lib/letters';
import { LetterListView } from './LetterListView';
import { PenawaranForm } from './PenawaranForm';

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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const rows: LetterRow[] = [
  { id: 'a', nomor: 'SK-VK-2026-002', tanggal: '2026-10-05', perihal: 'Pengajuan Seragam', perusahaan: 'PT Maju Jaya', createdBy: 'Raja', tahun: 2026, urut: 2 },
  { id: 'b', nomor: 'SK-VK-2026-001', tanggal: '2026-09-01', perihal: 'Kerjasama Kaos', perusahaan: 'CV Sinar', createdBy: '', tahun: 2026, urut: 1 },
  { id: 'c', nomor: 'SK-VK-2025-010', tanggal: '2025-12-20', perihal: 'Pengajuan Jaket', perusahaan: 'PT Maju Jaya', createdBy: 'Budi', tahun: 2025, urut: 10 },
];

function renderList(overrides: Partial<React.ComponentProps<typeof LetterListView>> = {}) {
  const props: React.ComponentProps<typeof LetterListView> = {
    title: 'Pengajuan Kerjasama',
    subtitle: 'Subjudul',
    icon: null,
    noun: 'surat',
    numberLabel: 'No. Surat',
    basePath: '/kerjasama',
    newLabel: 'Surat Baru',
    rows,
    state: 'ready',
    onRetry: vi.fn(),
    onDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { props, ...render(<LetterListView {...props} />) };
}

describe('LetterListView', () => {
  it('menampilkan baris terbaru dulu pada tabel desktop dengan kolom sesuai spesifikasi', () => {
    renderList();
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['No. Surat', 'Tanggal', 'Perihal', 'Perusahaan', 'Dibuat oleh', 'Aksi']);
    const bodyRows = within(table).getAllByRole('row').slice(1);
    expect(bodyRows.map((r) => within(r).getAllByRole('cell')[0].textContent)).toEqual(['SK-VK-2026-002', 'SK-VK-2026-001', 'SK-VK-2025-010']);
  });

  it('menyediakan kartu untuk HP dengan tautan ke editor', () => {
    renderList();
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href') === '/kerjasama/b');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('pencarian menyaring baris', () => {
    renderList();
    fireEvent.change(screen.getByLabelText('Cari surat'), { target: { value: 'kaos' } });
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row').slice(1)).toHaveLength(1);
    expect(screen.getByText('1 dari 3 surat')).toBeTruthy();
  });

  it('menampilkan keadaan kosong saat tidak ada yang cocok dan reset filter memulihkan daftar', () => {
    renderList();
    fireEvent.change(screen.getByLabelText('Cari surat'), { target: { value: 'tidak-ada' } });
    expect(screen.getByText('Tidak ada surat yang cocok')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filter' }));
    expect(screen.getAllByText('SK-VK-2026-002').length).toBeGreaterThan(0);
  });

  it('menampilkan keadaan kosong bila belum ada dokumen', () => {
    renderList({ rows: [] });
    expect(screen.getByText('Belum ada surat')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /Surat Baru/ }).length).toBeGreaterThan(0);
  });

  it('menampilkan galat dalam bahasa Indonesia dan tombol coba lagi', () => {
    const { props } = renderList({ state: 'error', rows: [] });
    expect(screen.getByRole('alert').textContent).toContain('Daftar surat gagal dimuat.');
    fireEvent.click(screen.getByRole('button', { name: /Coba lagi/ }));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it('menampilkan skeleton saat memuat', () => {
    renderList({ state: 'loading', rows: [] });
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('hapus meminta konfirmasi yang menyebut nomor dan perusahaan, lalu memanggil onDelete', async () => {
    const { props } = renderList();
    fireEvent.click(screen.getAllByRole('button', { name: 'Hapus surat SK-VK-2026-001' })[0]);
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('SK-VK-2026-001');
    expect(dialog.textContent).toContain('CV Sinar');
    expect(props.onDelete).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ya, hapus surat' }));
    await waitFor(() => expect(props.onDelete).toHaveBeenCalledWith(rows[1]));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('PenawaranForm', () => {
  const noop = () => {};

  function renderForm(items = defaultPenawaranItems(), handlers: Partial<React.ComponentProps<typeof PenawaranForm>> = {}) {
    return render(
      <PenawaranForm
        form={defaultPenawaranForm(new Date(2026, 9, 17))}
        items={items}
        onChange={noop}
        onAddItem={noop}
        onRemoveItem={noop}
        onUpdateItem={noop}
        {...handlers}
      />
    );
  }

  it('menampilkan nomor otomatis sebelum disimpan', () => {
    renderForm();
    expect((screen.getByLabelText('No. Penawaran') as HTMLInputElement).value).toBe('Otomatis saat disimpan');
    expect((screen.getByLabelText('No. Penawaran') as HTMLInputElement).readOnly).toBe(true);
  });

  it('di lebar sempit memakai kartu bertumpuk tanpa header tabel', () => {
    renderForm();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getAllByLabelText('Qty')).toHaveLength(3);
  });

  it('di lebar lega memakai tabel dengan header lengkap', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 800 } as DOMRect);
    renderForm();
    const headers = within(screen.getByRole('table')).getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['No', 'Deskripsi', 'Qty', 'Satuan', 'Harga Satuan', 'Jumlah', 'Hapus']);
  });

  it('tombol hapus baris dinonaktifkan saat tinggal satu baris', () => {
    renderForm([{ no: 1, desc: '', qty: 0, satuan: 'pcs', harga: 0, jumlah: 0 }]);
    const remove = screen.getByRole('button', { name: 'Hapus baris 1' }) as HTMLButtonElement;
    expect(remove.disabled).toBe(true);
    expect(remove.title).toBe('Minimal satu baris');
  });

  it('tombol hapus aktif dan memanggil handler saat ada lebih dari satu baris', () => {
    const onRemoveItem = vi.fn();
    renderForm(defaultPenawaranItems(), { onRemoveItem });
    const remove = screen.getByRole('button', { name: 'Hapus baris 2' }) as HTMLButtonElement;
    expect(remove.disabled).toBe(false);
    fireEvent.click(remove);
    expect(onRemoveItem).toHaveBeenCalledWith(1);
  });

  it('Tambah baris memanggil handler dan jumlah ditampilkan sebagai Rupiah', () => {
    const onAddItem = vi.fn();
    renderForm([{ no: 1, desc: 'Kaos', qty: 10, satuan: 'pcs', harga: 90000, jumlah: 900000 }], { onAddItem });
    fireEvent.click(screen.getByRole('button', { name: /Tambah baris/ }));
    expect(onAddItem).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Rp 900.000')).toBeTruthy();
  });

  it('mengubah qty memanggil onUpdateItem dengan angka', () => {
    const onUpdateItem = vi.fn();
    renderForm(defaultPenawaranItems(), { onUpdateItem });
    fireEvent.change(screen.getAllByLabelText('Qty')[0], { target: { value: '12' } });
    expect(onUpdateItem).toHaveBeenCalledWith(0, 'qty', 12);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { OpsDataFixtureProvider } from '@/context/OpsDataContext';
import VendorPage from '@/app/(ops)/vendor/page';
import type { LegacyOrder, VendorDoc } from '@/lib/legacy/types';

vi.mock('@/lib/firebase', () => ({ db: {} }));

const repo = vi.hoisted(() => ({
  createVendor: vi.fn(async () => 'new-id'),
  updateVendor: vi.fn(async () => undefined),
  deleteVendor: vi.fn(async () => undefined),
}));

vi.mock('@/lib/firestore/vendors-repo', () => ({
  ...repo,
  VendorInUseError: class VendorInUseError extends Error {},
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const vendors: VendorDoc[] = [
  { id: 'v1', nama: 'CV Maju Jaya', alamat: 'Bandung', wa: '081234567890', pic: 'Pak Andi' },
  { id: 'v2', nama: 'Konveksi Cepat', alamat: 'Cimahi', wa: '', pic: 'Bu Sari' },
];

const orders = ['a', 'b', 'c'].map((id) => ({ id, noInv: `VK26${id}`, namaCustomer: 'Budi', status: 'production', vendorId: 'v1' }) as LegacyOrder);

function renderPage(data = { orders, sizeCharts: [], kategoriList: [], vendors }) {
  return render(
    <OpsDataFixtureProvider data={data}>
      <VendorPage />
    </OpsDataFixtureProvider>
  );
}

// Tabel desktop dan kartu HP sama-sama ada di DOM (CSS yang menyembunyikan salah satunya), jadi ambil yang pertama.
const first = (name: string) => screen.getAllByRole('button', { name })[0];

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('VendorPage', () => {
  it('filters the list by search and offers a reset when nothing matches', () => {
    renderPage();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Cari vendor' }), { target: { value: 'bu sari' } });
    expect(screen.getAllByText('Konveksi Cepat').length).toBeGreaterThan(0);
    expect(screen.queryByText('CV Maju Jaya')).toBeNull();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Cari vendor' }), { target: { value: 'zzz' } });
    expect(screen.getAllByText('Tidak ada vendor yang cocok').length).toBeGreaterThan(0);
  });

  it('blocks deleting a vendor that orders still use and says how many', () => {
    renderPage();
    fireEvent.click(first('Hapus CV Maju Jaya'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/3 order masih memakai vendor ini/)).toBeTruthy();
    expect(within(dialog).queryByRole('button', { name: 'Hapus vendor' })).toBeNull();
    expect(repo.deleteVendor).not.toHaveBeenCalled();
  });

  it('deletes an unused vendor after confirmation', async () => {
    renderPage();
    fireEvent.click(first('Hapus Konveksi Cepat'));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Hapus vendor' }));
    await waitFor(() => expect(repo.deleteVendor).toHaveBeenCalledWith('v2'));
  });

  it('rejects a duplicate name case-insensitively without writing', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: /Tambah Vendor/ })[0]);
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Nama Vendor/), { target: { value: '  konveksi   CEPAT ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan Vendor' }));
    expect((await within(dialog).findByRole('alert')).textContent).toContain('sudah terdaftar');
    expect(repo.createVendor).not.toHaveBeenCalled();
  });

  it('creates a vendor with trimmed values', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: /Tambah Vendor/ })[0]);
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Nama Vendor/), { target: { value: ' Garmen Baru ' } });
    fireEvent.change(within(dialog).getByLabelText('Alamat'), { target: { value: ' Bogor ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan Vendor' }));
    await waitFor(() => expect(repo.createVendor).toHaveBeenCalledWith({ nama: 'Garmen Baru', alamat: 'Bogor', wa: '', pic: '' }));
  });

  it('edits a vendor and lets it keep its own name', async () => {
    renderPage();
    fireEvent.click(first('Edit CV Maju Jaya'));
    const dialog = screen.getByRole('dialog');
    expect((within(dialog).getByLabelText(/Nama Vendor/) as HTMLInputElement).value).toBe('CV Maju Jaya');
    fireEvent.change(within(dialog).getByLabelText(/PIC/), { target: { value: 'Pak Budi' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan Vendor' }));
    await waitFor(() =>
      expect(repo.updateVendor).toHaveBeenCalledWith('v1', { nama: 'CV Maju Jaya', alamat: 'Bandung', wa: '081234567890', pic: 'Pak Budi' })
    );
  });

  it('shows the empty state with an add button when there are no vendors', () => {
    renderPage({ orders: [], sizeCharts: [], kategoriList: [], vendors: [] });
    expect(screen.getAllByText('Belum ada vendor').length).toBeGreaterThan(0);
  });
});

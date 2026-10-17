import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ProfitCalculator } from './ProfitCalculator';
import type { BahanDoc, MarkupDoc } from '@/lib/cost-profit';

// Radix Select membutuhkan API pointer yang tidak ada di jsdom; versi native cukup untuk menguji alur data.
vi.mock('@/components/ui/custom-select', () => ({
  CustomSelect: ({ value, onValueChange, options, placeholder }: { value: string; onValueChange: (v: string) => void; options: Array<{ value: string; label: string }>; placeholder?: string }) => (
    <select aria-label={placeholder} value={value} onChange={(e) => onValueChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

afterEach(cleanup);

const kategori = [
  { id: 'k1', nama: 'Kaos' },
  { id: 'k2', nama: 'Jaket' },
];
const bahan: BahanDoc[] = [
  { id: 'b1', kategoriId: 'k1', nama: 'Cotton Combed 30s', harga: 35000 },
  { id: 'b2', kategoriId: 'k2', nama: 'Fleece', harga: 60000 },
];
const markup: MarkupDoc[] = [
  { id: 'm1', qtyMin: 1, qtyMax: 12, persen: 40 },
  { id: 'm2', qtyMin: 13, qtyMax: 48, persen: 30 },
];

function setup(overrides: Partial<React.ComponentProps<typeof ProfitCalculator>> = {}) {
  return render(<ProfitCalculator kategoriList={kategori} bahanList={bahan} markupList={markup} loading={false} onOpenDatabase={() => undefined} {...overrides} />);
}

function pick(kategoriName: string, bahanLabel: string) {
  fireEvent.change(screen.getByLabelText('Pilih kategori'), { target: { value: kategori.find((k) => k.nama === kategoriName)!.id } });
  fireEvent.change(screen.getByLabelText('Pilih bahan'), { target: { value: bahan.find((b) => b.nama === bahanLabel)!.id } });
}

describe('ProfitCalculator', () => {
  it('Qty awal 12 dan pilihan bahan dikunci sampai kategori dipilih', () => {
    setup();
    expect((screen.getByLabelText(/Qty/) as HTMLInputElement).value).toBe('12');
    expect(screen.getByLabelText('Pilih kategori dulu').matches(':disabled')).toBe(true);
  });

  it('menampilkan hasil sesuai rumus legacy untuk bahan, qty, dan aturan terpilih', () => {
    setup();
    pick('Kaos', 'Cotton Combed 30s');
    expect((screen.getByLabelText('Harga Modal / Pcs') as HTMLInputElement).value).toBe('Rp 35.000');
    expect(screen.getByText('+40%')).toBeTruthy();
    expect(screen.getByText('Qty 1 – 12 pcs')).toBeTruthy();
    expect(screen.getByText('Rp 49.000')).toBeTruthy();
    expect(screen.getByText('Rp 420.000')).toBeTruthy();
    expect(screen.getByText('Rp 588.000')).toBeTruthy();
    expect(screen.getByText('Rp 168.000')).toBeTruthy();
  });

  it('hanya menawarkan bahan dari kategori terpilih dan mereset bahan saat kategori berganti', () => {
    setup();
    pick('Kaos', 'Cotton Combed 30s');
    const bahanSelect = screen.getByLabelText('Pilih bahan');
    expect(within(bahanSelect).queryByText('Fleece')).toBeNull();

    fireEvent.change(screen.getByLabelText('Pilih kategori'), { target: { value: 'k2' } });
    expect((screen.getByLabelText('Pilih bahan') as HTMLSelectElement).value).toBe('');
    expect(within(screen.getByLabelText('Pilih bahan')).getByText('Fleece')).toBeTruthy();
  });

  it('qty di luar semua rentang memakai +0% dengan keterangan tidak ada aturan', () => {
    setup();
    pick('Jaket', 'Fleece');
    fireEvent.change(screen.getByLabelText(/Qty/), { target: { value: '500' } });
    expect(screen.getByText('Tidak ada aturan, +0%')).toBeTruthy();
    expect(screen.getAllByText('Rp 30.000.000').length).toBe(2);
    expect(screen.getByText('Rp 0')).toBeTruthy();
  });

  it('aturan pertama yang cocok berganti mengikuti qty', () => {
    setup();
    pick('Kaos', 'Cotton Combed 30s');
    fireEvent.change(screen.getByLabelText(/Qty/), { target: { value: '24' } });
    expect(screen.getByText('+30%')).toBeTruthy();
    expect(screen.getByText('Qty 13 – 48 pcs')).toBeTruthy();
  });

  it('qty kosong atau di bawah 1 menampilkan pesan dan hasil nol', () => {
    setup();
    pick('Kaos', 'Cotton Combed 30s');
    fireEvent.change(screen.getByLabelText(/Qty/), { target: { value: '0' } });
    expect(screen.getByText('Qty minimal 1 pcs')).toBeTruthy();
    expect(screen.queryByText('+40%')).toBeNull();
  });

  it('data bahan kosong menampilkan empty state dengan jalan ke tab database', () => {
    const open = vi.fn();
    setup({ bahanList: [], onOpenDatabase: open });
    fireEvent.click(screen.getByText(/Buka Database Bahan & Aturan/));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('memuat data menampilkan skeleton, bukan form', () => {
    setup({ loading: true });
    expect(screen.getByLabelText('Memuat kalkulator')).toBeTruthy();
    expect(screen.queryByText('Kalkulator Estimasi Profit')).toBeNull();
  });
});

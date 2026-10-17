import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MarkupDialog } from './MarkupDialog';
import type { MarkupDoc } from '@/lib/cost-profit';

const addMarkup = vi.fn(async () => 'new-id');
const updateMarkup = vi.fn(async () => undefined);

vi.mock('@/lib/firestore/cost-profit-repo', () => ({
  addMarkup: (...args: unknown[]) => addMarkup(...(args as [])),
  updateMarkup: (...args: unknown[]) => updateMarkup(...(args as [])),
}));

afterEach(() => {
  cleanup();
  addMarkup.mockClear();
  updateMarkup.mockClear();
});

const rules: MarkupDoc[] = [{ id: 'm1', qtyMin: 1, qtyMax: 12, persen: 40 }];

function setup(rule: MarkupDoc | null = null) {
  const onClose = vi.fn();
  render(<MarkupDialog open rule={rule} rules={rules} onClose={onClose} />);
  return onClose;
}

describe('MarkupDialog', () => {
  it('tambah aturan memakai default 1 / 12 / 40', () => {
    setup();
    expect((screen.getByLabelText('Qty Min (Dari)') as HTMLInputElement).value).toBe('1');
    expect((screen.getByLabelText('Qty Max (Sampai)') as HTMLInputElement).value).toBe('12');
    expect((screen.getByLabelText('Persentase Markup (%)') as HTMLInputElement).value).toBe('40');
  });

  it('rentang yang tumpang tindih hanya memberi peringatan dan tetap bisa disimpan', async () => {
    const onClose = setup();
    expect(screen.getByText('Rentang ini tumpang tindih dengan aturan lain')).toBeTruthy();
    fireEvent.click(screen.getByText('Simpan Aturan'));
    await waitFor(() => expect(addMarkup).toHaveBeenCalledWith({ qtyMin: 1, qtyMax: 12, persen: 40 }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('Qty Min yang tidak lebih kecil dari Qty Max memblokir simpan', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Qty Min (Dari)'), { target: { value: '12' } });
    fireEvent.click(screen.getByText('Simpan Aturan'));
    expect(screen.getByText('Qty Min harus lebih kecil dari Qty Max')).toBeTruthy();
    expect(addMarkup).not.toHaveBeenCalled();
  });

  it('edit tidak menganggap aturan itu sendiri sebagai tumpang tindih dan memanggil update', async () => {
    setup(rules[0]);
    expect(screen.queryByText('Rentang ini tumpang tindih dengan aturan lain')).toBeNull();
    fireEvent.change(screen.getByLabelText('Persentase Markup (%)'), { target: { value: '45' } });
    fireEvent.click(screen.getByText('Simpan Aturan'));
    await waitFor(() => expect(updateMarkup).toHaveBeenCalledWith('m1', { qtyMin: 1, qtyMax: 12, persen: 45 }));
  });

  it('persentase kosong ditolak, bukan dianggap 0', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Persentase Markup (%)'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Simpan Aturan'));
    expect(screen.getByText('Persentase wajib diisi')).toBeTruthy();
    expect(addMarkup).not.toHaveBeenCalled();
  });
});

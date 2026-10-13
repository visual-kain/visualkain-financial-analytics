import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MasterFinanceTable } from './MasterFinanceTable';
import { transformToMasterRows } from '@/lib/financial-calculator';
import type { Order } from '@/types';

afterEach(cleanup);

function makeOrders(count: number): Order[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ord-${i}`,
    noInv: `VK-${String(i).padStart(3, '0')}`,
    customerName: `Customer ${i}`,
    tanggalOrder: '2026-10-10',
    totalInvoice: 1_000_000,
    totalHpp: 600_000,
    targetMargin: 400_000,
    pembayaranList: [],
    totalUangMasukCustomer: 0,
    statusPembayaran: 'belum_bayar',
    totalDibayarKeVendor: 0,
    statusPembayaranVendor: 'belum_bayar',
  }));
}

const activePages = () =>
  screen
    .getAllByRole('button')
    .filter((b) => b.className.includes('bg-teal-600') && /^\d+$/.test(b.textContent || ''))
    .map((b) => b.textContent);

describe('MasterFinanceTable: pagination', () => {
  it('tetap di halaman 2 saat baris dikirim ulang dengan identitas array baru', () => {
    const orders = makeOrders(15);
    const { rerender } = render(<MasterFinanceTable rows={transformToMasterRows(orders)} selectedPeriod="Oktober 2026" />);

    fireEvent.click(screen.getAllByRole('button', { name: '2' })[0]);
    expect(activePages()).toContain('2');

    rerender(<MasterFinanceTable rows={transformToMasterRows(orders)} selectedPeriod="Oktober 2026" />);
    expect(activePages()).toContain('2');
    expect(activePages()).not.toContain('1');
  });

  it('kembali ke halaman 1 saat periode berganti', () => {
    const orders = makeOrders(15);
    const { rerender } = render(<MasterFinanceTable rows={transformToMasterRows(orders)} selectedPeriod="Oktober 2026" />);
    fireEvent.click(screen.getAllByRole('button', { name: '2' })[0]);

    rerender(<MasterFinanceTable rows={transformToMasterRows(orders)} selectedPeriod="November 2026" />);
    expect(activePages()).toContain('1');
  });
});

describe('MasterFinanceTable: baris terfilter untuk ekspor', () => {
  it('melaporkan baris hasil pencarian beserta label filter ke induk', () => {
    const onFilteredRowsChange = vi.fn();
    render(
      <MasterFinanceTable
        rows={transformToMasterRows(makeOrders(15))}
        selectedPeriod="Oktober 2026"
        onFilteredRowsChange={onFilteredRowsChange}
      />
    );

    fireEvent.change(screen.getAllByPlaceholderText(/cari/i)[0], { target: { value: 'VK-001' } });

    const [rows, label] = onFilteredRowsChange.mock.calls.at(-1)!;
    expect(rows.map((r: { noInv: string }) => r.noInv)).toEqual(['VK-001']);
    expect(label).toContain('VK-001');
  });
});

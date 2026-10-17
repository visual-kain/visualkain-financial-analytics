import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import InvoicePaper from './InvoicePaper';
import { summarizeInvoicePayments } from '@/lib/invoice-payments';
import type { LegacyOrder } from '@/lib/legacy/types';

const order = { id: 'o', noInv: 'VK260099', namaCustomer: 'CONTOH', status: 'production', kategoriOrder: 'Kaos', hargaPendek: 100000, pendekM: 10 } as LegacyOrder;

describe('InvoicePaper', () => {
  it('invoice lunas lewat satu transfer pelunasan menampilkan LUNAS, bukan Sisa DP', () => {
    const payments = summarizeInvoicePayments([{ id: 'p', nominal: 1000000, jenis: 'pelunasan', tanggal: '2026-10-10' }]);
    render(<InvoicePaper order={order} payments={payments} />);
    expect(screen.getByText('LUNAS')).toBeTruthy();
    expect(screen.queryByText(/Sisa DP/)).toBeNull();
    expect(screen.getByText(/Pelunasan Diterima/)).toBeTruthy();
  });

  it('DP di bawah target menampilkan kotak Sisa DP dengan rumus lama', () => {
    const payments = summarizeInvoicePayments([{ id: 'p', nominal: 300000, jenis: 'dp', tanggal: '2026-10-10' }]);
    render(<InvoicePaper order={order} payments={payments} />);
    expect(screen.getByText('Sisa DP (Target 70% Produksi)')).toBeTruthy();
    expect(screen.getByText(/DP 1 Diterima \(30%\)/)).toBeTruthy();
  });
});

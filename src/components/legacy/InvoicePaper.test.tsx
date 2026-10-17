import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import InvoicePaper from './InvoicePaper';
import { summarizeInvoicePayments } from '@/lib/invoice-payments';
import type { LegacyOrder } from '@/lib/legacy/types';

const order = { id: 'o', noInv: 'VK260099', namaCustomer: 'CONTOH', status: 'payment', kategoriOrder: 'Kaos', hargaPendek: 100000, pendekM: 10, diskonHarga: 0 } as LegacyOrder;

function hasColoredBackground(container: HTMLElement): boolean {
  return Array.from(container.querySelectorAll<HTMLElement>('[style]')).some((el) => /background/i.test(el.getAttribute('style') || ''));
}

describe('InvoicePaper (formal)', () => {
  it('rekening tampil sebagai teks biasa tanpa badge, tanpa elemen berlatar warna', () => {
    const { container } = render(<InvoicePaper order={order} bankInfo={{ bankName: 'Mandiri', noRekening: '123', atasNama: 'VISUAL KAIN' }} />);
    expect(screen.getByText('Pembayaran:')).toBeTruthy();
    expect(screen.getByText(/Mandiri/)).toBeTruthy();
    expect(hasColoredBackground(container)).toBe(false);
    expect(screen.getByText('Pembayaran Dikonfirmasi')).toBeTruthy();
  });

  it('menampilkan detail DP: status, baris DP diterima dengan tanggal, dan sisa DP target', () => {
    const payments = summarizeInvoicePayments([{ id: 'p', nominal: 300000, jenis: 'dp', tanggal: '2026-10-12' }]);
    const { container } = render(<InvoicePaper order={order} payments={payments} />);
    expect(screen.getByText('Status Pembayaran')).toBeTruthy();
    expect(screen.getByText('DP 1 Diterima (30%) - Menunggu DP 2')).toBeTruthy();
    expect(screen.getByText(/DP 1 Diterima \(12 Oktober 2026\)/)).toBeTruthy();
    expect(screen.getByText('Sisa DP (Target 70% Produksi)').parentElement!.textContent).toContain('400.000');
    expect(hasColoredBackground(container)).toBe(false);
  });

  it('target DP terpenuhi menampilkan sisa pelunasan 100%', () => {
    const payments = summarizeInvoicePayments([{ id: 'p', nominal: 700000, jenis: 'dp', tanggal: '2026-10-12' }]);
    render(<InvoicePaper order={order} payments={payments} />);
    expect(screen.getByText('DP Target (70%) Terpenuhi')).toBeTruthy();
    expect(screen.getByText('Sisa Pelunasan (100%)').parentElement!.textContent).toContain('300.000');
  });

  it('lunas lewat satu transfer pelunasan menampilkan LUNAS', () => {
    const payments = summarizeInvoicePayments([{ id: 'p', nominal: 1000000, jenis: 'pelunasan', tanggal: '2026-10-12' }]);
    render(<InvoicePaper order={order} payments={payments} />);
    expect(screen.getByText('Lunas 100%')).toBeTruthy();
    expect(screen.getByText('LUNAS')).toBeTruthy();
    expect(screen.queryByText(/Sisa DP/)).toBeNull();
  });
});

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreatorLabel } from './creator-label';
import { buildCashInflowEntries } from '@/lib/cash-ledger';
import type { CashTransaction, Order } from '@/types';

describe('CreatorLabel', () => {
  it('menampilkan pembuat dan pengubah terakhir bila berbeda', () => {
    render(<CreatorLabel audit={{ createdBy: 'Glora', createdByEmail: 'g@vk.com', updatedBy: 'Raja' }} />);
    expect(screen.getByText('Glora')).toBeTruthy();
    expect(screen.getByText('diubah Raja')).toBeTruthy();
    expect(screen.getByTitle(/Dibuat oleh Glora \(g@vk\.com\) · Terakhir diubah oleh Raja/)).toBeTruthy();
  });

  it('data lama tanpa jejak ditandai tidak tercatat', () => {
    render(<CreatorLabel audit={{}} />);
    expect(screen.getByText('Tidak tercatat')).toBeTruthy();
  });
});

describe('jejak pembuat di entri Dana Masuk', () => {
  it('pembayaran order dan kas manual membawa createdBy ke baris tabel', () => {
    const order = {
      id: 'o1',
      noInv: 'VK260100',
      customerName: 'CUST',
      tanggalOrder: '2026-10-05',
      pembayaranList: [{ id: 'p1', orderId: 'o1', noInv: 'VK260100', tanggal: '2026-10-06', nominal: 500000, jenis: 'dp', createdAt: '', createdBy: 'Glora' }],
    } as unknown as Order;
    const kas = { id: 'k1', tanggal: '2026-10-07', tipe: 'masuk', nominal: 100000, kategori: 'Pendapatan Lain', keterangan: 'Jual sisa kain', createdBy: 'Raja' } as CashTransaction;
    const entries = buildCashInflowEntries([order], [kas]);
    expect(entries.find((e) => e.id === 'p1')?.createdBy).toBe('Glora');
    expect(entries.find((e) => e.id === 'k1')?.createdBy).toBe('Raja');
  });
});

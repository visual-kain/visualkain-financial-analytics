import { describe, expect, it } from 'vitest';
import { countByStatus, filterDataCustomerRows, formatShortIsoDate, isDeadlineOverdue, summarizeQty, toDataCustomerRow } from './data-customer';
import { buildDataCustomerWorkbook, DATA_CUSTOMER_EXPORT_COLUMNS } from './excel-export-ops';
import { resolveActiveNavId } from './navigation';
import { formatIsoDateLong, generateInvoiceNumber, getUserDisplayName, formatRelativeTime } from './legacy/formatters';
import type { LegacyOrder } from './legacy/types';

function order(id: string, extra: Partial<LegacyOrder>): LegacyOrder {
  return { id, noInv: `VK26${id}`, namaCustomer: 'CUST', status: 'received', tanggalInv: '2026-10-10', ...extra } as LegacyOrder;
}

const rows = [
  toDataCustomerRow(order('0001', { namaCustomer: 'BU FITA', jenisMetodeProduksi: 'Sablon', pendekM: 10, tigaPerempatL: 2 }), 'Wisnu'),
  toDataCustomerRow(order('0002', { namaCustomer: 'OM SEDORF', status: 'completed', panjangXL: 5 }), '-'),
  toDataCustomerRow(order('0003', { namaCustomer: 'NIJI', tanggalInv: '2026-07-01', tanpaLenganS: 1 }), '-'),
];

describe('data customer rows', () => {
  it('menghitung total qty per jenis lengan termasuk 3/4', () => {
    expect(rows[0].qtyTotal).toBe(12);
    expect(rows[0].qtyPendek).toBe(10);
    expect(rows[0].qtyTigaPerempat).toBe(2);
    expect(summarizeQty(rows)).toEqual({ total: 18, tanpaLengan: 1, pendek: 10, tigaPerempat: 2, panjang: 5 });
  });

  it('default hanya order mulai Oktober; arsip terpisah', () => {
    expect(filterDataCustomerRows(rows, { search: '', status: 'all', scope: 'current' }).map((r) => r.id)).toEqual(['0001', '0002']);
    expect(filterDataCustomerRows(rows, { search: '', status: 'all', scope: 'archive' }).map((r) => r.id)).toEqual(['0003']);
  });

  it('mencari di customer, No. Invoice, project, dan metode produksi', () => {
    expect(filterDataCustomerRows(rows, { search: 'sablon', status: 'all', scope: 'current' }).map((r) => r.id)).toEqual(['0001']);
    expect(filterDataCustomerRows(rows, { search: 'vk260002', status: 'all', scope: 'current' }).map((r) => r.id)).toEqual(['0002']);
  });

  it('filter status dan jumlah per status', () => {
    expect(filterDataCustomerRows(rows, { search: '', status: 'completed', scope: 'current' })).toHaveLength(1);
    const counts = countByStatus(rows.slice(0, 2));
    expect(counts.all).toBe(2);
    expect(counts.completed).toBe(1);
    expect(counts.received).toBe(1);
  });

  it('format tanggal pendek dan deadline lewat', () => {
    expect(formatShortIsoDate('2026-10-20')).toBe('20 Okt 2026');
    expect(isDeadlineOverdue({ deadline: '2026-10-01', status: 'production' }, '2026-10-17')).toBe(true);
    expect(isDeadlineOverdue({ deadline: '2026-10-01', status: 'completed' }, '2026-10-17')).toBe(false);
  });
});

describe('ekspor Excel data customer', () => {
  it('header tabel mengikuti kolom screenshot klien dan baris KPI berisi total qty', () => {
    const wb = buildDataCustomerWorkbook(rows.slice(0, 2), 'Mulai Okt 2026', new Date(2026, 9, 17, 9, 30));
    const sheet = wb.getWorksheet('Data Customer')!;
    const headers = DATA_CUSTOMER_EXPORT_COLUMNS.map((_, i) => sheet.getRow(11).getCell(i + 1).value);
    expect(headers).toContain('TOTAL 3/4 TANGAN');
    expect(headers[1]).toBe('NO INV');
    expect(sheet.getCell('D8').value).toBe(17);
    expect(sheet.getRow(12).getCell(2).value).toBe('VK260001');
    expect(sheet.getRow(14).getCell(12).value).toBe(17);
  });
});

describe('navigasi', () => {
  it('menentukan menu aktif dari path dan tab', () => {
    expect(resolveActiveNavId('/', null)).toBe('dashboard');
    expect(resolveActiveNavId('/', 'cashin')).toBe('cashin');
    expect(resolveActiveNavId('/data-customer/abc/edit', null)).toBe('data-customer');
    expect(resolveActiveNavId('/cash-out/new', null)).toBe('cashout');
    expect(resolveActiveNavId('/orders/x/edit', null)).toBe('datatable');
    expect(resolveActiveNavId('/kerjasama/new', null)).toBe('kerjasama');
  });
});

describe('legacy formatters', () => {
  it('nomor invoice = urut tertinggi tahun itu + 1', () => {
    expect(generateInvoiceNumber(new Date(2026, 9, 17), ['VK260041', 'VK260039', 'VK250120'])).toBe('VK260042');
    expect(generateInvoiceNumber(new Date(2027, 0, 2), ['VK260041'])).toBe('VK270001');
  });

  it('nama tampilan dari displayName atau email', () => {
    expect(getUserDisplayName({ displayName: null, email: 'budi.santoso@x.com' })).toBe('Budi Santoso');
    expect(getUserDisplayName({ displayName: 'Glora', email: 'g@x.com' })).toBe('Glora');
  });

  it('tanggal ISO menjadi format panjang, teks lama dibiarkan', () => {
    expect(formatIsoDateLong('2026-10-13')).toBe('13 Oktober 2026');
    expect(formatIsoDateLong('13 Okt')).toBe('13 Okt');
  });

  it('waktu relatif bahasa Indonesia', () => {
    const now = new Date(2026, 9, 17, 10, 0, 0);
    expect(formatRelativeTime(new Date(2026, 9, 17, 9, 57, 0), now)).toBe('3 menit yang lalu');
    expect(formatRelativeTime(null)).toBe('-');
  });
});

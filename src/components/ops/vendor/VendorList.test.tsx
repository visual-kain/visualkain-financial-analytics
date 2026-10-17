import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VendorCards, VendorTable, type VendorListProps } from '@/components/ops/vendor/VendorList';

afterEach(cleanup);

const vendors = [
  { id: 'v1', nama: 'CV Maju Jaya', alamat: 'Jl. Merdeka No. 5, Bandung', wa: '0812-3456-7890', pic: 'Pak Andi' },
  { id: 'v2', nama: 'Konveksi Cepat', alamat: '', wa: '', pic: '' },
];

function props(overrides: Partial<VendorListProps> = {}): VendorListProps {
  return {
    vendors,
    orderCounts: new Map([['v1', 3]]),
    countsReady: true,
    loading: false,
    emptyState: <p>Kosong</p>,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

describe('VendorTable', () => {
  it('shows the six columns in the agreed order', () => {
    render(<VendorTable {...props()} />);
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers).toEqual(['Nama Vendor', 'Alamat', 'No. WhatsApp', 'PIC', 'Order', 'Aksi']);
  });

  it('shows order counts, a WhatsApp chat link, and dashes for missing values', () => {
    render(<VendorTable {...props()} />);
    const [, first, second] = screen.getAllByRole('row');
    expect(within(first).getByText('3')).toBeTruthy();
    expect(within(first).getByRole('link', { name: 'Chat WhatsApp CV Maju Jaya' }).getAttribute('href')).toBe('https://wa.me/6281234567890');
    expect(within(second).getByText('0')).toBeTruthy();
    expect(within(second).queryByRole('link')).toBeNull();
    expect(within(second).getAllByText('-').length).toBeGreaterThanOrEqual(3);
  });

  it('shows a dash instead of a count while order data is not ready', () => {
    render(<VendorTable {...props({ countsReady: false })} />);
    expect(screen.queryByText('3')).toBeNull();
  });

  it('lets long text wrap in the table', () => {
    render(<VendorTable {...props()} />);
    expect(screen.getByText('Jl. Merdeka No. 5, Bandung').className).toContain('whitespace-normal');
  });

  it('calls edit and delete with the vendor of that row', () => {
    const p = props();
    render(<VendorTable {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit CV Maju Jaya' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hapus Konveksi Cepat' }));
    expect(p.onEdit).toHaveBeenCalledWith(vendors[0]);
    expect(p.onDelete).toHaveBeenCalledWith(vendors[1]);
  });

  it('renders the empty state and the loading skeleton', () => {
    const { rerender } = render(<VendorTable {...props({ vendors: [] })} />);
    expect(screen.getByText('Kosong')).toBeTruthy();
    rerender(<VendorTable {...props({ loading: true })} />);
    expect(screen.queryByText('CV Maju Jaya')).toBeNull();
    expect(screen.queryByText('Kosong')).toBeNull();
  });
});

describe('VendorCards', () => {
  it('truncates text to one line and exposes the full text as a tooltip', () => {
    render(<VendorCards {...props()} />);
    const address = screen.getByText('Jl. Merdeka No. 5, Bandung');
    expect(address.className).toContain('truncate');
    expect(address.getAttribute('title')).toBe('Jl. Merdeka No. 5, Bandung');
  });

  it('keeps edit and delete reachable with 44px touch targets', () => {
    const p = props();
    render(<VendorCards {...p} />);
    const edit = screen.getByRole('button', { name: 'Edit CV Maju Jaya' });
    expect(edit.className).toContain('h-11');
    fireEvent.click(edit);
    fireEvent.click(screen.getByRole('button', { name: 'Hapus CV Maju Jaya' }));
    expect(p.onEdit).toHaveBeenCalledWith(vendors[0]);
    expect(p.onDelete).toHaveBeenCalledWith(vendors[0]);
  });

  it('offers a chat link only for vendors with a usable number', () => {
    render(<VendorCards {...props()} />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders the empty state', () => {
    render(<VendorCards {...props({ vendors: [] })} />);
    expect(screen.getByText('Kosong')).toBeTruthy();
  });
});

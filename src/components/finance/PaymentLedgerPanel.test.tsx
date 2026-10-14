import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PaymentLedgerPanel, type LedgerRow } from './PaymentLedgerPanel';

afterEach(cleanup);

const accounts = [{ value: 'Transfer BCA', label: 'Transfer BCA' }];

const rows: LedgerRow[] = [
  { id: 'pay-1', tanggal: '2026-10-02', nominal: 300_000, terminKe: 1, label: 'DP 1', keterangan: 'Transfer BCA' },
  { id: 'pay-2', tanggal: '2026-10-05', nominal: 200_000, terminKe: 2, label: 'DP 2', keterangan: 'Transfer BCA' },
];

function Harness({
  initialEditId,
  onChangeSpy,
}: {
  initialEditId?: string | null;
  onChangeSpy?: (rows: LedgerRow[]) => void;
}) {
  const [entries, setEntries] = useState<LedgerRow[]>(rows);
  return (
    <PaymentLedgerPanel
      variant="customer"
      totalTagihan={1_000_000}
      entries={entries}
      onChange={(next) => {
        onChangeSpy?.(next);
        setEntries(next);
      }}
      accountOptions={accounts}
      defaultTanggal="2026-10-10"
      defaultRekening="Transfer BCA"
      initialEditId={initialEditId}
    />
  );
}

describe('PaymentLedgerPanel: edit dari tabel', () => {
  it('membuka form edit target sekali dan tidak membukanya lagi setelah baris diperbarui', () => {
    render(<Harness initialEditId="pay-2" />);
    expect(screen.getByText('Edit status pembayaran ke-2')).toBeTruthy();

    fireEvent.click(screen.getByText('Perbarui baris'));

    expect(screen.queryByText('Edit status pembayaran ke-2')).toBeNull();
    expect(screen.getByText('Tambah Status Pembayaran')).toBeTruthy();
  });

  it('tidak membuka ulang form edit setelah baris lain dihapus', () => {
    render(<Harness initialEditId="pay-2" />);
    fireEvent.click(screen.getByText('Batal edit'));
    fireEvent.click(screen.getAllByLabelText('Hapus DP 1')[0]);

    expect(screen.queryByText(/^Edit status pembayaran/)).toBeNull();
  });

  it('menampilkan pemberitahuan dan tidak membuka baris lain bila ID target tidak ditemukan', () => {
    render(<Harness initialEditId="ord-9-p-1" />);
    expect(screen.queryByText(/^Edit status pembayaran/)).toBeNull();
    expect(screen.getByText(/Transaksi tidak ditemukan/)).toBeTruthy();
  });
});

describe('PaymentLedgerPanel: tombol Enter', () => {
  it('Enter di input nominal menambah baris panel dan tidak men-submit form induk', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const onChangeSpy = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <Harness onChangeSpy={onChangeSpy} />
      </form>
    );

    const nominal = screen.getByLabelText('Nominal (Rp)');
    fireEvent.change(nominal, { target: { value: '100000' } });
    const notPrevented = fireEvent.keyDown(nominal, { key: 'Enter' });

    expect(notPrevented).toBe(false);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy.mock.calls[0][0]).toHaveLength(3);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

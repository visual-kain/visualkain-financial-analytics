import { describe, it, expect } from 'vitest';
import {
  nextTerminNumber,
  outstandingAmount,
  suggestTerminLabel,
  deriveCustomerJenis,
  deriveVendorJenis,
  normalizeLedger,
  summarizeLedger,
  validateEntryNominal,
  type LedgerEntry,
} from './payment-ledger';

const rp = (n: number) => `Rp ${n}`;

const entry = (id: string, tanggal: string, nominal: number, extra: Partial<LedgerEntry> = {}): LedgerEntry => ({
  id,
  tanggal,
  nominal,
  ...extra,
});

describe('payment-ledger (US-9.35 to US-9.39)', () => {
  it('numbers termin without an upper limit (5x DP and beyond)', () => {
    const five = [1, 2, 3, 4, 5].map((n) => entry(`p${n}`, `2026-10-0${n}`, 100));
    expect(nextTerminNumber(five)).toBe(6);
    const normalized = normalizeLedger(five, 10_000);
    expect(normalized.map((e) => e.terminKe)).toEqual([1, 2, 3, 4, 5]);
    expect(normalized.map((e) => e.label)).toEqual(['DP 1', 'DP 2', 'DP 3', 'DP 4', 'DP 5']);
  });

  it('suggests Pelunasan when the payment settles the invoice', () => {
    expect(suggestTerminLabel(3, true)).toBe('Pelunasan');
    expect(suggestTerminLabel(3, false)).toBe('DP 3');
    expect(suggestTerminLabel(2, false, 'vendor')).toBe('Pembayaran ke-2');
  });

  it('derives legacy jenis values for compatibility', () => {
    expect(deriveCustomerJenis(1, false)).toBe('dp');
    expect(deriveCustomerJenis(4, false)).toBe('termin');
    expect(deriveCustomerJenis(4, true)).toBe('pelunasan');
    expect(deriveVendorJenis(1, false)).toBe('dp_vendor');
    expect(deriveVendorJenis(2, true)).toBe('pelunasan_vendor');
  });

  it('fills label and number for legacy rows and keeps custom labels', () => {
    const legacy = [
      entry('b', '2026-10-09', 600, { createdAt: '2' }),
      entry('a', '2026-10-07', 400, { label: 'Booking Awal', createdAt: '1' }),
    ];
    const out = normalizeLedger(legacy, 1000);
    expect(out.map((e) => e.id)).toEqual(['a', 'b']);
    expect(out[0].label).toBe('Booking Awal');
    expect(out[1].label).toBe('Pelunasan');
    expect(out[1].terminKe).toBe(2);
  });

  it('renumbers after a row is removed', () => {
    const rows = [entry('a', '2026-10-01', 100), entry('c', '2026-10-03', 100)];
    expect(normalizeLedger(rows, 1000).map((e) => e.terminKe)).toEqual([1, 2]);
  });

  it('summarizes progress, 70% threshold, and overpay', () => {
    const rows = [entry('a', '2026-10-07', 2_900_000), entry('b', '2026-10-09', 2_654_500)];
    const s = summarizeLedger(7_935_000, rows);
    expect(s.dibayar).toBe(5_554_500);
    expect(s.target70).toBe(5_554_500);
    expect(s.isReady70).toBe(true);
    expect(s.sisa).toBe(2_380_500);

    const over = summarizeLedger(1000, [entry('a', '2026-10-01', 900)], 200);
    expect(over.isOverpay).toBe(true);
  });

  it('excludes the row being edited from outstanding', () => {
    const rows = [entry('a', '2026-10-01', 400), entry('b', '2026-10-02', 300)];
    expect(outstandingAmount(1000, rows)).toBe(300);
    expect(outstandingAmount(1000, rows, 'b')).toBe(600);
  });

  it('blocks overpay and zero amounts', () => {
    expect(validateEntryNominal(0, 500, rp)).toMatch(/lebih dari/);
    expect(validateEntryNominal(600, 500, rp)).toMatch(/melebihi sisa/);
    expect(validateEntryNominal(500, 500, rp)).toBeNull();
    expect(validateEntryNominal(10, 0, rp)).toMatch(/sudah lunas/);
  });
});

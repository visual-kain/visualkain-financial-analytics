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
  resolveEditTarget,
  isAutoLabel,
  toPersistedLabel,
  isUnitemizedPaymentId,
  hasUnitemizedCustomerPayment,
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

describe('resolveEditTarget (F-10 2.8)', () => {
  const rows = [entry('pay-a', '2026-10-01', 100), entry('pay-b', '2026-10-02', 100), entry('pay-c', '2026-10-03', 100)];

  it('memilih baris dengan ID yang sama persis', () => {
    expect(resolveEditTarget(rows, 'pay-b')?.id).toBe('pay-b');
  });

  it('memetakan alias entri tabel ke baris awal ledger', () => {
    const custRows = [entry('pay-ord1-init', '2026-10-01', 100)];
    const vendRows = [entry('vp-ord1-init', '2026-10-01', 100), entry('vp-9', '2026-10-02', 50)];
    expect(resolveEditTarget(custRows, 'pay-ord1-single')?.id).toBe('pay-ord1-init');
    expect(resolveEditTarget(vendRows, 'vp-ord1')?.id).toBe('vp-ord1-init');
    expect(resolveEditTarget(vendRows, 'vp-rem-ord1')?.id).toBe('vp-ord1-init');
  });

  it('tidak menebak baris lain dari angka di akhir ID', () => {
    expect(resolveEditTarget(rows, 'ord1-p-2')).toBeNull();
    expect(resolveEditTarget([entry('pay-a', '2026-10-01', 100)], 'pay-zzz')).toBeNull();
  });
});

describe('label termin otomatis (F-10 2.10)', () => {
  it.each(['', undefined, 'DP 2', 'Termin 3', 'Pembayaran ke-4', 'Pelunasan'])('menganggap "%s" sebagai label otomatis', (label) => {
    expect(isAutoLabel(label)).toBe(true);
  });

  it.each(['Booking Awal', 'DP 2 70% Produksi', 'DP Vendor Bahan'])('mempertahankan label kustom "%s"', (label) => {
    expect(isAutoLabel(label)).toBe(false);
    expect(toPersistedLabel(label)).toBe(label);
  });

  it('label otomatis disimpan kosong', () => {
    expect(toPersistedLabel('DP 2')).toBe('');
    expect(toPersistedLabel('  Pelunasan ')).toBe('');
  });

  it('menomori ulang label lama setelah termin pertama dihapus', () => {
    const remaining = [entry('b', '2026-10-05', 300, { label: 'DP 2' }), entry('c', '2026-10-06', 200, { label: 'DP 3' })];
    expect(normalizeLedger(remaining, 1000).map((e) => e.label)).toEqual(['DP 1', 'DP 2']);
  });

  it('melepas label Pelunasan bila baris tidak lagi melunasi', () => {
    const rows2 = [entry('a', '2026-10-05', 300, { label: 'DP 1' }), entry('b', '2026-10-06', 200, { label: 'Pelunasan' })];
    expect(normalizeLedger(rows2, 1000).map((e) => e.label)).toEqual(['DP 1', 'DP 2']);
  });
});

describe('penanda pembayaran belum dirinci (F-10 2.29)', () => {
  it.each(['ord1-dp-legacy', 'pay-ord1-init', 'vp-ord1-init'])('menandai %s sebagai belum dirinci', (id) => {
    expect(isUnitemizedPaymentId(id)).toBe(true);
  });

  it.each(['ord1-dp1', 'ord1-dp2', 'ord1-pelunasan', 'ord1-p-0', 'pay-1728812345678'])('tidak menandai %s', (id) => {
    expect(isUnitemizedPaymentId(id)).toBe(false);
  });

  it('menandai order yang punya uang masuk tanpa daftar termin', () => {
    expect(hasUnitemizedCustomerPayment({ pembayaranList: [], totalUangMasukCustomer: 500 })).toBe(true);
    expect(
      hasUnitemizedCustomerPayment({
        pembayaranList: [{ id: 'ord1-dp-legacy', nominal: 500 }],
        totalUangMasukCustomer: 500,
      })
    ).toBe(true);
    expect(
      hasUnitemizedCustomerPayment({ pembayaranList: [{ id: 'ord1-p-0', nominal: 500 }], totalUangMasukCustomer: 500 })
    ).toBe(false);
    expect(hasUnitemizedCustomerPayment({ pembayaranList: [], totalUangMasukCustomer: 0 })).toBe(false);
  });
});

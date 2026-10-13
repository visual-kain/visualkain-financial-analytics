import { describe, it, expect } from 'vitest';
import { FINANCE_START_DATE, isFromFinanceStartDate } from './constants';
import { initialOrdersData, initialCashTransactions } from '@/test/fixtures/seed-data';
import { buildCashOutflowEntries, calculateFinancialSummary } from './financial-calculator';

describe('Phase 7: October 2026 Cutoff, Complete Cash Outflow, & Client Executive Metrics', () => {
  it('enforces FINANCE_START_DATE = 2026-10-01 cutoff helper (US-9.30)', () => {
    expect(FINANCE_START_DATE).toBe('2026-10-01');
    expect(isFromFinanceStartDate('2026-09-30')).toBe(false);
    expect(isFromFinanceStartDate('2025-10-10')).toBe(false);
    expect(isFromFinanceStartDate('2026-10-01')).toBe(true);
    expect(isFromFinanceStartDate('2026-10-12')).toBe(true);
    expect(isFromFinanceStartDate('2026-11-01')).toBe(true);
  });

  it('contains only October 2026+ orders and cash outflows in seed data (US-9.30)', () => {
    expect(initialOrdersData).toHaveLength(3);
    initialOrdersData.forEach((order) => {
      expect(order.tanggalOrder >= '2026-10-01').toBe(true);
    });

    expect(initialCashTransactions).toHaveLength(10);
    initialCashTransactions.forEach((tx) => {
      expect(tx.tanggal >= '2026-10-01').toBe(true);
      expect(tx.tipe).toBe('keluar');
    });
  });

  it('aggregates order vendor payments, order opEx, and kas outflows in buildCashOutflowEntries (US-9.31 & US-9.32)', () => {
    const entries = buildCashOutflowEntries(initialOrdersData, initialCashTransactions);
    expect(entries).toHaveLength(12);

    const orderEntries = entries.filter((e) => e.sumber === 'order');
    const manualEntries = entries.filter((e) => e.sumber === 'manual');

    expect(orderEntries).toHaveLength(2);
    expect(manualEntries).toHaveLength(10);

    const totalVendorOutflow = orderEntries.reduce((sum, e) => sum + e.nominal, 0);
    const totalKasOutflow = manualEntries.reduce((sum, e) => sum + e.nominal, 0);

    expect(totalVendorOutflow).toBe(4_700_000);
    expect(totalKasOutflow).toBe(1_779_000);
    expect(totalVendorOutflow + totalKasOutflow).toBe(6_479_000);
  });

  it('computes exact October 2026 client executive summary metrics and vendor debt coverage (US-9.33 & US-9.34)', () => {
    const summary = calculateFinancialSummary(0, initialCashTransactions, initialOrdersData);

    // 1. Dana Masuk: VK260039 (5.554.500) + VK260041 (982.000) = 6.536.500
    expect(summary.totalKasMasuk).toBe(6_536_500);

    // 2. Dana Keluar: Vendor (4.700.000) + Kas (1.779.000) = 6.479.000
    expect(summary.totalKasKeluar).toBe(6_479_000);
    expect(summary.kasKeluarCount).toBe(12);

    // 3. Dana Tersedia (Saldo Kas): 6.536.500 - 6.479.000 = +57.500
    expect(summary.saldoKasRiil).toBe(57_500);

    // 4. Sisa Customer (Piutang): VK260039 (3.280.500) + VK260040 (3.000.000) + VK260041 (440.000) = 6.720.500
    expect(summary.totalPiutangCustomer).toBe(6_720_500);
    expect(summary.unpaidCustomerCount).toBe(3);

    // 5. Sisa Hutang ke Vendor: VK260039 (1.735.000) + VK260040 (2.400.000) + VK260041 (320.000) = 4.455.000
    expect(summary.totalUtangVendor).toBe(4_455_000);
    expect(summary.vendorDebtCount).toBe(3);

    // 6. Status Cover Hutang Vendor & Sisa / Kekurangan: 57.500 - 4.455.000 = -4.397.500
    const selisihCover = summary.saldoKasRiil - summary.totalUtangVendor;
    expect(selisihCover).toBe(-4_397_500);

    // 7. Profit Realtime: VK260041 (402.000) + VK260040 (600.000) + VK260039 (3.100.000) = 4.102.000
    expect(summary.totalProfitRealtime).toBe(4_102_000);
  });

  it('includes standalone unlinked vendor payments from kas while deduplicating order-linked vendor payments', () => {
    const standaloneVendorTx = {
      id: 'kas-vendor-unlinked-1',
      tanggal: '2026-10-13',
      tipe: 'keluar' as const,
      nominal: 500_000,
      kategori: 'Pembayaran Vendor' as const,
      keterangan: 'Pembayaran Vendor (AMRIN): Transfer BCA - Pelunasan kain sisa non-order',
    };

    const txWithStandalone = [...initialCashTransactions, standaloneVendorTx];
    const entries = buildCashOutflowEntries(initialOrdersData, txWithStandalone);
    expect(entries).toHaveLength(13);

    const summary = calculateFinancialSummary(0, txWithStandalone, initialOrdersData);
    expect(summary.totalKasKeluar).toBe(6_479_000 + 500_000);
    expect(summary.saldoKasRiil).toBe(57_500 - 500_000);
  });
});

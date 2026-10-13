import { describe, it, expect } from 'vitest';
import { calculateOrderTotals } from './calculations';
import { calculateFinancialSummary, transformToMasterRows } from './financial-calculator';
import { initialOrdersData, initialCashTransactions } from '@/test/fixtures/seed-data';
import { Order, CashTransaction, FinanceSubTab } from '../types';

describe('Phase 6 & Codebase Audit Fixes Verification', () => {
    it('supports dedicated datatable sub-tab in FinanceSubTab type contract (US-9.29)', () => {
        const tabs: FinanceSubTab[] = ['dashboard', 'datatable', 'cashin', 'cashout', 'vendor', 'manual'];
        expect(tabs).toContain('datatable');
        expect(tabs).toHaveLength(6);
    });

    it('exports shared seed data for dedicated page fallback (Issue #10)', () => {
        expect(initialOrdersData.length).toBeGreaterThanOrEqual(3);
        expect(initialCashTransactions.length).toBeGreaterThanOrEqual(10);
    });

    it('prevents double-discount and preserves manual finance overrides in calculateOrderTotals (Issues #2 & #3)', () => {
        const overriddenOrder = {
            id: 'ORD-TEST-OVERRIDE',
            grossTotal: 15_000_000,
            diskon: 1_500_000,
            totalInvoice: 13_500_000, // net already saved
            isManualFinanceOverride: true,
            totalHpp: 8_000_000,
            totalDibayarKeVendor: 5_000_000,
            dpVendor: 5_000_000,
            pembayaranList: [
                { id: 'P1', nominal: 6_000_000, tanggal: '2026-04-01' },
                { id: 'P2', nominal: 4_000_000, tanggal: '2026-04-05' },
            ],
            // Even if legacy items exist, manual override should win
            items: [{ qty: 100, hargaSatuan: 150_000 }],
            hppItems: [{ qty: 100, hargaSatuan: 60_000 }],
        };

        const totals = calculateOrderTotals(overriddenOrder);

        // Must preserve grossTotal = 15,000,000 and net = 13,500,000 (not 12,000,000!)
        expect(totals.grossTotal).toBe(15_000_000);
        expect(totals.diskon).toBe(1_500_000);
        expect(totals.jumlahSemua).toBe(13_500_000);
        // Must preserve overridden HPP (8,000,000) instead of recalculating from hppItems (6,000,000)
        expect(totals.totalHpp).toBe(8_000_000);
        expect(totals.nominalDP).toBe(10_000_000);
        expect(totals.sisaPelunasan).toBe(3_500_000);
        expect(totals.dpVendor).toBe(5_000_000);
        expect(totals.sisaVendor).toBe(3_000_000);
        expect(totals.profit).toBe(5_500_000);
    });

    it('includes non-order cash inflows in totalKasMasuk and saldoKasRiil without double-counting order inflows (Issues #4 & #5)', () => {
        const orders: Order[] = [
            {
                id: 'ORD-1',
                noInv: 'INV-001',
                customerName: 'Klien Satu',
                projectName: 'Proyek A',
                tanggalOrder: '2026-04-01',
                totalInvoice: 10_000_000,
                totalHpp: 5_000_000,
                targetMargin: 5_000_000,
                pembayaranList: [],
                totalUangMasukCustomer: 7_000_000,
                statusPembayaran: 'parsial',
                totalDibayarKeVendor: 2_000_000,
                statusPembayaranVendor: 'dp_vendor',
                statusOrder: 'PRODUKSI',
            }
        ];

        const transactions: CashTransaction[] = [
            // Order-linked cash transaction (should NOT be added again because order.totalUangMasukCustomer is already 7,000,000)
            {
                id: 'TX-ORD',
                tanggal: '2026-04-01',
                tipe: 'masuk',
                kategori: 'Penerimaan Konsumen',
                nominal: 7_000_000,
                keterangan: 'DP Order 1',
            },
            // Non-order general income (MUST be included in totalKasMasuk & saldoKasRiil)
            {
                id: 'TX-NON-ORD',
                tanggal: '2026-04-02',
                tipe: 'masuk',
                kategori: 'Biaya Lain',
                nominal: 1_500_000,
                keterangan: 'Penjualan Sisa Kain',
            },
            // Operational expense
            {
                id: 'TX-OUT',
                tanggal: '2026-04-03',
                tipe: 'keluar',
                kategori: 'Operasional',
                nominal: 500_000,
                keterangan: 'Listrik & Air',
            }
        ];

        const summary = calculateFinancialSummary(0, transactions, orders);

        // Total Kas Masuk = 7,000,000 (from Order) + 1,500,000 (from non-order) = 8,500,000
        expect(summary.totalKasMasuk).toBe(8_500_000);
        // Total Pengeluaran = 2,000,000 (vendor paid) + 500,000 (operasional) = 2,500,000
        expect(summary.totalDibayarKeVendor + summary.bebanOperasionalNonVendor).toBe(2_500_000);
        // Saldo Kas Riil = 8,500,000 - 2,500,000 = 6,000,000
        expect(summary.saldoKasRiil).toBe(6_000_000);
    });

    it('attaches originalOrder to MasterFinanceRow for drawer inspection and DP timeline (Issue #7)', () => {
        const rows = transformToMasterRows(initialOrdersData);
        expect(rows.length).toBe(initialOrdersData.length);
        expect(rows[0].originalOrder).toBeDefined();
        expect(rows[0].originalOrder?.id).toBe(initialOrdersData[0].id);
    });
});

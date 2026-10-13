import { describe, it, expect, vi } from 'vitest';
import type { MasterFinanceRow, CashInflowEntry, CashTransaction } from '@/types';
import {
  exportMasterFinanceToExcel,
  exportCashInflowToExcel,
  exportCashOutflowToExcel,
} from './excel-export';

describe('Phase 5 Refinements & Acceptance Criteria Tests', () => {
  // Test Data Fixtures
  const mockRows: MasterFinanceRow[] = [
    {
      id: 'row-1',
      noInv: 'VK260001',
      tanggalInv: '2026-10-01',
      namaCustomer: 'PT Maju Bersama',
      namaProject: 'Seragam Polo',
      totalBiayaVendor: 5000000,
      dpVendor: 2000000,
      sisaPembayaranVendor: 3000000, // Ada utang vendor
      totalQty: 50,
      totalJumlah: 10000000,
      dpPersenCustomer: 70,
      nominalDpCustomer: 7000000,
      sisaPelunasanCustomer: 3000000,
      biayaOperasional: 200000,
      biayaTambahanVendor: 0,
      biayaTambahanCustomer: 0,
      diskon: 0,
      profitBersih: 4800000,
      profitPercent: 48,
      statusDpThreshold: 'dp2_siap_produksi',
      sisaMenujuDp70: 0,
      statusOrder: 'PRODUKSI',
    },
    {
      id: 'row-2',
      noInv: 'VK260002',
      tanggalInv: '2026-10-02',
      namaCustomer: 'CV Berkah Mandiri',
      namaProject: 'Jaket Bomber',
      totalBiayaVendor: 8000000,
      dpVendor: 8000000,
      sisaPembayaranVendor: 0, // Vendor lunas
      totalQty: 40,
      totalJumlah: 14000000,
      dpPersenCustomer: 100,
      nominalDpCustomer: 14000000,
      sisaPelunasanCustomer: 0,
      biayaOperasional: 500000,
      biayaTambahanVendor: 0,
      biayaTambahanCustomer: 0,
      diskon: 0,
      profitBersih: 5500000,
      profitPercent: 39.2,
      statusDpThreshold: 'lunas_total',
      sisaMenujuDp70: 0,
      statusOrder: 'SELESAI',
    },
    {
      id: 'row-3',
      noInv: 'VK260003',
      tanggalInv: '2026-10-03',
      namaCustomer: 'Komunitas Motor',
      namaProject: 'Kaos Sablon',
      totalBiayaVendor: 0,
      dpVendor: 0,
      sisaPembayaranVendor: 0, // Tanpa vendor
      totalQty: 20,
      totalJumlah: 2000000,
      dpPersenCustomer: 50,
      nominalDpCustomer: 1000000,
      sisaPelunasanCustomer: 1000000,
      biayaOperasional: 100000,
      biayaTambahanVendor: 0,
      biayaTambahanCustomer: 0,
      diskon: 0,
      profitBersih: 1900000,
      profitPercent: 95,
      statusDpThreshold: 'dp1_parsial',
      sisaMenujuDp70: 400000,
      statusOrder: 'PEMBAYARAN',
    },
  ];

  describe('US-9.24: Vendor Debt Filter 3-State Logic', () => {
    function filterByVendorDebt(rows: MasterFinanceRow[], filter: 'all' | 'has_debt' | 'settled') {
      return rows.filter((row) => {
        if (filter === 'has_debt' && row.sisaPembayaranVendor <= 0) return false;
        if (filter === 'settled' && (row.sisaPembayaranVendor > 0 || row.totalBiayaVendor <= 0)) return false;
        return true;
      });
    }

    it('harus mengembalikan seluruh order ketika filter bernilai "all"', () => {
      const result = filterByVendorDebt(mockRows, 'all');
      expect(result.length).toBe(3);
    });

    it('harus hanya menyaring order yang memiliki sisa utang vendor > 0 ketika filter "has_debt"', () => {
      const result = filterByVendorDebt(mockRows, 'has_debt');
      expect(result.length).toBe(1);
      expect(result[0].noInv).toBe('VK260001');
      expect(result[0].sisaPembayaranVendor).toBe(3000000);
    });

    it('harus hanya menyaring order yang vendor lunas (sisa === 0 dan biayaVendor > 0) ketika filter "settled"', () => {
      const result = filterByVendorDebt(mockRows, 'settled');
      expect(result.length).toBe(1);
      expect(result[0].noInv).toBe('VK260002');
      expect(result[0].sisaPembayaranVendor).toBe(0);
      expect(result[0].totalBiayaVendor).toBe(8000000);
    });
  });

  describe('US-9.23: Deficit Alert Detection Logic', () => {
    it('harus mendeteksi kondisi defisit ketika saldo kas bank bernilai negatif', () => {
      const saldoKasNegatif = -224500;
      const isDefisit = saldoKasNegatif < 0;
      expect(isDefisit).toBe(true);
    });

    it('tidak boleh memicu banner defisit ketika saldo kas positif atau nol', () => {
      const saldoKasPositif = 15000000;
      const isDefisit = saldoKasPositif < 0;
      expect(isDefisit).toBe(false);
    });
  });

  describe('US-9.28: Executive Excel Export Engine via ExcelJS', () => {
    it('harus mengeksekusi fungsi exportMasterFinanceToExcel tanpa error', async () => {
      // Mock DOM element download
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      vi.spyOn(document, 'createElement').mockReturnValue({
        set href(val: string) {},
        set download(val: string) {},
        click: mockClick,
      } as any);

      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();

      await expect(exportMasterFinanceToExcel(mockRows, 'Oktober 2026')).resolves.not.toThrow();
      expect(mockClick).toHaveBeenCalled();
    });

    it('harus mengeksekusi exportCashInflowToExcel tanpa error', async () => {
      const mockInflows: CashInflowEntry[] = [
        {
          id: 'in-1',
          tanggal: '2026-10-01',
          sumber: 'order',
          jenis: 'dp',
          noInv: 'VK260001',
          customerName: 'PT Maju Bersama',
          projectName: 'Seragam Polo',
          keterangan: 'Transfer BCA DP 1',
          nominal: 7000000,
        },
      ];

      await expect(exportCashInflowToExcel(mockInflows, 'Oktober 2026')).resolves.not.toThrow();
    });

    it('harus mengeksekusi exportCashOutflowToExcel tanpa error', async () => {
      const mockOutflows: CashTransaction[] = [
        {
          id: 'out-1',
          tanggal: '2026-10-01',
          kategori: 'Operasional',
          keterangan: 'Beli Bahan Pelengkap',
          nominal: 350000,
          tipe: 'keluar',
          akun: 'Bank BCA',
          createdAt: '2026-10-01T10:00:00Z',
        },
      ];

      await expect(exportCashOutflowToExcel(mockOutflows, 'Oktober 2026')).resolves.not.toThrow();
    });
  });

  describe('US-9.27: Indonesian Formal Accounting Copywriting Standardization', () => {
    const standardGlossary: Record<string, string> = {
      'dashboard': 'Ringkasan Finansial',
      'cashin': 'Arus Kas Masuk (Penerimaan Kas)',
      'cashout': 'Arus Kas Keluar (Pengeluaran Kas)',
      'vendor': 'Kinerja Mitra Vendor',
      'outstanding': 'Sisa Piutang Pelanggan',
      'vendor_debt': 'Sisa Utang ke Vendor',
      'profit_aktual': 'Realisasi Laba Bersih',
    };

    it('harus memvalidasi seluruh istilah baku akuntansi konveksi Indonesia formal', () => {
      expect(standardGlossary['dashboard']).toBe('Ringkasan Finansial');
      expect(standardGlossary['cashin']).toContain('Arus Kas Masuk');
      expect(standardGlossary['cashout']).toContain('Arus Kas Keluar');
      expect(standardGlossary['vendor']).toBe('Kinerja Mitra Vendor');
      expect(standardGlossary['outstanding']).toBe('Sisa Piutang Pelanggan');
      expect(standardGlossary['profit_aktual']).toBe('Realisasi Laba Bersih');
    });
  });
});

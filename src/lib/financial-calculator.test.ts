import { describe, it, expect } from 'vitest';
import {
  calculateEscrowAllocation,
  calculateFinancialSummary,
} from './financial-calculator';
import type { Order, CashTransaction } from '@/types';

describe('VisualKain Financial Calculator Engine', () => {
  describe('Simulasi Riil Kasus Klien (design.md Seksi 2.2)', () => {
    const baseOrder: Order = {
      id: 'ord-001',
      noInv: 'INV-2026-001',
      customerName: 'CV Sinar Tekstil',
      tanggalOrder: '2026-10-01',
      totalInvoice: 1420000,
      totalHpp: 986000,
      targetMargin: 434000,
      pembayaranList: [],
      totalUangMasukCustomer: 0,
      statusPembayaran: 'belum_bayar',
      totalDibayarKeVendor: 0,
      statusPembayaranVendor: 'belum_bayar',
    };

    it('Langkah 1: Customer bayar DP Rp 500.000', () => {
      const orderStep1: Order = {
        ...baseOrder,
        totalUangMasukCustomer: 500000,
        statusPembayaran: 'parsial',
      };

      const result = calculateEscrowAllocation(orderStep1);

      // Proporsi HPP: 500.000 * (986.000 / 1.420.000) ~ 347.183
      expect(Math.round(result.alokasiHakVendor)).toBe(347183);
      // Proporsi Margin: 500.000 * (434.000 / 1.420.000) ~ 152.817
      expect(Math.round(result.alokasiMarginVisualKain)).toBe(152817);
      // Sisa piutang: 1.420.000 - 500.000 = 920.000
      expect(result.sisaPiutangCustomer).toBe(920000);
      // Sisa utang vendor masih penuh 986.000 karena belum dibayarkan ke vendor
      expect(result.sisaUtangVendor).toBe(986000);
    });

    it('Langkah 2: VisualKain bayar DP Vendor Rp 300.000', () => {
      const orderStep2: Order = {
        ...baseOrder,
        totalUangMasukCustomer: 500000,
        totalDibayarKeVendor: 300000,
        statusPembayaranVendor: 'dp_vendor',
      };

      const result = calculateEscrowAllocation(orderStep2);

      // Sisa utang vendor berkurang: 986.000 - 300.000 = 686.000
      expect(result.sisaUtangVendor).toBe(686000);
      // Margin tetap utuh tidak terpotong!
      expect(Math.round(result.alokasiMarginVisualKain)).toBe(152817);
    });

    it('Langkah 4: Pelunasan Customer (Total Uang Masuk Rp 1.420.000)', () => {
      const orderStep4: Order = {
        ...baseOrder,
        totalUangMasukCustomer: 1420000,
        totalDibayarKeVendor: 300000,
        statusPembayaran: 'lunas',
      };

      const result = calculateEscrowAllocation(orderStep4);

      // Piutang customer lunas
      expect(result.sisaPiutangCustomer).toBe(0);
      // Seluruh target margin terealisasi
      expect(Math.round(result.alokasiMarginVisualKain)).toBe(434000);
      // Alokasi hak vendor terpenuhi penuh
      expect(Math.round(result.alokasiHakVendor)).toBe(986000);
    });

    it('Langkah 5: Pelunasan Vendor (Total Dibayar ke Vendor Rp 986.000)', () => {
      const orderStep5: Order = {
        ...baseOrder,
        totalUangMasukCustomer: 1420000,
        totalDibayarKeVendor: 986000,
        statusPembayaran: 'lunas',
        statusPembayaranVendor: 'lunas_vendor',
      };

      const result = calculateEscrowAllocation(orderStep5);

      expect(result.sisaUtangVendor).toBe(0);
      expect(result.sisaPiutangCustomer).toBe(0);
      expect(Math.round(result.alokasiMarginVisualKain)).toBe(434000);
    });
  });

  describe('Ringkasan Finansial Arus Kas Riil (calculateFinancialSummary)', () => {
    it('menghitung saldo kas riil secara tepat dan tidak negatif', () => {
      const saldoAwal = 1000000; // Saldo awal bank Rp 1.000.000

      const transactions: CashTransaction[] = [
        {
          id: 'tx-1',
          tanggal: '2026-10-02',
          tipe: 'masuk',
          nominal: 500000,
          kategori: 'Penerimaan Konsumen',
          keterangan: 'DP Order 1',
        },
        {
          id: 'tx-2',
          tanggal: '2026-10-03',
          tipe: 'keluar',
          nominal: 300000,
          kategori: 'Pembayaran Vendor',
          keterangan: 'DP Vendor Order 1',
        },
        {
          id: 'tx-3',
          tanggal: '2026-10-04',
          tipe: 'keluar',
          nominal: 150000,
          kategori: 'Operasional',
          keterangan: 'Beban Listrik & Internet',
        },
      ];

      const orders: Order[] = [
        {
          id: 'ord-1',
          noInv: 'INV-1',
          customerName: 'Klien A',
          tanggalOrder: '2026-10-01',
          totalInvoice: 1420000,
          totalHpp: 986000,
          targetMargin: 434000,
          pembayaranList: [],
          totalUangMasukCustomer: 500000,
          statusPembayaran: 'parsial',
          totalDibayarKeVendor: 300000,
          statusPembayaranVendor: 'dp_vendor',
        },
      ];

      const summary = calculateFinancialSummary(saldoAwal, transactions, orders);

      // Kas Masuk = 500.000
      expect(summary.totalKasMasuk).toBe(500000);
      // Kas Keluar = 300.000 + 150.000 = 450.000
      expect(summary.totalKasKeluar).toBe(450000);
      // Saldo Kas Riil Bank = 1.000.000 + 500.000 - 450.000 = 1.050.000
      expect(summary.saldoKasRiil).toBe(1050000);
      // Sisa Utang Vendor = 986.000 - 300.000 = 686.000
      expect(summary.totalUtangVendor).toBe(686000);
      // Sisa Piutang Customer = 1.420.000 - 500.000 = 920.000
      expect(summary.totalPiutangCustomer).toBe(920000);
      // Estimasi Profit Bersih = Margin Masuk (152.817) - Beban Ops (150.000) ~ 2.817
      expect(Math.round(summary.estimasiProfitBersih)).toBe(2817);
    });
  });
});

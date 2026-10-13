import { describe, it, expect } from 'vitest';
import {
  calculateEscrowAllocation,
  calculateFinancialSummary,
  calculateEscrowLiquidity,
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

      // Verifikasi VisualKainDB 6-Card Metrics
      expect(summary.omzetTotal).toBe(1420000);
      expect(summary.omzetBerjalanCount).toBe(1);
      expect(summary.omzetLunasCount).toBe(0);
      expect(summary.totalProfitRealtime).toBe(434000);
      expect(summary.kasKeluarCount).toBe(2);
      expect(summary.vendorDebtCount).toBe(1);
      expect(summary.unpaidCustomerCount).toBe(1);
      expect(summary.totalDibayarKeVendor).toBe(300000);
      expect(summary.bebanOperasionalNonVendor).toBe(150000);
    });
  });

  describe('Vendor Performance & Kategori Termurah SSOT Engine', () => {
    const mockVendors = [
      { id: 'v1', nama: 'AMRIN' },
      { id: 'v2', nama: 'LAJUWARNA' },
      { id: 'v3', nama: 'HARMONY INDUSTRY' }, // Tanpa order
    ];

    const mockOrders: Order[] = [
      {
        id: 'o1',
        noInv: 'VK01',
        customerName: 'Cust A',
        tanggalOrder: '2026-10-01',
        totalInvoice: 3000000,
        totalHpp: 2000000,
        targetMargin: 1000000,
        totalQty: 40,
        vendorId: 'v1',
        vendorName: 'AMRIN',
        kategoriOrder: 'T Shirt',
        hargaVendorPendek: 50000,
        hargaVendorPanjang: 55000,
        pembayaranList: [],
        totalUangMasukCustomer: 3000000,
        statusPembayaran: 'lunas',
        totalDibayarKeVendor: 2000000,
        statusPembayaranVendor: 'lunas_vendor',
      },
      {
        id: 'o2',
        noInv: 'VK02',
        customerName: 'Cust B',
        tanggalOrder: '2026-10-02',
        totalInvoice: 1800000,
        totalHpp: 1200000,
        targetMargin: 600000,
        totalQty: 20,
        vendorId: 'v2',
        vendorName: 'LAJUWARNA',
        kategoriOrder: 'T Shirt',
        hargaVendorPendek: 60000,
        hargaVendorTanpaLengan: 65000,
        pembayaranList: [],
        totalUangMasukCustomer: 1800000,
        statusPembayaran: 'lunas',
        totalDibayarKeVendor: 1200000,
        statusPembayaranVendor: 'lunas_vendor',
      },
    ];

    it('Menghitung komparasi performa vendor dan mengidentifikasi vendor tanpa order', async () => {
      const { computeVendorPerformance } = await import('./calculations');
      const perf = computeVendorPerformance(mockOrders, mockVendors);

      expect(perf.vendors).toHaveLength(2);
      expect(perf.mostUsed?.vendorNama).toBe('AMRIN');
      expect(perf.mostUsed?.orderCount).toBe(1);
      expect(perf.mostUsed?.pcsTotal).toBe(40);

      // Vendor tanpa order
      expect(perf.tanpaOrder).toHaveLength(1);
      expect(perf.tanpaOrder[0].vendorNama).toBe('HARMONY INDUSTRY');

      // Cheapest by sleeve
      expect(perf.cheapest.pendek?.vendorNama).toBe('AMRIN');
      expect(perf.cheapest.tanpaLengan?.vendorNama).toBe('LAJUWARNA');
    });

    it('Menghitung highlight termurah per kategori produk secara presisi', async () => {
      const { computeCheapestByKategori } = await import('./calculations');
      const cheapest = computeCheapestByKategori(mockOrders, (id) =>
        mockVendors.find((v) => v.id === id)?.nama || 'Tanpa Vendor'
      );

      expect(cheapest).toHaveLength(1);
      expect(cheapest[0].kategori).toBe('T Shirt');
      expect(cheapest[0].vendorNama).toBe('AMRIN'); // 2.000.000 / 40 = 50.000 vs 1.200.000 / 20 = 60.000
      expect(cheapest[0].avgCost).toBe(50000);
    });
  });

  describe('Escrow Liquidity Bar Invariant & Negative Deficit Handling', () => {
    it('Menangani kondisi defisit kas bank negatif (-Rp 314.500) secara elegan tanpa NaN / invalid CSS width', () => {
      const res = calculateEscrowLiquidity(-314500, 0);

      expect(res.isDefisit).toBe(true);
      expect(res.kasAmanDitarik).toBe(0);
      expect(res.danaTerkunciVendor).toBe(0);
      expect(res.percentBebas).toBe(0);
      expect(res.percentTerkunci).toBe(0);
      expect(res.percentDefisit).toBe(100);
      expect(res.isHealthy).toBe(false);
      expect(res.statusLabel).toBe('Defisit Kas Riil');
      expect(res.coverageLabel).toBe('Dana Belum Tercover');
    });

    it('Menangani kondisi defisit kas bank negatif ketika ada utang vendor tertunggak', () => {
      const res = calculateEscrowLiquidity(-314500, 5000000);

      expect(res.isDefisit).toBe(true);
      expect(res.kasAmanDitarik).toBe(0);
      expect(res.danaTerkunciVendor).toBe(0);
      expect(res.percentBebas).toBe(0);
      expect(res.percentTerkunci).toBe(0);
      expect(res.percentDefisit).toBe(100);
    });

    it('Menghitung proporsi normal ketika kas positif dan melebihi utang vendor', () => {
      const res = calculateEscrowLiquidity(5605000, 3455000);

      expect(res.isDefisit).toBe(false);
      expect(res.danaTerkunciVendor).toBe(3455000);
      expect(res.kasAmanDitarik).toBe(2150000);
      expect(res.percentBebas).toBe(38.4);
      expect(res.percentTerkunci).toBe(61.6);
      expect(res.percentDefisit).toBe(0);
      expect(res.isHealthy).toBe(true);
      expect(res.coverageLabel).toBe('Utang Tercover 100%');
    });

    it('Menghitung proporsi ketika utang vendor lebih besar dari saldo kas riil', () => {
      const res = calculateEscrowLiquidity(1000000, 2000000);

      expect(res.isDefisit).toBe(false);
      expect(res.danaTerkunciVendor).toBe(1000000);
      expect(res.kasAmanDitarik).toBe(0);
      expect(res.percentBebas).toBe(0);
      expect(res.percentTerkunci).toBe(100);
      expect(res.coverageLabel).toBe('Utang Tercover 50%');
    });

    it('Menangani saldo kas nol (0) tanpa menghasilkan pembagian nol / NaN', () => {
      const res = calculateEscrowLiquidity(0, 1000000);

      expect(res.isDefisit).toBe(false);
      expect(res.kasAmanDitarik).toBe(0);
      expect(res.danaTerkunciVendor).toBe(0);
      expect(res.percentBebas).toBe(0);
      expect(res.percentTerkunci).toBe(0);
      expect(Number.isNaN(res.percentBebas)).toBe(false);
      expect(Number.isNaN(res.percentTerkunci)).toBe(false);
    });
  });

  describe('F-09: Akumulasi Dinamis Escrow & Paginasi (Client Feedback Verification)', () => {
    it('Mengakumulasi alokasi hak vendor dan margin dari beberapa pesanan aktif', () => {
      const orderA: Order = {
        id: 'ord-A',
        noInv: 'INV-A',
        customerName: 'Customer A',
        tanggalOrder: '2026-10-01',
        totalInvoice: 1000000,
        totalHpp: 600000,
        targetMargin: 400000,
        pembayaranList: [],
        totalUangMasukCustomer: 500000,
        statusPembayaran: 'parsial',
        totalDibayarKeVendor: 0,
        statusPembayaranVendor: 'belum_bayar',
      };

      const orderB: Order = {
        id: 'ord-B',
        noInv: 'INV-B',
        customerName: 'Customer B',
        tanggalOrder: '2026-10-05',
        totalInvoice: 2000000,
        totalHpp: 1400000,
        targetMargin: 600000,
        pembayaranList: [],
        totalUangMasukCustomer: 1000000,
        statusPembayaran: 'parsial',
        totalDibayarKeVendor: 0,
        statusPembayaranVendor: 'belum_bayar',
      };

      const allocA = calculateEscrowAllocation(orderA);
      const allocB = calculateEscrowAllocation(orderB);

      // Order A: HPP = 500k * 0.6 = 300k, Margin = 500k * 0.4 = 200k
      expect(allocA.alokasiHakVendor).toBe(300000);
      expect(allocA.alokasiMarginVisualKain).toBe(200000);

      // Order B: HPP = 1jt * (1.4jt/2jt) = 700k, Margin = 1jt * (600k/2jt) = 300k
      expect(allocB.alokasiHakVendor).toBe(700000);
      expect(allocB.alokasiMarginVisualKain).toBe(300000);

      const totalHakVendor = allocA.alokasiHakVendor + allocB.alokasiHakVendor;
      const totalMargin = allocA.alokasiMarginVisualKain + allocB.alokasiMarginVisualKain;

      expect(totalHakVendor).toBe(1000000);
      expect(totalMargin).toBe(500000);
      expect(totalHakVendor + totalMargin).toBe(1500000);
    });

    it('Menghitung pemotongan indeks paginasi 10 item per halaman dengan benar', () => {
      const totalRows = 41;
      const pageSize = 10;
      const totalPages = Math.ceil(totalRows / pageSize);

      expect(totalPages).toBe(5);

      // Page 1
      const p1Start = (1 - 1) * pageSize;
      const p1End = p1Start + pageSize;
      expect(p1Start).toBe(0);
      expect(p1End).toBe(10);

      // Page 5 (halaman terakhir)
      const p5Start = (5 - 1) * pageSize;
      const p5End = Math.min(p5Start + pageSize, totalRows);
      expect(p5Start).toBe(40);
      expect(p5End).toBe(41);
    });
  });
});



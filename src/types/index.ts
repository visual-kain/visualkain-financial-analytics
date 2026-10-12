/**
 * Kontrak Tipe Data Finansial VisualKain 2026
 * Sumber Spesifikasi: docs/specs/design.md & Dokumen_Konfirmasi_Fitur_Update_VisualKain.pdf
 */

export type FinanceSubTab = 'dashboard' | 'cashin' | 'cashout' | 'vendor' | 'manual';

export type InflowCategoryType = 'dp' | 'termin' | 'pelunasan' | 'kas_masuk';

export interface CashInflowEntry {
  id: string;
  tanggal: string;              // YYYY-MM-DD
  sumber: 'order' | 'manual';   // 'order' dari invoice konsumen, 'manual' dari koleksi kas
  jenis: InflowCategoryType;
  noInv?: string;               // Referensi nomor invoice (misal: 'VK260041')
  orderId?: string;             // ID order untuk inspeksi drilldown
  customerName: string;         // Nama customer atau sumber dana
  projectName?: string;         // Nama project pesanan
  keterangan: string;           // Keterangan / catatan pembayaran
  nominal: number;              // Jumlah rupiah masuk
  rawOrder?: Order;             // Referensi order lengkap untuk modal inspeksi
}

export interface CustomerPayment {
  id: string;               // ID unik pembayaran
  orderId: string;          // Relasi ke order.id
  noInv: string;            // Nomor invoice acuan
  tanggal: string;          // Format YYYY-MM-DD
  nominal: number;          // Nominal rupiah yang dibayarkan
  jenis: 'dp' | 'termin' | 'pelunasan'; // Tipe pembayaran
  keterangan?: string;      // Contoh: "Transfer BCA Termin 1"
  buktiUrl?: string;        // URL bukti transfer (opsional)
  createdAt: string;
}

export interface VendorPayment {
  id: string;
  orderId: string;
  vendorId?: string;
  vendorName: string;
  tanggal: string;
  nominal: number;
  jenis: 'dp_vendor' | 'termin_vendor' | 'pelunasan_vendor';
  keterangan?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  noInv: string;
  customerName: string;
  projectName?: string;
  tanggalOrder: string;
  totalInvoice: number;      // Nilai tagihan bruto ke customer
  totalHpp: number;          // Total beban pokok / tagihan vendor
  targetMargin: number;      // totalInvoice - totalHpp
  totalQty?: number;
  biayaOperasional?: number;
  biayaTambahanVendor?: number;
  biayaTambahanCustomer?: number;
  diskon?: number;

  noWaCustomer?: string;     // Nomor WhatsApp Customer (format 08... atau 62...)
  targetDpPersen?: number;   // Ambang batas DP produksi (default 70%)

  vendorId?: string;
  vendorName?: string;
  kategoriOrder?: string;
  hargaVendorPendek?: number;
  hargaVendorPanjang?: number;
  hargaVendorTanpaLengan?: number;

  // Realisasi Aktual
  hppAktual?: number | null;
  profitAktual?: number | null;
  catatanFinance?: string;

  // Riwayat Pembayaran Bertahap Konsumen
  pembayaranList: CustomerPayment[];
  totalUangMasukCustomer: number; // Akumulasi pembayaran konsumen
  statusPembayaran: 'belum_bayar' | 'parsial' | 'lunas';

  // Riwayat Pembayaran Bertahap Vendor
  vendorPembayaranList?: VendorPayment[];
  totalDibayarKeVendor: number;   // Akumulasi kas keluar ke vendor
  statusPembayaranVendor: 'belum_bayar' | 'dp_vendor' | 'lunas_vendor';
  statusOrder?: string;           // Status pengerjaan ('PRODUKSI', 'SELESAI', 'PEMBAYARAN', dll)
  namaCustomer?: string;
  namaProject?: string;
  [key: string]: any;
}

export type MetricDrawerType =
  | 'omzet'
  | 'profit'
  | 'saldo'
  | 'cashout'
  | 'vendor_debt'
  | 'outstanding';

export interface VendorDebtBreakdown {
  vendorName: string;
  totalHpp: number;
  totalDibayar: number;
  sisaUtang: number;
  orderCount: number;
  orders: Order[];
}

export interface MasterFinanceRow {
  id: string;
  noInv: string;
  tanggalInv: string;
  namaCustomer: string;
  namaProject: string;
  noWaCustomer?: string;
  totalBiayaVendor: number;
  dpVendor: number;
  sisaPembayaranVendor: number;
  totalQty: number;
  totalJumlah: number;
  dpPersenCustomer: number;
  nominalDpCustomer: number;
  sisaPelunasanCustomer: number;
  biayaOperasional: number;
  biayaTambahanVendor: number;
  biayaTambahanCustomer: number;
  diskon: number;
  profitBersih: number;
  profitPercent: number;
  statusDpThreshold: 'belum_dp' | 'dp1_parsial' | 'dp2_siap_produksi' | 'lunas_total';
  sisaMenujuDp70: number;
  statusOrder: string;
  pembayaranList?: CustomerPayment[];
  vendorName?: string;
  originalOrder?: any;
  [key: string]: any;
}

export interface KasAdjustment {
  id: string;
  tanggal: string;
  nominalAwal: number;     // Saldo kas awal bank
  keterangan: string;      // Contoh: "Sinkronisasi saldo rekening BCA per 1 Oktober 2026"
  createdAt: string;
}

export type CashOutflowCategory =
  | 'Gaji/Upah'
  | 'Operasional'
  | 'Marketing dan Penjualan'
  | 'Logistik'
  | 'Keuangan'
  | 'Pajak'
  | 'Pembayaran Vendor'
  | 'Biaya Lain';

export interface CashTransaction {
  id: string;
  tanggal: string;
  tipe: 'masuk' | 'keluar';
  nominal: number;
  kategori: CashOutflowCategory | 'Penerimaan Konsumen' | 'Saldo Awal';
  keterangan: string;
  refInvoice?: string;
  orderId?: string;
}

export interface EscrowAllocation {
  totalInvoice: number;
  totalHpp: number;
  marginTarget: number;
  uangMasukRiil: number;
  alokasiHakVendor: number;
  alokasiMarginVisualKain: number;
  sisaUtangVendor: number;
  sisaPiutangCustomer: number;
}

export interface EscrowLiquidityCalculation {
  kasAmanDitarik: number;
  danaTerkunciVendor: number;
  percentBebas: number;
  percentTerkunci: number;
  percentDefisit: number;
  isDefisit: boolean;
  isHealthy: boolean;
  statusLabel: string;
  coverageLabel: string;
}

export interface FinancialSummary {
  saldoKasRiil: number;
  totalKasMasuk: number;
  totalKasKeluar: number;
  totalUtangVendor: number;
  totalPiutangCustomer: number;
  estimasiProfitBersih: number;

  // VisualKainDB 6-Card Executive Extensions
  omzetTotal: number;
  omzetLunasCount: number;
  omzetBerjalanCount: number;
  totalProfitRealtime: number;
  profitMarginPercent: number;
  kasKeluarCount: number;
  vendorDebtCount: number;
  unpaidCustomerCount: number;
  totalDibayarKeVendor: number;
  bebanOperasionalNonVendor: number;
  bebanOperasionalOrders?: number;
  bebanOperasionalKas?: number;
}

export interface VendorPerformanceItem {
  vendorId: string;
  vendorNama: string;
  orderCount: number;
  pcsTotal: number;
  avgLenganPendek: number;
  avgLenganPanjang: number;
  avgTanpaLengan: number;
  hppQuotation: number;
  hppAktual: number;
  selisihQuotation: number;
  profit: number;
  marginPercent: number;
}

export interface CheapestByCategory {
  kategori: string;
  vendorNama: string;
  avgCost: number;
  orderCount?: number;
  pcs?: number;
}

export interface VendorPerformanceResult {
  vendors: VendorPerformanceItem[];
  cheapest: {
    pendek?: VendorPerformanceItem;
    panjang?: VendorPerformanceItem;
    tanpaLengan?: VendorPerformanceItem;
  };
  mostUsed?: VendorPerformanceItem;
  tanpaOrder: Array<{ vendorId: string; vendorNama: string }>;
}

export interface ManualFinanceDraft {
  orderId: string;
  hppAktual: string;
  profitAktual: string;
  catatanFinance: string;
}

'use client';

import React, { useState, useMemo } from 'react';
import { useQueryState } from 'nuqs';
import { Sidebar } from '@/components/layout/Sidebar';
import { EscrowLiquidityBar } from '@/components/finance/EscrowLiquidityBar';
import { FinanceStatsGrid } from '@/components/analytics/FinanceStatsGrid';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';
import { MasterFinanceTable } from '@/components/finance/MasterFinanceTable';
import { OrderInspectionDrawer } from '@/components/finance/OrderInspectionDrawer';
import { MetricDetailDrawer } from '@/components/analytics/MetricDetailDrawer';
import { AddIncomeModal } from '@/components/finance/AddIncomeModal';
import { EditFinanceModal } from '@/components/finance/EditFinanceModal';
import { InvoicePreviewModal } from '@/components/finance/InvoicePreviewModal';
import { CashOutflowSection } from '@/components/finance/CashOutflowSection';
import { VendorPerformanceSection } from '@/components/finance/VendorPerformanceSection';
import { ProfitAktualSection } from '@/components/finance/ProfitAktualSection';
import { CustomSelect } from '@/components/ui/custom-select';
import { calculateFinancialSummary } from '@/lib/financial-calculator';
import { computeVendorPerformance, computeCheapestByKategori } from '@/lib/calculations';
import { useFirebaseFinance } from '@/hooks/useFirebaseFinance';
import { useAuth } from '@/context/AuthContext';
import type {
  FinanceSubTab,
  Order,
  MasterFinanceRow,
  CashTransaction,
  ManualFinanceDraft,
  MetricDrawerType,
} from '@/types';
import { Toaster, toast } from 'sonner';
import {
  Calendar,
  ShieldCheck,
  Download,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  LogOut,
  UserCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';


// Initial Seed Dataset (Fallback & Ground Truth)
const initialOrdersData: Order[] = [
  {
    id: 'ord-41',
    noInv: 'VK260041',
    customerName: 'XBI SUKABUMI',
    projectName: 'LAMPUNG EXPEDITION',
    noWaCustomer: '08123456789',
    tanggalOrder: '2026-10-07',
    totalInvoice: 1420000,
    totalHpp: 1020000,
    targetMargin: 400000,
    totalQty: 14,
    biayaOperasional: 0,
    biayaTambahanVendor: 34000,
    biayaTambahanCustomer: 0,
    diskon: 0,
    vendorName: 'CAHAYA BORDIR',
    hppAktual: 1020000,
    profitAktual: 434000,
    catatanFinance: 'Revisi sablon aman',
    pembayaranList: [
      {
        id: 'p-41-1',
        orderId: 'ord-41',
        noInv: 'VK260041',
        tanggal: '2026-10-07',
        nominal: 810000,
        jenis: 'dp',
        keterangan: 'DP 1 Transfer BCA',
        createdAt: '2026-10-07T09:00:00Z',
      },
    ],
    totalUangMasukCustomer: 810000,
    statusPembayaran: 'parsial',
    totalDibayarKeVendor: 700000,
    statusPembayaranVendor: 'dp_vendor',
    statusOrder: 'PRODUKSI',
  },
  {
    id: 'ord-40',
    noInv: 'VK260040',
    customerName: 'VISUALKAIN',
    projectName: 'WORK JAKET FILOSOPHY',
    noWaCustomer: '08987654321',
    tanggalOrder: '2026-10-07',
    totalInvoice: 3000000,
    totalHpp: 2400000,
    targetMargin: 600000,
    totalQty: 12,
    biayaOperasional: 0,
    biayaTambahanVendor: 0,
    biayaTambahanCustomer: 0,
    diskon: 0,
    vendorName: 'FJ MERCHANDISE',
    hppAktual: 2400000,
    profitAktual: 600000,
    catatanFinance: '',
    pembayaranList: [
      {
        id: 'p-40-1',
        orderId: 'ord-40',
        noInv: 'VK260040',
        tanggal: '2026-10-07',
        nominal: 700000,
        jenis: 'dp',
        keterangan: 'DP 1 Tokopedia',
        createdAt: '2026-10-07T11:00:00Z',
      },
    ],
    totalUangMasukCustomer: 700000,
    statusPembayaran: 'parsial',
    totalDibayarKeVendor: 1000000,
    statusPembayaranVendor: 'dp_vendor',
    statusOrder: 'PRODUKSI',
  },
  {
    id: 'ord-39',
    noInv: 'VK260039',
    customerName: 'ADAM',
    projectName: 'Seragam PDL Himpunan',
    noWaCustomer: '08561234567',
    tanggalOrder: '2026-10-06',
    totalInvoice: 8835000,
    totalHpp: 5735000,
    targetMargin: 3100000,
    totalQty: 45,
    biayaOperasional: 0,
    biayaTambahanVendor: 500000,
    biayaTambahanCustomer: 900000,
    diskon: 0,
    vendorName: 'CAHAYA BORDIR',
    hppAktual: 5735000,
    profitAktual: 3100000,
    catatanFinance: 'Bordir emblem rapi',
    pembayaranList: [
      {
        id: 'p-39-1',
        orderId: 'ord-39',
        noInv: 'VK260039',
        tanggal: '2026-10-06',
        nominal: 3500000,
        jenis: 'dp',
        keterangan: 'DP 1 (Booking & Antrean Bahan) - Transfer BCA',
        createdAt: '2026-10-06T10:00:00Z',
      },
      {
        id: 'p-39-2',
        orderId: 'ord-39',
        noInv: 'VK260039',
        tanggal: '2026-10-06',
        nominal: 2684500,
        jenis: 'termin',
        keterangan: 'DP 2 (Genap 70% Naik Potong) - Transfer Mandiri',
        createdAt: '2026-10-06T15:30:00Z',
      },
    ],
    totalUangMasukCustomer: 6184500,
    statusPembayaran: 'parsial',
    totalDibayarKeVendor: 4000000,
    statusPembayaranVendor: 'dp_vendor',
    statusOrder: 'PRODUKSI',
  },
  {
    id: 'ord-38',
    noInv: 'VK260038',
    customerName: 'OM SEDORF',
    projectName: 'BAJU POLO EUPA',
    noWaCustomer: '087711223344',
    tanggalOrder: '2026-09-02',
    totalInvoice: 3785000,
    totalHpp: 2805000,
    targetMargin: 980000,
    totalQty: 28,
    biayaOperasional: 0,
    biayaTambahanVendor: 0,
    biayaTambahanCustomer: 0,
    diskon: 0,
    vendorName: 'AMRIN',
    hppAktual: 2805000,
    profitAktual: 880000,
    catatanFinance: 'Ongkir tambahan Rp 100k',
    pembayaranList: [
      {
        id: 'p-38-1',
        orderId: 'ord-38',
        noInv: 'VK260038',
        tanggal: '2026-09-02',
        nominal: 3785000,
        jenis: 'pelunasan',
        keterangan: 'Pelunasan Penuh Transfer BCA',
        createdAt: '2026-09-02T16:00:00Z',
      },
    ],
    totalUangMasukCustomer: 3785000,
    statusPembayaran: 'lunas',
    totalDibayarKeVendor: 2805000,
    statusPembayaranVendor: 'lunas_vendor',
    statusOrder: 'SELESAI',
  },
];

const initialCashTransactions: CashTransaction[] = [
  { id: 'tx-1', tanggal: '2026-10-10', tipe: 'keluar', nominal: 300000, kategori: 'Gaji/Upah', keterangan: 'Biaya finance' },
  { id: 'tx-2', tanggal: '2026-10-10', tipe: 'keluar', nominal: 484000, kategori: 'Biaya Lain', keterangan: 'Biaya Handphone raja' },
  { id: 'tx-3', tanggal: '2026-10-09', tipe: 'keluar', nominal: 177500, kategori: 'Biaya Lain', keterangan: 'Biaya Illustrator' },
  { id: 'tx-4', tanggal: '2026-10-09', tipe: 'keluar', nominal: 201000, kategori: 'Biaya Lain', keterangan: 'Biaya pinjaman wawa' },
  { id: 'tx-5', tanggal: '2026-10-08', tipe: 'keluar', nominal: 100000, kategori: 'Biaya Lain', keterangan: 'Operasional RAJA PURNAMA' },
  { id: 'tx-6', tanggal: '2026-10-06', tipe: 'keluar', nominal: 102500, kategori: 'Biaya Lain', keterangan: 'Biaya illustrator' },
  { id: 'tx-7', tanggal: '2026-10-02', tipe: 'keluar', nominal: 14000, kategori: 'Biaya Lain', keterangan: 'Biaya Admin atm' },
];

function transformToMasterRows(orders: Order[]): MasterFinanceRow[] {
  return orders.map((o) => {
    const totalJumlah = o.totalInvoice;
    const nominalDpCustomer = o.totalUangMasukCustomer;
    const dpPersenCustomer = totalJumlah > 0 ? (nominalDpCustomer / totalJumlah) * 100 : 0;
    const sisaPelunasanCustomer = Math.max(0, totalJumlah - nominalDpCustomer);
    const sisaPembayaranVendor = Math.max(0, o.totalHpp - o.totalDibayarKeVendor);
    const biayaOperasional = o.biayaOperasional || 0;
    const profitBersih = totalJumlah - o.totalHpp - biayaOperasional;
    const profitPercent = totalJumlah > 0 ? (profitBersih / totalJumlah) * 100 : 0;

    let statusDpThreshold: 'belum_dp' | 'dp1_parsial' | 'dp2_siap_produksi' | 'lunas_total' = 'belum_dp';
    let sisaMenujuDp70 = 0;

    if (dpPersenCustomer >= 100) {
      statusDpThreshold = 'lunas_total';
    } else if (dpPersenCustomer >= 70) {
      statusDpThreshold = 'dp2_siap_produksi';
    } else if (dpPersenCustomer > 0) {
      statusDpThreshold = 'dp1_parsial';
      sisaMenujuDp70 = Math.max(0, 0.7 * totalJumlah - nominalDpCustomer);
    }

    const statusOrder =
      o.statusOrder ||
      (o.statusPembayaran === 'lunas' || dpPersenCustomer >= 100
        ? 'SELESAI'
        : dpPersenCustomer >= 70
        ? 'PRODUKSI'
        : 'PEMBAYARAN');

    return {
      id: o.id,
      noInv: o.noInv,
      tanggalInv: o.tanggalOrder,
      namaCustomer: o.customerName,
      namaProject: o.projectName || '-',
      noWaCustomer: o.noWaCustomer,
      totalBiayaVendor: o.totalHpp,
      dpVendor: o.totalDibayarKeVendor,
      sisaPembayaranVendor,
      totalQty: o.totalQty || 1,
      totalJumlah,
      dpPersenCustomer,
      nominalDpCustomer,
      sisaPelunasanCustomer,
      biayaOperasional,
      biayaTambahanVendor: o.biayaTambahanVendor || 0,
      biayaTambahanCustomer: o.biayaTambahanCustomer || 0,
      diskon: o.diskon || 0,
      profitBersih,
      profitPercent,
      statusDpThreshold,
      sisaMenujuDp70,
      statusOrder,
      pembayaranList: o.pembayaranList,
      vendorName: o.vendorName || '-',
    };
  });
}

function FinancialDashboardContent() {
  const { profile, logout } = useAuth();
  const [tab, setTab] = useQueryState<FinanceSubTab>('tab', {
    defaultValue: 'dashboard',
    parse: (v) => (['dashboard', 'cashout', 'vendor', 'manual'].includes(v) ? (v as FinanceSubTab) : 'dashboard'),
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<MasterFinanceRow | null>(null);
  const [editingOrder, setEditingOrder] = useState<MasterFinanceRow | null>(null);
  const [previewInvoiceOrder, setPreviewInvoiceOrder] = useState<MasterFinanceRow | null>(null);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [activeMetricDrawer, setActiveMetricDrawer] = useState<MetricDrawerType | null>(null);
  const [drawerVendorFilter, setDrawerVendorFilter] = useState<string | null>(null);
  const [bulan, setBulan] = useState<string>('all');
  const [tahun, setTahun] = useState<string>('all');
  const [extraIncomes, setExtraIncomes] = useState<CashTransaction[]>([]);
  const [saldoAwal] = useState<number>(0);

  // Firestore live sync (seluruh koleksi orders + kas + vendors)
  const {
    orders: rawOrders,
    cashTransactions: rawCashTxs,
    vendors: rawVendors,
    syncState,
    updateOrderFinance,
    addKas,
    deleteKas,
  } = useFirebaseFinance(initialOrdersData, initialCashTransactions);

  // Performa vendor dihitung secara menyeluruh (seluruh data order dan vendor terdaftar SSOT)
  const vendorPerformance = useMemo(
    () => computeVendorPerformance(rawOrders, rawVendors),
    [rawOrders, rawVendors]
  );
  const cheapestCategories = useMemo(
    () =>
      computeCheapestByKategori(rawOrders, (id) => {
        const v = rawVendors.find((item) => item.id === id);
        return v ? v.nama : 'Tanpa Vendor';
      }),
    [rawOrders, rawVendors]
  );

  // Periode kartu: default (Semua Bulan + Semua Tahun) = bulan berjalan,
  // sedangkan tabel menampilkan SELURUH data. Aturan sama dengan VisualKainDB.
  const now = new Date();
  const curBulan = String(now.getMonth() + 1).padStart(2, '0');
  const curTahun = String(now.getFullYear());
  const isDefaultMode = bulan === 'all' && tahun === 'all';
  const cardBulan = isDefaultMode ? curBulan : bulan;
  const cardTahun = isDefaultMode ? curTahun : tahun;

  const matchPeriod = (tanggal: string, b: string, y: string) => {
    if (!tanggal) return false;
    if (y !== 'all' && !tanggal.startsWith(y)) return false;
    if (b !== 'all' && tanggal.slice(5, 7) !== b) return false;
    return true;
  };

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    rawOrders.forEach((o) => o.tanggalOrder && set.add(o.tanggalOrder.slice(0, 4)));
    rawCashTxs.forEach((t) => t.tanggal && set.add(t.tanggal.slice(0, 4)));
    return [...set].sort().reverse();
  }, [rawOrders, rawCashTxs]);

  const allCashTransactions = useMemo(() => {
    return [...extraIncomes, ...rawCashTxs];
  }, [extraIncomes, rawCashTxs]);

  // Data tabel & seksi lain: mengikuti dropdown (default = semua data)
  const filteredOrders = useMemo(
    () => rawOrders.filter((o) => matchPeriod(o.tanggalOrder, bulan, tahun)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawOrders, bulan, tahun]
  );
  const filteredCashTxs = useMemo(
    () => allCashTransactions.filter((t) => matchPeriod(t.tanggal, bulan, tahun)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allCashTransactions, bulan, tahun]
  );

  // Data kartu: mengikuti periode kartu
  const cardOrders = useMemo(
    () => rawOrders.filter((o) => matchPeriod(o.tanggalOrder, cardBulan, cardTahun)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawOrders, cardBulan, cardTahun]
  );
  const cardCashTxs = useMemo(
    () => allCashTransactions.filter((t) => matchPeriod(t.tanggal, cardBulan, cardTahun)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allCashTransactions, cardBulan, cardTahun]
  );

  const BULAN_LABEL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const cardPeriodLabel = `${cardBulan === 'all' ? 'Semua Bulan' : BULAN_LABEL[Number(cardBulan) - 1]} ${cardTahun === 'all' ? 'Semua Tahun' : cardTahun}`;
  const selectedPeriod =
    bulan === 'all' && tahun === 'all'
      ? 'Semua Periode'
      : `${bulan === 'all' ? 'Semua Bulan' : BULAN_LABEL[Number(bulan) - 1]} ${tahun === 'all' ? 'Semua Tahun' : tahun}`;

  const summary = calculateFinancialSummary(saldoAwal, cardCashTxs, cardOrders);
  const masterRows = transformToMasterRows(filteredOrders);

  const viewTitles: Record<FinanceSubTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Finance Data Management VisualKain',
      subtitle: 'Master data keuangan, arus kas riil & alokasi pokok vendor vs margin',
    },
    cashout: {
      title: 'Cash Outflow (Dana Keluar)',
      subtitle: 'Pelacakan seluruh beban operasional dan mutasi kas keluar',
    },
    vendor: {
      title: 'Vendor Performance',
      subtitle: 'Highlight mitra termurah per kategori produk & tabel efisiensi belanja',
    },
    manual: {
      title: 'Profit Aktual (Input Manual Finance)',
      subtitle: 'Rekonsiliasi penyesuaian HPP aktual dan realisasi laba bersih di lapangan',
    },
  };

  const handleExportCsv = () => {
    const csvData = masterRows.map((r) => ({
      'No Inv': r.noInv,
      'Tanggal': r.tanggalInv,
      'Nama Customer': r.namaCustomer,
      'Nama Project': r.namaProject,
      'Total Biaya Vendor': r.totalBiayaVendor,
      'DP Vendor': r.dpVendor,
      'Sisa Bayar Vendor': r.sisaPembayaranVendor,
      'Total Qty': r.totalQty,
      'Total Jumlah': r.totalJumlah,
      'DP (%)': r.dpPersenCustomer.toFixed(1) + '%',
      'Nominal DP': r.nominalDpCustomer,
      'Sisa Pelunasan': r.sisaPelunasanCustomer,
      'Biaya Operasional': r.biayaOperasional,
      'Profit Bersih': r.profitBersih,
      'Profit (%)': r.profitPercent.toFixed(1) + '%',
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Finansial');
    XLSX.writeFile(workbook, `VisualKain_Master_Finance_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('File Master Finansial berhasil diekspor!');
  };

  const handleSaveProfitAktual = async (orderId: string, draft: ManualFinanceDraft) => {
    await updateOrderFinance(orderId, {
      hppAktual: draft.hppAktual ? Number(draft.hppAktual) : null,
      profitAktual: draft.profitAktual ? Number(draft.profitAktual) : null,
      catatanFinance: draft.catatanFinance,
    });
  };

  const handleSaveOrderFinance = async (orderId: string, updatedData: Partial<Order>) => {
    await updateOrderFinance(orderId, updatedData);
  };

  const handleAddIncome = (tx: CashTransaction) => {
    setExtraIncomes((prev) => [tx, ...prev]);
  };

  return (
    <div className="flex min-h-screen bg-[#E8ECF2] text-slate-900">
      <Toaster richColors position="top-right" />

      {/* 1. Collapsible / Persistent Executive Sidebar (Ctrl+B) */}
      <Sidebar
        activeTab={tab}
        onSelectTab={setTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        userName={profile?.name || 'Glora Sawita Br Panjaitan'}
        userRole={profile?.role || 'Head of Finance & Accounting'}
        onLogout={logout}
      />


      {/* 2. Slide-Over Order Inspection Drawer */}
      <OrderInspectionDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* 3. Slide-Over Metric Detail Drawer (VisualKainDB 6-Card Drilldown) */}
      <MetricDetailDrawer
        isOpen={!!activeMetricDrawer}
        metricType={activeMetricDrawer}
        onClose={() => setActiveMetricDrawer(null)}
        summary={summary}
        orders={cardOrders}
        transactions={cardCashTxs}
        saldoAwal={saldoAwal}
        initialVendorFilter={drawerVendorFilter}
        onOpenAddIncome={() => {
          setActiveMetricDrawer(null);
          setIsAddIncomeOpen(true);
        }}
        onSelectOrder={(order) => {
          setActiveMetricDrawer(null);
          setSelectedOrder(order);
        }}
      />

      {/* 4. Modal Tambahan Pemasukan Kas Baru */}
      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
        onAddIncome={handleAddIncome}
      />

      {/* 4. Modal Edit Finansial Order */}
      <EditFinanceModal
        isOpen={!!editingOrder}
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSave={handleSaveOrderFinance}
      />

      {/* 5. Modal Preview Invoice Resmi */}
      <InvoicePreviewModal
        isOpen={!!previewInvoiceOrder}
        order={previewInvoiceOrder}
        onClose={() => setPreviewInvoiceOrder(null)}
      />

      {/* 4. Main Content View Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 transition-all duration-300">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Top Executive Header Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
                className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:hidden active:scale-95 transition-all"
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 border border-teal-200">
                    VisualKain Financial 2026
                  </span>
                  <span className="text-xs text-slate-300 hidden sm:inline">&bull;</span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-800 border border-slate-200/90 shadow-2xs">
                    <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                    <span>Halo, Kak Glora Sawita 👋</span>
                  </span>
                  <span className="text-xs text-slate-300 hidden sm:inline">&bull;</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedPeriod}
                  </span>
                </div>
                <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  {viewTitles[tab].title}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewTitles[tab].subtitle}
                </p>
              </div>
            </div>

            {/* Header Right Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <CustomSelect
                value={bulan}
                onValueChange={setBulan}
                icon={<Calendar className="h-3.5 w-3.5" />}
                options={[
                  { value: 'all', label: 'Semua Bulan' },
                  ...BULAN_LABEL.map((label, i) => ({ value: String(i + 1).padStart(2, '0'), label })),
                ]}
              />
              <CustomSelect
                value={tahun}
                onValueChange={setTahun}
                options={[
                  { value: 'all', label: 'Semua Tahun' },
                  ...yearOptions.map((y) => ({ value: y, label: y })),
                ]}
              />

              {tab === 'dashboard' && (
                <>
                  <button
                    onClick={() => setIsAddIncomeOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 active:scale-95 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambahan Pemasukan
                  </button>

                  <button
                    onClick={handleExportCsv}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    Export CSV
                  </button>
                </>
              )}

              {/* Realtime Live Database Status Indicator */}
              {syncState === 'live' ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
                  <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                  Live Firestore ({rawOrders.length} Order)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Sinkron Rekening Bank
                </span>
              )}

              {/* Quick Logout Button */}
              <button
                onClick={logout}
                title="Keluar dari Sesi"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Keluar</span>
              </button>
            </div>

          </div>

          {/* Conditional Sub-Tab Rendering */}
          {tab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Escrow Liquidity Bar (Safe-to-Spend vs Locked Vendor Escrow) */}
              <EscrowLiquidityBar
                saldoKasRiil={summary.saldoKasRiil}
                totalUtangVendor={summary.totalUtangVendor}
                totalKasKeluar={summary.totalKasKeluar}
              />

              {/* Banner periode kartu (kartu = periode berjalan, tabel = seluruh data) */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2 text-xs text-slate-600">
                <span>
                  Laporan Update: <strong className="text-slate-900">{cardPeriodLabel}</strong>
                  <span className="text-slate-400"> (kartu mengikuti bulan berjalan; ubah filter untuk periode lain)</span>
                </span>
                <span className="font-semibold text-slate-500 tabular-nums">
                  Tabel: {filteredOrders.length} dari {rawOrders.length} order
                </span>
              </div>

              {/* 6 KPI Metric Cards with Interactive Slide-Over Detail Drawers */}
              <FinanceStatsGrid
                summary={summary}
                orders={cardOrders}
                orderCountWithDebt={cardOrders.filter((o) => o.totalHpp > o.totalDibayarKeVendor).length}
                activeOrderCount={cardOrders.length}
                onSelectMetric={(metric) => {
                  setActiveMetricDrawer(metric);
                }}
              />

              {/* Recharts Spline & Donut Escrow Allocation */}
              <AnalyticsCharts />

              {/* Master 17-Column Table with Dual-Sticky & Fullscreen Expand */}
              <MasterFinanceTable
                rows={masterRows}
                onSelectRow={(row) => setSelectedOrder(row)}
                onEditFinance={(row) => setEditingOrder(row)}
                onPreviewInvoice={(row) => setPreviewInvoiceOrder(row)}
                onQuickWaFollowUp={(row) => setSelectedOrder(row)}
              />
            </div>
          )}

          {tab === 'cashout' && (
            <div className="animate-fadeIn">
              <CashOutflowSection
                initialEntries={allCashTransactions}
                selectedPeriod={selectedPeriod}
                onAddTransaction={addKas}
                onDeleteTransaction={deleteKas}
              />
            </div>
          )}

          {tab === 'vendor' && (
            <div className="animate-fadeIn">
              <VendorPerformanceSection
                vendors={vendorPerformance.vendors}
                cheapestList={cheapestCategories}
                mostUsedVendor={
                  vendorPerformance.mostUsed
                    ? {
                        nama: vendorPerformance.mostUsed.vendorNama,
                        orderCount: vendorPerformance.mostUsed.orderCount,
                        pcsTotal: vendorPerformance.mostUsed.pcsTotal,
                      }
                    : undefined
                }
                cheapestBySleeve={vendorPerformance.cheapest}
                tanpaOrder={vendorPerformance.tanpaOrder}
              />
            </div>
          )}

          {tab === 'manual' && (
            <div className="animate-fadeIn">
              <ProfitAktualSection
                orders={rawOrders}
                onSave={handleSaveProfitAktual}
              />
            </div>
          )}

          {/* Footer Audit Trail */}
          <footer className="border-t border-slate-200/80 pt-4 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              VisualKain Financial Data & Analytics &bull; Metodologi Spec-Driven Development (SDD)
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Formula Akuntansi Terverifikasi Vitest & Dual-Sticky Frozen Table Columns
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function FinancialDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#E8ECF2] text-slate-600 font-mono text-xs">
          Memuat VisualKain Financial Analytics...
        </div>
      }
    >
      <FinancialDashboardContent />
    </React.Suspense>
  );
}

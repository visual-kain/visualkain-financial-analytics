'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { FinanceStatsGrid } from '@/components/analytics/FinanceStatsGrid';
import { AnalyticsCharts, type DonutDataPoint, type TrendDataPoint } from '@/components/analytics/AnalyticsCharts';
import { MasterFinanceTable } from '@/components/finance/MasterFinanceTable';
import { OrderInspectionDrawer } from '@/components/finance/OrderInspectionDrawer';
import { MetricDetailDrawer } from '@/components/analytics/MetricDetailDrawer';
import { InvoicePreviewModal } from '@/components/finance/InvoicePreviewModal';
import { CashInflowSection } from '@/components/finance/CashInflowSection';
import { CashOutflowSection } from '@/components/finance/CashOutflowSection';
import { VendorPerformanceSection } from '@/components/finance/VendorPerformanceSection';
import { ProfitAktualSection } from '@/components/finance/ProfitAktualSection';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  calculateFinancialSummary,
  calculateEscrowAllocation,
  transformToMasterRows,
  buildCashOutflowEntries,
} from '@/lib/financial-calculator';
import { computeVendorPerformance, computeCheapestByKategori } from '@/lib/calculations';
import { initialOrdersData, initialCashTransactions } from '@/lib/seed-data';
import { useFirebaseFinance } from '@/hooks/useFirebaseFinance';
import { useAuth } from '@/context/AuthContext';
import type {
  FinanceSubTab,
  MasterFinanceRow,
  ManualFinanceDraft,
  MetricDrawerType,
} from '@/types';
import { Toaster, toast } from 'sonner';
import {
  Calendar,
  ShieldCheck,
  Download,
  Plus,
  Minus,
  LogOut,
  UserCheck,
  AlertCircle,
  Table2,
  ArrowRight,
} from 'lucide-react';
import { formatDateTick, formatRupiah } from '@/lib/utils';
import { exportMasterFinanceToExcel } from '@/lib/excel-export';

function FinancialDashboardContent() {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [dev] = useQueryState('dev', { defaultValue: '' });
  const isDevMode = dev === 'true';

  const [tab, setTab] = useQueryState<FinanceSubTab>('tab', {
    defaultValue: 'dashboard',
    parse: (v) => {
      if (['dashboard', 'datatable', 'cashin', 'cashout', 'vendor'].includes(v)) return v as FinanceSubTab;
      if (v === 'manual') return 'manual';
      return 'dashboard';
    },
  });

  React.useEffect(() => {
    if (tab === 'manual' && !isDevMode) {
      setTab('dashboard');
    }
  }, [tab, isDevMode, setTab]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<MasterFinanceRow | null>(null);
  const [previewInvoiceOrder, setPreviewInvoiceOrder] = useState<MasterFinanceRow | null>(null);
  const [activeMetricDrawer, setActiveMetricDrawer] = useState<MetricDrawerType | null>(null);
  const [drawerVendorFilter] = useState<string | null>(null);
  const [bulan, setBulan] = useState<string>('all');
  const [tahun, setTahun] = useState<string>('all');
  const [saldoAwal] = useState<number>(0);

  const {
    orders: rawOrders,
    cashTransactions: rawCashTxs,
    vendors: rawVendors,
    syncState,
    updateOrderFinance,
    addKas,
    deleteKas,
  } = useFirebaseFinance(initialOrdersData, initialCashTransactions);

  const BULAN_LABEL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const selectedPeriod =
    bulan === 'all' && tahun === 'all'
      ? 'Semua Periode'
      : `${bulan === 'all' ? 'Semua Bulan' : BULAN_LABEL[Number(bulan) - 1]} ${tahun === 'all' ? 'Semua Tahun' : tahun}`;

  const matchPeriod = (tanggal: string, b: string, y: string) => {
    if (!tanggal || tanggal < '2026-10-01') return false;
    if (y !== 'all' && !tanggal.startsWith(y)) return false;
    if (b !== 'all' && tanggal.slice(5, 7) !== b) return false;
    return true;
  };

  const yearOptions = useMemo(() => {
    const set = new Set<string>(['2026']);
    rawOrders.forEach((o) => o.tanggalOrder && o.tanggalOrder >= '2026-10-01' && set.add(o.tanggalOrder.slice(0, 4)));
    rawCashTxs.forEach((t) => t.tanggal && t.tanggal >= '2026-10-01' && set.add(t.tanggal.slice(0, 4)));
    return [...set].sort().reverse();
  }, [rawOrders, rawCashTxs]);

  const monthOptions = useMemo(() => {
    return [
      { value: 'all', label: 'Semua Bulan' },
      ...BULAN_LABEL.map((label, i) => ({
        value: String(i + 1).padStart(2, '0'),
        label,
      })),
    ];
  }, []);

  const allCashTransactions = rawCashTxs;

  const filteredOrders = useMemo(
    () => rawOrders.filter((o) => matchPeriod(o.tanggalOrder, bulan, tahun)),
    [rawOrders, bulan, tahun]
  );
  const filteredCashTxs = useMemo(
    () => allCashTransactions.filter((t) => matchPeriod(t.tanggal, bulan, tahun)),
    [allCashTransactions, bulan, tahun]
  );

  const vendorPerformance = useMemo(
    () => computeVendorPerformance(filteredOrders, rawVendors),
    [filteredOrders, rawVendors]
  );
  const cheapestCategories = useMemo(
    () =>
      computeCheapestByKategori(filteredOrders, (id) => {
        const v = rawVendors.find((item) => item.id === id);
        return v ? v.nama : 'Tanpa Vendor';
      }),
    [filteredOrders, rawVendors]
  );

  const summary = calculateFinancialSummary(saldoAwal, filteredCashTxs, filteredOrders);
  const masterRows = transformToMasterRows(filteredOrders);

  const dynamicDonutData: DonutDataPoint[] = useMemo(() => {
    let hakVendor = 0;
    let marginVisualKain = 0;

    filteredOrders.forEach((o) => {
      const alloc = calculateEscrowAllocation(o);
      hakVendor += alloc.alokasiHakVendor;
      marginVisualKain += alloc.alokasiMarginVisualKain;
    });

    const total = hakVendor + marginVisualKain;
    if (total === 0) {
      return [
        { name: 'Hak Pokok Vendor (HPP)', value: 0, color: '#f59e0b' },
        { name: 'Saldo Margin VisualKain', value: 0, color: '#10b981' },
      ];
    }

    return [
      { name: 'Hak Pokok Vendor (HPP)', value: Math.round(hakVendor), color: '#f59e0b' },
      { name: 'Saldo Margin VisualKain', value: Math.round(marginVisualKain), color: '#10b981' },
    ];
  }, [filteredOrders]);

  const dynamicTrendData: TrendDataPoint[] = useMemo(() => {
    const map = new Map<string, { kasMasuk: number; kasKeluar: number }>();

    filteredOrders.forEach((o) => {
      if (Array.isArray(o.pembayaranList) && o.pembayaranList.length > 0) {
        o.pembayaranList.forEach((p) => {
          if (p.nominal > 0 && p.tanggal && matchPeriod(p.tanggal, bulan, tahun)) {
            const cur = map.get(p.tanggal) || { kasMasuk: 0, kasKeluar: 0 };
            cur.kasMasuk += p.nominal;
            map.set(p.tanggal, cur);
          }
        });
      } else if (o.totalUangMasukCustomer > 0 && o.tanggalOrder && matchPeriod(o.tanggalOrder, bulan, tahun)) {
        const cur = map.get(o.tanggalOrder) || { kasMasuk: 0, kasKeluar: 0 };
        cur.kasMasuk += o.totalUangMasukCustomer;
        map.set(o.tanggalOrder, cur);
      }
    });

    filteredCashTxs.forEach((t) => {
      if (t.tanggal && t.tipe === 'masuk' && t.kategori !== 'Penerimaan Konsumen') {
        const cur = map.get(t.tanggal) || { kasMasuk: 0, kasKeluar: 0 };
        cur.kasMasuk += t.nominal;
        map.set(t.tanggal, cur);
      }
    });

    const unifiedOutflows = buildCashOutflowEntries(filteredOrders, filteredCashTxs);
    unifiedOutflows.forEach((entry) => {
      if (entry.tanggal && matchPeriod(entry.tanggal, bulan, tahun)) {
        const cur = map.get(entry.tanggal) || { kasMasuk: 0, kasKeluar: 0 };
        cur.kasKeluar += entry.nominal;
        map.set(entry.tanggal, cur);
      }
    });

    if (map.size === 0) {
      return [];
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, val]) => ({
        periode: formatDateTick(date),
        fullDate: date,
        kasMasuk: val.kasMasuk,
        kasKeluar: val.kasKeluar,
        netCash: val.kasMasuk - val.kasKeluar,
      }));
  }, [filteredOrders, filteredCashTxs]);

  const viewTitles: Record<FinanceSubTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Ringkasan Finansial VisualKain',
      subtitle: 'Pantau dana masuk, dana keluar, sisa tagihan customer, sisa hutang vendor, dan status kecukupan dana (mulai Oktober 2026)',
    },
    datatable: {
      title: 'Master Data Finansial Order',
      subtitle: 'Tabel komprehensif seluruh pesanan produksi, progres tagihan konsumen, dan HPP vendor mulai Oktober 2026',
    },
    cashin: {
      title: 'Arus Dana Masuk (Penerimaan Kas)',
      subtitle: 'Pelacakan seluruh dana masuk dari DP/pelunasan order customer dan mutasi kas masuk',
    },
    cashout: {
      title: 'Arus Dana Keluar (Pengeluaran Kas & Vendor)',
      subtitle: 'Pelacakan seluruh dana keluar dari pembayaran ke vendor, biaya operasional order, dan pengeluaran kas',
    },
    vendor: {
      title: 'Kinerja Mitra Vendor',
      subtitle: 'Evaluasi efisiensi biaya vendor per kategori produk & histori transaksi produksi',
    },
    manual: {
      title: 'Realisasi Laba Bersih (Penyesuaian Manual)',
      subtitle: 'Rekonsiliasi penyesuaian HPP aktual dan realisasi laba bersih di lapangan',
    },
  };

  const handleExportExcel = async () => {
    try {
      await exportMasterFinanceToExcel(masterRows, selectedPeriod);
      toast.success('Laporan Master Finansial berhasil diekspor ke Excel!');
    } catch (err) {
      console.error('Gagal mengekspor Excel:', err);
      toast.error('Gagal mengekspor berkas Excel');
    }
  };

  const handleSaveProfitAktual = async (orderId: string, draft: ManualFinanceDraft) => {
    await updateOrderFinance(orderId, {
      hppAktual: draft.hppAktual ? Number(draft.hppAktual) : null,
      profitAktual: draft.profitAktual ? Number(draft.profitAktual) : null,
      catatanFinance: draft.catatanFinance,
    });
  };

  return (
    <div className="flex min-h-screen bg-[#E8ECF2] text-slate-900">
      <Toaster richColors position="top-right" />

      <Sidebar
        activeTab={tab}
        onSelectTab={setTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        userName={profile?.name || 'Glora Sawita Br Panjaitan'}
        userRole={profile?.role || 'Head of Finance & Accounting'}
        onLogout={logout}
        showHiddenTabs={isDevMode}
      />

      <MobileBottomNav
        activeTab={tab}
        onSelectTab={setTab}
        showHiddenTabs={isDevMode}
      />

      <OrderInspectionDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onPreviewInvoice={(order) => setPreviewInvoiceOrder(order)}
        onEditFinance={(order) => {
          setSelectedOrder(null);
          router.push(`/orders/${order.id}/edit`);
        }}
      />

      <MetricDetailDrawer
        isOpen={!!activeMetricDrawer}
        metricType={activeMetricDrawer}
        onClose={() => setActiveMetricDrawer(null)}
        summary={summary}
        orders={filteredOrders}
        transactions={filteredCashTxs}
        saldoAwal={saldoAwal}
        initialVendorFilter={drawerVendorFilter}
        onOpenAddIncome={() => {
          setActiveMetricDrawer(null);
          router.push('/cash-in/new');
        }}
        onOpenAddExpense={() => {
          setActiveMetricDrawer(null);
          router.push('/cash-out/new');
        }}
        onSelectOrder={(order) => {
          setActiveMetricDrawer(null);
          setSelectedOrder(order);
        }}
      />

      <InvoicePreviewModal
        isOpen={!!previewInvoiceOrder}
        order={previewInvoiceOrder}
        onClose={() => setPreviewInvoiceOrder(null)}
        getVendorById={(id) => {
          const v = rawVendors.find((vend) => vend.id === id);
          return v ? { nama: v.nama, pic: v.pic || '-' } : undefined;
        }}
      />

      <main
        className={`flex-1 overflow-y-auto px-3.5 py-4 pb-28 sm:px-8 sm:py-8 sm:pb-8 transition-all duration-300 ${
          previewInvoiceOrder ? 'no-print' : ''
        }`}
      >
        <div className="mx-auto w-full max-w-[1920px] space-y-4 sm:space-y-6">
          <div className="-mx-3.5 -mt-4 rounded-none rounded-b-2xl border-b border-slate-200/90 border-t-0 border-x-0 bg-white/95 px-3.5 pt-3 pb-3.5 shadow-card-double backdrop-blur-md transition-all sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border sm:border-slate-200/90 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-teal-800 border border-teal-200/80 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                    VisualKain 2026
                  </span>
                  <span className="text-xs text-slate-300 hidden sm:inline">&bull;</span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-slate-800 border border-slate-200/90 shadow-2xs">
                    <UserCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    <span>Glora Sawita</span>
                  </span>
                  <span className="text-xs text-slate-300 hidden sm:inline">&bull;</span>
                  <span className="rounded-lg bg-slate-100/80 px-2 py-0.5 text-[11px] sm:text-xs text-slate-600 font-semibold font-mono">
                    {selectedPeriod}
                  </span>
                </div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  {viewTitles[tab].title}
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 max-w-2xl leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                  {viewTitles[tab].subtitle}
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-center pt-2 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                  <CustomSelect
                    value={bulan}
                    onValueChange={setBulan}
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    className="w-full sm:w-auto h-10"
                    options={monthOptions}
                  />
                  <CustomSelect
                    value={tahun}
                    onValueChange={setTahun}
                    className="w-full sm:w-auto h-10"
                    options={[
                      { value: 'all', label: 'Semua Tahun' },
                      ...yearOptions.map((y) => ({ value: y, label: y })),
                    ]}
                  />
                </div>

                {(tab === 'dashboard' || tab === 'datatable') && (
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                    <button
                      onClick={() => router.push('/cash-in/new')}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-[0.98] transition-transform duration-150 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                      <span>Dana Masuk</span>
                    </button>

                    <button
                      onClick={() => router.push('/cash-out/new')}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-[0.98] transition-transform duration-150 cursor-pointer whitespace-nowrap"
                    >
                      <Minus className="h-4 w-4 shrink-0" />
                      <span>Dana Keluar</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                  {syncState === 'live' ? (
                    <div className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-300/90 bg-emerald-50/80 px-2.5 sm:px-3.5 text-xs font-bold text-emerald-900 shadow-2xs min-w-0">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      </span>
                      <span className="truncate font-semibold">
                        <span className="sm:hidden">Live</span>
                        <span className="hidden sm:inline">Live Firestore</span>
                      </span>
                      <span className="rounded-md bg-emerald-100/90 px-1.5 py-0.5 text-[10px] font-mono font-extrabold text-emerald-800 shrink-0">
                        {rawOrders.length} Order
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 sm:px-3.5 text-xs font-semibold text-emerald-700 shadow-2xs min-w-0">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span className="truncate">Sinkron</span>
                    </div>
                  )}

                  {(tab === 'dashboard' || tab === 'datatable') && (
                    <button
                      onClick={handleExportExcel}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-[0.98] transition-transform duration-150 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>Ekspor Excel</span>
                    </button>
                  )}

                  <button
                    onClick={logout}
                    title="Keluar dari Sesi"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98] transition-transform duration-150 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <LogOut className="h-3.5 w-3.5 shrink-0" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {tab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              {summary.saldoKasRiil < 0 && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 px-3.5 py-2.5 text-xs font-semibold text-rose-800 shadow-2xs">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Perhatian:</strong> Saldo Kas Bank saat ini berada pada posisi defisit (<strong>{formatRupiah(summary.saldoKasRiil)}</strong>).
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-[11px] sm:text-xs text-slate-600">
                <span>
                  Periode: <strong className="text-slate-900">{selectedPeriod}</strong> (Mulai Okt 2026)
                </span>
                <span className="font-semibold text-slate-500 tabular-nums">
                  {filteredOrders.length} order &bull; {summary.kasKeluarCount} trx keluar
                </span>
              </div>

              <FinanceStatsGrid
                summary={summary}
                orders={filteredOrders}
                orderCountWithDebt={filteredOrders.filter((o) => o.totalHpp > o.totalDibayarKeVendor).length}
                activeOrderCount={filteredOrders.length}
                onSelectMetric={(metric) => {
                  setActiveMetricDrawer(metric);
                }}
              />

              <AnalyticsCharts
                summary={summary}
                donutData={dynamicDonutData}
                trendData={dynamicTrendData.length > 0 ? dynamicTrendData : undefined}
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-teal-200/90 bg-white p-4 sm:p-5 shadow-card-double">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80">
                    <Table2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Tabel Master Data Finansial Order ({filteredOrders.length} Pesanan)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lihat rincian 17 kolom finansial order, progres DP 70%, utang vendor, dan cetak faktur di tab khusus Data Table.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('datatable')}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-[0.98] transition-all cursor-pointer shrink-0"
                >
                  <span>Buka Master Data Order (Data Table)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {tab === 'datatable' && (
            <div className="space-y-4 animate-fadeIn">
              <MasterFinanceTable
                rows={masterRows}
                selectedPeriod={selectedPeriod}
                onSelectRow={(row) => setSelectedOrder(row)}
                onEditFinance={(row) => router.push(`/orders/${row.id}/edit`)}
                onPreviewInvoice={(row) => setPreviewInvoiceOrder(row)}
              />
            </div>
          )}

          {tab === 'cashin' && (
            <div className="animate-fadeIn">
              <CashInflowSection
                orders={rawOrders}
                cashTransactions={allCashTransactions}
                selectedPeriod={selectedPeriod}
                activeBulan={bulan}
                activeTahun={tahun}
                onBulanChange={setBulan}
                onTahunChange={setTahun}
                onOpenAddIncome={() => router.push('/cash-in/new')}
                onSelectOrder={(order) => {
                  const row = masterRows.find((r) => r.id === order.id) || transformToMasterRows([order])[0];
                  setSelectedOrder(row);
                }}
                onDeleteTransaction={deleteKas}
              />
            </div>
          )}

          {tab === 'cashout' && (
            <div className="animate-fadeIn">
              <CashOutflowSection
                orders={rawOrders}
                initialEntries={allCashTransactions}
                selectedPeriod={selectedPeriod}
                activeBulan={bulan}
                activeTahun={tahun}
                onBulanChange={setBulan}
                onTahunChange={setTahun}
                onAddTransaction={addKas}
                onDeleteTransaction={deleteKas}
                onSelectOrder={(order) => {
                  const row = masterRows.find((r) => r.id === order.id) || transformToMasterRows([order])[0];
                  setSelectedOrder(row);
                }}
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

          {tab === 'manual' && isDevMode && (
            <div className="animate-fadeIn">
              <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                <span className="font-semibold">
                  Mode Pengembang Aktif: Fitur ini disembunyikan dari antarmuka klien dan hanya dapat diakses melalui parameter <code className="rounded bg-amber-100 px-1 py-0.5 font-mono font-bold">?tab=manual&dev=true</code>.
                </span>
              </div>
              <ProfitAktualSection
                orders={filteredOrders}
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

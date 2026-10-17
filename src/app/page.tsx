'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { FinanceStatsGrid } from '@/components/analytics/FinanceStatsGrid';
import { AnalyticsCharts, type TrendDataPoint } from '@/components/analytics/AnalyticsCharts';
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
  transformToMasterRows,
  applyCashPeriod,
} from '@/lib/financial-calculator';
import { buildCashEntries, summarizeCashPeriod, collectYearOptions, matchPeriod, projectCashCoverage } from '@/lib/cash-ledger';
import { computeVendorPerformance, computeCheapestByKategori } from '@/lib/calculations';
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
  RefreshCw,
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

  const [selectedOrder, setSelectedOrder] = useState<MasterFinanceRow | null>(null);
  const [previewInvoiceOrder, setPreviewInvoiceOrder] = useState<MasterFinanceRow | null>(null);
  const [activeMetricDrawer, setActiveMetricDrawer] = useState<MetricDrawerType | null>(null);
  const [bulan, setBulan] = useState<string>('all');
  const [tahun, setTahun] = useState<string>('all');

  const {
    orders: rawOrders,
    cashTransactions: rawCashTxs,
    vendors: rawVendors,
    syncState,
    error: syncError,
    retry: retrySync,
    updateOrderFinance,
    addKas,
    deleteKas,
  } = useFirebaseFinance();

  const BULAN_LABEL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const selectedPeriod =
    bulan === 'all' && tahun === 'all'
      ? 'Semua Periode'
      : `${bulan === 'all' ? 'Semua Bulan' : BULAN_LABEL[Number(bulan) - 1]} ${tahun === 'all' ? 'Semua Tahun' : tahun}`;

  const yearOptions = useMemo(() => collectYearOptions(rawOrders, rawCashTxs), [rawOrders, rawCashTxs]);

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

  const cashEntries = useMemo(() => buildCashEntries(rawOrders, rawCashTxs), [rawOrders, rawCashTxs]);
  const cashPeriod = useMemo(() => summarizeCashPeriod(cashEntries, { bulan, tahun }), [cashEntries, bulan, tahun]);
  const summary = useMemo(
    () => applyCashPeriod(calculateFinancialSummary(0, filteredCashTxs, filteredOrders), cashPeriod),
    [filteredCashTxs, filteredOrders, cashPeriod]
  );
  const coverage = useMemo(
    () => projectCashCoverage(rawOrders, cashEntries, cashPeriod, { bulan, tahun }),
    [rawOrders, cashEntries, cashPeriod, bulan, tahun]
  );
  const masterRows = useMemo(() => transformToMasterRows(filteredOrders), [filteredOrders]);
  const [tableExport, setTableExport] = useState<{ rows: MasterFinanceRow[]; filterLabel: string } | null>(null);
  const handleTableFilteredRows = useCallback((rows: MasterFinanceRow[], filterLabel: string) => {
    setTableExport({ rows, filterLabel });
  }, []);

  const dynamicTrendData: TrendDataPoint[] = useMemo(() => {
    const map = new Map<string, { kasMasuk: number; kasKeluar: number }>();

    cashEntries.forEach((entry) => {
      if (!matchPeriod(entry.tanggal, bulan, tahun)) return;
      const cur = map.get(entry.tanggal) || { kasMasuk: 0, kasKeluar: 0 };
      if (entry.arah === 'masuk') cur.kasMasuk += entry.nominal;
      else cur.kasKeluar += entry.nominal;
      map.set(entry.tanggal, cur);
    });

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
  }, [cashEntries, bulan, tahun]);

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
      const useTableFilter = tab === 'datatable' && tableExport !== null;
      const rows = useTableFilter ? tableExport.rows : masterRows;
      const label = useTableFilter && tableExport.filterLabel ? `${selectedPeriod} (${tableExport.filterLabel})` : selectedPeriod;
      await exportMasterFinanceToExcel(rows, label);
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

      <Sidebar />

      <MobileBottomNav />

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
        cashOrders={rawOrders}
        cashTransactions={rawCashTxs}
        cashPeriod={{ bulan, tahun }}
        saldoAwal={cashPeriod.saldoAwalPeriode}
        coverage={coverage}
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
                    <span>{profile?.shortName || 'Pengguna'}</span>
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
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3.5 text-xs text-white hover:bg-teal-700 active:scale-[0.98] transition-transform duration-150 cursor-pointer whitespace-nowrap border border-teal-700 shadow-btn-primary font-medium"
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                      <span>Dana Masuk</span>
                    </button>

                    <button
                      onClick={() => router.push('/cash-out/new')}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3.5 text-xs text-white hover:bg-rose-700 active:scale-[0.98] transition-transform duration-150 cursor-pointer whitespace-nowrap border border-rose-700 shadow-btn-primary font-medium"
                    >
                      <Minus className="h-4 w-4 shrink-0" />
                      <span>Dana Keluar</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                  {syncState === 'error' ? (
                    <button
                      type="button"
                      onClick={retrySync}
                      className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-2.5 sm:px-3.5 text-xs font-bold text-rose-800 shadow-2xs hover:bg-rose-100 active:scale-[0.98] transition-transform duration-150 cursor-pointer min-w-0"
                    >
                      <RefreshCw className="h-4 w-4 shrink-0" />
                      <span className="truncate">Gagal sinkron, coba lagi</span>
                    </button>
                  ) : syncState === 'connecting' ? (
                    <div className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3.5 text-xs text-slate-600 min-w-0 shadow-btn-secondary font-medium">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span className="truncate">Menghubungkan...</span>
                    </div>
                  ) : null}

                  {(tab === 'dashboard' || tab === 'datatable') && (
                    <button
                      onClick={handleExportExcel}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-transform duration-150 cursor-pointer shrink-0 whitespace-nowrap shadow-btn-secondary font-medium"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>Ekspor Excel</span>
                    </button>
                  )}

                  <button
                    onClick={logout}
                    title="Keluar dari Sesi"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98] transition-transform duration-150 cursor-pointer shrink-0 whitespace-nowrap shadow-btn-secondary font-medium"
                  >
                    <LogOut className="h-3.5 w-3.5 shrink-0" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {syncState === 'error' && (
            <div
              role="alert"
              className="mb-4 flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Gagal memuat data dari Firestore{syncError ? ` (${syncError})` : ''}. Angka di layar bisa tidak lengkap.
                </span>
              </span>
              <button
                type="button"
                onClick={retrySync}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 font-bold text-rose-800 hover:bg-rose-100 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Coba lagi
              </button>
            </div>
          )}

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
                coverage={coverage}
                orders={filteredOrders}
                orderCountWithDebt={filteredOrders.filter((o) => o.totalHpp > o.totalDibayarKeVendor).length}
                activeOrderCount={filteredOrders.length}
                onSelectMetric={(metric) => {
                  setActiveMetricDrawer(metric);
                }}
              />

              <AnalyticsCharts
                summary={summary}
                trendData={dynamicTrendData}
                isLoading={syncState === 'connecting'}
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
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-xs text-white hover:bg-teal-700 active:scale-[0.98] transition-all cursor-pointer shrink-0 border border-teal-700 shadow-btn-primary font-medium"
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
                onFilteredRowsChange={handleTableFilteredRows}
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

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { collectYearOptions } from '@/lib/cash-ledger';
import { buildOutflowCategoryOptions } from '@/lib/constants';
import { isInvestorTransaction } from '@/lib/investor-ledger';
import {
  cn,
  formatRupiah,
  formatCompactRupiah,
  formatDateTick,
  formatIndonesianDateFull,
  formatDateRangeBadge,
} from '@/lib/utils';
import type { Order, CashTransaction, CashOutflowEntry } from '@/types';
import { buildCashOutflowEntries } from '@/lib/financial-calculator';
import { exportCashOutflowToExcel } from '@/lib/excel-export';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  WalletCards,
  TrendingDown,
  Layers,
  Calculator,
  Plus,
  Download,
  Trash2,
  Pencil,
  Eye,
  X,
  PieChart as PieChartIcon,
  BarChart3,
  Search,
  Filter,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface CashOutflowSectionProps {
  orders?: Order[];
  initialEntries?: CashTransaction[];
  selectedPeriod?: string;
  activeBulan?: string;
  activeTahun?: string;
  onBulanChange?: (bulan: string) => void;
  onTahunChange?: (tahun: string) => void;
  onDeleteTransaction?: (id: string) => Promise<void>;
  onSelectOrder?: (order: Order) => void;
}

const BULAN_FILTER_OPTIONS_ALL = [
  { value: 'all', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Pembayaran Vendor': '#d97706',
  'Pembayaran Vendor Lainnya': '#b45309',
  'Biaya Operasional Order': '#ea580c',
  'Gaji/Upah': '#0d9488',
  'Operasional': '#2563eb',
  'Sponsorship/Sosial': '#ec4899',
  'Iklan/Marketing': '#7c3aed',
  'Marketing dan Penjualan': '#7c3aed',
  'Bahan Baku': '#059669',
  'Perawatan Web/Sistem': '#4f46e5',
  'Transport/Ongkir': '#ea580c',
  'Logistik': '#ea580c',
  'Pajak/Retribusi': '#dc2626',
  'Pajak': '#dc2626',
  'Keuangan': '#0891b2',
  'Biaya Lain': '#64748b',
  'Lainnya': '#64748b',
};

const SOURCE_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua Sumber Pengeluaran' },
  { value: 'order', label: 'Pembayaran Vendor & Order' },
  { value: 'manual', label: 'Pengeluaran Kas Non-Order' },
];

export function CashOutflowSection({
  orders = [],
  initialEntries = [],
  selectedPeriod = 'Mulai Oktober 2026',
  activeBulan,
  activeTahun,
  onBulanChange,
  onTahunChange,
  onDeleteTransaction,
  onSelectOrder,
}: CashOutflowSectionProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<CashTransaction[]>(initialEntries);

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'order' | 'manual'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [bulanFilter, setBulanFilter] = useState(activeBulan || 'all');
  const [tahunFilter, setTahunFilter] = useState(activeTahun || 'all');

  const handleEdit = (item: CashOutflowEntry) => {
    if (item.sumber === 'order' && item.rawOrder) {
      if (item.kategori === 'Biaya Operasional Order' || item.id.startsWith('opex-')) {
        router.push(`/orders/${item.rawOrder.id}/edit`);
      } else {
        router.push(
          `/cash-out/new?mode=vendor&orderId=${encodeURIComponent(item.rawOrder.id)}&editPaymentId=${encodeURIComponent(item.id)}`
        );
      }
    } else if (item.sumber === 'manual') {
      const mode = item.rawTransaction && isInvestorTransaction(item.rawTransaction) ? 'investor' : 'operasional';
      router.push(`/cash-out/new?mode=${mode}&editKasId=${encodeURIComponent(item.id)}`);
    }
  };

  React.useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  React.useEffect(() => {
    if (activeBulan !== undefined) {
      setBulanFilter(activeBulan);
    }
  }, [activeBulan]);

  React.useEffect(() => {
    if (activeTahun !== undefined) {
      setTahunFilter(activeTahun);
    }
  }, [activeTahun]);


  const allOutflowEntries: CashOutflowEntry[] = useMemo(() => {
    return buildCashOutflowEntries(orders, entries).filter(
      (item) => !item.tanggal || item.tanggal >= '2026-10-01'
    );
  }, [orders, entries]);

  const categoryFilterOptions = useMemo(
    () => buildOutflowCategoryOptions(allOutflowEntries.map((e) => e.kategori)),
    [allOutflowEntries]
  );

  const yearOptions = useMemo(
    () => [
      { value: 'all', label: 'Semua Tahun' },
      ...collectYearOptions(orders, entries).map((y) => ({ value: y, label: y })),
    ],
    [orders, entries]
  );

  const bulanOptions = BULAN_FILTER_OPTIONS_ALL;

  const filteredEntries = useMemo(() => {
    return allOutflowEntries.filter((item) => {
      const matchesSource = sourceFilter === 'all' || item.sumber === sourceFilter;
      const matchesCategory = categoryFilter === 'all' || item.kategori === categoryFilter;
      const matchesTahun = tahunFilter === 'all' || (item.tanggal || '').startsWith(tahunFilter);
      const matchesBulan = bulanFilter === 'all' || (item.tanggal || '').slice(5, 7) === bulanFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.keterangan.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        (item.noInv || '').toLowerCase().includes(q) ||
        (item.vendorOrTargetName || '').toLowerCase().includes(q) ||
        item.tanggal.includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchesSource && matchesCategory && matchesTahun && matchesBulan && matchesSearch;
    });
  }, [allOutflowEntries, sourceFilter, categoryFilter, tahunFilter, bulanFilter, searchQuery]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sourceFilter, categoryFilter, bulanFilter, tahunFilter, allOutflowEntries.length]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEntries = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, safeCurrentPage]);

  const totalDanaKeluar = filteredEntries.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalTransaksi = filteredEntries.length;
  const rataRataTransaksi = totalTransaksi > 0 ? totalDanaKeluar / totalTransaksi : 0;

  const categoryMap = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => {
      acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.nominal;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredEntries]);

  const categoryEntries = useMemo(() => {
    return Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  }, [categoryMap]);

  const kategoriTerbesar = categoryEntries[0] || ['Belum ada', 0];

  const pieChartData = useMemo(() => {
    return categoryEntries.map(([kat, total]) => ({
      name: kat,
      value: total,
      color: CATEGORY_COLORS[kat] || '#94a3b8',
    }));
  }, [categoryEntries]);

  const dailyTrendData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      map[e.tanggal] = (map[e.tanggal] || 0) + e.nominal;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tgl, amount]) => ({
        tanggal: formatDateTick(tgl),
        fullDate: tgl,
        nominal: amount,
      }));
  }, [filteredEntries]);

  const peakDay = useMemo(() => {
    if (!dailyTrendData.length) return null;
    return [...dailyTrendData].sort((a, b) => b.nominal - a.nominal)[0];
  }, [dailyTrendData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan kas keluar ini?')) return;
    try {
      if (onDeleteTransaction) {
        await onDeleteTransaction(id);
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success('Pengeluaran berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus pengeluaran');
    }
  };

  // Export Excel Eksekutif Standar Inzta (US-9.28)
  const handleExportExcel = async () => {
    if (filteredEntries.length === 0) {
      toast.error('Tidak ada data pengeluaran untuk diekspor!');
      return;
    }
    try {
      await exportCashOutflowToExcel(filteredEntries, selectedPeriod);
      toast.success('Laporan Arus Kas Keluar berhasil diekspor ke Excel!');
    } catch (err) {
      console.error('Gagal mengekspor Excel:', err);
      toast.error('Gagal mengekspor berkas Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards (2-Grid Mobile, 4-Col Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-card-double flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate pr-1">
              Total Dana Keluar
            </span>
            <span className="rounded-lg bg-rose-50 p-1.5 sm:p-2 text-rose-600 shrink-0">
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-sm sm:text-2xl font-extrabold text-rose-600 font-mono tabular-num truncate">
            {formatRupiah(totalDanaKeluar)}
          </div>
          <p className="mt-1 text-[10px] sm:text-xs text-slate-400 truncate">
            {categoryFilter !== 'all' ? categoryFilter : 'Akumulasi kas riil'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-card-double flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate pr-1">Total Transaksi</span>
            <span className="rounded-lg bg-blue-50 p-1.5 sm:p-2 text-blue-600 shrink-0">
              <WalletCards className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-sm sm:text-2xl font-extrabold text-slate-800 font-mono tabular-num truncate">
            {totalTransaksi}
          </div>
          <p className="mt-1 text-[10px] sm:text-xs text-slate-400 truncate">Mutasi kas tercatat</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-card-double flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate pr-1">Rata-rata/Trx</span>
            <span className="rounded-lg bg-teal-50 p-1.5 sm:p-2 text-teal-600 shrink-0">
              <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-sm sm:text-2xl font-extrabold text-teal-600 font-mono tabular-num truncate">
            {formatRupiah(rataRataTransaksi)}
          </div>
          <p className="mt-1 text-[10px] sm:text-xs text-slate-400 truncate">Rerata per pengeluaran</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-card-double flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 truncate pr-1">Kategori Terbesar</span>
            <span className="rounded-lg bg-purple-50 p-1.5 sm:p-2 text-purple-600 shrink-0">
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-xs sm:text-base font-extrabold text-purple-700 truncate" title={String(kategoriTerbesar[0])}>
            {kategoriTerbesar[0]}
          </div>
          <p className="mt-1 text-[10px] sm:text-xs font-mono font-semibold text-slate-500 tabular-num truncate">
            {formatRupiah(Number(kategoriTerbesar[1]))}
          </p>
        </div>
      </div>

      {/* 2 Visual Charts: Donut Breakdown & Daily Spike Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">Komposisi Beban per Pos</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Proporsi alokasi dana keluar terbesar (Vendor, Gaji, Operasional)
            </p>
          </div>

          <div className="h-56 w-full my-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    const val = Number(item.value) || 0;
                    const pct = totalDanaKeluar > 0 ? ((val / totalDanaKeluar) * 100).toFixed(1) : '0';
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl backdrop-blur-sm text-xs min-w-[170px]">
                        <div className="flex items-center gap-2 mb-1.5 border-b border-slate-800 pb-1">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: (item.payload as { color?: string })?.color || '#14b8a6' }}
                          />
                          <span className="font-semibold text-slate-200 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Total:</span>
                          <span className="font-mono font-bold text-white">{formatRupiah(val)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 text-[11px] mt-0.5">
                          <span>Proporsi:</span>
                          <span className="font-mono font-semibold text-teal-400">{pct}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Keluar</span>
              <span className="text-sm font-extrabold text-slate-800 font-mono tabular-num">
                {formatCompactRupiah(totalDanaKeluar)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {pieChartData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate max-w-[140px]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-800 tabular-num">
                  {formatRupiah(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Tren Pengeluaran Harian</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mendeteksi lonjakan dana keluar pada tanggal pembayaran vendor & operasional
              </p>
            </div>
            {dailyTrendData.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                <Calendar className="h-3 w-3 text-slate-400" />
                {formatDateRangeBadge(dailyTrendData.map((d) => d.fullDate))}
              </span>
            )}
          </div>

          <div className="h-64 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis
                  dataKey="tanggal"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  width={68}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tickFormatter={formatCompactRupiah}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const val = Number(payload[0].value) || 0;
                    const fullDate = (payload[0]?.payload as { fullDate?: string })?.fullDate;
                    const displayDate = fullDate ? formatIndonesianDateFull(fullDate) : label;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 shadow-xl backdrop-blur-sm text-xs min-w-[150px]">
                        <div className="font-medium text-slate-400 border-b border-slate-800 pb-1 mb-1.5">
                          Tanggal: <span className="text-white font-mono font-bold">{displayDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Pengeluaran:</span>
                          <span className="font-mono font-bold text-blue-400">{formatRupiah(val)}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="nominal" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <span>
              Puncak Kas Keluar:{' '}
              <strong className="text-slate-700">
                {peakDay ? `${peakDay.fullDate} (${formatCompactRupiah(peakDay.nominal)})` : '-'}
              </strong>
            </span>
            <span className="text-blue-700 font-semibold">Mulai Oktober 2026</span>
          </div>
        </div>
      </div>

      {/* Main Ledger Table & Actions */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-card-double overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 p-4 sm:p-5 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Riwayat Lengkap Dana Keluar (Vendor, Order & Kas)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gabungan pembayaran ke vendor produksi, biaya operasional order, dan pengeluaran kas mulai Oktober 2026
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center">
            <Button
              onClick={() => router.push('/cash-out/new')}
              className="h-10 min-h-[40px] flex-1 sm:flex-none gap-1.5 rounded-xl bg-teal-600 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-700 active:scale-[0.98] transition-transform duration-150 cursor-pointer justify-center"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Catat Dana Keluar</span>
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="h-10 min-h-[40px] flex-1 sm:flex-none gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-[0.98] transition-transform duration-150 cursor-pointer justify-center"
            >
              <Download className="h-4 w-4 shrink-0 text-slate-500" />
              <span>Ekspor Excel</span>
            </Button>
          </div>
        </div>

        {/* Dedicated Filter Toolbar */}
        <div className="flex flex-col border-b border-slate-100 p-3.5 sm:p-4 bg-slate-50/60 gap-3">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5">
            <div className="relative w-full sm:w-auto sm:min-w-[220px] sm:max-w-xs flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari invoice, vendor, keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center">
              <CustomSelect
                value={bulanFilter}
                onValueChange={(val) => {
                  setBulanFilter(val);
                  onBulanChange?.(val);
                }}
                options={bulanOptions}
                className="h-10 w-full sm:w-[155px]"
              />

              <CustomSelect
                value={tahunFilter}
                onValueChange={(val) => {
                  setTahunFilter(val);
                  onTahunChange?.(val);
                }}
                options={yearOptions}
                className="h-10 w-full sm:w-[125px]"
              />
            </div>

            <div className="w-full sm:w-auto">
              <CustomSelect
                value={sourceFilter}
                onValueChange={(val) => setSourceFilter(val as 'all' | 'order' | 'manual')}
                options={SOURCE_FILTER_OPTIONS}
                className="h-10 w-full sm:min-w-[185px]"
              />
            </div>

            <div className="w-full sm:w-auto">
              <CustomSelect
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                icon={<Filter className="h-3.5 w-3.5" />}
                options={categoryFilterOptions}
                className="h-10 w-full sm:min-w-[185px]"
              />
            </div>

            {(sourceFilter !== 'all' || categoryFilter !== 'all' || bulanFilter !== 'all' || tahunFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSourceFilter('all');
                  setCategoryFilter('all');
                  setBulanFilter('all');
                  setTahunFilter('all');
                  setSearchQuery('');
                  onBulanChange?.('all');
                  onTahunChange?.('all');
                }}
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs text-rose-600 hover:bg-rose-50 active:scale-[0.98] transition-all cursor-pointer shadow-btn-secondary font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-200/50 sm:border-0 sm:pt-0">
            <span className="text-slate-400 text-[11px] font-medium">Menampilkan:</span>
            <span className="font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs tabular-num text-[11px]">
              {filteredEntries.length} dari {allOutflowEntries.length} data ({formatRupiah(totalDanaKeluar)})
            </span>
          </div>
        </div>

        {/* Mobile View: Outflow Transaction Cards (< 768px, 1-Col on Phone, 2-Col on Tablet) */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-slate-50/40">
          {paginatedEntries.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs">
              Tidak ada transaksi pengeluaran yang cocok dengan filter
            </div>
          ) : (
            paginatedEntries.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs flex flex-col justify-between gap-2.5 overflow-hidden">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2 min-w-0 pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md px-2 py-0.5 shrink-0">
                        {item.noInv || 'KAS'}
                      </span>
                      <span className="font-mono text-slate-400 text-[10px] font-medium truncate">{item.tanggal}</span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold text-slate-700 border border-slate-200 truncate shrink-0">
                      {item.kategori}
                    </span>
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {item.vendorOrTargetName}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 leading-snug line-clamp-2" title={item.keterangan}>
                      {item.keterangan}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 min-w-0">
                  <span className="font-mono font-extrabold text-xs sm:text-sm text-rose-600 tabular-nums truncate">
                    -{formatRupiah(item.nominal)}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      title="Edit Pengeluaran Kas"
                      className="h-9 px-2.5 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-slate-700 text-[11px] font-bold hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>Edit</span>
                    </button>

                    {item.sumber === 'order' && item.rawOrder ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectOrder && item.rawOrder) {
                            onSelectOrder(item.rawOrder);
                          } else if (item.rawOrder) {
                            router.push(`/orders/${item.rawOrder.id}/edit`);
                          }
                        }}
                        title="Lihat Detail Order"
                        className="h-9 px-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold active:scale-[0.96] transition-transform duration-150 cursor-pointer shrink-0"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" />
                        <span>Detail Order</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        title="Hapus Transaksi"
                        className="h-9 px-2.5 inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-bold hover:bg-rose-100 active:scale-[0.96] transition-transform duration-150 cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Spreadsheet Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">TANGGAL</th>
                <th className="px-4 py-3">REFERENSI / VENDOR</th>
                <th className="px-4 py-3">KATEGORI</th>
                <th className="px-4 py-3">KETERANGAN</th>
                <th className="px-4 py-3 text-right">JUMLAH (RP)</th>
                <th className="px-4 py-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="h-8 w-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-600">
                        Tidak ada transaksi pengeluaran yang cocok dengan filter
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Coba gunakan kata kunci pencarian lain atau klik tombol Reset Filter
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-500">{item.tanggal}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            item.sumber === 'order'
                              ? 'rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800'
                              : 'rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600'
                          }
                        >
                          {item.noInv || 'KAS-KELUAR'}
                        </span>
                        <span className="font-semibold text-slate-700">{item.vendorOrTargetName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{item.keterangan}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600 tabular-num">
                      {formatRupiah(item.nominal)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          title="Edit Pengeluaran Kas"
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-rose-700 hover:border-rose-200 active:scale-[0.96] transition-all duration-150 shadow-2xs cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-400" />
                          <span>Edit</span>
                        </button>

                        {item.sumber === 'order' && item.rawOrder ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectOrder && item.rawOrder) {
                                onSelectOrder(item.rawOrder);
                              } else if (item.rawOrder) {
                                router.push(`/orders/${item.rawOrder.id}/edit`);
                              }
                            }}
                            title="Lihat Detail Order"
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 text-[10px] font-bold text-teal-700 hover:bg-teal-100 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Detail Order</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus Transaksi Kas"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.96] transition-all duration-150 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredEntries.length > 0 && (() => {
          const startIdx = (safeCurrentPage - 1) * pageSize + 1;
          const endIdx = Math.min(safeCurrentPage * pageSize, filteredEntries.length);
          const pageNumbers: number[] = [];
          const maxVisiblePages = 5;
          let startPage = Math.max(1, safeCurrentPage - Math.floor(maxVisiblePages / 2));
          const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
          if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
          }
          for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
          }

          return (
            <div className="border-t border-slate-100 bg-white px-3.5 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
              <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
                Menampilkan <strong className="text-slate-800 font-mono tabular-nums">{startIdx}</strong>–
                <strong className="text-slate-800 font-mono tabular-nums">{endIdx}</strong> dari{' '}
                <strong className="text-slate-800 font-mono tabular-nums">{filteredEntries.length}</strong> transaksi pengeluaran
              </div>

              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {startPage > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                    >
                      1
                    </button>
                    {startPage > 2 && <span className="text-slate-400 px-1 text-xs">&hellip;</span>}
                  </>
                )}

                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(num)}
                    className={cn(
                      'h-9 min-w-[36px] px-2.5 rounded-xl text-xs font-bold active:scale-[0.96] transition-transform duration-150 cursor-pointer',
                      num === safeCurrentPage
                        ? 'bg-teal-600 text-white shadow-sm font-extrabold'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
                    )}
                  >
                    {num}
                  </button>
                ))}

                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && <span className="text-slate-400 px-1 text-xs">&hellip;</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

    </div>
  );
}

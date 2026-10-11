'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { formatRupiah, formatCompactRupiah } from '@/lib/utils';
import type { CashTransaction, CashOutflowCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Drawer } from 'vaul';
import { CustomSelect } from '@/components/ui/custom-select';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  WalletCards,
  TrendingDown,
  Layers,
  Calculator,
  Plus,
  Download,
  Trash2,
  X,
  PieChart as PieChartIcon,
  BarChart3,
  Search,
  Filter,
  RotateCcw,
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
  initialEntries?: CashTransaction[];
  selectedPeriod?: string;
}

const defaultOutflow: CashTransaction[] = [
  { id: 'out-1', tanggal: '2026-10-10', tipe: 'keluar', nominal: 300000, kategori: 'Gaji/Upah', keterangan: 'Biaya finance' },
  { id: 'out-2', tanggal: '2026-10-10', tipe: 'keluar', nominal: 484000, kategori: 'Biaya Lain', keterangan: 'Biaya Handphone raja' },
  { id: 'out-3', tanggal: '2026-10-09', tipe: 'keluar', nominal: 177500, kategori: 'Biaya Lain', keterangan: 'Biaya Illustrator' },
  { id: 'out-4', tanggal: '2026-10-09', tipe: 'keluar', nominal: 201000, kategori: 'Biaya Lain', keterangan: 'Biaya pinjaman wawa' },
  { id: 'out-5', tanggal: '2026-10-08', tipe: 'keluar', nominal: 100000, kategori: 'Biaya Lain', keterangan: 'Operasional RAJA PURNAMA' },
  { id: 'out-6', tanggal: '2026-10-06', tipe: 'keluar', nominal: 102500, kategori: 'Biaya Lain', keterangan: 'Biaya illustrator' },
  { id: 'out-7', tanggal: '2026-10-02', tipe: 'keluar', nominal: 14000, kategori: 'Biaya Lain', keterangan: 'Biaya Admin atm' },
  { id: 'out-8', tanggal: '2026-10-01', tipe: 'keluar', nominal: 24278500, kategori: 'Gaji/Upah', keterangan: 'Payroll staff & penjahit' },
  { id: 'out-9', tanggal: '2026-10-01', tipe: 'keluar', nominal: 3973000, kategori: 'Operasional', keterangan: 'Perawatan Web & Server' },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Gaji/Upah': '#0d9488',
  'Operasional': '#2563eb',
  'Marketing dan Penjualan': '#7c3aed',
  'Logistik': '#ea580c',
  'Keuangan': '#0891b2',
  'Pajak': '#dc2626',
  'Pembayaran Vendor': '#d97706',
  'Biaya Lain': '#64748b',
};

const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua Kategori Beban', badge: 'Semua' },
  { value: 'Gaji/Upah', label: 'Gaji / Upah' },
  { value: 'Operasional', label: 'Operasional' },
  { value: 'Marketing dan Penjualan', label: 'Marketing' },
  { value: 'Logistik', label: 'Logistik' },
  { value: 'Keuangan', label: 'Keuangan' },
  { value: 'Biaya Lain', label: 'Biaya Lain' },
];

const CATEGORY_FORM_OPTIONS = [
  { value: 'Gaji/Upah', label: 'Gaji/Upah (Payroll Staff & Penjahit)' },
  { value: 'Operasional', label: 'Operasional (Listrik, Sewa, Server)' },
  { value: 'Marketing dan Penjualan', label: 'Marketing dan Penjualan (Iklan, Ads)' },
  { value: 'Logistik', label: 'Logistik (Pengiriman, Kurir)' },
  { value: 'Keuangan', label: 'Keuangan (Admin Bank, Pajak)' },
  { value: 'Biaya Lain', label: 'Biaya Lain' },
];

export function CashOutflowSection({
  initialEntries = defaultOutflow,
  selectedPeriod = '2026-10',
}: CashOutflowSectionProps) {
  const [entries, setEntries] = useState<CashTransaction[]>(initialEntries);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter Toolbar State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Synchronize with parent period updates
  React.useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  // Form State
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kategori, setKategori] = useState<CashOutflowCategory>('Operasional');
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState<number>(0);

  // Filtered dataset for table and charts
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.kategori === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.keterangan.toLowerCase().includes(q) ||
        item.tanggal.includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [entries, categoryFilter, searchQuery]);

  // Metric calculations based on active filter
  const totalDanaKeluar = filteredEntries.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalTransaksi = filteredEntries.length;
  const rataRataTransaksi = totalTransaksi > 0 ? totalDanaKeluar / totalTransaksi : 0;

  // Breakdown per Kategori
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
  const jumlahKategori = categoryEntries.length;

  // Category Donut Chart
  const pieChartData = useMemo(() => {
    return categoryEntries.map(([kat, total]) => ({
      name: kat,
      value: total,
      color: CATEGORY_COLORS[kat] || '#94a3b8',
    }));
  }, [categoryEntries]);

  // Daily Outflow Trend
  const dailyTrendData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      map[e.tanggal] = (map[e.tanggal] || 0) + e.nominal;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tgl, amount]) => ({
        tanggal: tgl.slice(5),
        fullDate: tgl,
        nominal: amount,
      }));
  }, [filteredEntries]);

  const periodLabel =
    selectedPeriod === 'all'
      ? 'Semua Periode'
      : selectedPeriod === '2026-10'
      ? 'Oktober 2026'
      : selectedPeriod === '2026-09'
      ? 'September 2026'
      : selectedPeriod;

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success('Pengeluaran berhasil dihapus');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || nominal <= 0 || !keterangan) {
      toast.error('Mohon isi nominal dan keterangan dengan benar');
      return;
    }

    const newTx: CashTransaction = {
      id: `out-${Date.now()}`,
      tanggal,
      tipe: 'keluar',
      nominal,
      kategori,
      keterangan,
    };

    setEntries((prev) => [newTx, ...prev]);
    setIsDrawerOpen(false);
    setKeterangan('');
    setNominal(0);
    toast.success('Pengeluaran berhasil dicatat');
  };

  const handleExportExcel = () => {
    const dataToExport = entries.map((e) => ({
      Tanggal: e.tanggal,
      Kategori: e.kategori,
      Keterangan: e.keterangan,
      'Jumlah (Rp)': e.nominal,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dana Keluar');
    XLSX.writeFile(workbook, `Laporan_Dana_Keluar_VisualKain_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('File Excel berhasil diekspor');
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 truncate pr-2">
              Total Dana Keluar ({categoryFilter !== 'all' ? `${categoryFilter} • ${periodLabel}` : periodLabel})
            </span>
            <span className="rounded-lg bg-rose-50 p-2 text-rose-600 shrink-0">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-rose-600 font-mono tabular-num">
            {formatRupiah(totalDanaKeluar)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Akumulasi pengeluaran {categoryFilter !== 'all' ? categoryFilter : 'kas riil'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Transaksi</span>
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <WalletCards className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-800 font-mono tabular-num">
            {totalTransaksi}
          </div>
          <p className="mt-1 text-xs text-slate-400">Mutasi kas keluar tercatat</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Rata-rata per Transaksi</span>
            <span className="rounded-lg bg-teal-50 p-2 text-teal-600">
              <Calculator className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-teal-600 font-mono tabular-num">
            {formatRupiah(rataRataTransaksi)}
          </div>
          <p className="mt-1 text-xs text-slate-400">Rerata pengeluaran per voucher</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Kategori Terbesar</span>
            <span className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-base font-extrabold text-purple-700 truncate" title={String(kategoriTerbesar[0])}>
            {kategoriTerbesar[0]}
          </div>
          <p className="mt-1 text-xs font-mono font-semibold text-slate-500 tabular-num">
            {formatRupiah(Number(kategoriTerbesar[1]))} ({jumlahKategori} pos aktif)
          </p>
        </div>
      </div>

      {/* 🆕 2 VISUAL CHARTS (DONUT BREAKDOWN & DAILY SPIKE BAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Donut Komposisi Beban */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800">Komposisi Beban per Pos</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Proporsi alokasi dana keluar terbesar (Payroll vs Operasional)
            </p>
          </div>

          <div className="h-56 w-full my-2">
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
                  formatter={(value: unknown) => [formatRupiah(Number(value)), 'Jumlah']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
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

        {/* Chart 2: Daily Outflow Trend Bar */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card-double flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Tren Pengeluaran Harian</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mendeteksi lonjakan kas keluar pada tanggal pencairan/belanja
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              {dailyTrendData.length} Titik Waktu
            </span>
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
                  formatter={(val: unknown) => [formatRupiah(Number(val)), 'Pengeluaran']}
                  labelFormatter={(lbl) => `Tanggal: ${lbl}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="nominal" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <span>Puncak Kas Keluar: <strong>01 Okt (Gaji & Payroll)</strong></span>
            <span className="text-blue-700 font-semibold">Terkontrol Sesuai Budget</span>
          </div>
        </div>
      </div>

      {/* Main Ledger Table & Actions */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-card-double overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 p-5 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Riwayat Mutasi Dana Keluar</h3>
            <p className="text-xs text-slate-400">Daftar transaksi kas keluar yang diverifikasi finance</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsDrawerOpen(true)}
              className="h-9 gap-1.5 rounded-xl bg-teal-600 px-3.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 active:scale-95 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Catat Pengeluaran
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="h-9 gap-1.5 rounded-xl border-slate-200 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Dedicated Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 p-4 bg-slate-50/60 gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Live Search Input */}
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari transaksi, voucher, keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* CustomSelect Kategori Beban Filter */}
            <CustomSelect
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              icon={<Filter className="h-3.5 w-3.5" />}
              options={CATEGORY_FILTER_OPTIONS}
              className="min-w-[190px]"
            />

            {(categoryFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filter
              </button>
            )}
          </div>

          {/* Active Filter Metrics Pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Menampilkan:</span>
            <span className="font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm tabular-num">
              {filteredEntries.length} dari {entries.length} data ({formatRupiah(totalDanaKeluar)})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">TANGGAL</th>
                <th className="px-4 py-3">KATEGORI</th>
                <th className="px-4 py-3">KETERANGAN</th>
                <th className="px-4 py-3 text-right">JUMLAH (RP)</th>
                <th className="px-4 py-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
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
                filteredEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-500">{item.tanggal}</td>
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
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Hapus Transaksi"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Vaul Drawer */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex max-h-[85vh] flex-col rounded-t-[24px] bg-white p-6 shadow-2xl focus:outline-none sm:mx-auto sm:max-w-lg">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <Drawer.Title className="text-base font-extrabold text-slate-900">
                  Catat Pengeluaran Baru
                </Drawer.Title>
                <Drawer.Description className="text-xs text-slate-400 mt-0.5">
                  Tambahkan transaksi kas keluar riil ke pembukuan
                </Drawer.Description>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="mt-4 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                  Kategori Beban
                </label>
                <CustomSelect
                  value={kategori}
                  onValueChange={(val) => setKategori(val as CashOutflowCategory)}
                  options={CATEGORY_FORM_OPTIONS}
                  className="mt-1 h-10 w-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Keterangan Pembayaran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Beli jarum jahit & benang seragam"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Nominal (Rp)
                </label>
                <CurrencyInput
                  value={nominal}
                  onValueChange={setNominal}
                  placeholder="0"
                  className="mt-1 h-10 w-full text-rose-600 font-bold"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-teal-600 text-xs font-bold text-white shadow-md hover:bg-teal-700 active:scale-95 transition-all"
                >
                  Simpan Transaksi Pengeluaran
                </Button>
              </div>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

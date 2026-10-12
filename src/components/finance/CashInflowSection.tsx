'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { formatRupiah, formatCompactRupiah } from '@/lib/utils';
import type { Order, CashTransaction, CashInflowEntry, InflowCategoryType } from '@/types';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  Coins,
  ArrowDownLeft,
  CheckCircle2,
  Wallet,
  Plus,
  Download,
  Trash2,
  PieChart as PieChartIcon,
  BarChart3,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Receipt,
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

interface CashInflowSectionProps {
  orders: Order[];
  cashTransactions: CashTransaction[];
  selectedPeriod?: string;
  onOpenAddIncome?: () => void;
  onSelectOrder?: (order: Order) => void;
  onDeleteTransaction?: (id: string) => Promise<void>;
}

const INFLOW_CATEGORY_COLORS: Record<InflowCategoryType, string> = {
  dp: '#0284c7',        // Sky 600
  termin: '#d97706',    // Amber 600
  pelunasan: '#059669', // Emerald 600
  kas_masuk: '#7c3aed', // Violet 600
};

const INFLOW_CATEGORY_LABELS: Record<InflowCategoryType, string> = {
  dp: 'Uang Muka (DP)',
  termin: 'Termin Produksi',
  pelunasan: 'Pelunasan Penuh',
  kas_masuk: 'Kas Masuk Langsung',
};

const INFLOW_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua Jenis Pemasukan', badge: 'Semua' },
  { value: 'dp', label: 'Uang Muka (DP)' },
  { value: 'termin', label: 'Termin Produksi' },
  { value: 'pelunasan', label: 'Pelunasan Penuh' },
  { value: 'kas_masuk', label: 'Kas Masuk Non-Order' },
];

const BULAN_FILTER_OPTIONS = [
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

export function CashInflowSection({
  orders,
  cashTransactions,
  selectedPeriod = '2026-10',
  onOpenAddIncome,
  onSelectOrder,
  onDeleteTransaction,
}: CashInflowSectionProps) {
  // Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [bulanFilter, setBulanFilter] = useState('all');
  const [tahunFilter, setTahunFilter] = useState('all');

  // 1. Dual-Source Data Aggregator: Order Payments + Direct Cash Inflows
  const rawInflows: CashInflowEntry[] = useMemo(() => {
    const list: CashInflowEntry[] = [];

    // Sumber A: Seluruh riwayat pembayaran konsumen per order
    orders.forEach((order) => {
      if (Array.isArray(order.pembayaranList) && order.pembayaranList.length > 0) {
        order.pembayaranList.forEach((p, idx) => {
          if (p.nominal > 0) {
            let catType: InflowCategoryType = 'termin';
            if (p.jenis === 'dp' || idx === 0) catType = 'dp';
            if (p.jenis === 'pelunasan') catType = 'pelunasan';

            list.push({
              id: p.id || `pay-${order.id}-${idx}`,
              tanggal: p.tanggal || order.tanggalOrder || '2026-10-01',
              sumber: 'order',
              jenis: catType,
              noInv: order.noInv,
              orderId: order.id,
              customerName: order.customerName || order.namaCustomer || 'Customer',
              projectName: order.projectName || order.namaProject || '-',
              keterangan: p.keterangan || (catType === 'dp' ? 'Pembayaran DP 1' : catType === 'pelunasan' ? 'Pelunasan Order' : 'Pembayaran Termin'),
              nominal: p.nominal,
              rawOrder: order,
            });
          }
        });
      } else if (order.totalUangMasukCustomer > 0) {
        // Fallback jika pembayaranList tidak terurai tapi total uang masuk tercatat
        const isLunas = order.statusPembayaran === 'lunas';
        list.push({
          id: `pay-${order.id}-single`,
          tanggal: order.tanggalOrder || '2026-10-01',
          sumber: 'order',
          jenis: isLunas ? 'pelunasan' : 'dp',
          noInv: order.noInv,
          orderId: order.id,
          customerName: order.customerName || order.namaCustomer || 'Customer',
          projectName: order.projectName || order.namaProject || '-',
          keterangan: `Pembayaran ${isLunas ? 'Lunas' : 'DP'} Konsumen`,
          nominal: order.totalUangMasukCustomer,
          rawOrder: order,
        });
      }
    });

    // Sumber B: Transaksi kas masuk langsung (koleksi kas Firestore)
    cashTransactions.forEach((tx) => {
      if (tx.tipe === 'masuk') {
        list.push({
          id: tx.id,
          tanggal: tx.tanggal,
          sumber: 'manual',
          jenis: 'kas_masuk',
          noInv: tx.refInvoice || '-',
          orderId: tx.orderId,
          customerName: tx.kategori || 'Penerimaan Kas',
          projectName: '-',
          keterangan: tx.keterangan || 'Kas Masuk Non-Order',
          nominal: tx.nominal,
        });
      }
    });

    // Urutkan kronologis terbaru ke terlama
    list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    return list;
  }, [orders, cashTransactions]);

  // Year options dynamically computed from entries
  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    rawInflows.forEach((e) => e.tanggal && set.add(e.tanggal.slice(0, 4)));
    const sorted = [...set].sort().reverse();
    return [{ value: 'all', label: 'Semua Tahun' }, ...sorted.map((y) => ({ value: y, label: y }))];
  }, [rawInflows]);

  // Filtered dataset
  const filteredInflows = useMemo(() => {
    return rawInflows.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.jenis === categoryFilter;
      const matchesTahun = tahunFilter === 'all' || (item.tanggal || '').startsWith(tahunFilter);
      const matchesBulan = bulanFilter === 'all' || (item.tanggal || '').slice(5, 7) === bulanFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.customerName.toLowerCase().includes(q) ||
        (item.projectName && item.projectName.toLowerCase().includes(q)) ||
        (item.noInv && item.noInv.toLowerCase().includes(q)) ||
        item.keterangan.toLowerCase().includes(q) ||
        item.tanggal.includes(q);
      return matchesCategory && matchesTahun && matchesBulan && matchesSearch;
    });
  }, [rawInflows, categoryFilter, tahunFilter, bulanFilter, searchQuery]);

  // 2. KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalDanaMasuk = filteredInflows.reduce((acc, curr) => acc + curr.nominal, 0);
    const totalDpDanTermin = filteredInflows
      .filter((i) => i.sumber === 'order' && i.jenis !== 'pelunasan')
      .reduce((acc, curr) => acc + curr.nominal, 0);
    const totalPelunasan = filteredInflows
      .filter((i) => i.sumber === 'order' && i.jenis === 'pelunasan')
      .reduce((acc, curr) => acc + curr.nominal, 0);
    const totalKasNonOrder = filteredInflows
      .filter((i) => i.sumber === 'manual')
      .reduce((acc, curr) => acc + curr.nominal, 0);
    const rataRataMasuk = filteredInflows.length > 0 ? totalDanaMasuk / filteredInflows.length : 0;

    return {
      totalDanaMasuk,
      totalDpDanTermin,
      totalPelunasan,
      totalKasNonOrder,
      rataRataMasuk,
      count: filteredInflows.length,
    };
  }, [filteredInflows]);

  // 3. Analytics Charts Data
  const compositionChartData = useMemo(() => {
    const map = new Map<InflowCategoryType, number>();
    filteredInflows.forEach((item) => {
      map.set(item.jenis, (map.get(item.jenis) || 0) + item.nominal);
    });

    return Array.from(map.entries())
      .map(([jenis, nominal]) => ({
        name: INFLOW_CATEGORY_LABELS[jenis] || jenis,
        value: nominal,
        color: INFLOW_CATEGORY_COLORS[jenis] || '#0d9488',
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredInflows]);

  const dailyTrendData = useMemo(() => {
    const map = new Map<string, number>();
    filteredInflows.forEach((item) => {
      if (item.tanggal) {
        map.set(item.tanggal, (map.get(item.tanggal) || 0) + item.nominal);
      }
    });

    return Array.from(map.entries())
      .map(([tanggal, nominal]) => ({
        tanggal: tanggal.slice(5), // MM-DD
        fullDate: tanggal,
        nominal,
      }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
      .slice(-14); // Ambil maksimal 14 hari terakhir
  }, [filteredInflows]);

  // Export Excel
  const handleExportExcel = () => {
    if (filteredInflows.length === 0) {
      toast.error('Tidak ada data pemasukan untuk diekspor!');
      return;
    }

    const data = filteredInflows.map((item, idx) => ({
      No: idx + 1,
      Tanggal: item.tanggal,
      'No Invoice': item.noInv || '-',
      'Customer / Sumber': item.customerName,
      Project: item.projectName || '-',
      Jenis: INFLOW_CATEGORY_LABELS[item.jenis] || item.jenis,
      Keterangan: item.keterangan,
      'Jumlah (Rp)': item.nominal,
      Sumber: item.sumber === 'order' ? 'Pembayaran Pesanan' : 'Kas Masuk Langsung',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dana Masuk');
    XLSX.writeFile(wb, `VisualKain_Dana_Masuk_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Laporan Dana Masuk berhasil diunduh!');
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setBulanFilter('all');
    setTahunFilter('all');
    toast.info('Filter berhasil direset.');
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteTransaction) return;
    if (confirm('Apakah Anda yakin ingin menghapus catatan kas masuk ini?')) {
      try {
        await onDeleteTransaction(id);
        toast.success('Transaksi kas masuk berhasil dihapus');
      } catch (e: any) {
        toast.error('Gagal menghapus transaksi: ' + (e.message || 'Error'));
      }
    }
  };

  const renderBadge = (jenis: InflowCategoryType) => {
    switch (jenis) {
      case 'dp':
        return (
          <span className="inline-flex items-center rounded-full bg-sky-50 px-1.5 py-0.5 text-[8px] sm:text-[8.5px] font-bold text-sky-700 border border-sky-200 truncate shrink-0">
            DP / Uang Muka
          </span>
        );
      case 'termin':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] sm:text-[8.5px] font-bold text-amber-700 border border-amber-200 truncate shrink-0">
            Termin Produksi
          </span>
        );
      case 'pelunasan':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] sm:text-[8.5px] font-bold text-emerald-700 border border-emerald-200 truncate shrink-0">
            100% Pelunasan
          </span>
        );
      case 'kas_masuk':
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-purple-50 px-1.5 py-0.5 text-[8px] sm:text-[8.5px] font-bold text-purple-700 border border-purple-200 truncate shrink-0">
            Kas Non-Order
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Dana Masuk */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-lg p-1.5 sm:p-2 bg-emerald-50 text-emerald-600">
                <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700">
                Pemasukan
              </span>
            </div>
            <h4 className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              Total Dana Masuk
            </h4>
            <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tracking-tight text-emerald-700 tabular-nums truncate">
              {formatRupiah(metrics.totalDanaMasuk)}
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            {metrics.count} transaksi mutasi masuk
          </p>
        </div>

        {/* Card 2: DP & Termin Order */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-lg p-1.5 sm:p-2 bg-sky-50 text-sky-600">
                <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-sky-700">
                Uang Muka
              </span>
            </div>
            <h4 className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              DP & Termin Order
            </h4>
            <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tracking-tight text-slate-900 tabular-nums truncate">
              {formatRupiah(metrics.totalDpDanTermin)}
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            Dana awal & 70% siap produksi
          </p>
        </div>

        {/* Card 3: Pelunasan Order Penuh */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-lg p-1.5 sm:p-2 bg-teal-50 text-teal-600">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-teal-700">
                Lunas 100%
              </span>
            </div>
            <h4 className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              Pelunasan Order
            </h4>
            <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tracking-tight text-slate-900 tabular-nums truncate">
              {formatRupiah(metrics.totalPelunasan)}
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            Selesai sebelum pengiriman
          </p>
        </div>

        {/* Card 4: Kas Masuk Non-Order & Rata-rata */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-lg p-1.5 sm:p-2 bg-purple-50 text-purple-600">
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="rounded-full border border-purple-200 bg-purple-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-purple-700">
                Non-Order
              </span>
            </div>
            <h4 className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              Kas Masuk Lain
            </h4>
            <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tracking-tight text-slate-900 tabular-nums truncate">
              {formatRupiah(metrics.totalKasNonOrder)}
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            Rata-rata: {formatCompactRupiah(metrics.rataRataMasuk)}/transaksi
          </p>
        </div>
      </div>

      {/* 2. Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: Daily Trend Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-card-double">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                Tren Penerimaan Kas Harian
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">14 Hari Terakhir</span>
          </div>

          <div className="h-56 w-full">
            {dailyTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada data transaksi pemasukan pada periode ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="tanggal" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(v) => formatCompactRupiah(v)}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatRupiah(Number(val) || 0), 'Nominal Masuk']}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="nominal" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart B: Inflow Composition Donut Chart */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-card-double flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-sky-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  Komposisi Jenis Pemasukan
                </h3>
              </div>
            </div>

            <div className="h-44 w-full">
              {compositionChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada komposisi data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compositionChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {compositionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(Number(val) || 0), 'Nominal']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Legend Details */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px]">
            {compositionChartData.map((item) => {
              const pct = metrics.totalDanaMasuk > 0 ? ((item.value / metrics.totalDanaMasuk) * 100).toFixed(1) : '0';
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-bold text-slate-800">{formatCompactRupiah(item.value)}</span>
                    <span className="text-slate-400 font-mono">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Interactive Filter Toolbar & Actions */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-card-double space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box & Type Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no invoice, customer, atau keterangan..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            <CustomSelect
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              options={INFLOW_FILTER_OPTIONS}
              icon={<Filter className="h-3.5 w-3.5" />}
              className="w-full sm:w-56 h-9"
            />
          </div>

          {/* Date Filters & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              value={bulanFilter}
              onValueChange={setBulanFilter}
              options={BULAN_FILTER_OPTIONS}
              className="w-32 h-9"
            />

            <CustomSelect
              value={tahunFilter}
              onValueChange={setTahunFilter}
              options={yearOptions}
              className="w-28 h-9"
            />

            {(searchQuery || categoryFilter !== 'all' || bulanFilter !== 'all' || tahunFilter !== 'all') && (
              <button
                onClick={handleResetFilter}
                title="Reset Semua Filter"
                className="h-9 px-2.5 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              title="Unduh Laporan Excel"
              className="h-9 px-3 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            {onOpenAddIncome && (
              <button
                onClick={onOpenAddIncome}
                className="h-9 px-3.5 flex items-center gap-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-bold active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Catat Kas</span>
              </button>
            )}
          </div>
        </div>

        {/* Counter Pill */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredInflows.length}</strong> dari {rawInflows.length} transaksi pemasukan
          </span>
          <span className="font-mono font-bold text-emerald-700">
            Total Terfilter: {formatRupiah(metrics.totalDanaMasuk)}
          </span>
        </div>
      </div>

      {/* 4. Riwayat Mutasi Dana Masuk Feed */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-card-double overflow-hidden">
        {/* Table Header Pill */}
        <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Riwayat Mutasi Dana Masuk
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            {filteredInflows.length} Data
          </span>
        </div>

        {/* Mobile View: 2-Grid Adaptive Ergonomic Cards (< 768px) */}
        <div className="md:hidden grid grid-cols-2 gap-2 sm:gap-2.5 p-2 sm:p-3 bg-slate-50/40">
          {filteredInflows.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
              Tidak ada riwayat pemasukan yang cocok dengan kriteria filter.
            </div>
          ) : (
            filteredInflows.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/90 bg-white p-2 sm:p-2.5 shadow-2xs flex flex-col justify-between gap-1.5 overflow-hidden hover:border-emerald-300 transition-all"
              >
                <div className="min-w-0">
                  {/* Top Bar: Tanggal & Badge Jenis */}
                  <div className="flex items-center justify-between gap-1 min-w-0 pb-1 border-b border-slate-100">
                    <span className="font-mono text-slate-400 text-[9px] sm:text-[9.5px] font-medium truncate">
                      {item.tanggal}
                    </span>
                    {renderBadge(item.jenis)}
                  </div>

                  {/* Identity: No Inv & Customer */}
                  <div className="mt-1 space-y-0.5 min-w-0">
                    {item.noInv && item.noInv !== '-' && (
                      <span className="font-mono text-[9px] sm:text-[9.5px] font-black tracking-tight text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/80 inline-block w-fit">
                        {item.noInv}
                      </span>
                    )}
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 leading-snug truncate" title={item.customerName}>
                      {item.customerName}
                    </h4>
                    <p className="text-[9px] sm:text-[9.5px] text-slate-400 font-medium line-clamp-1" title={item.keterangan}>
                      {item.projectName !== '-' ? `${item.projectName} • ` : ''}{item.keterangan}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Nominal & Action */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 min-w-0">
                  <span className="font-mono font-bold text-[10.5px] sm:text-xs text-emerald-600 truncate">
                    +{formatRupiah(item.nominal)}
                  </span>

                  {item.rawOrder ? (
                    <button
                      onClick={() => onSelectOrder?.(item.rawOrder!)}
                      title="Inspeksi Detail Order"
                      className="h-6 sm:h-6.5 px-1.5 flex items-center justify-center gap-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700 text-[9.5px] font-bold active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Detail</span>
                    </button>
                  ) : item.sumber === 'manual' ? (
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Hapus Transaksi Kas Masuk"
                      className="h-6 w-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Spreadsheet Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 select-none">
              <tr>
                <th className="px-4 py-3">TANGGAL</th>
                <th className="px-4 py-3">REF / NO INV</th>
                <th className="px-4 py-3">CUSTOMER / SUMBER</th>
                <th className="px-4 py-3 text-center">JENIS</th>
                <th className="px-4 py-3">KETERANGAN</th>
                <th className="px-4 py-3 text-right">NOMINAL (RP)</th>
                <th className="px-4 py-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInflows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi pemasukan yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredInflows.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                      {item.tanggal}
                    </td>
                    <td className="px-4 py-3">
                      {item.noInv && item.noInv !== '-' ? (
                        <span className="font-mono text-[10px] font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {item.noInv}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{item.customerName}</div>
                      {item.projectName && item.projectName !== '-' && (
                        <div className="text-[10px] text-slate-400 font-medium">{item.projectName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderBadge(item.jenis)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={item.keterangan}>
                      {item.keterangan}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 tabular-nums">
                      +{formatRupiah(item.nominal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.rawOrder ? (
                        <button
                          onClick={() => onSelectOrder?.(item.rawOrder!)}
                          title="Inspeksi Detail Order"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          <span>Detail</span>
                        </button>
                      ) : item.sumber === 'manual' ? (
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Hapus Transaksi Kas Masuk"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

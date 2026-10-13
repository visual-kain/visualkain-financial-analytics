'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  cn,
  formatRupiah,
  formatCompactRupiah,
  formatDateTick,
  formatIndonesianDateFull,
  formatDateRangeBadge,
} from '@/lib/utils';
import type { Order, CashTransaction, CashInflowEntry, InflowCategoryType } from '@/types';
import { exportCashInflowToExcel } from '@/lib/excel-export';
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

interface CashInflowSectionProps {
  orders: Order[];
  cashTransactions: CashTransaction[];
  selectedPeriod?: string;
  activeBulan?: string;
  activeTahun?: string;
  onBulanChange?: (bulan: string) => void;
  onTahunChange?: (tahun: string) => void;
  onOpenAddIncome?: () => void;
  onSelectOrder?: (order: Order) => void;
  onDeleteTransaction?: (id: string) => Promise<void>;
}

const INFLOW_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua Jenis Pemasukan', badge: 'Semua' },
  { value: 'dp', label: 'DP 1 Booking (Awal)' },
  { value: 'termin', label: 'DP 2 Termin 70% (Produksi)' },
  { value: 'pelunasan', label: 'Pelunasan 30% (Kirim)' },
  { value: 'kas_masuk', label: 'Kas Masuk Non-Order' },
];

const BULAN_FILTER_OPTIONS_2026 = [
  { value: 'all', label: 'Mulai Oktober (Semua)' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

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

export function CashInflowSection({
  orders,
  cashTransactions,
  selectedPeriod = 'Mulai Oktober 2026',
  activeBulan,
  activeTahun,
  onBulanChange,
  onTahunChange,
  onOpenAddIncome,
  onSelectOrder,
  onDeleteTransaction,
}: CashInflowSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [bulanFilter, setBulanFilter] = useState(activeBulan || 'all');
  const [tahunFilter, setTahunFilter] = useState(activeTahun || 'all');

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

  const rawInflows: CashInflowEntry[] = useMemo(() => {
    const list: CashInflowEntry[] = [];

    orders.forEach((order) => {
      if (order.tanggalOrder && order.tanggalOrder < '2026-10-01') return;

      if (Array.isArray(order.pembayaranList) && order.pembayaranList.length > 0) {
        order.pembayaranList.forEach((p, idx) => {
          const tgl = p.tanggal || order.tanggalOrder || '2026-10-01';
          if (p.nominal > 0 && tgl >= '2026-10-01') {
            let catType: InflowCategoryType = 'termin';
            if (p.jenis === 'dp' || idx === 0) catType = 'dp';
            if (p.jenis === 'pelunasan') catType = 'pelunasan';

            list.push({
              id: p.id || `pay-${order.id}-${idx}`,
              tanggal: tgl,
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
        const totalTagihan = order.totalInvoice || order.totalJumlah || 0;
        const isLunas = order.statusPembayaran === 'lunas' || (totalTagihan > 0 && order.totalUangMasukCustomer >= totalTagihan);
        const dpPersen = totalTagihan > 0 ? (order.totalUangMasukCustomer / totalTagihan) * 100 : (order.dpPersenCustomer || 0);
        const isTermin70 = dpPersen >= 70;
        const catType: InflowCategoryType = isLunas ? 'pelunasan' : isTermin70 ? 'termin' : 'dp';

        list.push({
          id: `pay-${order.id}-single`,
          tanggal: order.tanggalOrder || '2026-10-01',
          sumber: 'order',
          jenis: catType,
          noInv: order.noInv,
          orderId: order.id,
          customerName: order.customerName || order.namaCustomer || 'Customer',
          projectName: order.projectName || order.namaProject || '-',
          keterangan: `Pembayaran ${catType === 'pelunasan' ? 'Pelunasan 30%' : catType === 'termin' ? 'Termin 70% Produksi' : 'DP 1 Booking'} Konsumen`,
          nominal: order.totalUangMasukCustomer,
          rawOrder: order,
        });
      }
    });

    cashTransactions.forEach((tx) => {
      if (tx.tipe === 'masuk' && tx.kategori !== 'Penerimaan Konsumen' && (!tx.tanggal || tx.tanggal >= '2026-10-01')) {
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

    list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    return list;
  }, [orders, cashTransactions]);

  const yearOptions = useMemo(() => {
    const set = new Set<string>(['2026']);
    rawInflows.forEach((e) => e.tanggal && e.tanggal >= '2026-10-01' && set.add(e.tanggal.slice(0, 4)));
    const sorted = [...set].sort().reverse();
    return [{ value: 'all', label: 'Tahun 2026+' }, ...sorted.map((y) => ({ value: y, label: y }))];
  }, [rawInflows]);

  const bulanOptions = useMemo(() => {
    const isOnly2026 = tahunFilter === '2026' || tahunFilter === 'all';
    return isOnly2026 ? BULAN_FILTER_OPTIONS_2026 : BULAN_FILTER_OPTIONS_ALL;
  }, [tahunFilter]);

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

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, bulanFilter, tahunFilter, rawInflows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredInflows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedInflows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredInflows.slice(start, start + pageSize);
  }, [filteredInflows, safeCurrentPage]);

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

  const receivableStats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const matchingOrders = orders.filter((order) => {
      const tgl = order.tanggalOrder || '';
      if (tgl && tgl < '2026-10-01') return false;
      const matchesTahun = tahunFilter === 'all' || tgl.startsWith(tahunFilter);
      const matchesBulan = bulanFilter === 'all' || tgl.slice(5, 7) === bulanFilter;
      const cName = (order.customerName || order.namaCustomer || '').toLowerCase();
      const pName = (order.projectName || order.namaProject || '').toLowerCase();
      const inv = (order.noInv || '').toLowerCase();
      const matchesSearch = !q || cName.includes(q) || pName.includes(q) || inv.includes(q);
      return matchesTahun && matchesBulan && matchesSearch;
    });

    let totalTagihan = 0;
    let totalSudahMasuk = 0;
    let sisaPelunasanProduksi = 0;
    let sisaKurangDp = 0;
    let unpaidOrderCount = 0;

    matchingOrders.forEach((order) => {
      const tagihan = Math.max(0, Number(order.totalInvoice || order.totalJumlah || 0));
      const masuk = Math.max(0, Number(order.totalUangMasukCustomer || 0));
      const sisa = Math.max(0, tagihan - masuk);

      totalTagihan += tagihan;
      totalSudahMasuk += Math.min(tagihan, masuk);

      if (sisa > 0) {
        unpaidOrderCount++;
        const dpPct = tagihan > 0 ? (masuk / tagihan) * 100 : (order.dpPersenCustomer || 0);
        if (dpPct >= 70) {
          sisaPelunasanProduksi += sisa;
        } else {
          sisaKurangDp += sisa;
        }
      }
    });

    const totalSisaPiutang = sisaPelunasanProduksi + sisaKurangDp;
    const collectionRate = totalTagihan > 0 ? (totalSudahMasuk / totalTagihan) * 100 : 0;

    const slices = [
      {
        name: 'Sudah Cair (Uang Masuk)',
        value: totalSudahMasuk,
        color: '#0d9488',
      },
      {
        name: 'Sisa Pelunasan (Order ≥70%)',
        value: sisaPelunasanProduksi,
        color: '#f59e0b',
      },
      {
        name: 'Kurang DP (<70% Prioritas)',
        value: sisaKurangDp,
        color: '#f43f5e',
      },
    ];

    const activeSlices = slices.filter((s) => s.value > 0);

    return {
      totalTagihan,
      totalSudahMasuk,
      totalSisaPiutang,
      orderCount: matchingOrders.length,
      unpaidOrderCount,
      collectionRate,
      slices,
      activeSlices,
    };
  }, [orders, tahunFilter, bulanFilter, searchQuery]);

  const dailyTrendData = useMemo(() => {
    const map = new Map<string, number>();
    filteredInflows.forEach((item) => {
      if (item.tanggal) {
        map.set(item.tanggal, (map.get(item.tanggal) || 0) + item.nominal);
      }
    });

    return Array.from(map.entries())
      .map(([tanggal, nominal]) => ({
        tanggal: formatDateTick(tanggal),
        fullDate: tanggal,
        nominal,
      }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
      .slice(-14); // Ambil maksimal 14 hari terakhir
  }, [filteredInflows]);

  // Export Excel Eksekutif Standar Inzta (US-9.28)
  const handleExportExcel = async () => {
    if (filteredInflows.length === 0) {
      toast.error('Tidak ada data pemasukan untuk diekspor!');
      return;
    }
    try {
      await exportCashInflowToExcel(filteredInflows, selectedPeriod);
      toast.success('Laporan Arus Kas Masuk berhasil diekspor ke Excel!');
    } catch (err) {
      console.error('Gagal mengekspor Excel:', err);
      toast.error('Gagal mengekspor berkas Excel');
    }
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setBulanFilter('all');
    setTahunFilter('all');
    onBulanChange?.('all');
    onTahunChange?.('all');
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                Tren Penerimaan Kas Harian
              </h3>
            </div>
            {dailyTrendData.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                <Calendar className="h-3 w-3 text-slate-400" />
                {formatDateRangeBadge(dailyTrendData.map((d) => d.fullDate))}
              </span>
            )}
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
                    labelFormatter={(_label, payload) => {
                      const fullDate = payload?.[0]?.payload?.fullDate;
                      return `Tanggal: ${fullDate ? formatIndonesianDateFull(fullDate) : _label}`;
                    }}
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

        {/* Chart B: Realisasi Kas Masuk vs Sisa Piutang Customer */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-card-double flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-teal-600 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                    Realisasi Uang Masuk vs Piutang
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Porsi tagihan order yang sudah cair vs belum dibayar customer
                  </p>
                </div>
              </div>
            </div>

            <div className="relative h-40 w-full">
              {receivableStats.totalTagihan === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada tagihan order pada periode ini
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={receivableStats.activeSlices}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={44}
                        outerRadius={66}
                        paddingAngle={receivableStats.activeSlices.length > 1 ? 3 : 0}
                      >
                        {receivableStats.activeSlices.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatRupiah(Number(val) || 0), 'Nilai']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.96)',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Donut Percentage Indicator */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-sm font-black tracking-tight text-teal-700 tabular-nums">
                      {receivableStats.collectionRate.toFixed(1)}%
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Terkumpul
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Legend & Total Contract Context */}
          <div className="space-y-2 pt-2.5 border-t border-slate-100 text-[10.5px]">
            <div className="space-y-1.5">
              {receivableStats.slices.map((item) => {
                if (item.value === 0 && item.name.includes('Kurang DP')) return null;
                const pct =
                  receivableStats.totalTagihan > 0
                    ? ((item.value / receivableStats.totalTagihan) * 100).toFixed(1)
                    : '0.0';
                return (
                  <div key={item.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600 font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono font-bold text-slate-800 tabular-nums">
                        {formatCompactRupiah(item.value)}
                      </span>
                      <span className="text-slate-400 font-mono tabular-nums">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Summary Pill: Total Nilai Order vs Sisa Piutang */}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 text-[10px]">
              <span className="text-slate-500 font-semibold">
                Total Tagihan ({receivableStats.orderCount} Order)
              </span>
              <span className="font-mono font-extrabold text-slate-800 tabular-nums">
                {formatCompactRupiah(receivableStats.totalTagihan)}
              </span>
            </div>
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
              onValueChange={(val) => {
                setBulanFilter(val);
                onBulanChange?.(val);
              }}
              options={bulanOptions}
              className="w-32 h-9"
            />

            <CustomSelect
              value={tahunFilter}
              onValueChange={(val) => {
                setTahunFilter(val);
                onTahunChange?.(val);
              }}
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
              <span>Ekspor Excel</span>
            </button>

            {onOpenAddIncome && (
              <button
                onClick={onOpenAddIncome}
                className="h-9 px-3.5 flex items-center gap-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-bold active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Catat Kas</span>
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
          {paginatedInflows.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
              Tidak ada riwayat pemasukan yang cocok dengan kriteria filter.
            </div>
          ) : (
            paginatedInflows.map((item) => (
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
                      type="button"
                      onClick={() => onSelectOrder?.(item.rawOrder!)}
                      title="Inspeksi Detail Order"
                      className="h-7 px-2 flex items-center justify-center gap-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-bold active:scale-[0.96] transition-transform duration-150 cursor-pointer shrink-0"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Detail</span>
                    </button>
                  ) : item.sumber === 'manual' ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      title="Hapus Transaksi Kas Masuk"
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
              {paginatedInflows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi pemasukan yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                paginatedInflows.map((item) => (
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
                          type="button"
                          onClick={() => onSelectOrder?.(item.rawOrder!)}
                          title="Inspeksi Detail Order"
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          <span>Detail</span>
                        </button>
                      ) : item.sumber === 'manual' ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          title="Hapus Transaksi Kas Masuk"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
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

        {/* Pagination Bar */}
        {filteredInflows.length > 0 && (() => {
          const startIdx = (safeCurrentPage - 1) * pageSize + 1;
          const endIdx = Math.min(safeCurrentPage * pageSize, filteredInflows.length);
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
                <strong className="text-slate-800 font-mono tabular-nums">{filteredInflows.length}</strong> transaksi pemasukan
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

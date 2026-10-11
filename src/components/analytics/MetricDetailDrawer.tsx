'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupiah, formatCompactRupiah } from '@/lib/utils';
import type {
  Order,
  CashTransaction,
  FinancialSummary,
  MetricDrawerType,
  MasterFinanceRow,
} from '@/types';
import {
  X,
  Search,
  ExternalLink,
  MessageCircle,
  Building2,
  Calendar,
  Wallet,
  Receipt,
  ClockAlert,
  ArrowUpRight,
  TrendingUp,
  HandCoins,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';

interface MetricDetailDrawerProps {
  isOpen: boolean;
  metricType: MetricDrawerType | null;
  onClose: () => void;
  summary: FinancialSummary;
  orders: Order[];
  transactions: CashTransaction[];
  saldoAwal?: number;
  initialVendorFilter?: string | null;
  onOpenAddIncome?: () => void;
  onSelectOrder?: (order: MasterFinanceRow) => void;
}

export function MetricDetailDrawer({
  isOpen,
  metricType,
  onClose,
  summary,
  orders,
  transactions,
  saldoAwal = 0,
  initialVendorFilter = null,
  onOpenAddIncome,
  onSelectOrder,
}: MetricDetailDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lunas' | 'berjalan'>('all');

  // Sinkronisasi vendor filter saat initialVendorFilter berubah
  useEffect(() => {
    if (initialVendorFilter) {
      setSelectedVendorFilter(initialVendorFilter);
    } else {
      setSelectedVendorFilter('all');
    }
  }, [initialVendorFilter, metricType]);

  // Reset filter saat drawer dibuka dengan metrik baru
  useEffect(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, [metricType]);

  // Listener tombol ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Ekstraksi daftar vendor unik untuk tab/filter vendor
  const vendorList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.vendorName) set.add(o.vendorName);
    });
    return Array.from(set).sort();
  }, [orders]);

  const vendorOptions = useMemo(() => {
    return [
      { value: 'all', label: 'Semua Vendor' },
      ...vendorList.map((v) => ({ value: v, label: v })),
    ];
  }, [vendorList]);

  // Filter Orders sesuai pencarian dan filter aktif
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        o.noInv.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.projectName && o.projectName.toLowerCase().includes(q)) ||
        (o.vendorName && o.vendorName.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (metricType === 'vendor_debt') {
        const hasDebt = (o.totalHpp - o.totalDibayarKeVendor) > 0;
        if (!hasDebt) return false;
        if (selectedVendorFilter !== 'all' && o.vendorName !== selectedVendorFilter) {
          return false;
        }
      }

      if (metricType === 'outstanding') {
        const sisaPiutang = o.totalInvoice - o.totalUangMasukCustomer;
        return sisaPiutang > 0;
      }

      if (metricType === 'omzet') {
        const isLunas = o.statusPembayaran === 'lunas' || o.totalUangMasukCustomer >= o.totalInvoice;
        if (statusFilter === 'lunas') return isLunas;
        if (statusFilter === 'berjalan') return !isLunas;
      }

      return true;
    });
  }, [orders, searchQuery, selectedVendorFilter, statusFilter, metricType]);

  // Filter Cash Transactions untuk Uang Keluar & Saldo
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return transactions.filter((t) => {
      if (metricType === 'cashout' && t.tipe !== 'keluar') return false;
      const matchSearch =
        !q ||
        t.keterangan.toLowerCase().includes(q) ||
        t.kategori.toLowerCase().includes(q) ||
        (t.refInvoice && t.refInvoice.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [transactions, searchQuery, metricType]);

  if (!isOpen || !metricType) return null;

  // Konfigurasi visual per metrik
  const meta = {
    omzet: {
      title: 'Detail Omzet Realtime',
      badge: 'Pendapatan Bruto',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      totalValue: summary.omzetTotal,
      subtitle: `${summary.omzetLunasCount} order lunas + ${summary.omzetBerjalanCount} order berjalan`,
      formula: 'Total Omzet = ∑ Nilai Bersih Invoice Seluruh Pesanan (Berjalan & Selesai)',
      formulaDesc:
        'Akumulasi nilai seluruh pesanan yang telah dikonfirmasi pelanggan. Mencakup pesanan yang sudah lunas maupun yang sedang dalam progres produksi.',
      icon: Receipt,
      accentColor: 'text-sky-600',
    },
    profit: {
      title: 'Detail Estimasi Profit Realtime',
      badge: `Net Margin ${summary.profitMarginPercent.toFixed(1)}%`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      totalValue: summary.totalProfitRealtime,
      subtitle: `Estimasi laba bersih: ${formatRupiah(summary.estimasiProfitBersih)}`,
      formula: 'Profit Realtime = ∑ (Total Invoice - HPP Vendor - Biaya Operasional Order)',
      formulaDesc:
        'Hak margin bersih VisualKain atas seluruh pesanan. Angka ini mencerminkan surplus komersial sebelum dikurangi beban kas umum di luar proyek.',
      icon: TrendingUp,
      accentColor: 'text-emerald-600',
    },
    saldo: {
      title: 'Detail Saldo Periode Rekening',
      badge: 'Kas Bank Riil',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      totalValue: summary.saldoKasRiil,
      subtitle: `Saldo Awal: ${formatCompactRupiah(saldoAwal)} • Inflow: ${formatCompactRupiah(summary.totalKasMasuk)}`,
      formula: 'Saldo Kas = (Saldo Awal + Total Uang Masuk) - (Bayar Vendor + Beban Operasional)',
      formulaDesc:
        'Posisi kas nyata yang tersedia di rekening bank. Mengikuti prinsip Dua Kantong Alokasi Dana agar uang operasional dan titipan pokok vendor terpisah.',
      icon: Wallet,
      accentColor: 'text-teal-600',
    },
    cashout: {
      title: 'Detail Pengeluaran (Uang Keluar)',
      badge: 'Kas Keluar Operasional',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      totalValue: summary.totalKasKeluar,
      subtitle: `${summary.kasKeluarCount} transaksi mutasi keluar tercatat`,
      formula: 'Total Uang Keluar = ∑ Seluruh Transaksi Beban Kas Keluar & Pembayaran Vendor',
      formulaDesc:
        'Akumulasi seluruh mutasi debit rekening bank, terdiri dari beban operasional, gaji, logistik, pemasaran, keuangan, pajak, serta pencairan ke vendor.',
      icon: ArrowUpRight,
      accentColor: 'text-rose-600',
    },
    vendor_debt: {
      title: 'Detail Utang Vendor Global',
      badge: 'Kewajiban Pokok Mitra',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      totalValue: summary.totalUtangVendor,
      subtitle: `${summary.vendorDebtCount} pesanan dengan sisa kewajiban vendor`,
      formula: 'Utang Vendor = ∑ (Total HPP Vendor - Akumulasi Dana yang Telah Dibayar ke Vendor)',
      formulaDesc:
        'Kewajiban pokok produksi yang masih harus dilunasi ke vendor/mitra konveksi. Pembayaran vendor dibebankan dari alokasi kas pokok konsumen, bukan margin bersih.',
      icon: ClockAlert,
      accentColor: 'text-amber-600',
    },
    outstanding: {
      title: 'Detail Piutang & Outstanding Customer',
      badge: 'Hak Tagih Konsumen',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      totalValue: summary.totalPiutangCustomer,
      subtitle: `${summary.unpaidCustomerCount} pesanan belum menyelesaikan pelunasan 100%`,
      formula: 'Outstanding = ∑ (Total Tagihan Invoice - Akumulasi Uang Masuk Customer)',
      formulaDesc:
        'Dana tagihan yang masih tertahan di tangan pelanggan. Dilengkapi tombol 1-klik follow up WhatsApp dengan pesan formal sesuai tahap cicilan.',
      icon: HandCoins,
      accentColor: 'text-indigo-600',
    },
  }[metricType];

  const Icon = meta.icon;

  // Helper konversi order ke MasterFinanceRow saat user ingin inspeksi
  const handleOpenOrderInspection = (o: Order) => {
    if (!onSelectOrder) return;
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

    const row: MasterFinanceRow = {
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
      statusOrder: o.statusOrder || 'PRODUKSI',
      pembayaranList: o.pembayaranList,
      vendorName: o.vendorName,
    };

    onSelectOrder(row);
  };

  // Helper WhatsApp generator
  const getWhatsAppLink = (order: Order) => {
    const cleanPhone = (order.noWaCustomer || '08123456789')
      .replace(/[^0-9]/g, '')
      .replace(/^0/, '62');
    const sisa = Math.max(0, order.totalInvoice - order.totalUangMasukCustomer);
    const dpPersen = order.totalInvoice > 0 ? (order.totalUangMasukCustomer / order.totalInvoice) * 100 : 0;

    let text = '';
    if (dpPersen < 70) {
      const sisa70 = Math.max(0, 0.7 * order.totalInvoice - order.totalUangMasukCustomer);
      text = `Halo Kak ${order.customerName}! Pembayaran DP pesanan *${order.projectName || order.noInv}* (${order.noInv}) telah kami catat (${dpPersen.toFixed(1)}%). Sesuai SOP, pesanan akan naik potong & jahit saat DP mencapai 70%. Kekurangan DP 70% adalah *${formatRupiah(sisa70)}*. Terima kasih!`;
    } else {
      text = `Halo Kak ${order.customerName}! Mengonfirmasi sisa pelunasan pesanan *${order.projectName || order.noInv}* (${order.noInv}) sebesar *${formatRupiah(sisa)}*. Mohon info perkiraan transfernya ya kak. Terima kasih!`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        {/* Slide-Over Panel */}
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="flex w-screen max-w-xl md:max-w-2xl flex-col bg-white shadow-2xl"
          >
            {/* Top Bar Header */}
            <div className="flex items-center justify-between border-b border-slate-200/90 px-6 py-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className={`rounded-xl p-2.5 bg-white border border-slate-200 shadow-sm ${meta.accentColor}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {meta.title}
                    </h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeColor}`}>
                      {meta.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    VisualKain Realtime Traceability & Audit Engine
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 active:scale-95 transition-all"
                title="Tutup (ESC)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* 1. Hero Nominal Display Banner */}
              <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                    Nominal Akumulasi Saat Ini
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    Sinkron Periode Aktif
                  </span>
                </div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                  {formatRupiah(meta.totalValue)}
                </div>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  {meta.subtitle}
                </p>
              </div>

              {/* 2. Formula Traceability & Accounting Audit Box */}
              <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <Receipt className="h-4 w-4 text-teal-700 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-teal-900 font-mono">
                      Rumus Akuntansi: {meta.formula}
                    </h4>
                    <p className="mt-1 text-[11px] text-teal-800 leading-relaxed">
                      {meta.formulaDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Sub-Filters & Quick Search Controls */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        metricType === 'cashout'
                          ? 'Cari beban kas, kategori, keterangan...'
                          : 'Cari invoice, customer, vendor...'
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs"
                    />
                  </div>

                  {metricType === 'omzet' && (
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                          statusFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua ({orders.length})
                      </button>
                      <button
                        onClick={() => setStatusFilter('lunas')}
                        className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                          statusFilter === 'lunas'
                            ? 'bg-white text-emerald-700 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Lunas
                      </button>
                      <button
                        onClick={() => setStatusFilter('berjalan')}
                        className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                          statusFilter === 'berjalan'
                            ? 'bg-white text-amber-700 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Berjalan
                      </button>
                    </div>
                  )}

                  {metricType === 'vendor_debt' && vendorList.length > 0 && (
                    <div className="w-full sm:w-52 shrink-0">
                      <CustomSelect
                        value={selectedVendorFilter}
                        onValueChange={setSelectedVendorFilter}
                        icon={<Building2 className="h-3.5 w-3.5" />}
                        options={vendorOptions}
                        placeholder="Semua Vendor"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Itemized Data Breakdown List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-1 border-b border-slate-100">
                  <span>
                    Rincian Transaksi Pembentuk (
                    {metricType === 'cashout' ? filteredTransactions.length : filteredOrders.length} data)
                  </span>
                  {metricType === 'cashout' && onOpenAddIncome && (
                    <button
                      onClick={onOpenAddIncome}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
                    >
                      <Plus className="h-3 w-3" /> Catat Kas Keluar
                    </button>
                  )}
                </div>

                {/* Tampilan untuk Uang Keluar (Cash Transactions) */}
                {metricType === 'cashout' && (
                  <div className="space-y-2">
                    {filteredTransactions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                        Tidak ada transaksi pengeluaran yang cocok dengan pencarian.
                      </div>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs hover:border-slate-300 transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {tx.keterangan}
                              </span>
                              <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                {tx.kategori}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                              <Calendar className="h-3 w-3" />
                              <span>{tx.tanggal}</span>
                              {tx.refInvoice && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-slate-500">
                                    Ref: {tx.refInvoice}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-rose-600 tabular-nums">
                              -{formatRupiah(tx.nominal)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tampilan untuk Saldo Kas (Rincian Komponen Saldo) */}
                {metricType === 'saldo' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>1. Saldo Awal Pembukuan Bank</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {formatRupiah(saldoAwal)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700">
                        <span>2. Akumulasi Kas Masuk Konsumen (+)</span>
                        <span className="font-bold tabular-nums">
                          +{formatRupiah(summary.totalKasMasuk)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-rose-700">
                        <span>3. Kas Keluar Pembayaran Vendor (-)</span>
                        <span className="font-bold tabular-nums">
                          -{formatRupiah(summary.totalDibayarKeVendor)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-rose-700">
                        <span>4. Beban Operasional Umum Lain (-)</span>
                        <span className="font-bold tabular-nums">
                          -{formatRupiah(summary.bebanOperasionalNonVendor)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-teal-900">
                        <span>Saldo Kas Bersih Riil</span>
                        <span className="tabular-nums font-mono">
                          {formatRupiah(summary.saldoKasRiil)}
                        </span>
                      </div>
                    </div>

                    <h5 className="text-xs font-bold text-slate-700 mt-4">
                      Mutasi Kas Terakhir
                    </h5>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {transactions.slice(0, 8).map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs"
                        >
                          <div>
                            <span className="font-medium text-slate-800">
                              {tx.keterangan}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {tx.tanggal} • {tx.kategori}
                            </div>
                          </div>
                          <span
                            className={`font-bold tabular-nums ${
                              tx.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {tx.tipe === 'masuk' ? '+' : '-'}
                            {formatRupiah(tx.nominal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tampilan untuk Omzet, Profit, Utang Vendor, dan Outstanding (Order Breakdown) */}
                {['omzet', 'profit', 'vendor_debt', 'outstanding'].includes(metricType) && (
                  <div className="space-y-2.5">
                    {filteredOrders.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                        Tidak ada pesanan yang sesuai dengan kriteria filter.
                      </div>
                    ) : (
                      filteredOrders.map((o) => {
                        const sisaPiutang = Math.max(0, o.totalInvoice - o.totalUangMasukCustomer);
                        const sisaVendor = Math.max(0, o.totalHpp - o.totalDibayarKeVendor);
                        const isLunas = o.statusPembayaran === 'lunas' || sisaPiutang === 0;
                        const marginNet = o.profitAktual ?? (o.totalInvoice - o.totalHpp - (o.biayaOperasional || 0));
                        const marginPercent = o.totalInvoice > 0 ? (marginNet / o.totalInvoice) * 100 : 0;
                        const waLink = getWhatsAppLink(o);

                        return (
                          <div
                            key={o.id}
                            className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                                    {o.noInv}
                                  </span>
                                  <h4 className="text-xs font-extrabold text-slate-900">
                                    {o.customerName}
                                  </h4>
                                </div>
                                <p className="mt-1 text-xs text-slate-500 font-medium">
                                  {o.projectName || '-'}
                                  {o.vendorName && ` • Vendor: ${o.vendorName}`}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {metricType === 'outstanding' && sisaPiutang > 0 && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all"
                                    title="Kirim pesan penagihan WhatsApp"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    WA Tagih
                                  </a>
                                )}

                                <button
                                  onClick={() => handleOpenOrderInspection(o)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                                  title="Lihat riwayat lengkap"
                                >
                                  Detail <ExternalLink className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {/* Rincian Angka Kontekstual */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                              {metricType === 'omzet' && (
                                <>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Nilai Invoice</span>
                                    <span className="font-bold text-slate-900 tabular-nums">
                                      {formatRupiah(o.totalInvoice)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Uang Masuk</span>
                                    <span className="font-bold text-emerald-600 tabular-nums">
                                      {formatRupiah(o.totalUangMasukCustomer)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Sisa Piutang</span>
                                    <span className="font-bold text-slate-700 tabular-nums">
                                      {formatRupiah(sisaPiutang)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Status</span>
                                    <span
                                      className={`inline-block font-bold text-[10px] rounded px-1.5 py-0.5 ${
                                        isLunas
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}
                                    >
                                      {isLunas ? 'LUNAS' : 'BERJALAN'}
                                    </span>
                                  </div>
                                </>
                              )}

                              {metricType === 'profit' && (
                                <>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Invoice</span>
                                    <span className="font-bold text-slate-900 tabular-nums">
                                      {formatRupiah(o.totalInvoice)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Modal HPP</span>
                                    <span className="font-bold text-slate-600 tabular-nums">
                                      {formatRupiah(o.totalHpp)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Net Margin</span>
                                    <span className="font-bold text-emerald-700 tabular-nums">
                                      {formatRupiah(marginNet)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Margin %</span>
                                    <span className="font-bold text-emerald-700 tabular-nums">
                                      {marginPercent.toFixed(1)}%
                                    </span>
                                  </div>
                                </>
                              )}

                              {metricType === 'vendor_debt' && (
                                <>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Total HPP PO</span>
                                    <span className="font-bold text-slate-900 tabular-nums">
                                      {formatRupiah(o.totalHpp)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Diserahkan</span>
                                    <span className="font-bold text-emerald-600 tabular-nums">
                                      {formatRupiah(o.totalDibayarKeVendor)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Sisa Utang</span>
                                    <span className="font-bold text-rose-600 tabular-nums">
                                      {formatRupiah(sisaVendor)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Mitra</span>
                                    <span className="font-bold text-slate-700 truncate block">
                                      {o.vendorName || 'Umum'}
                                    </span>
                                  </div>
                                </>
                              )}

                              {metricType === 'outstanding' && (
                                <>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Total Invoice</span>
                                    <span className="font-bold text-slate-900 tabular-nums">
                                      {formatRupiah(o.totalInvoice)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">DP Masuk</span>
                                    <span className="font-bold text-emerald-600 tabular-nums">
                                      {formatRupiah(o.totalUangMasukCustomer)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Sisa Tagihan</span>
                                    <span className="font-bold text-rose-600 tabular-nums">
                                      {formatRupiah(sisaPiutang)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Progres DP</span>
                                    <span className="font-bold text-indigo-700 tabular-nums">
                                      {((o.totalUangMasukCustomer / (o.totalInvoice || 1)) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer Bar */}
            <div className="flex items-center justify-between border-t border-slate-200/90 px-6 py-4 bg-slate-50/70">
              <span className="text-[11px] text-slate-400">
                Tekan <kbd className="rounded border bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600">ESC</kbd> untuk menutup
              </span>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shadow-xs"
              >
                Tutup Inspeksi
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupiah, formatCompactRupiah, cn, normalizeWaNumber } from '@/lib/utils';
import { buildCashOutflowEntries, aggregateOrders } from '@/lib/financial-calculator';
import {
  matchPeriod,
  periodEnd,
  buildCashEntries,
  groupBebanKasByKategori,
  type CashPeriod,
  type CashCoverageProjection,
} from '@/lib/cash-ledger';
import { isInvestorInflow, summarizeInvestors } from '@/lib/investor-ledger';
import type {
  Order,
  CashTransaction,
  CashOutflowEntry,
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
  Landmark,
  PiggyBank,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import { CashCoveragePanel } from '@/components/analytics/CashCoveragePanel';

interface MetricDetailDrawerProps {
  isOpen: boolean;
  metricType: MetricDrawerType | null;
  onClose: () => void;
  summary: FinancialSummary;
  orders: Order[];
  transactions: CashTransaction[];
  /** Sumber daftar Dana Masuk/Keluar (cash basis): semua order dan kas, difilter per tanggal entri. */
  cashOrders?: Order[];
  cashTransactions?: CashTransaction[];
  cashPeriod?: CashPeriod;
  saldoAwal?: number;
  coverage?: CashCoverageProjection;
  initialVendorFilter?: string | null;
  onOpenAddIncome?: () => void;
  onOpenAddExpense?: () => void;
  onSelectOrder?: (order: MasterFinanceRow) => void;
}

export function MetricDetailDrawer({
  isOpen,
  metricType,
  onClose,
  summary,
  orders,
  transactions,
  cashOrders,
  cashTransactions,
  cashPeriod,
  saldoAwal = 0,
  coverage,
  initialVendorFilter = null,
  onOpenAddIncome,
  onOpenAddExpense,
  onSelectOrder,
}: MetricDetailDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lunas' | 'berjalan'>('all');
  const [inflowFilter, setInflowFilter] = useState<'all' | 'dp' | 'termin' | 'pelunasan' | 'kas_masuk' | 'investor'>('all');
  const [saldoSubView, setSaldoSubView] = useState<'komponen' | 'inflow' | 'outflow'>('komponen');

  useEffect(() => {
    if (initialVendorFilter) {
      setSelectedVendorFilter(initialVendorFilter);
    } else {
      setSelectedVendorFilter('all');
    }
  }, [initialVendorFilter, metricType]);

  useEffect(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setInflowFilter('all');
    setSaldoSubView('komponen');
  }, [metricType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        const isLunas = o.totalInvoice - o.totalUangMasukCustomer <= 0;
        if (statusFilter === 'lunas') return isLunas;
        if (statusFilter === 'berjalan') return !isLunas;
      }

      return true;
    });
  }, [orders, searchQuery, selectedVendorFilter, statusFilter, metricType]);

  const vendorAggregate = useMemo(
    () =>
      metricType === 'vendor_debt' && selectedVendorFilter !== 'all'
        ? aggregateOrders(orders.filter((o) => o.vendorName === selectedVendorFilter))
        : null,
    [metricType, selectedVendorFilter, orders]
  );

  const inPeriod = (tanggal: string | undefined) =>
    !cashPeriod || matchPeriod(tanggal, cashPeriod.bulan, cashPeriod.tahun);
  const flowOrders = cashOrders ?? orders;
  const flowTransactions = cashTransactions ?? transactions;

  const activePeriod: CashPeriod = cashPeriod ?? { bulan: 'all', tahun: 'all' };

  const bebanKasGroups = useMemo(
    () => groupBebanKasByKategori(buildCashEntries(flowOrders, flowTransactions), activePeriod),
    [flowOrders, flowTransactions, activePeriod.bulan, activePeriod.tahun]
  );

  const investorList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return summarizeInvestors(flowTransactions, periodEnd(activePeriod)).filter(
      (i) => !q || i.nama.toLowerCase().includes(q)
    );
  }, [flowTransactions, activePeriod.bulan, activePeriod.tahun, searchQuery]);

  const allOutflowEntries: CashOutflowEntry[] = useMemo(() => {
    return buildCashOutflowEntries(flowOrders, flowTransactions).filter((e) => inPeriod(e.tanggal));
  }, [flowOrders, flowTransactions, cashPeriod?.bulan, cashPeriod?.tahun]);

  const filteredOutflows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allOutflowEntries.filter((item) => {
      const matchSearch =
        !q ||
        item.keterangan.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        (item.noInv && item.noInv.toLowerCase().includes(q)) ||
        (item.vendorOrTargetName && item.vendorOrTargetName.toLowerCase().includes(q)) ||
        (item.tanggal && item.tanggal.includes(q)) ||
        item.nominal.toString().includes(q);
      return matchSearch;
    });
  }, [allOutflowEntries, searchQuery]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return transactions.filter((t) => {
      const matchSearch =
        !q ||
        t.keterangan.toLowerCase().includes(q) ||
        t.kategori.toLowerCase().includes(q) ||
        (t.refInvoice && t.refInvoice.toLowerCase().includes(q)) ||
        (t.tanggal && t.tanggal.includes(q)) ||
        t.nominal.toString().includes(q);
      return matchSearch;
    });
  }, [transactions, searchQuery]);

  // Agregasi seluruh arus kas masuk (pembayaran customer + kas masuk non-order) (US-9.9)
  const allInflowEntries = useMemo(() => {
    const list: Array<{
      id: string;
      order?: Order;
      noInv: string;
      namaCustomer: string;
      namaProject: string;
      tanggal: string;
      nominal: number;
      kategori: 'dp' | 'termin' | 'pelunasan' | 'kas_masuk' | 'investor';
      kategoriLabel: string;
      rekening: string;
      keterangan: string;
    }> = [];

    flowOrders.forEach((o) => {
      if (o.pembayaranList && o.pembayaranList.length > 0) {
        o.pembayaranList.forEach((p, idx) => {
          if (!p.nominal || p.nominal <= 0) return;
          if (p.tanggal && p.tanggal < '2026-10-01') return;
          let katLabel = 'Uang Muka (DP 1)';
          if (p.jenis === 'termin') katLabel = 'Termin (DP 2 70%)';
          else if (p.jenis === 'pelunasan') katLabel = 'Pelunasan Penuh';

          const parts = (p.keterangan || '').split(' - ');
          const rekening = parts[0] || 'Transfer Bank';
          const note = parts.slice(1).join(' - ') || p.keterangan || '-';

          list.push({
            id: p.id || `inflow-${o.id}-${idx}`,
            order: o,
            noInv: o.noInv,
            namaCustomer: o.customerName,
            namaProject: o.projectName || '-',
            tanggal: p.tanggal,
            nominal: p.nominal,
            kategori: p.jenis,
            kategoriLabel: katLabel,
            rekening,
            keterangan: note,
          });
        });
      } else if (o.totalUangMasukCustomer > 0) {
        list.push({
          id: `inflow-${o.id}-legacy`,
          order: o,
          noInv: o.noInv,
          namaCustomer: o.customerName,
          namaProject: o.projectName || '-',
          tanggal: o.tanggalInv || o.tanggalOrder || '-',
          nominal: o.totalUangMasukCustomer,
          kategori: 'dp',
          kategoriLabel: 'Uang Muka (DP)',
          rekening: 'Transfer Bank',
          keterangan: 'Pembayaran DP Konsumen',
        });
      }
    });

    flowTransactions.forEach((tx) => {
      if (isInvestorInflow(tx)) {
        list.push({
          id: tx.id,
          noInv: tx.refInvoice || 'INVESTOR',
          namaCustomer: tx.investorNama || 'Investor',
          namaProject: tx.jatuhTempo ? `Target kembali ${tx.jatuhTempo}` : 'Dana Investor',
          tanggal: tx.tanggal,
          nominal: tx.nominal,
          kategori: 'investor',
          kategoriLabel: 'Dana Investor',
          rekening: 'Kas / Bank',
          keterangan: tx.keterangan,
        });
        return;
      }
      if (tx.tipe === 'masuk' && tx.kategori !== 'Penerimaan Konsumen') {
        list.push({
          id: tx.id,
          noInv: tx.refInvoice || 'KAS-MASUK',
          namaCustomer: 'Penerimaan Non-Order',
          namaProject: tx.kategori || 'Kas Langsung',
          tanggal: tx.tanggal,
          nominal: tx.nominal,
          kategori: 'kas_masuk',
          kategoriLabel: 'Kas Masuk Non-Order',
          rekening: 'Kas / Bank',
          keterangan: tx.keterangan,
        });
      }
    });

    return list.filter((item) => inPeriod(item.tanggal)).sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
  }, [flowOrders, flowTransactions, cashPeriod?.bulan, cashPeriod?.tahun]);

  const filteredInflows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allInflowEntries.filter((item) => {
      const matchSearch =
        !q ||
        item.noInv.toLowerCase().includes(q) ||
        item.namaCustomer.toLowerCase().includes(q) ||
        item.namaProject.toLowerCase().includes(q) ||
        item.keterangan.toLowerCase().includes(q) ||
        item.rekening.toLowerCase().includes(q);

      if (!matchSearch) return false;
      // Kartu Dana Masuk hanya pemasukan usaha; dana investor tampil di drawer Saldo dan Dana Investor.
      if (metricType === 'cashin' && item.kategori === 'investor') return false;
      if (inflowFilter !== 'all' && item.kategori !== inflowFilter) return false;
      return true;
    });
  }, [allInflowEntries, searchQuery, inflowFilter, metricType]);

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
      title: 'Detail Laba Kotor',
      badge: `Margin Kotor ${summary.profitMarginPercent.toFixed(1)}%`,
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      totalValue: summary.totalProfitRealtime,
      subtitle: `Laba bersih setelah beban kas: ${formatRupiah(summary.labaBersih)}`,
      formula: 'Laba Kotor = ∑ (Total Invoice - HPP Vendor - Biaya Operasional Order)',
      formulaDesc:
        'Selisih nilai pesanan dengan modal vendor dan biaya operasional order. Belum dikurangi beban kas umum (gaji, sewa, marketing, dll).',
      icon: TrendingUp,
      accentColor: 'text-sky-600',
    },
    net_profit: {
      title: 'Detail Laba Bersih (Profit Riil)',
      badge: `Margin Bersih ${summary.labaBersihMarginPercent.toFixed(1)}%`,
      badgeColor: summary.labaBersih < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      totalValue: summary.labaBersih,
      subtitle: `Laba kotor ${formatCompactRupiah(summary.totalProfitRealtime)} - beban kas ${formatCompactRupiah(summary.bebanOperasionalKas ?? 0)}`,
      formula: 'Laba Bersih = Laba Kotor - Beban Operasional Kas',
      formulaDesc:
        'Laba kotor pesanan dipotong seluruh dana keluar operasional pada periode (gaji, sewa, marketing, bagi hasil investor, dll). Pembayaran vendor pesanan sudah termasuk di HPP, dan pengembalian pokok investor bukan beban.',
      icon: PiggyBank,
      accentColor: summary.labaBersih < 0 ? 'text-rose-600' : 'text-emerald-600',
    },
    investor: {
      title: 'Detail Dana Investor',
      badge: 'Kewajiban Wajib Kembali',
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
      totalValue: summary.kewajibanInvestor,
      subtitle: `Periode ini: masuk ${formatCompactRupiah(summary.danaInvestorMasuk)} • dikembalikan ${formatCompactRupiah(summary.danaInvestorKembali)}`,
      formula: 'Sisa Kewajiban = ∑ Dana Investor Masuk - ∑ Pengembalian Pokok',
      formulaDesc:
        'Dana investor menambah saldo kas tetapi bukan pendapatan, sehingga tidak masuk laba. Pengembalian pokok mengurangi kewajiban; bagi hasil dicatat sebagai beban.',
      icon: Landmark,
      accentColor: 'text-violet-600',
    },
    saldo: {
      title: 'Detail Saldo Periode Rekening',
      badge: summary.saldoKasRiil < 0 ? 'Defisit Kas Periode' : 'Kas Bank Riil',
      badgeColor: summary.saldoKasRiil < 0 ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold' : 'bg-teal-50 text-teal-700 border-teal-200',
      totalValue: summary.saldoKasRiil,
      subtitle: `Saldo Awal Periode: ${formatCompactRupiah(saldoAwal)} • Kas Masuk: ${formatCompactRupiah(summary.totalKasMasuk)}`,
      formula: 'Saldo Kas = (Saldo Awal + Total Uang Masuk) - (Bayar Vendor + Beban Operasional)',
      formulaDesc:
        'Posisi kas nyata yang tersedia di rekening bank. Mengikuti prinsip alokasi dana agar uang operasional dan titipan pokok vendor terpisah.',
      icon: Wallet,
      accentColor: summary.saldoKasRiil < 0 ? 'text-rose-600' : 'text-teal-600',
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
      title: 'Detail Sisa Piutang Pelanggan',
      badge: 'Hak Tagih Konsumen',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      totalValue: summary.totalPiutangCustomer,
      subtitle: `${summary.unpaidCustomerCount} pesanan belum menyelesaikan pelunasan 100%`,
      formula: 'Sisa Piutang = ∑ (Total Tagihan Invoice - Akumulasi Uang Masuk Customer)',
      formulaDesc:
        'Dana tagihan yang masih tertahan di tangan pelanggan. Dilengkapi tombol 1-klik follow up WhatsApp dengan pesan formal sesuai tahap cicilan.',
      icon: HandCoins,
      accentColor: 'text-indigo-600',
    },
    cashin: {
      title: 'Detail Arus Kas Masuk (Penerimaan Kas)',
      badge: 'Pemasukan Kas Riil',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      totalValue: summary.totalKasMasukUsaha,
      subtitle: `Pemasukan usaha: pembayaran customer & kas masuk non-order (tanpa dana investor)`,
      formula: 'Pemasukan Usaha = ∑ DP + ∑ Termin + ∑ Pelunasan Konsumen + ∑ Kas Masuk Non-Order',
      formulaDesc:
        'Rincian seluruh arus kas masuk yang telah berhasil diterima ke rekening bank VisualKain. Menampilkan breakdown per invoice, customer, dan kategori termin.',
      icon: HandCoins,
      accentColor: 'text-emerald-600',
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
      ...o,
      originalOrder: o.rawOrder || o,
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
  const getWhatsAppLink = (order: Order): string | null => {
    const cleanPhone = normalizeWaNumber(order.noWaCustomer);
    if (!cleanPhone) return null;
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
      <div className="fixed inset-0 z-[60] overflow-hidden">
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
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="flex w-screen max-w-xl md:max-w-2xl h-full flex-col bg-white shadow-2xl overflow-hidden"
          >
            {/* Top Bar Header */}
            <div className="flex items-center justify-between border-b border-slate-200/90 px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <span className={`rounded-xl p-2 sm:p-2.5 bg-white border border-slate-200 shadow-sm shrink-0 ${meta.accentColor}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {meta.title}
                    </h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0 ${meta.badgeColor}`}>
                      {meta.badge}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                    VisualKain Realtime Traceability &amp; Audit Engine
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Tutup (ESC)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
              {/* 1. Hero Nominal Display Banner */}
              <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                    Nominal Akumulasi Saat Ini
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 shrink-0">
                    Sinkron Periode Aktif
                  </span>
                </div>
                <div className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
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
                {metricType === 'saldo' && (
                  <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setSaldoSubView('komponen')}
                      className={`rounded-lg py-1.5 px-2 font-medium transition-all text-center cursor-pointer ${
                        saldoSubView === 'komponen'
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Komponen
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaldoSubView('inflow')}
                      className={`rounded-lg py-1.5 px-2 font-medium transition-all text-center cursor-pointer ${
                        saldoSubView === 'inflow'
                          ? 'bg-white text-emerald-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Masuk ({formatCompactRupiah(summary.totalKasMasuk)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaldoSubView('outflow')}
                      className={`rounded-lg py-1.5 px-2 font-medium transition-all text-center cursor-pointer ${
                        saldoSubView === 'outflow'
                          ? 'bg-white text-rose-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Keluar ({formatCompactRupiah(summary.totalKasKeluar)})
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        metricType === 'cashout' || (metricType === 'saldo' && saldoSubView === 'outflow')
                          ? 'Cari beban kas, vendor, invoice, keterangan...'
                          : metricType === 'cashin' || (metricType === 'saldo' && saldoSubView === 'inflow')
                          ? 'Cari cicilan DP, invoice, customer, rekening...'
                          : 'Cari invoice, customer, vendor...'
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs"
                    />
                  </div>

                  {metricType === 'omzet' && (
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`rounded-lg px-2.5 py-1 font-medium transition-all cursor-pointer ${
                          statusFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua ({orders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('lunas')}
                        className={`rounded-lg px-2.5 py-1 font-medium transition-all cursor-pointer ${
                          statusFilter === 'lunas'
                            ? 'bg-white text-emerald-700 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Lunas
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('berjalan')}
                        className={`rounded-lg px-2.5 py-1 font-medium transition-all cursor-pointer ${
                          statusFilter === 'berjalan'
                            ? 'bg-white text-amber-700 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Berjalan
                      </button>
                    </div>
                  )}

                  {(metricType === 'cashin' || (metricType === 'saldo' && saldoSubView === 'inflow')) && (
                    <div className="w-full sm:w-56 shrink-0">
                      <CustomSelect
                        value={inflowFilter}
                        onValueChange={(val) => setInflowFilter(val as typeof inflowFilter)}
                        icon={<Filter className="h-3.5 w-3.5" />}
                        options={[
                          { value: 'all', label: 'Semua Kas Masuk' },
                          { value: 'dp', label: 'DP 1 (Booking)' },
                          { value: 'termin', label: 'DP 2 (70% Produksi)' },
                          { value: 'pelunasan', label: 'Pelunasan (30%)' },
                          { value: 'kas_masuk', label: 'Kas Masuk Non-Order' },
                          ...(metricType === 'saldo' ? [{ value: 'investor', label: 'Dana Investor' }] : []),
                        ]}
                      />
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

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-1 border-b border-slate-100">
                  <span>
                    {metricType === 'saldo' && saldoSubView === 'komponen'
                      ? 'Komponen Akuntansi Saldo Kas & Proyeksi Kecukupan Dana'
                      : metricType === 'investor'
                      ? `Posisi per Investor (${investorList.length} investor)`
                      : `Rincian Transaksi Pembentuk (${
                          metricType === 'cashin' || (metricType === 'saldo' && saldoSubView === 'inflow')
                            ? `${filteredInflows.length} mutasi masuk`
                            : metricType === 'cashout' || (metricType === 'saldo' && saldoSubView === 'outflow')
                            ? `${filteredOutflows.length} mutasi keluar`
                            : `${filteredOrders.length} order`
                        })`}
                  </span>
                  {(metricType === 'cashout' || (metricType === 'saldo' && saldoSubView === 'outflow')) && (onOpenAddExpense || onOpenAddIncome) && (
                    <button
                      onClick={onOpenAddExpense || onOpenAddIncome}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Catat Dana Keluar
                    </button>
                  )}
                  {(metricType === 'cashin' || (metricType === 'saldo' && saldoSubView === 'inflow')) && onOpenAddIncome && (
                    <button
                      onClick={onOpenAddIncome}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Catat Dana Masuk
                    </button>
                  )}
                </div>

                {/* A. TAMPILAN RINCIAN KAS MASUK (INFLOW BREAKDOWN) */}
                {(metricType === 'cashin' || (metricType === 'saldo' && saldoSubView === 'inflow')) && (
                  <div className="space-y-2.5">
                    {filteredInflows.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                        Tidak ada transaksi kas masuk yang sesuai dengan kriteria filter.
                      </div>
                    ) : (
                      filteredInflows.map((item) => (
                        <div
                          key={item.id}
                          className="group rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-card-double hover:border-emerald-300 transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[10px] sm:text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                  {item.noInv}
                                </span>
                                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate" title={item.namaCustomer}>
                                  {item.namaCustomer}
                                </h4>
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                  <Calendar className="h-3 w-3" />
                                  {item.tanggal}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500 font-medium truncate" title={item.namaProject}>
                                {item.namaProject} &bull; <span className="text-slate-600">{item.rekening}</span>
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-mono text-xs sm:text-sm font-black text-emerald-700 tabular-nums">
                                +{formatRupiah(item.nominal)}
                              </div>
                              <span
                                className={`inline-block mt-1 text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${
                                  item.kategori === 'dp'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : item.kategori === 'termin'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : item.kategori === 'pelunasan'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : item.kategori === 'investor'
                                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}
                              >
                                {item.kategoriLabel}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
                            <span className="truncate pr-2 italic text-[10.5px]">
                              Catatan: {item.keterangan || '-'}
                            </span>
                            {item.order && (
                              <button
                                type="button"
                                onClick={() => handleOpenOrderInspection(item.order!)}
                                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-teal-700 hover:text-teal-800 shrink-0 cursor-pointer"
                              >
                                Inspeksi Order <ExternalLink className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* B. TAMPILAN RINCIAN KAS KELUAR (OUTFLOW BREAKDOWN: VENDOR, OPEX ORDER, DAN KAS) */}
                {(metricType === 'cashout' || (metricType === 'saldo' && saldoSubView === 'outflow')) && (
                  <div className="space-y-2.5">
                    {filteredOutflows.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                        Tidak ada transaksi pengeluaran yang cocok dengan pencarian.
                      </div>
                    ) : (
                      filteredOutflows.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs hover:border-rose-300 transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={
                                    item.sumber === 'order'
                                      ? 'font-mono text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200'
                                      : 'font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200'
                                  }
                                >
                                  {item.noInv || 'KAS-KELUAR'}
                                </span>
                                <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                  {item.kategori}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                  <Calendar className="h-3 w-3" />
                                  {item.tanggal}
                                </span>
                              </div>
                              <div className="mt-1 font-bold text-xs text-slate-900">
                                {item.keterangan}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs sm:text-sm font-bold text-rose-600 tabular-nums font-mono">
                                -{formatRupiah(item.nominal)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
                            <span className="truncate pr-2 text-[10.5px]">
                              Tujuan / Mitra: <strong className="text-slate-700">{item.vendorOrTargetName}</strong>
                            </span>
                            {item.rawOrder && (
                              <button
                                type="button"
                                onClick={() => handleOpenOrderInspection(item.rawOrder!)}
                                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-teal-700 hover:text-teal-800 shrink-0 cursor-pointer"
                              >
                                Inspeksi Order <ExternalLink className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* C. TAMPILAN RINGKASAN SALDO KAS (KOMPONEN AUDIT & COVER HUTANG VENDOR) */}
                {metricType === 'saldo' && saldoSubView === 'komponen' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Saldo Awal Periode (akumulasi sejak 1 Okt 2026)</span>
                        <span className="font-bold text-slate-900 tabular-nums font-mono">
                          {formatRupiah(saldoAwal)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700">
                        <span>Pemasukan Usaha (+)</span>
                        <span className="font-bold tabular-nums font-mono">
                          +{formatRupiah(summary.totalKasMasukUsaha)}
                        </span>
                      </div>
                      {summary.danaInvestorMasuk > 0 && (
                        <div className="flex justify-between items-center text-violet-700">
                          <span>Dana Investor Masuk (+)</span>
                          <span className="font-bold tabular-nums font-mono">
                            +{formatRupiah(summary.danaInvestorMasuk)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-rose-700">
                        <span>Dana Keluar Pembayaran Vendor (-)</span>
                        <span className="font-bold tabular-nums font-mono">
                          -{formatRupiah(summary.totalDibayarKeVendor)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-rose-700">
                        <span>Beban Operasional Kas (-)</span>
                        <span className="font-bold tabular-nums font-mono">
                          -{formatRupiah(summary.bebanOperasionalKas ?? summary.totalKasKeluar)}
                        </span>
                      </div>
                      {(summary.bebanOperasionalOrders ?? 0) > 0 && (
                        <div className="flex justify-between items-center text-rose-700">
                          <span>Biaya Operasional Order (-)</span>
                          <span className="font-bold tabular-nums font-mono">
                            -{formatRupiah(summary.bebanOperasionalOrders || 0)}
                          </span>
                        </div>
                      )}
                      {summary.danaInvestorKembali > 0 && (
                        <div className="flex justify-between items-center text-violet-700">
                          <span>Pengembalian Dana Investor (-)</span>
                          <span className="font-bold tabular-nums font-mono">
                            -{formatRupiah(summary.danaInvestorKembali)}
                          </span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold">
                        <span className={summary.saldoKasRiil < 0 ? 'text-rose-950 font-bold' : 'text-teal-900'}>
                          Dana Tersedia Saat Ini (Saldo Kas)
                        </span>
                        <span className={cn('tabular-nums font-mono', summary.saldoKasRiil < 0 ? 'text-rose-600 font-extrabold' : 'text-teal-700')}>
                          {formatRupiah(summary.saldoKasRiil)}
                        </span>
                      </div>
                    </div>

                    {coverage && <CashCoveragePanel coverage={coverage} variant="compact" />}

                    {summary.saldoKasRiil < 0 && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Peringatan Posisi Kas Periode:</span> Akumulasi pengeluaran nyata (DP vendor + operasional kas) melebihi uang masuk customer sebesar <span className="font-bold font-mono text-rose-700">{formatRupiah(Math.abs(summary.saldoKasRiil))}</span>. Pastikan menagih sisa termin/pelunasan customer untuk menjaga likuiditas kas.
                        </div>
                      </div>
                    )}

                    <h5 className="text-xs font-bold text-slate-700 mt-4">
                      Mutasi Kas Operasional Terakhir (Non-Order) ({filteredTransactions.length})
                    </h5>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {filteredTransactions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                          Tidak ada mutasi kas yang sesuai dengan pencarian.
                        </div>
                      ) : (
                        filteredTransactions.slice(0, 15).map((tx) => (
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
                              className={`font-bold tabular-nums font-mono ${
                                tx.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {tx.tipe === 'masuk' ? '+' : '-'}
                              {formatRupiah(tx.nominal)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* E. KOMPONEN LABA BERSIH */}
                {metricType === 'net_profit' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Omzet (Net Invoice)</span>
                      <span className="font-bold tabular-nums font-mono">{formatRupiah(summary.omzetTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>HPP Vendor &amp; Biaya Operasional Order (-)</span>
                      <span className="font-bold tabular-nums font-mono">
                        -{formatRupiah(summary.omzetTotal - summary.totalProfitRealtime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold text-sky-800">
                      <span>Laba Kotor</span>
                      <span className="tabular-nums font-mono">{formatRupiah(summary.totalProfitRealtime)}</span>
                    </div>
                    {bebanKasGroups.length === 0 ? (
                      <div className="text-slate-500">Tidak ada beban operasional kas pada periode ini.</div>
                    ) : (
                      bebanKasGroups.map((g) => (
                        <div key={g.kategori} className="flex justify-between items-center text-rose-700">
                          <span>
                            {g.kategori} ({g.count}x) (-)
                          </span>
                          <span className="font-bold tabular-nums font-mono">-{formatRupiah(g.total)}</span>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-sm font-extrabold">
                      <span className={summary.labaBersih < 0 ? 'text-rose-700' : 'text-emerald-800'}>Laba Bersih</span>
                      <span className={cn('tabular-nums font-mono', summary.labaBersih < 0 ? 'text-rose-600' : 'text-emerald-700')}>
                        {formatRupiah(summary.labaBersih)}
                      </span>
                    </div>
                  </div>
                )}

                {/* F. POSISI DANA INVESTOR */}
                {metricType === 'investor' && (
                  <div className="space-y-2.5">
                    {investorList.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                        Belum ada dana investor tercatat. Catat lewat Dana Masuk, pilih mode Dana Investor.
                      </div>
                    ) : (
                      investorList.map((inv) => (
                        <div key={inv.key} className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-card-double space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">{inv.nama}</h4>
                              <p className="text-[11px] text-slate-500">
                                {inv.transaksi.length} transaksi
                                {inv.jatuhTempoTerdekat && inv.sisaKewajiban > 0 ? ` • target kembali ${inv.jatuhTempoTerdekat}` : ''}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0',
                                inv.sisaKewajiban > 0
                                  ? 'border-violet-200 bg-violet-50 text-violet-700'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              )}
                            >
                              {inv.sisaKewajiban > 0 ? 'Belum Lunas' : 'Lunas'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div className="rounded-lg bg-slate-50/80 p-2 border border-slate-100">
                              <span className="text-slate-400 block text-[9.5px] font-medium">Dana Masuk</span>
                              <span className="font-bold text-slate-900 tabular-nums font-mono text-xs">{formatRupiah(inv.totalMasuk)}</span>
                            </div>
                            <div className="rounded-lg bg-slate-50/80 p-2 border border-slate-100">
                              <span className="text-slate-400 block text-[9.5px] font-medium">Dikembalikan</span>
                              <span className="font-bold text-slate-700 tabular-nums font-mono text-xs">{formatRupiah(inv.totalKembali)}</span>
                            </div>
                            <div className="rounded-lg bg-slate-50/80 p-2 border border-slate-100">
                              <span className="text-slate-400 block text-[9.5px] font-medium">Bagi Hasil</span>
                              <span className="font-bold text-slate-700 tabular-nums font-mono text-xs">{formatRupiah(inv.totalBagiHasil)}</span>
                            </div>
                            <div className="rounded-lg bg-violet-50/80 p-2 border border-violet-100">
                              <span className="text-violet-700 block text-[9.5px] font-medium">Sisa Kewajiban</span>
                              <span className="font-bold text-violet-800 tabular-nums font-mono text-xs">{formatRupiah(inv.sisaKewajiban)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* G. TOTAL GABUNGAN SAAT DIFILTER KE SATU VENDOR */}
                {vendorAggregate && vendorAggregate.count > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-amber-900 truncate">
                        Total Semua Pesanan {selectedVendorFilter} ({vendorAggregate.count} pesanan)
                      </h4>
                      <Building2 className="h-4 w-4 text-amber-700 shrink-0" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                      <div className="rounded-lg bg-white p-2 border border-amber-100">
                        <span className="text-slate-400 block text-[9.5px] font-medium">Total Nilai Invoice</span>
                        <span className="font-bold text-slate-900 tabular-nums font-mono text-xs">{formatRupiah(vendorAggregate.totalInvoice)}</span>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-amber-100">
                        <span className="text-slate-400 block text-[9.5px] font-medium">Total HPP Vendor</span>
                        <span className="font-bold text-slate-700 tabular-nums font-mono text-xs">{formatRupiah(vendorAggregate.totalHpp)}</span>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-amber-100">
                        <span className="text-slate-400 block text-[9.5px] font-medium">Sudah Diserahkan</span>
                        <span className="font-bold text-slate-700 tabular-nums font-mono text-xs">{formatRupiah(vendorAggregate.totalDibayarVendor)}</span>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-rose-100">
                        <span className="text-rose-600 block text-[9.5px] font-medium">Sisa Utang</span>
                        <span className="font-bold text-rose-700 tabular-nums font-mono text-xs">{formatRupiah(vendorAggregate.sisaUtangVendor)}</span>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-emerald-100 col-span-2 sm:col-span-1">
                        <span className="text-emerald-700 block text-[9.5px] font-medium">Net Profit</span>
                        <span className="font-bold text-emerald-800 tabular-nums font-mono text-xs">{formatRupiah(vendorAggregate.netProfit)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* D. TAMPILAN ORDER BREAKDOWN (OMZET, PROFIT, UTANG VENDOR, OUTSTANDING) */}
                {/* Redesain Kartu Sesuai US-9.11: No Inv, Customer, Tanggal, Status, Vendor, Revenue, Modal HPP, Biaya Op, Net Margin, Margin % (TANPA PROFIT AKTUAL) */}
                {['omzet', 'profit', 'net_profit', 'vendor_debt', 'outstanding'].includes(metricType) && (
                  <div className="space-y-3">
                    {filteredOrders.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                        Tidak ada pesanan yang sesuai dengan kriteria filter.
                      </div>
                    ) : (
                      filteredOrders.map((o) => {
                        const sisaPiutang = Math.max(0, o.totalInvoice - o.totalUangMasukCustomer);
                        const sisaVendor = Math.max(0, o.totalHpp - o.totalDibayarKeVendor);
                        const opCost = o.biayaOperasional || 0;
                        const netProfit = o.totalInvoice - o.totalHpp - opCost;
                        const marginPercent = o.totalInvoice > 0 ? (netProfit / o.totalInvoice) * 100 : 0;
                        const waLink = getWhatsAppLink(o);

                        return (
                          <div
                            key={o.id}
                            className="group rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-card-double hover:border-teal-300 transition-all space-y-2.5"
                          >
                            {/* Header: No Inv, Customer, Tanggal, Status Badge */}
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-teal-800">
                                    {o.noInv}
                                  </span>
                                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate" title={o.customerName}>
                                    {o.customerName}
                                  </h4>
                                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 font-medium">
                                    <Calendar className="h-3 w-3" />
                                    {o.tanggalOrder || o.tanggalInv || '-'}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500 font-medium truncate">
                                  {o.projectName || '-'} &bull; <span className="font-semibold text-slate-700">Mitra: {o.vendorName || 'Umum'}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-slate-700 border border-slate-200">
                                  {o.statusOrder || 'PRODUKSI'}
                                </span>

                                {metricType === 'outstanding' && sisaPiutang > 0 && !waLink && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-slate-500"
                                    title="Nomor WA customer belum diisi"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    <span className="hidden sm:inline">Nomor WA belum diisi</span>
                                  </span>
                                )}

                                {metricType === 'outstanding' && sisaPiutang > 0 && waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all"
                                    title="Kirim pesan penagihan WhatsApp"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    <span className="hidden sm:inline">WA Tagih</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOpenOrderInspection(o)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                                  title="Lihat riwayat lengkap"
                                >
                                  <span>Detail</span> <ExternalLink className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {/* Grid Metrik Finansial (US-9.11: Revenue, HPP Vendor, Biaya Operasional, Net Profit, Margin % - DILARANG TAMPILKAN PROFIT AKTUAL) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 text-[11px]">
                              <div className="rounded-lg bg-slate-50/80 p-2 border border-slate-100">
                                <span className="text-slate-400 block text-[9.5px] font-medium leading-tight">Total Nilai Invoice</span>
                                <span className="font-bold text-slate-900 tabular-nums font-mono text-xs block mt-0.5">
                                  {formatRupiah(o.totalInvoice)}
                                </span>
                              </div>

                              <div className="rounded-lg bg-slate-50/80 p-2 border border-slate-100">
                                <span className="text-slate-400 block text-[9.5px] font-medium leading-tight">Modal HPP Vendor</span>
                                <span className="font-bold text-slate-700 tabular-nums font-mono text-xs block mt-0.5">
                                  {formatRupiah(o.totalHpp)}
                                </span>
                              </div>

                              <div className="rounded-lg bg-slate-50/80 p-2 border border-slate-100">
                                <span className="text-slate-400 block text-[9.5px] font-medium leading-tight">Biaya Operasional</span>
                                <span className="font-bold text-slate-600 tabular-nums font-mono text-xs block mt-0.5">
                                  {formatRupiah(opCost)}
                                </span>
                              </div>

                              <div className="rounded-lg bg-emerald-50/70 p-2 border border-emerald-100">
                                <span className="text-emerald-700 block text-[9.5px] font-medium leading-tight">Net Profit Bersih</span>
                                <span className="font-bold text-emerald-800 tabular-nums font-mono text-xs block mt-0.5">
                                  {formatRupiah(netProfit)}
                                </span>
                              </div>

                              <div className="rounded-lg bg-emerald-50/70 p-2 border border-emerald-100 col-span-2 sm:col-span-1">
                                <span className="text-emerald-700 block text-[9.5px] font-medium leading-tight">Margin (%)</span>
                                <span className="font-bold text-emerald-800 tabular-nums font-mono text-xs block mt-0.5">
                                  {marginPercent.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Baris Ekstra Kontekstual untuk Utang Vendor & Piutang Konsumen */}
                            {metricType === 'vendor_debt' && (
                              <div className="flex items-center justify-between text-xs bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-1.5 mt-1">
                                <span className="text-amber-800 font-medium text-[11px]">
                                  Diserahkan ke Vendor: <strong className="font-mono text-slate-800">{formatRupiah(o.totalDibayarKeVendor || 0)}</strong>
                                </span>
                                <span className="text-rose-700 font-bold font-mono text-[11px]">
                                  Sisa Utang: {formatRupiah(sisaVendor)}
                                </span>
                              </div>
                            )}

                            {metricType === 'outstanding' && (
                              <div className="flex items-center justify-between text-xs bg-indigo-50/80 border border-indigo-200/80 rounded-xl px-3 py-1.5 mt-1">
                                <span className="text-indigo-800 font-medium text-[11px]">
                                  Uang Masuk: <strong className="font-mono text-emerald-700">{formatRupiah(o.totalUangMasukCustomer || 0)}</strong> ({((o.totalUangMasukCustomer / (o.totalInvoice || 1)) * 100).toFixed(0)}%)
                                </span>
                                <span className="text-rose-700 font-bold font-mono text-[11px]">
                                  Sisa Piutang: {formatRupiah(sisaPiutang)}
                                </span>
                              </div>
                            )}
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

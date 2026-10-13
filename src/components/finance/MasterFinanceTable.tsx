'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatRupiah, formatCompactRupiah, cn } from '@/lib/utils';
import type { MasterFinanceRow } from '@/types';
import {
  TableProperties,
  LayoutGrid,
  MessageCircle,
  Eye,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Download,
  X,
  Building,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import { toast } from 'sonner';
import { exportMasterFinanceToExcel } from '@/lib/excel-export';
import { hasUnitemizedCustomerPayment } from '@/lib/payment-ledger';

interface MasterFinanceTableProps {
  rows: MasterFinanceRow[];
  selectedPeriod?: string;
  onSelectRow?: (row: MasterFinanceRow) => void;
  onEditFinance?: (row: MasterFinanceRow) => void;
  onPreviewInvoice?: (row: MasterFinanceRow) => void;
  onQuickWaFollowUp?: (row: MasterFinanceRow) => void;
  /** Dipakai tombol Ekspor di header agar isi file sama dengan baris yang terlihat. */
  onFilteredRowsChange?: (rows: MasterFinanceRow[], filterLabel: string) => void;
}

function UnitemizedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title="Nominal berasal dari data DP lama VisualKainDB. Rinci per termin di halaman Dana Masuk."
      className="mt-1 inline-flex max-w-full rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-800 truncate"
    >
      {compact ? 'Belum dirinci' : 'Belum dirinci per termin'}
    </span>
  );
}

const STATUS_FILTER_LABEL: Record<string, string> = {
  dp1_parsial: 'DP < 70%',
  dp2_siap_produksi: 'DP >= 70%',
  lunas_total: 'Lunas',
};

const VENDOR_FILTER_LABEL: Record<string, string> = {
  has_debt: 'Utang Vendor',
  settled: 'Vendor Lunas',
};

export function MasterFinanceTable({
  rows,
  selectedPeriod,
  onSelectRow,
  onEditFinance,
  onPreviewInvoice,
  onQuickWaFollowUp,
  onFilteredRowsChange,
}: MasterFinanceTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'dp1_parsial' | 'dp2_siap_produksi' | 'lunas_total'>('all');
  const [vendorDebtFilter, setVendorDebtFilter] = useState<'all' | 'has_debt' | 'settled'>('all');
  const [mobileViewMode, setMobileViewMode] = useState<'card' | 'table'>('card');

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Filtered rows based on search & filters
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInv = row.noInv.toLowerCase().includes(q);
        const matchCust = row.namaCustomer.toLowerCase().includes(q);
        const matchProj = row.namaProject.toLowerCase().includes(q);
        if (!matchInv && !matchCust && !matchProj) return false;
      }

      // 2. Status DP Filter
      if (statusFilter !== 'all' && row.statusDpThreshold !== statusFilter) {
        return false;
      }

      // 3. Vendor Debt Filter (US-9.24)
      if (vendorDebtFilter === 'has_debt' && row.sisaPembayaranVendor <= 0) {
        return false;
      }
      if (vendorDebtFilter === 'settled' && (row.sisaPembayaranVendor > 0 || row.totalBiayaVendor <= 0)) {
        return false;
      }

      return true;
    });
  }, [rows, searchQuery, statusFilter, vendorDebtFilter]);

  const filterLabel = [
    searchQuery.trim() ? `Cari ${searchQuery.trim()}` : '',
    STATUS_FILTER_LABEL[statusFilter] || '',
    VENDOR_FILTER_LABEL[vendorDebtFilter] || '',
  ]
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    onFilteredRowsChange?.(filteredRows, filterLabel);
  }, [filteredRows, filterLabel, onFilteredRowsChange]);

  // Client-side Pagination (10 order per halaman - Feedback Client #6)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Snapshot Firestore mengganti identitas `rows`; reset hanya saat filter berubah, sisanya cukup di-clamp oleh safeCurrentPage.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, vendorDebtFilter, selectedPeriod]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safeCurrentPage, pageSize]);

  const handleExportExcel = async () => {
    try {
      await exportMasterFinanceToExcel(filteredRows, selectedPeriod);
      toast.success('File Master Finansial berhasil diekspor ke Excel!');
    } catch (err) {
      console.error('Gagal mengekspor Excel:', err);
      toast.error('Gagal mengekspor berkas Excel');
    }
  };

  const renderStatusBadge = (status: string, compact = false) => {
    const s = (status || '').toUpperCase();
    if (s === 'PRODUKSI' || s === 'PRODUCTION') {
      return (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600 border border-blue-200',
            compact ? 'px-1.5 py-0.5 text-[8px] sm:text-[8.5px] leading-tight tracking-tight' : 'px-3.5 py-1 text-xs shadow-sm'
          )}
        >
          PRODUKSI
        </span>
      );
    }
    if (s === 'SELESAI' || s === 'LUNAS' || s === 'COMPLETED') {
      return (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-600 border border-emerald-200',
            compact ? 'px-1.5 py-0.5 text-[8px] sm:text-[8.5px] leading-tight tracking-tight' : 'px-3.5 py-1 text-xs shadow-sm'
          )}
        >
          SELESAI
        </span>
      );
    }
    if (s === 'PEMBAYARAN' || s === 'PAYMENT' || s === 'DP') {
      return (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-amber-50 font-bold text-amber-700 border border-amber-200',
            compact ? 'px-1.5 py-0.5 text-[8px] sm:text-[8.5px] leading-tight tracking-tight' : 'px-3.5 py-1 text-xs shadow-sm'
          )}
        >
          PEMBAYARAN
        </span>
      );
    }
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 border border-slate-200',
          compact ? 'px-1.5 py-0.5 text-[8px] sm:text-[8.5px] leading-tight tracking-tight' : 'px-3 py-1 text-xs shadow-sm'
        )}
      >
        {s || 'ANTREAN'}
      </span>
    );
  };

  const getWaActionConfig = (row: MasterFinanceRow) => {
    const isLunas = row.dpPersenCustomer >= 100 || row.sisaPelunasanCustomer <= 0;
    const isSiapProduksi = row.dpPersenCustomer >= 70;

    let label = 'Tagih DP 70%';
    let shortLabel = 'Tagih DP';
    let title = 'Kirim Penagihan WhatsApp DP 70% (Syarat Mulai Produksi)';
    let bgClass = 'bg-amber-600 hover:bg-amber-700 text-white';
    let message = `Halo Kak ${row.namaCustomer}, kami dari VisualKain menginfokan terkait pesanan ${row.namaProject} (${row.noInv}). Saat ini pembayaran DP tercatat ${formatRupiah(row.nominalDpCustomer)} (${row.dpPersenCustomer.toFixed(0)}%). Untuk memulai proses potong & jahit di vendor konveksi, mohon pelunasan DP minimal 70% (kurang ${formatRupiah(row.sisaMenujuDp70)}). Terima kasih 🙏`;

    if (isLunas) {
      label = 'Notif WA';
      shortLabel = 'Notif WA';
      title = 'Kirim Konfirmasi Lunas / Info Pesanan via WhatsApp';
      bgClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
      message = `Halo Kak ${row.namaCustomer}, terima kasih pembayaran pesanan ${row.namaProject} (${row.noInv}) telah LUNAS sebesar ${formatRupiah(row.totalJumlah)}. Kami akan mengabari perkembangan produksi pesanan secepatnya. Terima kasih 🙏`;
    } else if (isSiapProduksi) {
      label = 'Tagih Pelunasan';
      shortLabel = 'Pelunasan';
      title = 'Kirim Penagihan Pelunasan 30% via WhatsApp';
      bgClass = 'bg-teal-600 hover:bg-teal-700 text-white';
      message = `Halo Kak ${row.namaCustomer}, pesanan ${row.namaProject} (${row.noInv}) saat ini sedang dalam proses produksi. Terdapat sisa pelunasan sebesar ${formatRupiah(row.sisaPelunasanCustomer)}. Mohon konfirmasi jika sudah transfer pelunasan ya Kak. Terima kasih 🙏`;
    }

    return { label, shortLabel, title, bgClass, message };
  };

  const handleOpenWhatsApp = (e: React.MouseEvent, row: MasterFinanceRow) => {
    e.stopPropagation();
    const rawPhone =
      row.noWaCustomer ||
      row.originalOrder?.noWaCustomer ||
      row.originalOrder?.customerPhone ||
      row.originalOrder?.phone ||
      '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const { message } = getWaActionConfig(row);

    if (!cleanPhone) {
      toast.error(`Nomor WhatsApp untuk pesanan ${row.noInv} (${row.namaCustomer}) belum terisi`);
      onSelectRow?.(row);
      onQuickWaFollowUp?.(row);
      return;
    }

    const formattedPhone = cleanPhone.startsWith('0')
      ? '62' + cleanPhone.slice(1)
      : cleanPhone.startsWith('62')
      ? cleanPhone
      : '62' + cleanPhone;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const renderDpBadge = (row: MasterFinanceRow) => {
    switch (row.statusDpThreshold) {
      case 'lunas_total':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            100% Lunas
          </span>
        );
      case 'dp2_siap_produksi':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-200">
            {row.dpPersenCustomer.toFixed(1)}% Siap Produksi
          </span>
        );
      case 'dp1_parsial':
        return (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
              {row.dpPersenCustomer.toFixed(1)}% (DP 1)
            </span>
            {row.sisaMenujuDp70 > 0 && (
              <span className="text-[9px] font-semibold text-amber-600 mt-0.5">
                Kurang: {formatRupiah(row.sisaMenujuDp70)}
              </span>
            )}
          </div>
        );
      case 'belum_dp':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
            Belum DP (0%)
          </span>
        );
    }
  };

  const renderMobileCardContent = () => (
    <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/40">
      {paginatedRows.length === 0 ? (
        <div className="col-span-full py-12 text-center text-slate-500 text-xs">
          Tidak ada order yang cocok dengan kriteria pencarian / filter.
        </div>
      ) : (
        paginatedRows.map((row) => {
          const waConfig = getWaActionConfig(row);
          return (
            <div
              key={row.id}
              onClick={() => onSelectRow?.(row)}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-card-double hover:border-teal-300 transition-colors duration-150 gap-2.5 overflow-hidden cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-[10.5px] font-black tracking-tight text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/90 whitespace-nowrap shrink-0">
                    {row.noInv}
                  </span>
                  {row.tanggalInv && (
                    <span className="font-mono text-[10px] text-slate-400 font-medium truncate">
                      {row.tanggalInv}
                    </span>
                  )}
                </div>
                <div className="shrink-0">{renderStatusBadge(row.statusOrder, true)}</div>
              </div>

              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs sm:text-[13px] font-extrabold text-slate-900 leading-snug truncate" title={row.namaCustomer}>
                  {row.namaCustomer}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium truncate" title={row.namaProject}>
                  {row.namaProject} &bull; <span className="font-bold text-slate-700">{row.totalQty} pcs</span>
                  {row.vendorName && row.vendorName !== '-' ? (
                    <> &bull; <span className="text-slate-600">{row.vendorName}</span></>
                  ) : null}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] min-w-0">
                <div className="rounded-xl bg-slate-50 p-2 border border-slate-200/80 min-w-0">
                  <span className="text-slate-500 block text-[9.5px] font-semibold leading-none mb-1 truncate">
                    Total Omzet
                  </span>
                  <span className="font-mono font-extrabold text-slate-900 tabular-nums truncate block text-[11px]">
                    {formatCompactRupiah(row.totalJumlah)}
                  </span>
                </div>

                <div className="rounded-xl bg-teal-50/70 p-2 border border-teal-100/90 min-w-0">
                  <span className="text-teal-800 block text-[9.5px] font-semibold leading-none mb-1 truncate">
                    DP ({row.dpPersenCustomer.toFixed(0)}%)
                  </span>
                  <span className="font-mono font-extrabold text-teal-900 tabular-nums truncate block text-[11px]">
                    {formatCompactRupiah(row.nominalDpCustomer)}
                  </span>
                  {hasUnitemizedCustomerPayment(row) && <UnitemizedBadge compact />}
                </div>

                <div
                  className={cn(
                    'rounded-xl p-2 border min-w-0',
                    row.sisaPelunasanCustomer > 0
                      ? 'bg-amber-50/70 border-amber-100/90 text-amber-900'
                      : 'bg-emerald-50/70 border-emerald-100/90 text-emerald-900'
                  )}
                >
                  <span className="block text-[9.5px] font-semibold opacity-85 leading-none mb-1 truncate">
                    {row.sisaPelunasanCustomer > 0 ? 'Sisa Piutang' : 'Status'}
                  </span>
                  <span className="font-mono font-extrabold tabular-nums truncate block text-[11px]">
                    {row.sisaPelunasanCustomer > 0 ? formatCompactRupiah(row.sisaPelunasanCustomer) : 'LUNAS'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-[10.5px] px-1 text-slate-500 min-w-0">
                <span className="font-medium truncate">
                  Utang Vendor:{' '}
                  <strong className={cn('font-mono', row.sisaPembayaranVendor > 0 ? 'text-rose-600' : 'text-emerald-700')}>
                    {row.sisaPembayaranVendor > 0 ? formatCompactRupiah(row.sisaPembayaranVendor) : 'Lunas'}
                  </strong>
                </span>
                <span className="font-mono font-bold text-emerald-700 shrink-0">
                  Profit +{formatCompactRupiah(row.profitBersih)} ({row.profitPercent.toFixed(0)}%)
                </span>
              </div>

              <div
                className="pt-2 flex items-center gap-2 border-t border-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onSelectRow?.(row)}
                  title="Inspeksi Detail Order & Faktur"
                  aria-label="Inspeksi Detail Order"
                  className="h-10 px-2.5 shrink-0 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span>Detail</span>
                </button>

                <button
                  type="button"
                  onClick={() => onEditFinance?.(row)}
                  title="Edit Finansial & Termin DP"
                  aria-label="Edit Finansial Order"
                  className="h-10 px-2.5 shrink-0 inline-flex items-center justify-center gap-1 rounded-xl border border-teal-200 bg-teal-50 text-[11px] font-bold text-teal-800 hover:bg-teal-100 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 shrink-0" />
                  <span>Edit &amp; DP</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleOpenWhatsApp(e, row)}
                  title={waConfig.title}
                  className={cn(
                    'flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-bold shadow-2xs active:scale-[0.96] transition-transform duration-150 cursor-pointer whitespace-nowrap min-w-0',
                    waConfig.bgClass
                  )}
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{waConfig.label}</span>
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // Reusable Table with Dual-Sticky Kiri (NO INV + NAMA CUST) & Sticky Kanan (AKSI & STATUS)
  const renderTableContent = () => (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 select-none">
          {/* Header Super-Row: Category Groupings */}
          <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
            <th colSpan={2} className="px-4 py-2 bg-slate-100 text-slate-700 md:sticky md:left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
              Identitas Pesanan (Kunci)
            </th>
            <th className="px-4 py-2 bg-slate-100 text-slate-500">
              Project
            </th>
            <th colSpan={3} className="px-4 py-2 bg-blue-50 text-blue-800">
              Komitmen Vendor (HPP)
            </th>
            <th colSpan={5} className="px-4 py-2 bg-teal-50 text-teal-800">
              Pembayaran Konsumen
            </th>
            <th colSpan={4} className="px-4 py-2 bg-slate-100 text-slate-500">
              Beban & Penyesuaian
            </th>
            <th colSpan={2} className="px-4 py-2 bg-emerald-50 text-emerald-800">
              Realisasi Margin
            </th>
            <th colSpan={2} className="px-4 py-2 bg-slate-100 text-center md:sticky md:right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)]">
              Aksi Cepat & Status
            </th>
          </tr>

          {/* Header Sub-Row */}
          <tr className="text-[11px]">
            {/* Frozen Sticky 1: NO INV (left: 0) */}
            <th className="px-4 py-3 bg-teal-50 text-teal-800 w-32 min-w-[128px] max-w-[128px] md:sticky md:left-0 z-30 shadow-[1px_0_0_0_#e2e8f0]">
              NO INV
            </th>
            {/* Frozen Sticky 2: NAMA CUST (left: 128px) */}
            <th className="px-4 py-3 bg-teal-50 text-teal-800 w-44 min-w-[176px] max-w-[176px] md:sticky md:left-[128px] z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
              NAMA CUST
            </th>
            {/* Scrollable Columns */}
            <th className="px-4 py-3 min-w-[180px]">NAMA PROJECT</th>
            <th className="px-4 py-3 bg-blue-50 text-blue-900">TOTAL BIAYA VENDOR</th>
            <th className="px-4 py-3 bg-blue-50 text-blue-900">DP VENDOR</th>
            <th className="px-4 py-3 bg-blue-100 text-blue-950 font-bold">SISA BAYAR VENDOR</th>
            <th className="px-4 py-3 text-center">QTY</th>
            <th className="px-4 py-3 bg-purple-50 text-purple-900 font-bold">TOTAL JUMLAH</th>
            <th className="px-4 py-3 bg-pink-50 text-center text-pink-900">DP (%) CUST</th>
            <th className="px-4 py-3 bg-pink-50 text-pink-900">NOMINAL DP</th>
            <th className="px-4 py-3 bg-amber-100 text-amber-900 font-bold">SISA PELUNASAN</th>
            <th className="px-4 py-3">OPERASIONAL</th>
            <th className="px-4 py-3">TAMBAHAN VENDOR</th>
            <th className="px-4 py-3">TAMBAHAN CUST</th>
            <th className="px-4 py-3">DISKON</th>
            <th className="px-4 py-3 bg-emerald-50 text-emerald-800 font-bold">PROFIT BERSIH</th>
            <th className="px-4 py-3 bg-emerald-50 text-emerald-800 font-bold">PROFIT (%)</th>
            {/* Frozen Sticky Right 1: Aksi (right: 124px) */}
            <th className="px-3 py-3 text-center bg-slate-100 w-52 min-w-[200px] md:sticky md:right-[124px] z-30 shadow-[-1px_0_0_0_#e2e8f0]">
              AKSI
            </th>
            {/* Frozen Sticky Right 2: Status (right: 0) */}
            <th className="px-3 py-3 text-center bg-blue-100 text-blue-900 w-32 min-w-[124px] md:sticky md:right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]">
              STATUS
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-slate-700">
          {paginatedRows.length === 0 ? (
            <tr>
              <td colSpan={19} className="px-6 py-12 text-center text-slate-400">
                Tidak ada order yang cocok dengan kriteria pencarian / filter.
              </td>
            </tr>
          ) : (
            paginatedRows.map((row) => {
              const waConfig = getWaActionConfig(row);
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectRow?.(row)}
                  className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                >
                {/* Frozen Sticky 1: NO INV */}
                <td className="px-4 py-3.5 font-bold text-teal-700 w-32 min-w-[128px] max-w-[128px] md:sticky md:left-0 bg-white group-hover:bg-[#f6fbfb] z-20 shadow-[1px_0_0_0_#e2e8f0]">
                  {row.noInv}
                </td>
                {/* Frozen Sticky 2: NAMA CUST */}
                <td className="px-4 py-3.5 font-semibold text-slate-800 w-44 min-w-[176px] max-w-[176px] md:sticky md:left-[128px] bg-white group-hover:bg-[#f6fbfb] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] truncate" title={row.namaCustomer}>
                  {row.namaCustomer}
                </td>
                {/* Scrollable Columns */}
                <td className="px-4 py-3.5 text-slate-600 min-w-[180px]">
                  {row.namaProject}
                </td>
                <td className="px-4 py-3.5 tabular-nums">
                  {formatRupiah(row.totalBiayaVendor)}
                </td>
                <td className="px-4 py-3.5 tabular-nums">
                  {formatRupiah(row.dpVendor)}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-semibold text-rose-600">
                  {row.sisaPembayaranVendor > 0
                    ? formatRupiah(row.sisaPembayaranVendor)
                    : 'Rp 0 (LUNAS)'}
                </td>
                <td className="px-4 py-3.5 tabular-nums text-center">
                  {row.totalQty}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-bold text-slate-900">
                  {formatRupiah(row.totalJumlah)}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {renderDpBadge(row)}
                </td>
                <td className="px-4 py-3.5 tabular-nums">
                  {formatRupiah(row.nominalDpCustomer)}
                  {hasUnitemizedCustomerPayment(row) && <UnitemizedBadge />}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-bold text-amber-600">
                  {row.sisaPelunasanCustomer > 0
                    ? formatRupiah(row.sisaPelunasanCustomer)
                    : 'Rp 0'}
                </td>
                <td className="px-4 py-3.5 tabular-nums">
                  {formatRupiah(row.biayaOperasional)}
                </td>
                <td className="px-4 py-3.5 tabular-nums">
                  {row.biayaTambahanVendor > 0
                    ? formatRupiah(row.biayaTambahanVendor)
                    : '—'}
                </td>
                <td className="px-4 py-3.5 tabular-nums">
                  {row.biayaTambahanCustomer > 0
                    ? formatRupiah(row.biayaTambahanCustomer)
                    : '—'}
                </td>
                <td className="px-4 py-3.5 tabular-nums">
                  {row.diskon > 0 ? formatRupiah(row.diskon) : 'Rp 0'}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-bold text-emerald-600">
                  {formatRupiah(row.profitBersih)}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-bold text-emerald-600">
                  {row.profitPercent.toFixed(1)}%
                </td>

                {/* Frozen Sticky Right 1: Aksi Kompak */}
                <td
                  className="px-2.5 py-2 text-center w-56 min-w-[216px] md:sticky md:right-[124px] bg-white group-hover:bg-[#f6fbfb] z-20 shadow-[-1px_0_0_0_#e2e8f0]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditFinance?.(row)}
                      title="Edit Finansial Order (Harga, DP, Vendor, HPP)"
                      aria-label={`Edit Finansial ${row.noInvoice}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-50/90 text-teal-700 hover:bg-teal-100 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectRow?.(row)}
                      title="Inspeksi Detail Cicilan & Faktur"
                      aria-label={`Detail Cicilan ${row.noInvoice}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenWhatsApp(e, row)}
                      title={waConfig.title}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold shadow-2xs active:scale-[0.96] transition-transform duration-150 cursor-pointer whitespace-nowrap",
                        waConfig.bgClass
                      )}
                    >
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{waConfig.label}</span>
                    </button>
                  </div>
                </td>

                {/* Frozen Sticky Right 2: Kolom STATUS */}
                <td
                  className="px-3 py-2 text-center w-32 min-w-[124px] md:sticky md:right-0 bg-white group-hover:bg-[#f6fbfb] z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderStatusBadge(row.statusOrder)}
                </td>
              </tr>
            );
          })
          )}
        </tbody>
      </table>
    </div>
  );

  // Reusable Pagination Bar (10 order per page, responsive & ergonomic - Feedback Client #6)
  const renderPaginationBar = () => {
    if (filteredRows.length === 0) return null;

    const startIdx = (safeCurrentPage - 1) * pageSize + 1;
    const endIdx = Math.min(safeCurrentPage * pageSize, filteredRows.length);

    // Hitung tombol nomor halaman (tampilkan max 5 tombol)
    const pageNumbers: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, safeCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="border-t border-slate-100 bg-white px-3 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
        {/* Info Text */}
        <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
          Menampilkan <strong className="text-slate-800 font-mono">{startIdx}</strong>–
          <strong className="text-slate-800 font-mono">{endIdx}</strong> dari{' '}
          <strong className="text-slate-800 font-mono">{filteredRows.length}</strong> order
        </div>

        {/* Page Navigation Controls */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {/* Tombol Prev */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* First page link if truncated */}
          {startPage > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                1
              </button>
              {startPage > 2 && <span className="text-slate-400 px-1 text-xs">&hellip;</span>}
            </>
          )}

          {/* Numbered buttons */}
          {pageNumbers.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setCurrentPage(num)}
              className={cn(
                'h-9 min-w-[36px] px-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer',
                num === safeCurrentPage
                  ? 'bg-teal-600 text-white shadow-sm font-extrabold'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
              )}
            >
              {num}
            </button>
          ))}

          {/* Last page link if truncated */}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-slate-400 px-1 text-xs">&hellip;</span>}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Tombol Next */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. STANDARD CARD VIEW */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-card-double overflow-hidden">
        {/* Table Header Action Bar */}
        <div className="border-b border-slate-100 px-3.5 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <TableProperties className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                Master Data Finansial Order VisualKain
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-none">
                Klik kartu atau baris untuk membuka rincian cicilan &amp; penagihan WA
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            {/* Mobile View Toggle: Kartu vs Tabel */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 md:hidden">
              <button
                type="button"
                onClick={() => setMobileViewMode('card')}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold active:scale-[0.96] transition-transform duration-150 cursor-pointer',
                  mobileViewMode === 'card'
                    ? 'bg-white text-teal-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                <span>Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('table')}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold active:scale-[0.96] transition-transform duration-150 cursor-pointer',
                  mobileViewMode === 'table'
                    ? 'bg-white text-teal-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <TableProperties className="h-3.5 w-3.5 shrink-0" />
                <span>Tabel</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(true)}
                title="Perluas Tabel ke Seluruh Layar (Fullscreen)"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-teal-700 active:scale-95 transition-all cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5 text-teal-600" />
                <span className="hidden sm:inline">Expand Layar Penuh</span>
              </button>

              <span className="rounded-full bg-teal-50 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-teal-700 border border-teal-200">
                Total {filteredRows.length} Order
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Standard Search & Filter Toolbar */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-3 sm:px-6 sm:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No Invoice, Customer, atau Project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status & Debt Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
            <CustomSelect
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}
              icon={<Filter className="h-3.5 w-3.5" />}
              options={[
                { value: 'all', label: 'Semua Status DP' },
                { value: 'dp1_parsial', label: 'DP 1 (< 70% Butuh FU)' },
                { value: 'dp2_siap_produksi', label: 'DP 2 (>= 70% Siap Produksi)' },
                { value: 'lunas_total', label: '100% Lunas Penuh' },
              ]}
              className="h-10 text-xs w-full md:w-auto"
            />

            <CustomSelect
              value={vendorDebtFilter}
              onValueChange={(val) => setVendorDebtFilter(val as typeof vendorDebtFilter)}
              icon={<Building className="h-3.5 w-3.5" />}
              options={[
                { value: 'all', label: 'Semua Status Vendor' },
                { value: 'has_debt', label: 'Hanya Utang Vendor' },
                { value: 'settled', label: 'Vendor Lunas' },
              ]}
              className="h-10 text-xs w-full md:w-auto"
            />

            {(searchQuery || statusFilter !== 'all' || vendorDebtFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setVendorDebtFilter('all');
                }}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer sm:col-span-2 md:col-span-1"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Responsive Content: Mobile Cards or Horizontal Table */}
        {mobileViewMode === 'card' ? (
          <>
            <div className="md:hidden">{renderMobileCardContent()}</div>
            <div className="hidden md:block">{renderTableContent()}</div>
          </>
        ) : (
          renderTableContent()
        )}

        {/* Pagination Bar (Feedback Client #6: Page 1/2/3) */}
        {renderPaginationBar()}
      </div>

      {/* 2. FULLSCREEN EXPANDED OVERLAY (POLISHED FULL-VIEWPORT) */}
      {isExpanded && (
        <div className="fixed inset-0 z-40 flex flex-col bg-[#E8ECF2] p-4 sm:p-6 overflow-hidden animate-fadeIn">
          {/* Top Fullscreen Header & Custom Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card-double flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">
                <TableProperties className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Master Finansial Order - Tampilan Layar Penuh
                  </h2>
                  <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700 border border-teal-200">
                    {filteredRows.length} dari {rows.length} Order
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Kolom No Inv & Customer terkunci tetap di sisi kiri saat tabel digeser horizontal
                </p>
              </div>
            </div>

            {/* Custom Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Invoice / Cust / Project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-60 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none"
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

              {/* Status DP Filter (Custom Select) */}
              <CustomSelect
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}
                icon={<Filter className="h-3.5 w-3.5" />}
                options={[
                  { value: 'all', label: 'Semua Status DP' },
                  { value: 'dp1_parsial', label: 'DP 1 (< 70% Butuh FU)', badge: 'Tagih WA' },
                  { value: 'dp2_siap_produksi', label: 'DP 2 (>= 70% Siap Produksi)', badge: 'Siap Jahit' },
                  { value: 'lunas_total', label: '100% Lunas Penuh' },
                ]}
              />

              {/* Utang Vendor Filter (Custom Select - US-9.24) */}
              <CustomSelect
                value={vendorDebtFilter}
                onValueChange={(val) => setVendorDebtFilter(val as typeof vendorDebtFilter)}
                icon={<Building className="h-3.5 w-3.5" />}
                options={[
                  { value: 'all', label: 'Semua Status Vendor' },
                  { value: 'has_debt', label: 'Hanya Utang Vendor' },
                  { value: 'settled', label: 'Vendor Lunas' },
                ]}
              />

              {/* Ekspor Excel Standar Inzta (US-9.28) */}
              <button
                onClick={handleExportExcel}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Ekspor Excel</span>
              </button>

              {/* Close Fullscreen */}
              <button
                onClick={() => setIsExpanded(false)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 active:scale-95 transition-all"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Keluar (Esc)</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Table Container */}
          <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-double flex flex-col justify-between">
            {renderTableContent()}
            {renderPaginationBar()}
          </div>
        </div>
      )}
    </>
  );
}

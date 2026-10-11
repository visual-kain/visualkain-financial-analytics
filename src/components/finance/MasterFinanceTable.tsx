'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatRupiah } from '@/lib/utils';
import type { MasterFinanceRow } from '@/types';
import {
  TableProperties,
  MessageCircle,
  Eye,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Download,
  X,
  CreditCard,
  Building,
  FileText,
  Pencil,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface MasterFinanceTableProps {
  rows: MasterFinanceRow[];
  onSelectRow?: (row: MasterFinanceRow) => void;
  onEditFinance?: (row: MasterFinanceRow) => void;
  onPreviewInvoice?: (row: MasterFinanceRow) => void;
  onQuickWaFollowUp?: (row: MasterFinanceRow) => void;
}

export function MasterFinanceTable({
  rows,
  onSelectRow,
  onEditFinance,
  onPreviewInvoice,
  onQuickWaFollowUp,
}: MasterFinanceTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'dp1_parsial' | 'dp2_siap_produksi' | 'lunas_total'>('all');
  const [vendorDebtFilter, setVendorDebtFilter] = useState<'all' | 'has_debt' | 'settled'>('all');

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

      // 3. Vendor Debt Filter
      if (vendorDebtFilter === 'has_debt' && row.sisaPembayaranVendor <= 0) {
        return false;
      }
      if (vendorDebtFilter === 'settled' && row.sisaPembayaranVendor > 0) {
        return false;
      }

      return true;
    });
  }, [rows, searchQuery, statusFilter, vendorDebtFilter]);

  const handleExportCsv = () => {
    const csvData = filteredRows.map((r) => ({
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
      'Status Order': r.statusOrder,
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Finansial');
    XLSX.writeFile(workbook, `VisualKain_Master_Finance_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('File Master Finansial berhasil diekspor!');
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PRODUKSI' || s === 'PRODUCTION') {
      return (
        <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-600 border border-blue-200 shadow-sm">
          PRODUKSI
        </span>
      );
    }
    if (s === 'SELESAI' || s === 'LUNAS' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-200 shadow-sm">
          SELESAI
        </span>
      );
    }
    if (s === 'PEMBAYARAN' || s === 'PAYMENT' || s === 'DP') {
      return (
        <span className="inline-flex items-center justify-center rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-700 border border-amber-200 shadow-sm">
          PEMBAYARAN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm">
        {s || 'ANTREAN'}
      </span>
    );
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
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
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

  // Reusable Table with Dual-Sticky Kiri (NO INV + NAMA CUST) & Sticky Kanan (AKSI & STATUS)
  const renderTableContent = () => (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
        <thead className="bg-slate-50/95 text-slate-600 font-bold border-b border-slate-200 select-none">
          {/* Header Super-Row: Category Groupings */}
          <tr className="border-b border-slate-200/60 text-[10px] uppercase tracking-wider text-slate-400">
            <th colSpan={2} className="px-4 py-2 bg-slate-100/70 text-slate-700 sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
              Identitas Pesanan (Kunci)
            </th>
            <th className="px-4 py-2 bg-slate-100/40 text-slate-500">
              Project
            </th>
            <th colSpan={3} className="px-4 py-2 bg-blue-50/50 text-blue-800">
              Komitmen Vendor (HPP)
            </th>
            <th colSpan={5} className="px-4 py-2 bg-teal-50/50 text-teal-800">
              Pembayaran Konsumen
            </th>
            <th colSpan={4} className="px-4 py-2 bg-slate-100/40 text-slate-500">
              Beban & Penyesuaian
            </th>
            <th colSpan={2} className="px-4 py-2 bg-emerald-50/60 text-emerald-800">
              Realisasi Margin
            </th>
            <th colSpan={2} className="px-4 py-2 bg-slate-100/70 text-center sticky right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)]">
              Aksi Cepat & Status
            </th>
          </tr>

          {/* Header Sub-Row */}
          <tr className="text-[11px]">
            {/* Frozen Sticky 1: NO INV (left: 0) */}
            <th className="px-4 py-3 bg-teal-50 text-teal-800 w-32 min-w-[128px] max-w-[128px] sticky left-0 z-30 shadow-[1px_0_0_0_#e2e8f0]">
              NO INV
            </th>
            {/* Frozen Sticky 2: NAMA CUST (left: 128px) */}
            <th className="px-4 py-3 bg-teal-50 text-teal-800 w-44 min-w-[176px] max-w-[176px] sticky left-[128px] z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
              NAMA CUST
            </th>
            {/* Scrollable Columns */}
            <th className="px-4 py-3 min-w-[180px]">NAMA PROJECT</th>
            <th className="px-4 py-3 bg-blue-50/40 text-blue-900">TOTAL BIAYA VENDOR</th>
            <th className="px-4 py-3 bg-blue-50/40 text-blue-900">DP VENDOR</th>
            <th className="px-4 py-3 bg-blue-50/60 text-blue-950 font-bold">SISA BAYAR VENDOR</th>
            <th className="px-4 py-3 text-center">QTY</th>
            <th className="px-4 py-3 bg-purple-50/50 text-purple-900 font-bold">TOTAL JUMLAH</th>
            <th className="px-4 py-3 bg-pink-50/50 text-center text-pink-900">DP (%) CUST</th>
            <th className="px-4 py-3 bg-pink-50/50 text-pink-900">NOMINAL DP</th>
            <th className="px-4 py-3 bg-amber-50/60 text-amber-900 font-bold">SISA PELUNASAN</th>
            <th className="px-4 py-3">OPERASIONAL</th>
            <th className="px-4 py-3">TAMBAHAN VENDOR</th>
            <th className="px-4 py-3">TAMBAHAN CUST</th>
            <th className="px-4 py-3">DISKON</th>
            <th className="px-4 py-3 bg-emerald-50 text-emerald-800 font-bold">PROFIT BERSIH</th>
            <th className="px-4 py-3 bg-emerald-50 text-emerald-800 font-bold">PROFIT (%)</th>
            {/* Frozen Sticky Right 1: Aksi (right: 124px) */}
            <th className="px-3 py-3 text-center bg-slate-50 w-44 min-w-[176px] sticky right-[124px] z-30 shadow-[-1px_0_0_0_#e2e8f0]">
              AKSI
            </th>
            {/* Frozen Sticky Right 2: Status (right: 0) */}
            <th className="px-3 py-3 text-center bg-blue-50/70 text-blue-900 w-32 min-w-[124px] sticky right-0 z-30 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]">
              STATUS
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-slate-700">
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={19} className="px-6 py-12 text-center text-slate-400">
                Tidak ada order yang cocok dengan kriteria pencarian / filter.
              </td>
            </tr>
          ) : (
            filteredRows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelectRow?.(row)}
                className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
              >
                {/* Frozen Sticky 1: NO INV */}
                <td className="px-4 py-3.5 font-bold text-teal-700 w-32 min-w-[128px] max-w-[128px] sticky left-0 bg-white group-hover:bg-[#f6fbfb] z-20 shadow-[1px_0_0_0_#e2e8f0]">
                  {row.noInv}
                </td>
                {/* Frozen Sticky 2: NAMA CUST */}
                <td className="px-4 py-3.5 font-semibold text-slate-800 w-44 min-w-[176px] max-w-[176px] sticky left-[128px] bg-white group-hover:bg-[#f6fbfb] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] truncate" title={row.namaCustomer}>
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

                {/* Frozen Sticky Right 1: 4 Aksi Kompak */}
                <td
                  className="px-2.5 py-2 text-center w-44 min-w-[176px] sticky right-[124px] bg-white group-hover:bg-[#f6fbfb] z-20 shadow-[-1px_0_0_0_#e2e8f0]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {/* 1. Ikon Dokumen Biru: Faktur / Invoice PDF */}
                    <button
                      onClick={() => onPreviewInvoice?.(row)}
                      title="Faktur & Invoice Pesanan"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 transition-all"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>

                    {/* 2. Ikon Pensil Hijau: Edit Finansial Order */}
                    <button
                      onClick={() => onEditFinance?.(row)}
                      title="Edit Finansial Order (Harga, DP, Vendor, HPP)"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 active:scale-95 transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* 3. Ikon Mata Abu: Detail Cicilan */}
                    <button
                      onClick={() => onSelectRow?.(row)}
                      title="Inspeksi Detail Cicilan"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    {/* 4. Tombol Tagih WA (DP < 70%) */}
                    {row.dpPersenCustomer < 70 && (
                      <button
                        onClick={() => {
                          onSelectRow?.(row);
                          onQuickWaFollowUp?.(row);
                        }}
                        title="Kirim Penagihan WhatsApp DP 70%"
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-600 px-2 text-[10px] font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>Tagih WA</span>
                      </button>
                    )}
                  </div>
                </td>

                {/* Frozen Sticky Right 2: Kolom STATUS */}
                <td
                  className="px-3 py-2 text-center w-32 min-w-[124px] sticky right-0 bg-white group-hover:bg-[#f6fbfb] z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderStatusBadge(row.statusOrder)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {/* 1. STANDARD CARD VIEW */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-card-double overflow-hidden">
        {/* Table Header Action Bar */}
        <div className="border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <TableProperties className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Master Data Finansial Order VisualKain
              </h3>
              <p className="text-xs text-slate-400">
                Kolom NO INV & Customer terkunci di kiri. Klik baris mana saja untuk membuka drawer inspeksi cicilan & WA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(true)}
              title="Perluas Tabel ke Seluruh Layar (Fullscreen)"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-teal-700 active:scale-95 transition-all"
            >
              <Maximize2 className="h-3.5 w-3.5 text-teal-600" />
              <span>Expand Layar Penuh</span>
            </button>

            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 border border-teal-200">
              Total {filteredRows.length} Order
            </span>
          </div>
        </div>

        {/* Regular Table Content */}
        {renderTableContent()}
      </div>

      {/* 2. FULLSCREEN EXPANDED OVERLAY (POLISHED FULL-VIEWPORT) */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#E8ECF2] p-4 sm:p-6 overflow-hidden animate-fadeIn">
          {/* Top Fullscreen Header & Custom Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card-double flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">
                <TableProperties className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Master Finansial Order — Fullscreen View
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

              {/* Utang Vendor Filter (Custom Select) */}
              <CustomSelect
                value={vendorDebtFilter}
                onValueChange={(val) => setVendorDebtFilter(val as typeof vendorDebtFilter)}
                icon={<Building className="h-3.5 w-3.5" />}
                options={[
                  { value: 'all', label: 'Semua Utang Vendor' },
                  { value: 'has_debt', label: 'Ada Sisa Utang Vendor', badge: 'Utang' },
                  { value: 'settled', label: 'Vendor Sudah Lunas' },
                ]}
              />

              {/* CSV Export */}
              <button
                onClick={handleExportCsv}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export CSV</span>
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
          <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-double flex flex-col">
            {renderTableContent()}
          </div>
        </div>
      )}
    </>
  );
}

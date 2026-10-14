'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatRupiah, normalizeWaNumber } from '@/lib/utils';
import type { MasterFinanceRow } from '@/types';
import { BIAYA_TAMBAHAN_SUMBER_OPTIONS, deriveBiayaTambahanItems, summarizeBiayaTambahan } from '@/lib/biaya-tambahan';
import {
  X,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Wallet,
  Receipt,
  ArrowRight,
  ExternalLink,
  FileText,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderInspectionDrawerProps {
  order: MasterFinanceRow | null;
  onClose: () => void;
  onPreviewInvoice?: (order: MasterFinanceRow) => void;
  onEditFinance?: (order: MasterFinanceRow) => void;
}

export function OrderInspectionDrawer({
  order,
  onClose,
  onPreviewInvoice,
  onEditFinance,
}: OrderInspectionDrawerProps) {
  const [phoneNumber, setPhoneNumber] = useState('');

  // Sinkronisasi nomor WhatsApp saat order terpilih berubah
  useEffect(() => {
    if (order) {
      setPhoneNumber(order.noWaCustomer || '');
    }
  }, [order]);

  // Listener tombol ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const cleanPhone = normalizeWaNumber(phoneNumber);
  const biayaTambahanItems = order ? deriveBiayaTambahanItems(order) : [];
  const biayaTambahanSum = summarizeBiayaTambahan(biayaTambahanItems);

  // Template Pesan WhatsApp Penagihan (Dokumen Konfirmasi Fitur Update Bagian 3.D)
  const waTemplate = (() => {
    if (order.dpPersenCustomer < 70) {
      // Template 1: Follow up sisa DP 2 agar pesanan bisa dipotong & dijahit
      return `Halo Kak ${order.namaCustomer}! Pembayaran DP sebesar ${formatRupiah(order.nominalDpCustomer)} (${order.dpPersenCustomer.toFixed(1)}%) untuk pesanan *${order.namaProject}* (${order.noInv}) telah kami terima ya.

Sebagai informasi, sesuai SOP konveksi VisualKain, pesanan akan mulai dipotong dan dijahit setelah DP genap 70% (${formatRupiah(Math.round(0.7 * order.totalJumlah))}).

Mohon dapat melunasi sisa DP sebesar *${formatRupiah(order.sisaMenujuDp70)}* agar antrean produksi pesanan kakak bisa langsung kami jalankan hari ini. Invoice terupdate kami lampirkan ya kak. Terima kasih! 🙏`;
    } else if (order.dpPersenCustomer < 100) {
      // Template 2: Notifikasi DP lengkap 70% & info sisa pelunasan 30%
      return `Halo Kak ${order.namaCustomer}! Pembayaran DP untuk pesanan *${order.namaProject}* (${order.noInv}) telah kami terima. Total DP telah LENGKAP 70% (${formatRupiah(order.nominalDpCustomer)}) dan pesanan saat ini RESMI NAIK PRODUKSI.

Sisa pelunasan akhir sebesar *${formatRupiah(order.sisaPelunasanCustomer)}* (30%) dapat dibayarkan saat barang selesai sebelum dikirimkan ke alamat kakak. Terima kasih atas kerjasamanya! 🙏`;
    } else {
      // Template 3: Lunas total 100% & siap kirim
      return `Halo Kak ${order.namaCustomer}! Pembayaran pesanan *${order.namaProject}* (${order.noInv}) telah LUNAS TOTAL 100% (${formatRupiah(order.totalJumlah)}).

Pesanan saat ini siap dikirimkan ke alamat kakak. Terima kasih atas kepercayaan dan kerjasamanya! 🙏`;
    }
  })();

  const handleSendWa = () => {
    if (!cleanPhone) {
      toast.error('Nomor WA belum diisi atau tidak valid');
      return;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waTemplate)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(`Membuka WhatsApp untuk ${order.namaCustomer}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] overflow-hidden no-print">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        />

        {/* Slide-Over Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-screen max-w-md h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Header Section */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                    {order.noInv}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium truncate">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span className="truncate">{order.tanggalInv}</span>
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 active:scale-95 transition-all shrink-0 cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                  {order.namaCustomer}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                  {order.namaProject} &bull; {order.totalQty} pcs
                </p>

                {/* Tombol Lihat Faktur & Edit Finansial/DP */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onPreviewInvoice?.(order)}
                    className="h-10 flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-2.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 hover:border-blue-300 active:scale-[0.98] transition-all duration-150 cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="sm:hidden">Lihat Faktur</span>
                    <span className="hidden sm:inline">Lihat Faktur Resmi</span>
                  </button>
                  {onEditFinance && (
                    <button
                      type="button"
                      onClick={() => onEditFinance(order)}
                      className="h-10 flex items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/80 px-2.5 text-xs font-bold text-teal-800 shadow-2xs hover:bg-teal-100 hover:border-teal-300 active:scale-[0.98] transition-all duration-150 cursor-pointer whitespace-nowrap"
                    >
                      <Pencil className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                      <span className="sm:hidden">Edit &amp; DP</span>
                      <span className="hidden sm:inline">Edit Finansial &amp; DP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
              {/* Financial Snapshot Cards */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Total Invoice
                  </span>
                  <span className="text-sm font-extrabold font-mono text-slate-900 mt-0.5 block tabular-num">
                    {formatRupiah(order.totalJumlah)}
                  </span>
                </div>

                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3">
                  <span className="text-[11px] font-semibold text-teal-800 block">
                    DP Konsumen ({order.dpPersenCustomer.toFixed(1)}%)
                  </span>
                  <span className="text-sm font-extrabold font-mono text-teal-700 mt-0.5 block tabular-num">
                    {formatRupiah(order.nominalDpCustomer)}
                  </span>
                </div>
              </div>

              {/* Status Threshold Indicator */}
              <div
                className={`rounded-xl border p-3.5 text-xs ${
                  order.dpPersenCustomer >= 70
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {order.dpPersenCustomer >= 70 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                  <span>
                    {order.dpPersenCustomer >= 100
                      ? 'Lunas 100% (Siap Kirim)'
                      : order.dpPersenCustomer >= 70
                      ? 'Ambang Batas 70% Terpenuhi (Siap Jahit)'
                      : `Belum Memenuhi Ambang 70% (Sisa ${formatRupiah(order.sisaMenujuDp70)})`}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                  {order.dpPersenCustomer >= 70
                    ? 'Komitmen pembayaran konsumen aman. Vendor dapat diinstruksikan naik potong kain.'
                    : 'Standar SOP VisualKain: SPK potong & jahit baru dirilis ke penjahit setelah DP mencapai minimal 70%.'}
                </p>
              </div>

              {/* Vertical Stepper: Payment Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-slate-400" />
                  Rincian &amp; Timeline Cicilan Pembayaran
                </h4>

                <div className="relative pl-6 space-y-4 border-l-2 border-teal-200 ml-2">
                  {Array.isArray(order.pembayaranList) && order.pembayaranList.length > 0 ? (
                    order.pembayaranList.map((p, idx) => (
                      <div key={p.id || idx} className="relative">
                        <span className="absolute -left-[31px] top-0.5 h-3.5 w-3.5 rounded-full bg-teal-600 border-2 border-white shadow-sm" />
                        <div className="text-xs font-bold text-slate-800">
                          {p.label
                            ? `${idx + 1}. ${p.label}`
                            : p.jenis === 'dp'
                            ? `DP ${idx + 1} (Booking & Antrean)`
                            : p.jenis === 'termin'
                            ? `Termin ${idx + 1} (Progres 70%)`
                            : 'Pelunasan Akhir'}
                        </div>
                        <div className="text-xs font-mono font-bold text-teal-700 mt-0.5">
                          {formatRupiah(p.nominal)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {p.tanggal} &bull; {p.keterangan || 'Terverifikasi masuk mutasi bank'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="relative">
                      <span className="absolute -left-[31px] top-0.5 h-3.5 w-3.5 rounded-full bg-teal-600 border-2 border-white shadow-sm" />
                      <div className="text-xs font-bold text-slate-800">
                        DP Awal (Booking & Antrean Desain)
                      </div>
                      <div className="text-xs font-mono font-bold text-teal-700 mt-0.5">
                        {formatRupiah(order.nominalDpCustomer)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Terverifikasi masuk mutasi bank BCA
                      </div>
                    </div>
                  )}

                  {/* Step 2: DP 2 Target 70% */}
                  <div className="relative">
                    <span
                      className={`absolute -left-[31px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${
                        order.dpPersenCustomer >= 70
                          ? 'bg-teal-600'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div className="text-xs font-bold text-slate-800">
                      Target DP 70% (SPK Potong Kain & Jahit)
                    </div>
                    <div
                      className={`text-xs font-mono font-bold mt-0.5 ${
                        order.dpPersenCustomer >= 70
                          ? 'text-teal-700'
                          : 'text-amber-600'
                      }`}
                    >
                      {order.dpPersenCustomer >= 70
                        ? 'Terpenuhi (Produksi Dimulai)'
                        : `Kurang ${formatRupiah(order.sisaMenujuDp70)} lagi`}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Syarat mutlak sebelum rilis kain ke vendor jahit
                    </div>
                  </div>

                  {/* Step 3: Pelunasan 30% Akhir */}
                  <div className="relative">
                    <span
                      className={`absolute -left-[31px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${
                        order.sisaPelunasanCustomer === 0
                          ? 'bg-emerald-600'
                          : 'bg-slate-300'
                      }`}
                    />
                    <div className="text-xs font-bold text-slate-800">
                      Pelunasan Akhir (Sebelum Serah Terima)
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                      {order.sisaPelunasanCustomer > 0
                        ? formatRupiah(order.sisaPelunasanCustomer)
                        : 'Lunas Total'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Pengambilan barang / pengiriman ekspedisi
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Commitment Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>Komitmen Pokok Vendor (HPP)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {formatRupiah(order.totalBiayaVendor)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-slate-600">
                  <span>Pembayaran Vendor:</span>
                  <span className="font-mono">{formatRupiah(order.dpVendor)}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-semibold text-rose-700">
                    Sisa Utang Vendor:
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    {order.sisaPembayaranVendor > 0
                      ? formatRupiah(order.sisaPembayaranVendor)
                      : 'LUNAS'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-bold">
                  <span className="text-emerald-700">Estimasi Margin Laba:</span>
                  <span className="font-mono text-emerald-600">
                    {formatRupiah(order.profitBersih)} ({order.profitPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {biayaTambahanItems.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-600">Rincian Biaya Tambahan</span>
                    <span className={cn('font-mono font-bold', biayaTambahanSum.selisih < 0 ? 'text-rose-600' : 'text-emerald-700')}>
                      Selisih {formatRupiah(biayaTambahanSum.selisih)}
                    </span>
                  </div>
                  {biayaTambahanItems.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-2 text-xs">
                      <span className="min-w-0 text-slate-600">
                        {item.keterangan}{' '}
                        <span className="text-[10px] font-semibold text-slate-400">
                          ({BIAYA_TAMBAHAN_SUMBER_OPTIONS.find((o) => o.value === item.sumber)?.label})
                        </span>
                      </span>
                      <span className="font-mono shrink-0">{formatRupiah(item.nominal)}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-[10px]">
                    <span className="text-teal-700">Customer <strong className="font-mono block">{formatRupiah(biayaTambahanSum.customer)}</strong></span>
                    <span className="text-blue-700">Vendor <strong className="font-mono block">{formatRupiah(biayaTambahanSum.vendor)}</strong></span>
                    <span className="text-amber-700">Lainnya <strong className="font-mono block">{formatRupiah(biayaTambahanSum.lainnya)}</strong></span>
                  </div>
                </div>
              )}

              {/* WhatsApp Follow-Up Generator Box */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-900">
                    Penagihan Cepat via WhatsApp
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Nomor WhatsApp Customer
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="mt-1 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Pratinjau Pesan Penagihan
                  </label>
                  <div className="mt-1 rounded-xl bg-white p-3 text-[11px] text-slate-600 border border-emerald-200 whitespace-pre-line font-sans max-h-36 overflow-y-auto leading-relaxed">
                    {waTemplate}
                  </div>
                </div>

                <button
                  onClick={handleSendWa}
                  disabled={!cleanPhone}
                  className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {cleanPhone ? 'Kirim Pesan Penagihan via WhatsApp' : 'Nomor WA belum diisi'}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px]">
                {order.namaProject}
              </span>
              <button
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

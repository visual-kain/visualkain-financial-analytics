'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Building,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import type { MasterFinanceRow } from '@/types';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  order: MasterFinanceRow | null;
  onClose: () => void;
}

export function InvoicePreviewModal({ isOpen, order, onClose }: InvoicePreviewModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isLunas = order.statusDpThreshold === 'lunas_total';
  const isSiapProduksi = order.statusDpThreshold === 'dp2_siap_produksi';
  const targetDp70 = Math.round(0.7 * order.totalJumlah);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-2xl z-10 max-h-[92vh] flex flex-col"
        >
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Faktur Resmi Pesanan &bull; {order.noInv}
                </h3>
                <p className="text-xs text-slate-400">
                  Salinan tagihan komersial resmi dengan transparansi termin DP & rekening BCA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                Cetak / Print
              </button>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 active:scale-95 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Paper Area */}
          <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm font-sans text-slate-800">
            {/* Kop Invoice */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 gap-3">
              <div className="flex items-center gap-3.5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
                  <img
                    src="/img/logo.jpg"
                    alt="VisualKain Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                    VISUALKAIN INDONESIA
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Spesialis Konveksi Seragam, Jaket, Kemeja & Merchandise Custom
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Hotline Finance: +62 812-2168-8065 &bull; finance@visualkain.id
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  COMMERCIAL INVOICE
                </span>
                <span className="text-lg font-mono font-extrabold text-teal-700">
                  {order.noInv}
                </span>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Tanggal: {order.tanggalInv}
                </p>
              </div>
            </div>

            {/* Bill To & Project Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 text-xs">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  DITAGIHKAN KEPADA:
                </span>
                <p className="text-sm font-bold text-slate-900">{order.namaCustomer}</p>
                {order.noWaCustomer && (
                  <p className="text-slate-500 font-mono mt-0.5">WhatsApp: {order.noWaCustomer}</p>
                )}
                <p className="text-slate-600 mt-1">Status Klien: Terverifikasi</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  DETAIL PROJECT / PESANAN:
                </span>
                <p className="text-sm font-bold text-slate-900">{order.namaProject}</p>
                <p className="text-slate-600 mt-0.5 font-mono">Total Volume: {order.totalQty} Pcs</p>
                <p className="text-slate-500 mt-1">Standar Produksi Ekspor & Jahitan Bartek</p>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left text-xs mb-4">
              <thead className="bg-slate-100 text-slate-700 font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">DESKRIPSI ITEM</th>
                  <th className="py-2.5 px-3 text-center">QTY</th>
                  <th className="py-2.5 px-3 text-right">TOTAL HARGA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900">{order.namaProject}</p>
                    <p className="text-[11px] text-slate-400">
                      Bahan Premium, Aplikasi Sablon/Bordir Komputer & Finishing Setrika Uap
                    </p>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{order.totalQty} Pcs</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(order.totalJumlah + (order.diskon || 0))}
                  </td>
                </tr>
                {order.diskon > 0 && (
                  <tr className="text-rose-600 font-medium">
                    <td className="py-2 px-3">Potongan Khusus / Diskon Order</td>
                    <td className="py-2 px-3 text-center font-mono">-</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      -{formatRupiah(order.diskon)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Riwayat Pembayaran Customer Diterima (Dokumen Konfirmasi Fitur Update Bagian 3.C) */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/20 p-4 mb-4">
              <div className="flex items-center justify-between border-b border-teal-100 pb-2 mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-teal-700" />
                  Riwayat Pembayaran Customer Diterima
                </span>
                <span className="text-[11px] font-mono font-semibold text-teal-800">
                  Syarat DP 70%: {formatRupiah(targetDp70)}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {order.pembayaranList && order.pembayaranList.length > 0 ? (
                  order.pembayaranList.map((p, idx) => {
                    const pct = order.totalJumlah > 0 ? ((p.nominal / order.totalJumlah) * 100).toFixed(1) : '0';
                    return (
                      <div key={p.id || idx} className="flex items-center justify-between font-mono text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className="text-teal-600 font-bold">&check;</span>
                          <span>
                            {p.jenis === 'pelunasan'
                              ? 'Pelunasan 30%'
                              : p.jenis === 'termin'
                              ? 'DP 2 (Tambahan)'
                              : 'DP 1 (Awal)'}{' '}
                            ({p.tanggal} &bull; {p.keterangan || 'Transfer Bank'})
                          </span>
                        </span>
                        <span className="font-bold text-teal-800">
                          {formatRupiah(p.nominal)} ({pct}%)
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-between font-mono text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="text-teal-600 font-bold">&check;</span>
                      <span>DP Awal (Transfer Bank BCA)</span>
                    </span>
                    <span className="font-bold text-teal-800">
                      {formatRupiah(order.nominalDpCustomer)} ({order.dpPersenCustomer.toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 border-t border-teal-100 pt-2 flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Total Uang Muka Diterima:</span>
                <span className="font-mono text-teal-700">
                  {formatRupiah(order.nominalDpCustomer)} ({order.dpPersenCustomer.toFixed(1)}% &bull;{' '}
                  {isSiapProduksi ? 'DP Terpenuhi' : 'DP Parsial'})
                </span>
              </div>
            </div>

            {/* Threshold Highlight Box */}
            <div className="mb-5">
              {!isSiapProduksi && !isLunas ? (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Kekurangan DP untuk Naik Produksi: {formatRupiah(order.sisaMenujuDp70)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800 pl-6">
                    Menunggu pelunasan DP agar bahan pesanan dapat dipotong dan dijahit oleh mitra konveksi.
                  </p>
                </div>
              ) : isSiapProduksi && !isLunas ? (
                <div className="rounded-xl border border-teal-300 bg-teal-50 p-3 text-xs text-teal-900">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                    <span>Syarat Uang Muka Produksi Terpenuhi (Bahan Naik Jahit)</span>
                  </div>
                  <p className="mt-1 text-[11px] text-teal-800 pl-6">
                    Sisa pelunasan saat barang selesai (30%): <strong>{formatRupiah(order.sisaPelunasanCustomer)}</strong>
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Lunas Penuh (100% Paid) &bull; Pesanan Siap Dikirim / Diserahkan</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Summary & Rekening */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  REKENING RESMI PEMBAYARAN:
                </span>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <p className="font-bold text-slate-800">Bank Central Asia (BCA)</p>
                  <p className="font-mono text-xs font-bold text-teal-700">8830-1928-41</p>
                  <p className="text-[11px] text-slate-500">a/n PT VisualKain Kreasi Tekstil</p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="text-[11px] text-slate-500">
                    Pembayaran sah diverifikasi langsung oleh Finance
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                  <span>Total Tagihan Bersih:</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(order.totalJumlah)}</span>
                </div>
                <div className="flex justify-between py-1 text-teal-700 border-b border-slate-100 font-medium">
                  <span>Total DP Diterima:</span>
                  <span className="font-mono font-bold">{formatRupiah(order.nominalDpCustomer)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-800 font-bold">
                  <span>Sisa Pelunasan:</span>
                  <span className={`font-mono text-sm ${order.sisaPelunasanCustomer === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {order.sisaPelunasanCustomer === 0 ? 'Rp 0 (LUNAS)' : formatRupiah(order.sisaPelunasanCustomer)}
                  </span>
                </div>

                {/* Status Stamp */}
                <div className="pt-2 flex justify-end">
                  {isLunas ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800 tracking-wider">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      LUNAS (100% PAID)
                    </span>
                  ) : isSiapProduksi ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-extrabold text-teal-800 tracking-wider">
                      <CheckCircle2 className="h-4 w-4 text-teal-600" />
                      DP 70% &bull; SIAP PRODUKSI
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-800 tracking-wider">
                      DP {order.dpPersenCustomer.toFixed(1)}% &bull; BELUM LUNAS
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseFinance } from '@/hooks/useFirebaseFinance';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CustomSelect } from '@/components/ui/custom-select';
import { formatRupiah, formatCompactRupiah, cn } from '@/lib/utils';
import { DEFAULT_PAYMENT_CHANNELS } from '@/lib/constants';
import type { CustomerPayment, Order } from '@/types';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  Save,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  HelpCircle,
  Layers,
  Percent,
} from 'lucide-react';

const KATEGORI_KAS_MASUK_OPTIONS = [
  { value: 'Saldo Awal', label: 'Setoran Modal / Saldo Awal Rekening' },
  { value: 'Biaya Lain', label: 'Pendapatan Lain / Non-Operasional' },
];

const JENIS_TERMIN_OPTIONS = [
  { value: 'dp', label: 'DP 1 (Booking & Antrian Awal)', badge: 'Awal' },
  { value: 'termin', label: 'DP 2 (Termin 70% Siap Produksi)', badge: 'Produksi' },
  { value: 'pelunasan', label: 'Pelunasan Akhir (30% Sebelum Kirim)', badge: 'Selesai' },
];

export default function CashInNewPage() {
  const router = useRouter();
  const { orders, updateOrderFinance, addKas } = useFirebaseFinance();

  // Form Mode: Order Payment vs Direct Cash In
  const [entryMode, setEntryMode] = useState<'order' | 'direct'>('order');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Form Fields
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [nominal, setNominal] = useState<number>(0);
  const [rekening, setRekening] = useState<string>('Transfer BCA');
  const [kategori, setKategori] = useState<'Saldo Awal' | 'Biaya Lain'>('Saldo Awal');
  const [jenisTermin, setJenisTermin] = useState<'dp' | 'termin' | 'pelunasan'>('termin');
  const [keterangan, setKeterangan] = useState<string>('');

  // Guard & Loading State
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Selected Order Object
  const selectedOrder = useMemo<Order | undefined>(() => {
    return orders.find((o) => o.id === selectedOrderId || o.noInv === selectedOrderId);
  }, [orders, selectedOrderId]);

  // Dropdown Options Order
  const orderSelectOptions = useMemo(() => {
    return [
      { value: '', label: '-- Pilih Nomor Invoice / Pesanan Konsumen --' },
      ...orders.map((o) => ({
        value: o.id,
        label: `${o.noInv} - ${o.customerName || 'Customer'} (${o.projectName || '-'}) [Tagihan: ${formatCompactRupiah(o.totalInvoice)}]`,
      })),
    ];
  }, [orders]);

  // Order Finance Breakdown Realtime
  const orderBreakdown = useMemo(() => {
    if (!selectedOrder) return null;
    const totalInv = selectedOrder.totalInvoice || 0;
    const existingPaid = selectedOrder.totalUangMasukCustomer || 0;
    const target70 = Math.round(0.7 * totalInv);
    const simulatedPaid = existingPaid + nominal;
    const simulatedPercent = totalInv > 0 ? (simulatedPaid / totalInv) * 100 : 0;
    const sisaMenuju70 = Math.max(0, target70 - simulatedPaid);
    const sisaPelunasan = Math.max(0, totalInv - simulatedPaid);
    const isReadyForProduction = simulatedPaid >= target70;

    return {
      totalInv,
      existingPaid,
      target70,
      simulatedPaid,
      simulatedPercent,
      sisaMenuju70,
      sisaPelunasan,
      isReadyForProduction,
    };
  }, [selectedOrder, nominal]);

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      router.push('/?tab=cashin');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nominal <= 0) {
      toast.error('Nominal penerimaan kas harus lebih dari Rp 0');
      return;
    }

    if (entryMode === 'order' && !selectedOrder) {
      toast.error('Silakan pilih pesanan konsumen yang terkait dengan penerimaan kas');
      return;
    }

    try {
      setIsSaving(true);
      const ketText = keterangan.trim()
        ? `${rekening} - ${keterangan.trim()}`
        : `${rekening}`;

      if (entryMode === 'order' && selectedOrder) {
        // Tambahkan ke riwayat pembayaran pesanan (SSOT untuk penerimaan konsumen per order)
        const newPayment: CustomerPayment = {
          id: `pay-${Date.now()}`,
          orderId: selectedOrder.id,
          noInv: selectedOrder.noInv,
          tanggal: tanggal || new Date().toISOString().slice(0, 10),
          nominal,
          jenis: jenisTermin,
          keterangan: ketText,
          createdAt: new Date().toISOString(),
        };

        const currentPayments: CustomerPayment[] =
          Array.isArray(selectedOrder.pembayaranList) && selectedOrder.pembayaranList.length > 0
            ? selectedOrder.pembayaranList
            : selectedOrder.totalUangMasukCustomer > 0
            ? [
                {
                  id: `pay-${selectedOrder.id}-init`,
                  orderId: selectedOrder.id,
                  noInv: selectedOrder.noInv,
                  tanggal: selectedOrder.tanggalInv || selectedOrder.tanggalOrder || new Date().toISOString().slice(0, 10),
                  nominal: selectedOrder.totalUangMasukCustomer,
                  jenis: 'dp',
                  keterangan: 'DP Awal Konsumen',
                  createdAt: new Date().toISOString(),
                },
              ]
            : [];
        const updatedPayments = [...currentPayments, newPayment];
        const newTotalMasuk = updatedPayments.reduce((acc, p) => acc + Number(p.nominal), 0);
        const netInv = selectedOrder.totalInvoice || 0;

        await updateOrderFinance(selectedOrder.id, {
          pembayaranList: updatedPayments,
          dpNominal: newTotalMasuk,
          totalUangMasukCustomer: newTotalMasuk,
          statusPembayaran:
            newTotalMasuk >= netInv && netInv > 0
              ? 'lunas'
              : newTotalMasuk > 0
              ? 'parsial'
              : 'belum_bayar',
        });

        toast.success(`Penerimaan termin kas masuk untuk ${selectedOrder.noInv} berhasil dicatat!`);
      } else {
        // Kas Masuk Non-Order
        await addKas({
          tanggal,
          tipe: 'masuk',
          nominal,
          kategori,
          keterangan: ketText,
        });

        toast.success('Penerimaan kas masuk berhasil dicatat ke pembukuan!');
      }

      setIsDirty(false);
      router.push('/?tab=cashin');
    } catch {
      toast.error('Gagal mencatat penerimaan kas ke database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800 antialiased select-none">
      <Toaster position="top-right" richColors />

      {/* Top Floating App Bar / Breadcrumb */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              title="Kembali ke Dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <span>Finansial</span>
                <span>/</span>
                <span>Kas Masuk</span>
                <span>/</span>
                <span className="text-teal-700">Pencatatan Baru</span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
                Catat Penerimaan Kas &amp; Termin DP
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <Coins className="h-3.5 w-3.5 text-emerald-600" />
              <span>Arus Kas Masuk</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="w-full max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Pilihan Mode Entri Kas Masuk */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Jenis Transaksi Kas Masuk</h3>
                <p className="text-xs text-slate-400">Tentukan apakah dana terkait order konsumen atau penerimaan kas umum</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEntryMode('order');
                  setIsDirty(true);
                }}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                  entryMode === 'order'
                    ? 'border-teal-500 bg-teal-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm',
                  entryMode === 'order' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                )}>
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">Pembayaran DP / Termin Pesanan</div>
                  <div className="text-[11px] text-slate-500">Terkait tagihan invoice konsumen konveksi</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntryMode('direct');
                  setIsDirty(true);
                }}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                  entryMode === 'direct'
                    ? 'border-teal-500 bg-teal-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm',
                  entryMode === 'direct' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                )}>
                  <Coins className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">Kas Masuk Langsung / Non-Order</div>
                  <div className="text-[11px] text-slate-500">Modal pemilik, pendapatan lain, atau selisih kas</div>
                </div>
              </button>
            </div>

            {/* Sub-form: Dropdown Pilih Pesanan jika Mode Order */}
            {entryMode === 'order' && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Pilih Pesanan Konsumen Terkait <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={selectedOrderId}
                  onValueChange={(val) => {
                    setSelectedOrderId(val);
                    setIsDirty(true);
                  }}
                  options={orderSelectOptions}
                  className="w-full h-11"
                />

                {/* Kartu Rincian Breakdown 70% Production Threshold (US-9.10) */}
                {orderBreakdown && (
                  <div className="mt-3 rounded-xl border border-teal-200/90 bg-gradient-to-br from-teal-50/40 via-white to-slate-50 p-4 space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{selectedOrder?.noInv} &bull; {selectedOrder?.customerName}</div>
                        <div className="text-[11px] text-slate-500">{selectedOrder?.projectName} &bull; Qty: {selectedOrder?.totalQty || 1} pcs</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Invoice:</span>
                        <span className="font-mono text-xs font-bold text-slate-900">{formatRupiah(orderBreakdown.totalInv)}</span>
                      </div>
                    </div>

                    {/* 3 Metrik Stat Tile */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                        <div className="text-[10px] text-slate-400 font-medium">Sudah Terbayar</div>
                        <div className="font-mono text-xs font-bold text-teal-700">{formatRupiah(orderBreakdown.existingPaid)}</div>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                        <div className="text-[10px] text-slate-400 font-medium">Target DP 70%</div>
                        <div className="font-mono text-xs font-bold text-amber-700">{formatRupiah(orderBreakdown.target70)}</div>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-slate-200/80">
                        <div className="text-[10px] text-slate-400 font-medium">Sisa Pelunasan</div>
                        <div className="font-mono text-xs font-bold text-rose-700">{formatRupiah(orderBreakdown.sisaPelunasan)}</div>
                      </div>
                    </div>

                    {/* Ambang Batas 70% Production Alert (US-9.10) */}
                    <div className={cn(
                      'rounded-lg p-3 text-xs flex items-center gap-2 border',
                      orderBreakdown.isReadyForProduction
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    )}>
                      {orderBreakdown.isReadyForProduction ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Syarat 70% Terpenuhi!</strong> Pesanan siap masuk lini potong &amp; jahit di vendor konveksi (Total bayar: {orderBreakdown.simulatedPercent.toFixed(0)}%).
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>
                            <strong>Perhatian SOP:</strong> Kurang <strong>{formatRupiah(orderBreakdown.sisaMenuju70)}</strong> lagi agar pesanan mencapai syarat 70% untuk mulai produksi.
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Rincian Nominal, Tanggal & Rekening */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rincian Nominal &amp; Rekening Penerima</h3>
                <p className="text-xs text-slate-400">Masukkan nilai uang masuk dan rekening tujuan mutasi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tanggal Kas Masuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => {
                    setTanggal(e.target.value);
                    setIsDirty(true);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Nominal Penerimaan */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nominal Penerimaan (Rp) <span className="text-rose-500">*</span>
                </label>
                <CurrencyInput
                  value={nominal}
                  onValueChange={(val: number) => {
                    setNominal(val);
                    setIsDirty(true);
                  }}
                  placeholder="Rp 0"
                  className="h-11 text-sm font-bold font-mono text-emerald-700"
                />
              </div>

              {/* Rekening Tujuan */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rekening / Akun Penerima <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={rekening}
                  onValueChange={(val) => {
                    setRekening(val);
                    setIsDirty(true);
                  }}
                  options={DEFAULT_PAYMENT_CHANNELS.map((ch) => ({
                    value: ch.value,
                    label: ch.label,
                    badge: 'badge' in ch ? (ch as { badge: string }).badge : undefined,
                  }))}
                  className="h-11 w-full"
                />
              </div>

              {/* Pilihan Kategori / Termin */}
              {entryMode === 'order' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tahapan Termin Pembayaran <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={jenisTermin}
                    onValueChange={(val) => {
                      setJenisTermin(val as 'dp' | 'termin' | 'pelunasan');
                      setIsDirty(true);
                    }}
                    options={JENIS_TERMIN_OPTIONS}
                    className="h-11 w-full"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kategori Kas Masuk <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={kategori}
                    onValueChange={(val) => {
                      setKategori(val as 'Saldo Awal' | 'Biaya Lain');
                      setIsDirty(true);
                    }}
                    options={KATEGORI_KAS_MASUK_OPTIONS}
                    className="h-11 w-full"
                  />
                </div>
              )}
            </div>

            {/* Catatan / Keterangan Transaksi */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Catatan / Keterangan Tambahan
              </label>
              <textarea
                rows={3}
                value={keterangan}
                onChange={(e) => {
                  setKeterangan(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Contoh: Transfer pelunasan sisa 30% via rekening BCA a.n Kak Glora..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg">
            <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                <span>Batal / Kembali</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Penerimaan Kas'}</span>
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Exit Confirmation Dialog (Dirty Form Guard) */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <h4 className="text-sm font-bold text-slate-900">Perubahan Belum Disimpan</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda memiliki input penerimaan kas yang belum tersimpan ke sistem. Tinggalkan halaman ini?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Lanjutkan Mengisi
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  router.push('/?tab=cashin');
                }}
                className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Tinggalkan Halaman
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

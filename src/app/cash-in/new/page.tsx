'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseFinance } from '@/hooks/useFirebaseFinance';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CustomSelect } from '@/components/ui/custom-select';
import { formatRupiah, formatCompactRupiah, cn } from '@/lib/utils';
import {
  DEFAULT_PAYMENT_CHANNELS,
  FINANCE_START_DATE,
  isFromFinanceStartDate,
  getDefaultFinanceDate,
} from '@/lib/constants';
import type { CustomerPayment, Order } from '@/types';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  Save,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  CreditCard,
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

  const [entryMode, setEntryMode] = useState<'order' | 'direct'>('order');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const [tanggal, setTanggal] = useState<string>(getDefaultFinanceDate);
  const [nominal, setNominal] = useState<number>(0);
  const [rekening, setRekening] = useState<string>('Transfer BCA');
  const [kategori, setKategori] = useState<'Saldo Awal' | 'Biaya Lain'>('Saldo Awal');
  const [jenisTermin, setJenisTermin] = useState<'dp' | 'termin' | 'pelunasan'>('termin');
  const [keterangan, setKeterangan] = useState<string>('');

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const selectedOrder = useMemo<Order | undefined>(() => {
    return orders.find((o) => o.id === selectedOrderId || o.noInv === selectedOrderId);
  }, [orders, selectedOrderId]);

  const orderSelectOptions = useMemo(() => {
    return [
      { value: '', label: '-- Pilih Nomor Invoice / Pesanan Konsumen --' },
      ...orders.map((o) => ({
        value: o.id,
        label: `${o.noInv} - ${o.customerName || 'Customer'} (${o.projectName || '-'}) [Tagihan: ${formatCompactRupiah(o.totalInvoice)}]`,
      })),
    ];
  }, [orders]);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (nominal <= 0) {
      toast.error('Nominal penerimaan kas harus lebih dari Rp 0');
      return;
    }

    if (!isFromFinanceStartDate(tanggal)) {
      toast.error('Tanggal transaksi kas harus mulai 1 Oktober 2026 ke atas');
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
    <div className="min-h-screen bg-[#E8ECF2] pb-12 text-slate-900 antialiased">
      <Toaster position="top-right" richColors />

      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-10 py-3.5 shadow-2xs">
        <div className="w-full max-w-[1920px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              title="Kembali ke Dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-[0.96] transition-transform duration-150 cursor-pointer shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <span>Finansial</span>
                <span>/</span>
                <span>Kas Masuk</span>
                <span>/</span>
                <span className="text-teal-700">Pencatatan Baru</span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 truncate">
                Catat Penerimaan Kas &amp; Termin DP
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-slate-100 sm:border-t-0">
            <span
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-bold border shrink-0',
                isDirty
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              )}
            >
              {isDirty ? 'Belum Disimpan' : 'Arus Kas Masuk'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 sm:px-5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5 shrink-0" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Penerimaan'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Inputs */}
          <div className="xl:col-span-7 2xl:col-span-8 space-y-6">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                  <Layers className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">1. Jenis Transaksi Kas Masuk</h2>
                  <p className="text-xs text-slate-500">Tentukan apakah dana terkait order konsumen atau penerimaan kas umum</p>
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
                    'flex items-center gap-3 p-3.5 rounded-xl border text-left active:scale-[0.98] transition-transform duration-150 cursor-pointer',
                    entryMode === 'order'
                      ? 'border-teal-500 bg-teal-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm',
                      entryMode === 'order' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                    )}
                  >
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
                    'flex items-center gap-3 p-3.5 rounded-xl border text-left active:scale-[0.98] transition-transform duration-150 cursor-pointer',
                    entryMode === 'direct'
                      ? 'border-teal-500 bg-teal-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm',
                      entryMode === 'direct' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <Coins className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900">Kas Masuk Langsung / Non-Order</div>
                    <div className="text-[11px] text-slate-500">Modal pemilik, pendapatan lain, atau selisih kas</div>
                  </div>
                </button>
              </div>

              {entryMode === 'order' && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
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
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">2. Rincian Nominal &amp; Rekening Penerima</h2>
                  <p className="text-xs text-slate-500">Masukkan nilai uang masuk dan rekening tujuan mutasi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tanggal Kas Masuk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={FINANCE_START_DATE}
                    value={tanggal}
                    onChange={(e) => {
                      setTanggal(e.target.value);
                      setIsDirty(true);
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
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

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
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

                {entryMode === 'order' ? (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
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
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
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

              <div className="pt-1">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  rows={3}
                  value={keterangan}
                  onChange={(e) => {
                    setKeterangan(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Contoh: Transfer pelunasan sisa 30% via rekening BCA a.n Glora..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </section>
          </div>

          {/* Right Sticky Column: Simulasi Threshold 70% & Ringkasan Penerimaan */}
          <div className="xl:col-span-5 2xl:col-span-4 xl:sticky xl:top-24 space-y-6">
            {entryMode === 'order' && orderBreakdown && selectedOrder ? (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                      <Percent className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Simulasi Threshold 70% Order</h2>
                      <p className="text-xs text-slate-500">
                        {selectedOrder.noInv} &bull; {selectedOrder.customerName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[11px] font-extrabold border shrink-0',
                      orderBreakdown.isReadyForProduction
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    )}
                  >
                    {orderBreakdown.isReadyForProduction ? 'Siap Produksi' : 'Menunggu 70%'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                    <span className="text-slate-500 block text-[11px] font-medium">Total Invoice</span>
                    <div className="font-mono text-sm font-extrabold text-slate-900 mt-1 tabular-nums">
                      {formatRupiah(orderBreakdown.totalInv)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-teal-50/70 p-3.5 border border-teal-200/80">
                    <span className="text-teal-800 block text-[11px] font-medium">Total Setelah Input Ini</span>
                    <div className="font-mono text-sm font-extrabold text-teal-900 mt-1 tabular-nums">
                      {formatRupiah(orderBreakdown.simulatedPaid)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-50/70 p-3.5 border border-blue-200/80">
                    <span className="text-blue-800 block text-[11px] font-medium">Target DP 70%</span>
                    <div className="font-mono text-sm font-extrabold text-blue-900 mt-1 tabular-nums">
                      {formatRupiah(orderBreakdown.target70)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-purple-50/70 p-3.5 border border-purple-200/80">
                    <span className="text-purple-800 block text-[11px] font-medium">Sisa Pelunasan</span>
                    <div className="font-mono text-sm font-extrabold text-purple-900 mt-1 tabular-nums">
                      {formatRupiah(orderBreakdown.sisaPelunasan)}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    'rounded-xl p-3.5 text-xs flex items-start gap-2.5 border leading-relaxed',
                    orderBreakdown.isReadyForProduction
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  )}
                >
                  {orderBreakdown.isReadyForProduction ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Syarat 70% Terpenuhi!</strong> Pesanan siap masuk lini potong &amp; jahit di vendor konveksi (Total bayar: {orderBreakdown.simulatedPercent.toFixed(0)}%).
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Perhatian SOP:</strong> Kurang <strong>{formatRupiah(orderBreakdown.sisaMenuju70)}</strong> lagi agar pesanan mencapai syarat 70% untuk mulai produksi.
                      </span>
                    </>
                  )}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Coins className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Ringkasan Penerimaan Kas</h2>
                  <p className="text-xs text-slate-500">Konfirmasi rincian mutasi sebelum disimpan</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mode Pencatatan:</span>
                  <span className="font-bold text-slate-800">
                    {entryMode === 'order' ? 'Termin Invoice Order' : `Kas Masuk (${kategori})`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tanggal Masuk:</span>
                  <span className="font-mono font-bold text-slate-800">{tanggal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rekening Penerima:</span>
                  <span className="font-bold text-slate-800">{rekening}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Nominal Diterima:</span>
                  <span className="font-mono text-base font-extrabold text-emerald-700 tabular-nums">
                    {formatRupiah(nominal)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                >
                  Batal &amp; Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4 shrink-0" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Penerimaan Kas'}</span>
                </button>
              </div>
            </section>
          </div>
        </form>
      </main>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
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
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
              >
                Lanjutkan Mengisi
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  router.push('/?tab=cashin');
                }}
                className="inline-flex h-9 items-center rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
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

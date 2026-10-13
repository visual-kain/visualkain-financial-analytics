'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseFinance } from '@/hooks/useFirebaseFinance';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  PaymentLedgerPanel,
  type LedgerRow,
  type LedgerDraftState,
} from '@/components/finance/PaymentLedgerPanel';
import {
  normalizeLedger,
  deriveCustomerJenis,
  summarizeLedger,
} from '@/lib/payment-ledger';
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

function buildInitialCustomerRows(order: Order | undefined): LedgerRow[] {
  if (!order) return [];
  const totalInv = order.totalInvoice || 0;
  const rawList: CustomerPayment[] =
    Array.isArray(order.pembayaranList) && order.pembayaranList.length > 0
      ? order.pembayaranList
      : order.totalUangMasukCustomer > 0
      ? [
          {
            id: `pay-${order.id}-init`,
            orderId: order.id,
            noInv: order.noInv,
            tanggal:
              order.tanggalInv && isFromFinanceStartDate(order.tanggalInv)
                ? order.tanggalInv
                : order.tanggalOrder && isFromFinanceStartDate(order.tanggalOrder)
                ? order.tanggalOrder
                : getDefaultFinanceDate(),
            nominal: order.totalUangMasukCustomer,
            jenis: 'dp',
            keterangan: 'Transfer BCA - DP Awal Konsumen',
            createdAt: new Date().toISOString(),
          },
        ]
      : [];

  return normalizeLedger(
    rawList.map((p) => ({
      id: p.id,
      tanggal: p.tanggal,
      nominal: Number(p.nominal) || 0,
      terminKe: p.terminKe,
      label: p.label,
      jenis: p.jenis,
      keterangan: p.keterangan,
      createdAt: p.createdAt,
    })),
    totalInv,
    'customer'
  ) as LedgerRow[];
}

export default function CashInNewPage() {
  const router = useRouter();
  const { orders, updateOrderFinance, addKas } = useFirebaseFinance();

  const [entryMode, setEntryMode] = useState<'order' | 'direct'>('order');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // State khusus mode Kas Masuk Langsung (non-order)
  const [tanggal, setTanggal] = useState<string>(getDefaultFinanceDate);
  const [nominal, setNominal] = useState<number>(0);
  const [rekening, setRekening] = useState<string>('Transfer BCA');
  const [kategori, setKategori] = useState<'Saldo Awal' | 'Biaya Lain'>('Saldo Awal');
  const [keterangan, setKeterangan] = useState<string>('');

  // State khusus mode Termin Pesanan
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([]);
  const [hasLedgerChanged, setHasLedgerChanged] = useState<boolean>(false);
  const [ledgerDraft, setLedgerDraft] = useState<LedgerDraftState>({
    nominal: 0,
    error: null,
    previewEntries: [],
  });

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const selectedOrder = useMemo<Order | undefined>(() => {
    return orders.find((o) => o.id === selectedOrderId || o.noInv === selectedOrderId);
  }, [orders, selectedOrderId]);

  useEffect(() => {
    const initial = buildInitialCustomerRows(selectedOrder);
    setLedgerRows(initial);
    setHasLedgerChanged(false);
    setLedgerDraft({
      nominal: 0,
      error: null,
      previewEntries: initial,
    });
  }, [selectedOrder]);

  const accountOptions = useMemo(
    () =>
      DEFAULT_PAYMENT_CHANNELS.map((ch) => ({
        value: ch.value,
        label: ch.label,
        badge: 'badge' in ch ? (ch as { badge: string }).badge : undefined,
      })),
    []
  );

  const orderSelectOptions = useMemo(() => {
    return [
      { value: '', label: '-- Pilih Nomor Invoice / Pesanan Konsumen --' },
      ...orders.map((o) => {
        const sisa = Math.max(0, (o.totalInvoice || 0) - (o.totalUangMasukCustomer || 0));
        return {
          value: o.id,
          label: `${o.noInv} - ${o.customerName || 'Customer'} (${o.projectName || '-'}) [Sisa: ${formatCompactRupiah(sisa)}]`,
        };
      }),
    ];
  }, [orders]);

  const handleDraftChange = useCallback((draft: LedgerDraftState) => {
    setLedgerDraft(draft);
    if (draft.nominal > 0) {
      setIsDirty(true);
    }
  }, []);

  const effectiveEntries = useMemo<LedgerRow[]>(() => {
    if (ledgerDraft.nominal > 0 && !ledgerDraft.error) {
      return ledgerDraft.previewEntries;
    }
    return ledgerRows;
  }, [ledgerDraft, ledgerRows]);

  const orderBreakdown = useMemo(() => {
    if (!selectedOrder) return null;
    const totalInv = selectedOrder.totalInvoice || 0;
    const existingPaid = selectedOrder.totalUangMasukCustomer || 0;
    const sim = summarizeLedger(totalInv, effectiveEntries);
    return {
      totalInv,
      existingPaid,
      target70: sim.target70,
      simulatedPaid: sim.dibayar,
      simulatedPercent: sim.persen,
      sisaMenuju70: sim.sisaMenuju70,
      sisaPelunasan: sim.sisa,
      isReadyForProduction: sim.isReady70,
      isLunas: sim.isLunas,
    };
  }, [selectedOrder, effectiveEntries]);

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      router.push('/?tab=cashin');
    }
  };

  const isSaveDisabled =
    isSaving ||
    (entryMode === 'order' && Boolean(ledgerDraft.error));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (entryMode === 'order') {
      if (!selectedOrder) {
        toast.error('Silakan pilih pesanan konsumen terlebih dahulu');
        return;
      }

      if (ledgerDraft.error) {
        toast.error(ledgerDraft.error);
        return;
      }

      if (!hasLedgerChanged && ledgerDraft.nominal <= 0) {
        toast.error('Tambahkan atau ubah minimal satu termin pembayaran sebelum menyimpan');
        return;
      }

      const finalRows = effectiveEntries;
      for (const row of finalRows) {
        if (!isFromFinanceStartDate(row.tanggal)) {
          toast.error('Tanggal setiap termin harus mulai 1 Oktober 2026 ke atas');
          return;
        }
      }

      const netInv = selectedOrder.totalInvoice || 0;
      const newTotalMasuk = finalRows.reduce((acc, r) => acc + (Number(r.nominal) || 0), 0);
      if (netInv > 0 && newTotalMasuk > netInv) {
        toast.error(`Total termin (${formatRupiah(newTotalMasuk)}) melebihi tagihan pesanan (${formatRupiah(netInv)})`);
        return;
      }

      try {
        setIsSaving(true);
        let running = 0;
        const updatedPayments: CustomerPayment[] = finalRows.map((row, idx) => {
          const nominalVal = Number(row.nominal) || 0;
          running += nominalVal;
          const terminKe = idx + 1;
          const settles = netInv > 0 && running >= netInv;
          return {
            id: row.id === 'pay-draft' ? `pay-${Date.now()}-${idx}` : row.id,
            orderId: selectedOrder.id,
            noInv: selectedOrder.noInv,
            tanggal: row.tanggal,
            nominal: nominalVal,
            jenis: deriveCustomerJenis(terminKe, settles),
            terminKe,
            label: row.label,
            keterangan: row.keterangan || 'Transfer BCA',
            createdAt: row.createdAt || new Date().toISOString(),
          };
        });

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

        toast.success(`Riwayat termin untuk ${selectedOrder.noInv} berhasil disimpan!`);
        setIsDirty(false);
        router.push('/?tab=cashin');
      } catch {
        toast.error('Gagal menyimpan termin pembayaran ke database');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Mode Kas Masuk Langsung (non-order)
    if (nominal <= 0) {
      toast.error('Nominal penerimaan kas harus lebih dari Rp 0');
      return;
    }

    if (!isFromFinanceStartDate(tanggal)) {
      toast.error('Tanggal transaksi kas harus mulai 1 Oktober 2026 ke atas');
      return;
    }

    try {
      setIsSaving(true);
      const ketText = keterangan.trim()
        ? `${rekening} - ${keterangan.trim()}`
        : `${rekening}`;

      await addKas({
        tanggal,
        tipe: 'masuk',
        nominal,
        kategori,
        keterangan: ketText,
      });

      toast.success('Penerimaan kas masuk berhasil dicatat ke pembukuan!');
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
              aria-label="Kembali ke Dashboard"
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
                disabled={isSaveDisabled}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 sm:px-5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          {/* Left Column */}
          <div className="xl:col-span-7 2xl:col-span-8 space-y-6">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                  <Layers className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">1. Jenis Transaksi Kas Masuk</h2>
                  <p className="text-xs text-slate-500">Tentukan apakah dana terkait pesanan konsumen atau penerimaan kas umum</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('order');
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
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Pilih Pesanan Konsumen Terkait <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                      value={selectedOrderId}
                      onValueChange={(val) => {
                        setSelectedOrderId(val);
                      }}
                      options={orderSelectOptions}
                      className="w-full h-11"
                    />
                  </div>

                  {selectedOrder && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-mono font-extrabold text-teal-800">
                          {selectedOrder.noInv} &bull; {selectedOrder.customerName}
                        </div>
                        <div className="text-slate-600 truncate">
                          {selectedOrder.projectName || 'Pesanan Konveksi'} ({selectedOrder.totalPcs || 0} pcs)
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                          Vendor: {selectedOrder.vendorName || '-'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {entryMode === 'order' ? (
              selectedOrder ? (
                <PaymentLedgerPanel
                  variant="customer"
                  totalTagihan={selectedOrder.totalInvoice || 0}
                  diskon={selectedOrder.diskon || 0}
                  entries={ledgerRows}
                  onChange={(rows) => {
                    setLedgerRows(rows);
                    setHasLedgerChanged(true);
                    setIsDirty(true);
                  }}
                  accountOptions={accountOptions}
                  defaultTanggal={getDefaultFinanceDate()}
                  defaultRekening="Transfer BCA"
                  onDraftChange={handleDraftChange}
                />
              ) : (
                <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">Pilih Pesanan Terlebih Dahulu</h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Setelah Anda memilih nomor invoice di atas, rincian tagihan, progres DP 70%, dan riwayat termin konsumen akan ditampilkan secara lengkap di sini.
                  </p>
                </section>
              )
            ) : (
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
                      options={accountOptions}
                      className="h-11 w-full"
                    />
                  </div>

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
                    placeholder="Contoh: Setoran modal kas operasional via rekening BCA..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </section>
            )}
          </div>

          {/* Right Sticky Column */}
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
                    <span className="text-teal-800 block text-[11px] font-medium">Total Setelah Simpan</span>
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

              {entryMode === 'order' ? (
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mode Pencatatan:</span>
                    <span className="font-bold text-slate-800">Termin Invoice Order</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pesanan:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedOrder ? selectedOrder.noInv : 'Belum dipilih'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Jumlah Termin:</span>
                    <span className="font-bold text-slate-800">{effectiveEntries.length}x pembayaran</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Total Uang Masuk Order:</span>
                    <span className="font-mono text-base font-extrabold text-emerald-700 tabular-nums">
                      {formatRupiah(orderBreakdown ? orderBreakdown.simulatedPaid : 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mode Pencatatan:</span>
                    <span className="font-bold text-slate-800">Kas Masuk ({kategori})</span>
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
              )}

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
                  disabled={isSaveDisabled}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
              >
                Lanjutkan Mengisi
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  router.push('/?tab=cashin');
                }}
                className="inline-flex h-10 items-center rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
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

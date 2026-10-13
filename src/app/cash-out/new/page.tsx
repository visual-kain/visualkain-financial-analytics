'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseFinance } from '@/hooks/useFirebaseFinance';
import { useInitOnce } from '@/hooks/useInitOnce';
import { useBeforeUnloadGuard } from '@/hooks/useBeforeUnloadGuard';
import { EditKasStatusNotice, resolveEditKasStatus } from '@/components/finance/EditKasStatusNotice';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  PaymentLedgerPanel,
  type LedgerRow,
  type LedgerDraftState,
} from '@/components/finance/PaymentLedgerPanel';
import {
  normalizeLedger,
  deriveVendorJenis,
  summarizeLedger,
} from '@/lib/payment-ledger';
import { formatRupiah, formatCompactRupiah, cn } from '@/lib/utils';
import {
  DEFAULT_PAYMENT_CHANNELS,
  FINANCE_START_DATE,
  isFromFinanceStartDate,
  getDefaultFinanceDate,
  KATEGORI_KAS_KELUAR_OPTIONS,
} from '@/lib/constants';
import type { Order, VendorPayment, CashOutflowCategory } from '@/types';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  Save,
  WalletCards,
  TrendingDown,
  Building2,
  CreditCard,
  Layers,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

function buildInitialVendorRows(order: Order | undefined): LedgerRow[] {
  if (!order) return [];
  const totalHpp = order.totalHpp || 0;
  const fallbackDate =
    order.tanggalOrder && isFromFinanceStartDate(order.tanggalOrder)
      ? order.tanggalOrder
      : order.tanggalInv && isFromFinanceStartDate(order.tanggalInv)
      ? order.tanggalInv
      : getDefaultFinanceDate();

  const existingList = Array.isArray(order.vendorPembayaranList) ? order.vendorPembayaranList : [];
  const sumExisting = existingList.reduce((acc, vp) => acc + (Number(vp.nominal) || 0), 0);
  const totalPaid = Number(order.totalDibayarKeVendor) || 0;

  const rawList: VendorPayment[] =
    existingList.length > 0
      ? totalPaid > sumExisting
        ? [
            {
              id: `vp-${order.id}-init`,
              orderId: order.id,
              vendorName: order.vendorName || '-',
              tanggal: fallbackDate,
              nominal: totalPaid - sumExisting,
              jenis: 'dp_vendor',
              label: 'DP Vendor',
              keterangan: 'Transfer BCA - DP Awal Vendor',
              catatan: 'Transfer BCA - DP Awal Vendor',
              createdAt: new Date(0).toISOString(),
            },
            ...existingList,
          ]
        : existingList
      : totalPaid > 0
      ? [
          {
            id: `vp-${order.id}-init`,
            orderId: order.id,
            vendorName: order.vendorName || '-',
            tanggal: fallbackDate,
            nominal: totalPaid,
            jenis: 'dp_vendor',
            label: 'DP Vendor',
            keterangan: 'Transfer BCA - DP Awal Vendor',
            catatan: 'Transfer BCA - DP Awal Vendor',
            createdAt: new Date().toISOString(),
          },
        ]
      : [];

  return normalizeLedger(
    rawList.map((vp) => ({
      id: vp.id,
      tanggal: vp.tanggal && isFromFinanceStartDate(vp.tanggal) ? vp.tanggal : fallbackDate,
      nominal: Number(vp.nominal) || 0,
      terminKe: vp.terminKe,
      label: vp.label,
      jenis: vp.jenis,
      keterangan: vp.keterangan || vp.catatan,
      createdAt: vp.createdAt,
    })),
    totalHpp,
    'vendor'
  ) as LedgerRow[];
}

function CashOutNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orders, cashTransactions, kasReady, updateOrderFinance, addKas, updateKas } = useFirebaseFinance();

  const modeParam = searchParams.get('mode');
  const orderIdParam = searchParams.get('orderId') || '';
  const editPaymentIdParam = searchParams.get('editPaymentId');
  const editKasIdParam = searchParams.get('editKasId');
  const isEditMode = Boolean(editPaymentIdParam || editKasIdParam);

  const [entryMode, setEntryMode] = useState<'operasional' | 'vendor'>(
    modeParam === 'vendor' || editPaymentIdParam ? 'vendor' : 'operasional'
  );
  const [kategori, setKategori] = useState<CashOutflowCategory>('Operasional');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderIdParam);

  // State khusus mode Beban Operasional
  const [tanggal, setTanggal] = useState<string>(getDefaultFinanceDate);
  const [nominal, setNominal] = useState<number>(0);
  const [sumberRekening, setSumberRekening] = useState<string>('Transfer BCA');
  const [noVoucher, setNoVoucher] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');

  // State khusus mode Pembayaran Mitra Vendor (berbasis pesanan)
  const [vendorLedgerRows, setVendorLedgerRows] = useState<LedgerRow[]>([]);
  const [hasLedgerChanged, setHasLedgerChanged] = useState<boolean>(false);
  const [ledgerDraft, setLedgerDraft] = useState<LedgerDraftState>({
    nominal: 0,
    error: null,
    previewEntries: [],
  });

  const [isDirty, setIsDirty] = useState<boolean>(false);
  useBeforeUnloadGuard(isDirty);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const selectedOrder = useMemo<Order | undefined>(() => {
    if (!selectedOrderId) return undefined;
    return orders.find((o) => o.id === selectedOrderId || o.noInv === selectedOrderId);
  }, [orders, selectedOrderId]);

  const hasValidVendor = useMemo<boolean>(() => {
    if (!selectedOrder) return false;
    const v = (selectedOrder.vendorName || '').trim();
    return Boolean(v && v !== '-' && v.toLowerCase() !== 'tanpa vendor');
  }, [selectedOrder]);

  useInitOnce(selectedOrder?.id, () => {
    const initial = buildInitialVendorRows(selectedOrder);
    setVendorLedgerRows(initial);
    setHasLedgerChanged(false);
    setLedgerDraft({
      nominal: 0,
      error: null,
      previewEntries: initial,
    });
  });

  const accountOptions = useMemo(
    () => [
      ...DEFAULT_PAYMENT_CHANNELS.map((ch) => ({
        value: ch.value,
        label: ch.label,
        badge: 'badge' in ch ? (ch as { badge: string }).badge : undefined,
      })),
      { value: '', label: 'Kas Operasional (Tanpa Prefix Rekening)' },
    ],
    []
  );

  // Pre-fill form jika sedang mengedit transaksi Kas Keluar Non-Order (editKasIdParam)
  const editKasTarget = editKasIdParam ? cashTransactions.find((t) => t.id === editKasIdParam) : undefined;
  const editKasStatus = resolveEditKasStatus(editKasIdParam, Boolean(editKasTarget), kasReady);

  useInitOnce(editKasTarget ? editKasIdParam : null, () => {
    const targetTx = editKasTarget;
    if (!targetTx) return;
    setEntryMode('operasional');
    setTanggal(targetTx.tanggal || getDefaultFinanceDate());
    setNominal(Number(targetTx.nominal) || 0);
    setKategori((targetTx.kategori as CashOutflowCategory) || 'Operasional');

    const rawKet = (targetTx.keterangan || '').trim();
    let parsedVoucher = '';
    let restText = rawKet;

    const voucherMatch = rawKet.match(/^\[Voucher:\s*([^\]]+)\]\s*(.*)$/);
    if (voucherMatch) {
      parsedVoucher = voucherMatch[1].trim();
      restText = voucherMatch[2].trim();
    }
    setNoVoucher(parsedVoucher);

    const matchedCh = DEFAULT_PAYMENT_CHANNELS.find(
      (ch) => restText === ch.value || restText.startsWith(`${ch.value} - `)
    );
    if (matchedCh) {
      setSumberRekening(matchedCh.value);
      setKeterangan(restText === matchedCh.value ? '' : restText.slice(matchedCh.value.length + 3).trim());
    } else {
      setSumberRekening('');
      setKeterangan(restText);
    }
  });

  const orderSelectOptions = useMemo(() => {
    return [
      { value: '', label: '-- Pilih Nomor Invoice / Pesanan Produksi --' },
      ...orders.map((o) => {
        const sisaBayar = Math.max(0, (o.totalHpp || 0) - (o.totalDibayarKeVendor || 0));
        const vendorLabel = o.vendorName && o.vendorName.trim() !== '-' ? o.vendorName : 'Tanpa Vendor';
        return {
          value: o.id,
          label: `${o.noInv} - ${o.projectName || o.customerName || '-'} [Vendor: ${vendorLabel} | Sisa HPP: ${formatCompactRupiah(sisaBayar)}]`,
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
    return vendorLedgerRows;
  }, [ledgerDraft, vendorLedgerRows]);

  const vendorDebtSummary = useMemo(() => {
    if (entryMode !== 'vendor' || !selectedOrder) return null;
    const totalHpp = selectedOrder.totalHpp || 0;
    const existingPaid = selectedOrder.totalDibayarKeVendor || 0;
    const sim = summarizeLedger(totalHpp, effectiveEntries);
    return {
      totalHpp,
      existingPaid,
      newTotalPaid: sim.dibayar,
      sisaUtang: sim.sisa,
      persen: sim.persen,
    };
  }, [entryMode, selectedOrder, effectiveEntries]);

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      router.push('/?tab=cashout');
    }
  };

  const isSaveDisabled =
    isSaving ||
    (entryMode === 'operasional' && editKasStatus !== 'none' && editKasStatus !== 'ready') ||
    (entryMode === 'vendor' &&
      (!selectedOrder || !hasValidVendor || Boolean(ledgerDraft.error)));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (entryMode === 'vendor') {
      if (!selectedOrder) {
        toast.error('Silakan pilih pesanan produksi terlebih dahulu');
        return;
      }

      if (!hasValidVendor) {
        toast.error('Pesanan ini belum memiliki mitra vendor. Tetapkan vendor di halaman Edit Pesanan terlebih dahulu.');
        return;
      }

      if (ledgerDraft.error) {
        toast.error(ledgerDraft.error);
        return;
      }

      if (!hasLedgerChanged && ledgerDraft.nominal <= 0) {
        toast.error('Tambahkan atau ubah minimal satu baris pembayaran vendor sebelum menyimpan');
        return;
      }

      const finalRows = effectiveEntries;
      for (const row of finalRows) {
        if (!isFromFinanceStartDate(row.tanggal)) {
          toast.error('Tanggal setiap pembayaran vendor harus mulai 1 Oktober 2026 ke atas');
          return;
        }
      }

      const totalHpp = selectedOrder.totalHpp || 0;
      const newDibayar = finalRows.reduce((acc, r) => acc + (Number(r.nominal) || 0), 0);
      if (totalHpp > 0 && newDibayar > totalHpp) {
        toast.error(`Total pembayaran (${formatRupiah(newDibayar)}) melebihi HPP vendor (${formatRupiah(totalHpp)})`);
        return;
      }

      try {
        setIsSaving(true);
        const vendorNama = (selectedOrder.vendorName || '').trim();
        let running = 0;
        const updatedVendorList: VendorPayment[] = finalRows.map((row, idx) => {
          const nominalVal = Number(row.nominal) || 0;
          running += nominalVal;
          const terminKe = idx + 1;
          const settles = totalHpp > 0 && running >= totalHpp;
          const noteText = row.keterangan || 'Transfer BCA';
          return {
            id: row.id === 'vp-draft' ? `vp-${Date.now()}-${idx}` : row.id,
            orderId: selectedOrder.id,
            vendorName: vendorNama,
            tanggal: row.tanggal,
            nominal: nominalVal,
            jenis: deriveVendorJenis(terminKe, settles),
            terminKe,
            label: row.label,
            keterangan: noteText,
            catatan: noteText,
            createdAt: row.createdAt || new Date().toISOString(),
          };
        });

        await updateOrderFinance(selectedOrder.id, {
          dpNominalPO: newDibayar,
          totalDibayarKeVendor: newDibayar,
          vendorPembayaranList: updatedVendorList,
          statusPembayaranVendor:
            newDibayar >= totalHpp && totalHpp > 0
              ? 'lunas_vendor'
              : newDibayar > 0
              ? 'dp_vendor'
              : 'belum_bayar',
        });

        toast.success(`Riwayat pembayaran vendor ${vendorNama} untuk ${selectedOrder.noInv} berhasil disimpan!`);
        setIsDirty(false);
        router.push('/?tab=cashout');
      } catch {
        toast.error('Gagal menyimpan pembayaran vendor ke database');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Mode Beban Operasional
    if (nominal <= 0) {
      toast.error('Nominal pengeluaran kas harus lebih dari Rp 0');
      return;
    }

    if (!isFromFinanceStartDate(tanggal)) {
      toast.error('Tanggal pengeluaran kas harus mulai 1 Oktober 2026 ke atas');
      return;
    }

    if (!keterangan.trim()) {
      toast.error('Keterangan pengeluaran wajib diisi');
      return;
    }

    try {
      setIsSaving(true);
      const voucherText = noVoucher.trim() ? `[Voucher: ${noVoucher.trim()}] ` : '';
      const accountPrefix = sumberRekening.trim() ? `${sumberRekening.trim()} - ` : '';
      const ketFull = `${voucherText}${accountPrefix}${keterangan.trim()}`;

      if (editKasIdParam) {
        if (!editKasTarget) throw new Error('Transaksi kas tidak ditemukan');
        await updateKas(editKasIdParam, {
          tanggal,
          tipe: 'keluar',
          nominal,
          kategori,
          keterangan: ketFull,
        });
        toast.success(`Perubahan pengeluaran ${kategori} berhasil disimpan!`);
      } else {
        await addKas({
          tanggal,
          tipe: 'keluar',
          nominal,
          kategori,
          keterangan: ketFull,
        });
        toast.success(`Pengeluaran operasional ${kategori} berhasil dicatat!`);
      }

      setIsDirty(false);
      router.push('/?tab=cashout');
    } catch {
      toast.error('Gagal menyimpan pengeluaran kas ke database');
    } finally {
      setIsSaving(false);
    }
  };

  const kategoriBebanOptions = useMemo(() => {
    if (KATEGORI_KAS_KELUAR_OPTIONS.some((o) => o.value === kategori)) {
      return KATEGORI_KAS_KELUAR_OPTIONS;
    }
    return [...KATEGORI_KAS_KELUAR_OPTIONS, { value: kategori, label: kategori }];
  }, [kategori]);

  return (
    <div className="min-h-screen bg-[#E8ECF2] pb-12 text-slate-900 antialiased">
      <Toaster position="top-right" richColors />

      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-3.5 sm:px-6 lg:px-10 py-2.5 sm:py-3.5 shadow-2xs">
        <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
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
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-500 truncate">
                <span className="hidden sm:inline">Finansial</span>
                <span className="hidden sm:inline">/</span>
                <span>Kas Keluar</span>
                <span>/</span>
                <span className="text-rose-700">{isEditMode ? 'Edit Transaksi' : 'Pencatatan Baru'}</span>
              </div>
              <h1 className="text-xs sm:text-base font-extrabold tracking-tight text-slate-900 truncate">
                {isEditMode ? 'Edit Pengeluaran Kas & Pembayaran Vendor' : 'Catat Pengeluaran Kas & Bayar Vendor'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                'hidden md:inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold border shrink-0',
                isDirty
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              )}
            >
              {isDirty ? 'Belum Disimpan' : isEditMode ? 'Mode Edit Kas Keluar' : 'Arus Kas Keluar'}
            </span>

            <button
              type="button"
              onClick={handleBack}
              className="hidden sm:inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSaveDisabled}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3.5 sm:px-5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <Save className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden">{isSaving ? 'Proses...' : 'Simpan'}</span>
              <span className="hidden sm:inline">
                {isSaving ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="xl:col-span-7 2xl:col-span-8 space-y-6">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <Layers className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">1. Jenis Pengeluaran Kas</h2>
                  <p className="text-xs text-slate-500">Pilih apakah kas keluar untuk operasional umum atau pembayaran pesanan ke vendor</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('operasional');
                  }}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border text-left active:scale-[0.98] transition-transform duration-150 cursor-pointer',
                    entryMode === 'operasional'
                      ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm',
                      entryMode === 'operasional' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900">Beban Operasional &amp; Rutin</div>
                    <div className="text-[11px] text-slate-500">Gaji, sewa, listrik, logistik, atau vendor non-pesanan</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('vendor');
                  }}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border text-left active:scale-[0.98] transition-transform duration-150 cursor-pointer',
                    entryMode === 'vendor'
                      ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm',
                      entryMode === 'vendor' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900">Pembayaran Mitra Vendor (Pesanan)</div>
                    <div className="text-[11px] text-slate-500">DP vendor, cicilan jahit, atau pelunasan HPP pesanan</div>
                  </div>
                </button>
              </div>

              {entryMode === 'operasional' && <EditKasStatusNotice status={editKasStatus} />}

              {entryMode === 'operasional' ? (
                <div className="pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Kategori Beban Operasional <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={kategori}
                    onValueChange={(val) => {
                      setKategori(val as CashOutflowCategory);
                      setIsDirty(true);
                    }}
                    options={kategoriBebanOptions}
                    className="w-full h-11"
                  />
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Pilih Pesanan Produksi Terkait <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                      value={selectedOrderId}
                      onValueChange={(val) => {
                        setSelectedOrderId(val);
                      }}
                      options={orderSelectOptions}
                      className="w-full h-11"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Mitra vendor dan kewajiban HPP otomatis mengikuti pesanan yang dipilih. Untuk pengeluaran ke vendor di luar pesanan, gunakan mode Beban Operasional dengan kategori Pembayaran Vendor Lainnya.
                    </p>
                  </div>

                  {selectedOrder && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="block text-[11px] text-slate-500">Mitra Vendor Pesanan</span>
                        <div className="mt-1 font-extrabold text-slate-900 truncate">
                          {hasValidVendor ? selectedOrder.vendorName : 'Belum Ditetapkan'}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="block text-[11px] text-slate-500">Pelanggan &amp; Proyek</span>
                        <div className="mt-1 font-bold text-slate-800 truncate">
                          {selectedOrder.customerName} ({selectedOrder.projectName || '-'})
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="block text-[11px] text-slate-500">Total Kuantitas</span>
                        <div className="mt-1 font-mono font-extrabold text-slate-900">
                          {selectedOrder.totalPcs || 0} pcs
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOrder && !hasValidVendor && (
                    <div
                      role="alert"
                      className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          Pesanan <strong>{selectedOrder.noInv}</strong> belum memiliki mitra vendor. Tetapkan mitra vendor dan HPP terlebih dahulu sebelum mencatat pembayaran vendor.
                        </span>
                      </div>
                      <Link
                        href={`/orders/${selectedOrder.id}/edit`}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3.5 text-xs font-bold text-white hover:bg-amber-700 shrink-0"
                      >
                        <span>Edit Pesanan</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </section>

            {entryMode === 'vendor' ? (
              selectedOrder ? (
                <PaymentLedgerPanel
                  variant="vendor"
                  totalTagihan={selectedOrder.totalHpp || 0}
                  entries={vendorLedgerRows}
                  onChange={(rows) => {
                    setVendorLedgerRows(rows);
                    setHasLedgerChanged(true);
                    setIsDirty(true);
                  }}
                  accountOptions={accountOptions}
                  defaultTanggal={getDefaultFinanceDate()}
                  defaultRekening="Transfer BCA"
                  initialEditId={editPaymentIdParam}
                  onDraftChange={handleDraftChange}
                  disabled={!hasValidVendor}
                />
              ) : (
                <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">Pilih Pesanan Terlebih Dahulu</h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Pilih nomor invoice pesanan di atas untuk memuat nama mitra vendor, total HPP, sisa utang, serta riwayat pembayaran ke vendor.
                  </p>
                </section>
              )
            ) : (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">2. Rincian Nominal &amp; Sumber Kas</h2>
                    <p className="text-xs text-slate-500">Masukkan nilai pengeluaran kas dan rekening pencairan</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Tanggal Pengeluaran <span className="text-rose-500">*</span>
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
                      Nominal Pengeluaran (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <CurrencyInput
                      value={nominal}
                      onValueChange={(val: number) => {
                        setNominal(val);
                        setIsDirty(true);
                      }}
                      placeholder="Rp 0"
                      className="h-11 text-sm font-bold font-mono text-rose-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Sumber Rekening Pencairan <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                      value={sumberRekening}
                      onValueChange={(val) => {
                        setSumberRekening(val);
                        setIsDirty(true);
                      }}
                      options={accountOptions}
                      className="h-11 w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Nomor Voucher / Ref Bukti (Opsional)
                    </label>
                    <input
                      type="text"
                      value={noVoucher}
                      onChange={(e) => {
                        setNoVoucher(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Contoh: VCR-2026-10-092"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Keterangan / Rincian Pengeluaran <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={keterangan}
                    onChange={(e) => {
                      setKeterangan(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Contoh: Pembayaran listrik dan internet kantor bulan Oktober 2026..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </section>
            )}
          </div>

          {/* Right Sticky Column */}
          <div className="xl:col-span-5 2xl:col-span-4 xl:sticky xl:top-24 space-y-6">
            {vendorDebtSummary && selectedOrder ? (
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Simulasi Kewajiban HPP Vendor</h2>
                      <p className="text-xs text-slate-500">
                        {selectedOrder.noInv} &bull; {selectedOrder.vendorName || '-'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[11px] font-extrabold border shrink-0',
                      vendorDebtSummary.sisaUtang <= 0 && vendorDebtSummary.totalHpp > 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    )}
                  >
                    {vendorDebtSummary.sisaUtang <= 0 && vendorDebtSummary.totalHpp > 0 ? 'Lunas Vendor' : 'DP / Cicilan'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                    <span className="text-slate-500 block text-[11px] font-medium">Total HPP Vendor</span>
                    <div className="font-mono text-sm font-extrabold text-slate-900 mt-1 tabular-nums">
                      {formatRupiah(vendorDebtSummary.totalHpp)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                    <span className="text-slate-500 block text-[11px] font-medium">Sudah Diserahkan</span>
                    <div className="font-mono text-sm font-extrabold text-slate-800 mt-1 tabular-nums">
                      {formatRupiah(vendorDebtSummary.existingPaid)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-teal-50/70 p-3.5 border border-teal-200/80">
                    <span className="text-teal-800 block text-[11px] font-medium">Total Setelah Simpan</span>
                    <div className="font-mono text-sm font-extrabold text-teal-900 mt-1 tabular-nums">
                      {formatRupiah(vendorDebtSummary.newTotalPaid)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-rose-50/70 p-3.5 border border-rose-200/80">
                    <span className="text-rose-800 block text-[11px] font-medium">Sisa Utang Vendor</span>
                    <div className="font-mono text-sm font-extrabold text-rose-900 mt-1 tabular-nums">
                      {formatRupiah(vendorDebtSummary.sisaUtang)}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <TrendingDown className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Ringkasan Pengeluaran Kas</h2>
                  <p className="text-xs text-slate-500">Konfirmasi rincian kas keluar sebelum disimpan</p>
                </div>
              </div>

              {entryMode === 'vendor' ? (
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Jenis Pengeluaran:</span>
                    <span className="font-bold text-slate-800">Pembayaran Mitra Vendor</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pesanan:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedOrder ? selectedOrder.noInv : 'Belum dipilih'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mitra Vendor:</span>
                    <span className="font-bold text-slate-800">
                      {selectedOrder ? selectedOrder.vendorName || '-' : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Jumlah Pembayaran:</span>
                    <span className="font-bold text-slate-800">{effectiveEntries.length}x pembayaran</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Total Dibayar ke Vendor:</span>
                    <span className="font-mono text-base font-extrabold text-rose-700 tabular-nums">
                      {formatRupiah(vendorDebtSummary ? vendorDebtSummary.newTotalPaid : 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Jenis Pengeluaran:</span>
                    <span className="font-bold text-slate-800">Operasional ({kategori})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tanggal Keluar:</span>
                    <span className="font-mono font-bold text-slate-800">{tanggal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sumber Rekening:</span>
                    <span className="font-bold text-slate-800">{sumberRekening}</span>
                  </div>
                  {noVoucher.trim() && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">No. Voucher:</span>
                      <span className="font-mono font-bold text-slate-800">{noVoucher.trim()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Nominal Keluar:</span>
                    <span className="font-mono text-base font-extrabold text-rose-700 tabular-nums">
                      {formatRupiah(nominal)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto inline-flex min-h-11 h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                >
                  Batal &amp; Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSaveDisabled}
                  className="w-full sm:w-auto sm:flex-1 inline-flex min-h-11 h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 shrink-0" />
                  <span>{isSaving ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Simpan Pengeluaran Kas'}</span>
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
              Anda memiliki input pengeluaran kas yang belum tersimpan ke sistem. Tinggalkan halaman ini?
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
                  router.push('/?tab=cashout');
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

export default function CashOutNewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#E8ECF2] text-slate-600 font-mono text-xs">
          Memuat Form Kas Keluar...
        </div>
      }
    >
      <CashOutNewContent />
    </React.Suspense>
  );
}


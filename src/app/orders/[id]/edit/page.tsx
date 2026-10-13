'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from '@/lib/payment-ledger';
import { formatRupiah, cn } from '@/lib/utils';
import {
  DEFAULT_VENDOR_OPTIONS,
  DEFAULT_PAYMENT_CHANNELS,
  isFromFinanceStartDate,
  getDefaultFinanceDate,
} from '@/lib/constants';
import type { Order, CustomerPayment } from '@/types';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Building2,
  Clock,
  Layers,
  Percent,
} from 'lucide-react';

export default function OrderEditFinancePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { orders, vendors, updateOrderFinance } = useFirebaseFinance();

  const currentOrder = useMemo(() => {
    return orders.find((o) => o.id === orderId || o.noInv === orderId);
  }, [orders, orderId]);

  const [totalInvoice, setTotalInvoice] = useState<number>(0);
  const [diskon, setDiskon] = useState<number>(0);
  const [biayaOperasional, setBiayaOperasional] = useState<number>(0);

  const [vendorNama, setVendorNama] = useState<string>('AMRIN');
  const [totalBiayaVendor, setTotalBiayaVendor] = useState<number>(0);
  const [dpVendor, setDpVendor] = useState<number>(0);
  const [catatanFinance, setCatatanFinance] = useState<string>('');

  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([]);
  const [ledgerDraft, setLedgerDraft] = useState<LedgerDraftState>({
    nominal: 0,
    error: null,
    previewEntries: [],
  });

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (currentOrder) {
      const currentDiskon = currentOrder.diskon || 0;
      const grossTagihan =
        currentOrder.grossTotal !== undefined && Number(currentOrder.grossTotal) > 0
          ? Number(currentOrder.grossTotal)
          : (currentOrder.totalInvoice || 0) + currentDiskon;
      const netTagihan = Math.max(0, grossTagihan - currentDiskon);

      setTotalInvoice(grossTagihan);
      setDiskon(currentDiskon);
      setBiayaOperasional(currentOrder.biayaOperasional || 0);
      setVendorNama(currentOrder.vendorName || 'AMRIN');
      setTotalBiayaVendor(currentOrder.totalHpp || 0);
      setDpVendor(currentOrder.totalDibayarKeVendor || 0);
      setCatatanFinance(currentOrder.catatanFinance || '');

      const rawPayments: CustomerPayment[] =
        currentOrder.pembayaranList && currentOrder.pembayaranList.length > 0
          ? currentOrder.pembayaranList
          : currentOrder.totalUangMasukCustomer > 0
          ? [
              {
                id: `pay-${currentOrder.id}-init`,
                orderId: currentOrder.id,
                noInv: currentOrder.noInv,
                tanggal:
                  currentOrder.tanggalInv && isFromFinanceStartDate(currentOrder.tanggalInv)
                    ? currentOrder.tanggalInv
                    : currentOrder.tanggalOrder && isFromFinanceStartDate(currentOrder.tanggalOrder)
                    ? currentOrder.tanggalOrder
                    : getDefaultFinanceDate(),
                nominal: currentOrder.totalUangMasukCustomer,
                jenis: 'dp',
                keterangan: 'Transfer BCA - DP Awal Konsumen',
                createdAt: new Date().toISOString(),
              },
            ]
          : [];

      const normalized = normalizeLedger(
        rawPayments.map((p) => ({
          id: p.id,
          tanggal: p.tanggal,
          nominal: Number(p.nominal) || 0,
          terminKe: p.terminKe,
          label: p.label,
          jenis: p.jenis,
          keterangan: p.keterangan,
          createdAt: p.createdAt,
        })),
        netTagihan,
        'customer'
      ) as LedgerRow[];

      setLedgerRows(normalized);
      setLedgerDraft({
        nominal: 0,
        error: null,
        previewEntries: normalized,
      });
      setIsDirty(false);
    }
  }, [currentOrder]);

  const accountOptions = useMemo(
    () =>
      DEFAULT_PAYMENT_CHANNELS.map((ch) => ({
        value: ch.value,
        label: ch.label,
        badge: 'badge' in ch ? (ch as { badge: string }).badge : undefined,
      })),
    []
  );

  const vendorOptions = useMemo<Array<{ value: string; label: string; badge?: string }>>(() => {
    const list: Array<{ value: string; label: string; badge?: string }> = DEFAULT_VENDOR_OPTIONS.map((v) => ({
      value: v.value,
      label: v.label,
      badge: 'badge' in v ? (v as { badge: string }).badge : undefined,
    }));

    vendors.forEach((v) => {
      if (v.nama && !list.some((opt) => opt.value.toLowerCase() === v.nama.toLowerCase())) {
        list.push({ value: v.nama, label: v.nama, badge: 'Mitra Aktif' });
      }
    });

    orders.forEach((o) => {
      if (
        o.vendorName &&
        o.vendorName.trim() &&
        o.vendorName !== '-' &&
        !list.some((opt) => opt.value.toLowerCase() === o.vendorName!.toLowerCase())
      ) {
        list.push({ value: o.vendorName, label: o.vendorName, badge: 'Order Aktif' });
      }
    });

    if (currentOrder?.vendorName && currentOrder.vendorName.trim() && currentOrder.vendorName !== '-') {
      if (!list.some((opt) => opt.value.toLowerCase() === currentOrder.vendorName!.toLowerCase())) {
        list.push({ value: currentOrder.vendorName, label: currentOrder.vendorName, badge: 'Saat Ini' });
      }
    }

    return list;
  }, [vendors, orders, currentOrder]);

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

  const netInvoice = Math.max(0, totalInvoice - diskon);
  const nominalDpCustomer = useMemo(() => {
    return effectiveEntries.reduce((acc, p) => acc + (Number(p.nominal) || 0), 0);
  }, [effectiveEntries]);

  const target70 = Math.round(0.7 * netInvoice);
  const sisaMenuju70 = Math.max(0, target70 - nominalDpCustomer);
  const isSiapProduksi = netInvoice > 0 && nominalDpCustomer >= target70;
  const dpPersenCustomer = netInvoice > 0 ? (nominalDpCustomer / netInvoice) * 100 : 0;
  const sisaPelunasanCustomer = Math.max(0, netInvoice - nominalDpCustomer);

  const sisaPembayaranVendor = Math.max(0, totalBiayaVendor - dpVendor);
  const netProfit = netInvoice - totalBiayaVendor - biayaOperasional;
  const marginPercent = netInvoice > 0 ? (netProfit / netInvoice) * 100 : 0;

  const isSaveDisabled = isSaving || Boolean(ledgerDraft.error);

  const handleBackToFinance = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentOrder) return;

    if (netInvoice <= 0) {
      toast.error('Nilai bersih tagihan invoice harus lebih dari Rp 0');
      return;
    }

    if (ledgerDraft.error) {
      toast.error(ledgerDraft.error);
      return;
    }

    if (nominalDpCustomer > netInvoice) {
      toast.error(`Total termin konsumen (${formatRupiah(nominalDpCustomer)}) melebihi tagihan bersih (${formatRupiah(netInvoice)})`);
      return;
    }

    for (const row of effectiveEntries) {
      if (!isFromFinanceStartDate(row.tanggal)) {
        toast.error('Tanggal setiap termin pembayaran harus mulai 1 Oktober 2026 ke atas');
        return;
      }
    }

    try {
      setIsSaving(true);
      const matchedVendor = vendors.find(
        (v) => v.nama.toLowerCase() === vendorNama.toLowerCase() || v.id === vendorNama
      );
      const vendorId = matchedVendor ? matchedVendor.id : (currentOrder.vendorId || vendorNama);

      let running = 0;
      const updatedPayments: CustomerPayment[] = effectiveEntries.map((row, idx) => {
        const nominalVal = Number(row.nominal) || 0;
        running += nominalVal;
        const terminKe = idx + 1;
        const settles = netInvoice > 0 && running >= netInvoice;
        return {
          id: row.id === 'pay-draft' ? `pay-${Date.now()}-${idx}` : row.id,
          orderId: currentOrder.id,
          noInv: currentOrder.noInv,
          tanggal: row.tanggal,
          nominal: nominalVal,
          jenis: deriveCustomerJenis(terminKe, settles),
          terminKe,
          label: row.label,
          keterangan: row.keterangan || 'Transfer BCA',
          createdAt: row.createdAt || new Date().toISOString(),
        };
      });

      const updatedPayload: Partial<Order> = {
        grossTotal: totalInvoice,
        totalInvoice: netInvoice,
        jumlahSemua: netInvoice,
        diskon,
        diskonHarga: diskon,
        biayaOperasional,
        pembayaranList: updatedPayments,
        dpNominal: nominalDpCustomer,
        totalUangMasukCustomer: nominalDpCustomer,
        totalHpp: totalBiayaVendor,
        totalBiayaVendor,
        hppAktual: totalBiayaVendor,
        profitAktual: netProfit,
        targetMargin: netProfit,
        dpNominalPO: dpVendor,
        totalDibayarKeVendor: dpVendor,
        vendorName: vendorNama,
        vendorId,
        catatanFinance,
        isManualFinanceOverride: true,
        statusPembayaran:
          nominalDpCustomer >= netInvoice && netInvoice > 0
            ? 'lunas'
            : nominalDpCustomer > 0
            ? 'parsial'
            : 'belum_bayar',
        statusPembayaranVendor:
          dpVendor >= totalBiayaVendor && totalBiayaVendor > 0
            ? 'lunas_vendor'
            : dpVendor > 0
            ? 'dp_vendor'
            : 'belum_bayar',
      };

      await updateOrderFinance(currentOrder.id, updatedPayload);
      toast.success(`Data finansial invoice ${currentOrder.noInv} berhasil disimpan!`);
      setIsDirty(false);
      router.push('/');
    } catch {
      toast.error('Gagal menyimpan perubahan ke database');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-[#E8ECF2] p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 max-w-md w-full text-center shadow-card-double">
          <Clock className="h-10 w-10 text-teal-600 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Memuat Data Finansial Order...</h3>
          <p className="text-xs text-slate-500 mt-1">Mengambil rincian invoice {orderId} dari Firestore</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Master Finansial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8ECF2] text-slate-900 pb-12">
      <Toaster richColors position="top-right" />

      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-10 py-3.5 shadow-2xs">
        <div className="w-full max-w-[1920px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBackToFinance}
              aria-label="Kembali ke Master Finansial"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-[0.96] transition-transform duration-150 cursor-pointer shrink-0"
              title="Kembali ke Master Finansial"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                  {currentOrder.noInv}
                </span>
                <span className="text-xs text-slate-300 hidden sm:inline">&bull;</span>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  Edit Finansial Order &amp; Termin DP
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {currentOrder.customerName} &bull; {currentOrder.projectName || 'Proyek Garmen'}
                {currentOrder.totalQty ? ` • ${currentOrder.totalQty} Pcs` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-slate-100 sm:border-t-0">
            <span
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-bold border shrink-0',
                isDirty
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              )}
            >
              {isDirty ? 'Belum Disimpan' : 'Tersinkron'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToFinance}
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
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="xl:col-span-7 2xl:col-span-8 space-y-6">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-5">
              <div className="flex items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                    <Receipt className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">1. Nilai Tagihan Invoice &amp; Biaya Operasional</h2>
                    <p className="text-xs text-slate-500">Atur nominal tagihan kotor, potongan diskon, dan beban operasional proyek</p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                  Net: {formatRupiah(netInvoice)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Nilai Tagihan Kotor (Rp)</label>
                  <CurrencyInput
                    value={totalInvoice}
                    onValueChange={(val: number) => {
                      setTotalInvoice(val);
                      setIsDirty(true);
                    }}
                    className="h-11 text-xs font-semibold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Sebelum potongan diskon</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Diskon Konsumen (Rp)</label>
                  <CurrencyInput
                    value={diskon}
                    onValueChange={(val: number) => {
                      setDiskon(val);
                      setIsDirty(true);
                    }}
                    className="h-11 text-xs font-semibold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Potongan harga resmi invoice</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Biaya Operasional Order (Rp)</label>
                  <CurrencyInput
                    value={biayaOperasional}
                    onValueChange={(val: number) => {
                      setBiayaOperasional(val);
                      setIsDirty(true);
                    }}
                    className="h-11 text-xs font-semibold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Ongkir sample, bordir film, packing</span>
                </div>
              </div>
            </section>

            <PaymentLedgerPanel
              variant="customer"
              totalTagihan={netInvoice}
              diskon={diskon}
              entries={ledgerRows}
              onChange={(rows) => {
                setLedgerRows(rows);
                setIsDirty(true);
              }}
              accountOptions={accountOptions}
              defaultTanggal={getDefaultFinanceDate()}
              defaultRekening="Transfer BCA"
              onDraftChange={handleDraftChange}
            />

            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">3. Kewajiban Beban Pokok Mitra Vendor (HPP)</h2>
                  <p className="text-xs text-slate-500">Pilih mitra konveksi pelaksana, modal HPP PO, dan dana yang telah diserahkan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mitra Vendor Konveksi</label>
                  <CustomSelect
                    value={vendorNama}
                    onValueChange={(val) => {
                      setVendorNama(val);
                      setIsDirty(true);
                    }}
                    options={vendorOptions}
                    className="h-11 text-xs"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Mitra pelaksana produksi</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Biaya HPP Vendor (Rp)</label>
                  <CurrencyInput
                    value={totalBiayaVendor}
                    onValueChange={(val: number) => {
                      setTotalBiayaVendor(val);
                      setIsDirty(true);
                    }}
                    className="h-11 text-xs font-semibold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Pokok tagihan konveksi</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">DP Diserahkan ke Vendor (Rp)</label>
                  <CurrencyInput
                    value={dpVendor}
                    onValueChange={(val: number) => {
                      setDpVendor(val);
                      setIsDirty(true);
                    }}
                    className="h-11 text-xs font-semibold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Dana nyata keluar dari kas</span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 font-semibold">Sisa Utang yang Masih Harus Dibayar ke Vendor:</span>
                <span className={cn('font-mono font-extrabold tabular-nums text-sm', sisaPembayaranVendor > 0 ? 'text-rose-600' : 'text-emerald-700')}>
                  {sisaPembayaranVendor > 0 ? formatRupiah(sisaPembayaranVendor) : 'Rp 0 (LUNAS VENDOR)'}
                </span>
              </div>
            </section>
          </div>

          {/* Right Sticky Column */}
          <div className="xl:col-span-5 2xl:col-span-4 xl:sticky xl:top-24 space-y-6">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                    <Percent className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Alokasi &amp; Threshold 70% Produksi
                    </h2>
                    <p className="text-xs text-slate-500">
                      SOP VisualKain: Naik produksi jika DP &ge; 70%
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-[11px] font-extrabold border shrink-0',
                    isSiapProduksi
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  )}
                >
                  {isSiapProduksi ? 'Siap Produksi' : 'Menunggu DP 70%'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                  <span className="text-slate-500 block text-[11px] font-medium leading-tight">Total Nilai Tagihan</span>
                  <div className="font-mono text-sm sm:text-base font-extrabold text-slate-900 mt-1 tabular-nums">
                    {formatRupiah(netInvoice)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">100% Nilai Kontrak</span>
                </div>

                <div className="rounded-xl bg-teal-50/70 p-3.5 border border-teal-200/80">
                  <span className="text-teal-800 block text-[11px] font-medium leading-tight">Sudah Dibayar Konsumen</span>
                  <div className="font-mono text-sm sm:text-base font-extrabold text-teal-900 mt-1 tabular-nums">
                    {formatRupiah(nominalDpCustomer)}
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 mt-0.5 block">
                    {dpPersenCustomer.toFixed(1)}% Terkumpul
                  </span>
                </div>

                <div className="rounded-xl bg-blue-50/70 p-3.5 border border-blue-200/80">
                  <span className="text-blue-800 block text-[11px] font-medium leading-tight">Target 70% Syarat Jahit</span>
                  <div className="font-mono text-sm sm:text-base font-extrabold text-blue-900 mt-1 tabular-nums">
                    {formatRupiah(target70)}
                  </div>
                  <span className="text-[10px] text-blue-700 mt-0.5 block">0.7 &times; Nilai Invoice</span>
                </div>

                <div className="rounded-xl bg-purple-50/70 p-3.5 border border-purple-200/80">
                  <span className="text-purple-800 block text-[11px] font-medium leading-tight">Sisa Pelunasan Akhir</span>
                  <div className="font-mono text-sm sm:text-base font-extrabold text-purple-900 mt-1 tabular-nums">
                    {formatRupiah(sisaPelunasanCustomer)}
                  </div>
                  <span className="text-[10px] text-purple-700 mt-0.5 block">Dibayar sebelum kirim</span>
                </div>
              </div>

              {isSiapProduksi ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5 leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Syarat 70% Terpenuhi:</strong> Konsumen telah melunasi{' '}
                    <span className="font-mono font-bold">{formatRupiah(nominalDpCustomer)}</span> ({dpPersenCustomer.toFixed(1)}%).
                    Pesanan resmi siap dinaikkan ke jadwal potong &amp; jahit vendor. Sisa pelunasan akhir:{' '}
                    <span className="font-mono font-bold">{formatRupiah(sisaPelunasanCustomer)}</span>.
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Perhatian Jadwal Produksi:</strong> Pembayaran baru mencapai{' '}
                    <span className="font-mono font-bold">{formatRupiah(nominalDpCustomer)}</span> ({dpPersenCustomer.toFixed(1)}%).
                    Masih <strong className="text-rose-700">kurang {formatRupiah(sisaMenuju70)}</strong> untuk memenuhi ambang batas 70% produksi.
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                  <Layers className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">4. Ringkasan Margin &amp; Laba Bersih Proyek</h2>
                  <p className="text-xs text-slate-500">Kalkulasi hak margin bersih VisualKain atas pesanan ini</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                  <span className="text-slate-500 block text-[11px] font-medium">Net Invoice</span>
                  <span className="font-mono text-sm font-bold text-slate-900 block mt-1 tabular-nums">{formatRupiah(netInvoice)}</span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                  <span className="text-slate-500 block text-[11px] font-medium">Total Modal HPP</span>
                  <span className="font-mono text-sm font-bold text-slate-700 block mt-1 tabular-nums">{formatRupiah(totalBiayaVendor)}</span>
                </div>

                <div className="rounded-xl bg-emerald-50/80 p-3.5 border border-emerald-200/80">
                  <span className="text-emerald-800 block text-[11px] font-medium">Profit Bersih</span>
                  <span className="font-mono text-sm font-extrabold text-emerald-900 block mt-1 tabular-nums">{formatRupiah(netProfit)}</span>
                </div>

                <div className="rounded-xl bg-emerald-50/80 p-3.5 border border-emerald-200/80">
                  <span className="text-emerald-800 block text-[11px] font-medium">Margin Bersih (%)</span>
                  <span className="font-mono text-sm font-extrabold text-emerald-900 block mt-1 tabular-nums">{marginPercent.toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Internal Keuangan</label>
                <textarea
                  rows={3}
                  placeholder="Catatan finance terkait revisi kain, toleransi DP, atau kesepakatan vendor..."
                  value={catatanFinance}
                  onChange={(e) => {
                    setCatatanFinance(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleBackToFinance}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                >
                  Batal &amp; Kembali
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSaveDisabled}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 shrink-0" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Finansial'}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 max-w-sm w-full shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h4 className="text-sm font-bold text-slate-900">Perubahan Belum Disimpan</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda memiliki input perubahan finansial yang belum disimpan ke database. Apakah Anda yakin ingin keluar dan membuang perubahan ini?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
              >
                Tetap di Halaman
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  router.push('/');
                }}
                className="inline-flex h-10 items-center rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
              >
                Buang &amp; Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

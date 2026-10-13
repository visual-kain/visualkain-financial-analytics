'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebaseFinance } from '@/hooks/useFirebaseFinance';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CustomSelect } from '@/components/ui/custom-select';
import { formatRupiah, cn } from '@/lib/utils';
import { DEFAULT_VENDOR_OPTIONS, DEFAULT_PAYMENT_CHANNELS } from '@/lib/constants';
import type { Order, CustomerPayment } from '@/types';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
  Receipt,
  Building2,
  Wallet,
  Clock,
  Layers,
  Percent,
} from 'lucide-react';

const JENIS_PEMBAYARAN_OPTIONS = [
  { value: 'dp', label: 'DP 1 (Booking & Antrian)', badge: 'Awal' },
  { value: 'termin', label: 'DP 2 (Tambahan menuju 70%)', badge: 'Produksi' },
  { value: 'pelunasan', label: 'Pelunasan Akhir (30%)', badge: 'Selesai' },
];

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

  const [pembayaranList, setPembayaranList] = useState<CustomerPayment[]>([]);

  const [isAddingPayment, setIsAddingPayment] = useState<boolean>(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [payTanggal, setPayTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payJenis, setPayJenis] = useState<'dp' | 'termin' | 'pelunasan'>('termin');
  const [payNominal, setPayNominal] = useState<number>(0);
  const [payRekening, setPayRekening] = useState<string>('Transfer BCA');
  const [payKeterangan, setPayKeterangan] = useState<string>('');

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
      setTotalInvoice(grossTagihan);
      setDiskon(currentDiskon);
      setBiayaOperasional(currentOrder.biayaOperasional || 0);
      setVendorNama(currentOrder.vendorName || 'AMRIN');
      setTotalBiayaVendor(currentOrder.totalHpp || 0);
      setDpVendor(currentOrder.totalDibayarKeVendor || 0);
      setCatatanFinance(currentOrder.catatanFinance || '');

      if (currentOrder.pembayaranList && currentOrder.pembayaranList.length > 0) {
        setPembayaranList(currentOrder.pembayaranList);
      } else if (currentOrder.totalUangMasukCustomer > 0) {
        setPembayaranList([
          {
            id: `pay-${currentOrder.id}-init`,
            orderId: currentOrder.id,
            noInv: currentOrder.noInv,
            tanggal: currentOrder.tanggalInv || currentOrder.tanggalOrder || new Date().toISOString().slice(0, 10),
            nominal: currentOrder.totalUangMasukCustomer,
            jenis: 'dp',
            keterangan: 'DP Awal (Transfer Bank BCA)',
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setPembayaranList([]);
      }
      setIsDirty(false);
    }
  }, [currentOrder]);

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

  const netInvoice = Math.max(0, totalInvoice - diskon);
  const nominalDpCustomer = useMemo(() => {
    return pembayaranList.reduce((acc, p) => acc + Number(p.nominal), 0);
  }, [pembayaranList]);

  const target70 = Math.round(0.7 * netInvoice);
  const sisaMenuju70 = Math.max(0, target70 - nominalDpCustomer);
  const isSiapProduksi = netInvoice > 0 && nominalDpCustomer >= target70;
  const dpPersenCustomer = netInvoice > 0 ? (nominalDpCustomer / netInvoice) * 100 : 0;
  const sisaPelunasanCustomer = Math.max(0, netInvoice - nominalDpCustomer);

  const sisaPembayaranVendor = Math.max(0, totalBiayaVendor - dpVendor);
  const netProfit = netInvoice - totalBiayaVendor - biayaOperasional;
  const marginPercent = netInvoice > 0 ? (netProfit / netInvoice) * 100 : 0;

  const handleStartEditPayment = (pay: CustomerPayment) => {
    setEditingPaymentId(pay.id);
    setPayTanggal(pay.tanggal);
    setPayJenis(pay.jenis);
    setPayNominal(pay.nominal);
    const parts = (pay.keterangan || '').split(' - ');
    if (parts.length > 1) {
      setPayRekening(parts[0]);
      setPayKeterangan(parts.slice(1).join(' - '));
    } else {
      setPayKeterangan(pay.keterangan || '');
    }
    setIsAddingPayment(true);
  };

  const handleSavePaymentEntry = () => {
    if (payNominal <= 0) {
      toast.error('Nominal pembayaran termin harus lebih dari Rp 0');
      return;
    }

    const ketText = payKeterangan ? `${payRekening} - ${payKeterangan}` : `${payRekening}`;

    if (editingPaymentId) {
      setPembayaranList((prev) =>
        prev.map((p) =>
          p.id === editingPaymentId
            ? {
                ...p,
                tanggal: payTanggal || new Date().toISOString().slice(0, 10),
                jenis: payJenis,
                nominal: payNominal,
                keterangan: ketText,
              }
            : p
        )
      );
      setEditingPaymentId(null);
      toast.success('Baris pembayaran termin berhasil diperbarui!');
    } else {
      const newPayment: CustomerPayment = {
        id: `pay-${Date.now()}`,
        orderId: currentOrder?.id || orderId,
        noInv: currentOrder?.noInv || '',
        tanggal: payTanggal || new Date().toISOString().slice(0, 10),
        nominal: payNominal,
        jenis: payJenis,
        keterangan: ketText,
        createdAt: new Date().toISOString(),
      };
      setPembayaranList((prev) => [...prev, newPayment]);
      toast.success(`Termin ${payJenis.toUpperCase()} sebesar ${formatRupiah(newPayment.nominal)} ditambahkan!`);
    }

    setPayNominal(0);
    setPayKeterangan('');
    setIsAddingPayment(false);
    setIsDirty(true);
  };

  const handleRemovePaymentEntry = (paymentId: string) => {
    if (editingPaymentId === paymentId) {
      setEditingPaymentId(null);
      setIsAddingPayment(false);
    }
    setPembayaranList((prev) => prev.filter((p) => p.id !== paymentId));
    setIsDirty(true);
    toast.info('Baris termin pembayaran dihapus');
  };

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

    try {
      setIsSaving(true);
      const matchedVendor = vendors.find(
        (v) => v.nama.toLowerCase() === vendorNama.toLowerCase() || v.id === vendorNama
      );
      const vendorId = matchedVendor ? matchedVendor.id : (currentOrder.vendorId || vendorNama);

      const updatedPayload: Partial<Order> = {
        grossTotal: totalInvoice,
        totalInvoice: netInvoice,
        jumlahSemua: netInvoice,
        diskon,
        diskonHarga: diskon,
        biayaOperasional,
        pembayaranList,
        dpNominal: nominalDpCustomer,
        totalUangMasukCustomer: nominalDpCustomer,
        totalHpp: totalBiayaVendor,
        totalBiayaVendor,
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
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 sm:px-5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50"
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
          {/* Left Column: Form Inputs & Termin Table */}
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

            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">2. Riwayat Mutasi Termin Pembayaran Konsumen</h2>
                    <p className="text-xs text-slate-500">
                      Daftar cicilan nyata konsumen yang otomatis tersinkron ke Master Finansial
                    </p>
                  </div>
                </div>

                {!isAddingPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPaymentId(null);
                      setPayNominal(0);
                      setPayKeterangan('');
                      setIsAddingPayment(true);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Termin Pembayaran</span>
                  </button>
                )}
              </div>

              {isAddingPayment && (
                <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-2.5">
                    <h3 className="text-xs font-bold text-teal-900">
                      {editingPaymentId ? 'Edit Termin Pembayaran' : 'Tambah Termin Pembayaran Baru'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingPayment(false);
                        setEditingPaymentId(null);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Tutup Form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Bayar</label>
                      <input
                        type="date"
                        value={payTanggal}
                        onChange={(e) => setPayTanggal(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Termin</label>
                      <CustomSelect
                        value={payJenis}
                        onValueChange={(val) => setPayJenis(val as typeof payJenis)}
                        options={JENIS_PEMBAYARAN_OPTIONS}
                        className="h-10 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                      <CurrencyInput
                        value={payNominal}
                        onValueChange={setPayNominal}
                        className="h-10 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Rekening Tujuan</label>
                      <CustomSelect
                        value={payRekening}
                        onValueChange={setPayRekening}
                        options={DEFAULT_PAYMENT_CHANNELS}
                        className="h-10 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Catatan / Bukti Referensi</label>
                    <input
                      type="text"
                      placeholder="Contoh: Transfer Bank BCA a.n PT Harapan Jaya - Ref #8271"
                      value={payKeterangan}
                      onChange={(e) => setPayKeterangan(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingPayment(false);
                        setEditingPaymentId(null);
                      }}
                      className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePaymentEntry}
                      className="inline-flex h-9 items-center rounded-xl bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                    >
                      {editingPaymentId ? 'Perbarui Baris' : 'Tambahkan Baris'}
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Card List (< 640px) */}
              <div className="sm:hidden space-y-2.5">
                {pembayaranList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                    Belum ada termin cicilan yang dicatat. Ketuk &quot;Tambah Termin Pembayaran&quot; di atas.
                  </div>
                ) : (
                  pembayaranList.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'rounded-lg px-2 py-0.5 text-[10px] font-bold border',
                            p.jenis === 'dp'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : p.jenis === 'termin'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}
                        >
                          {p.jenis === 'dp'
                            ? 'DP 1 (Booking)'
                            : p.jenis === 'termin'
                            ? 'DP 2 (70% Produksi)'
                            : 'Pelunasan Penuh'}
                        </span>
                        <span className="font-mono text-xs text-slate-500 font-medium">{p.tanggal}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-slate-600 truncate">{p.keterangan || '-'}</div>
                        <div className="font-mono text-sm font-extrabold text-slate-900 tabular-nums shrink-0">
                          {formatRupiah(p.nominal)}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => handleStartEditPayment(p)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentEntry(p.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 active:scale-[0.96] transition-transform duration-150"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">Total Uang Masuk:</span>
                  <span className="font-mono text-sm font-extrabold text-emerald-700 tabular-nums">
                    {formatRupiah(nominalDpCustomer)}
                  </span>
                </div>
              </div>

              {/* Desktop / Tablet Table (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold">TANGGAL</th>
                      <th className="px-4 py-3 font-bold">JENIS TERMIN</th>
                      <th className="px-4 py-3 font-bold">REKENING &amp; CATATAN</th>
                      <th className="px-4 py-3 font-bold text-right">NOMINAL (RP)</th>
                      <th className="px-4 py-3 font-bold text-center w-24">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {pembayaranList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                          Belum ada termin cicilan yang dicatat. Klik &quot;+ Tambah Termin Pembayaran&quot; di atas.
                        </td>
                      </tr>
                    ) : (
                      pembayaranList.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium whitespace-nowrap">{p.tanggal}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'rounded-lg px-2.5 py-0.5 text-[10px] font-bold border inline-block',
                                p.jenis === 'dp'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : p.jenis === 'termin'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              )}
                            >
                              {p.jenis === 'dp'
                                ? 'DP 1 (Booking)'
                                : p.jenis === 'termin'
                                ? 'DP 2 (70% Produksi)'
                                : 'Pelunasan Penuh'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{p.keterangan || '-'}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {formatRupiah(p.nominal)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditPayment(p)}
                                title="Edit Termin Ini"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePaymentEntry(p.id)}
                                title="Hapus Termin Ini"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">
                        Total Uang Masuk Konsumen Terkumpul:
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 font-extrabold tabular-nums">
                        {formatRupiah(nominalDpCustomer)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

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

          {/* Right Sticky Column: Production 70% Threshold, Margin Summary & Notes */}
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

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-medium">Progres Akumulasi Pembayaran</span>
                  <span className="font-mono font-bold text-slate-900">{dpPersenCustomer.toFixed(1)}%</span>
                </div>

                <div className="relative h-3.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10"
                    style={{ left: '70%' }}
                    title="Batas Minimal 70% Siap Produksi"
                  />
                  <div
                    className={cn(
                      'h-full transition-all duration-300 rounded-full',
                      isSiapProduksi ? 'bg-emerald-500' : 'bg-amber-500'
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, dpPersenCustomer))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>DP 1 (Booking)</span>
                  <span className="text-slate-700 font-semibold">&uarr; Batas 70% Produksi</span>
                  <span>100% Lunas</span>
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
                  disabled={isSaving}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50"
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
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
              >
                Tetap di Halaman
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  router.push('/');
                }}
                className="inline-flex h-9 items-center rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
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

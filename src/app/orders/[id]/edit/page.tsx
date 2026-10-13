'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebaseFinance } from '@/hooks/useFirebaseFinance';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CustomSelect } from '@/components/ui/custom-select';
import { formatRupiah, formatCompactRupiah, cn } from '@/lib/utils';
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
  Calendar,
  AlertCircle,
  HelpCircle,
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

  // Temukan order aktif
  const currentOrder = useMemo(() => {
    return orders.find((o) => o.id === orderId || o.noInv === orderId);
  }, [orders, orderId]);

  // State Form Input Finansial
  const [totalInvoice, setTotalInvoice] = useState<number>(0);
  const [diskon, setDiskon] = useState<number>(0);
  const [biayaOperasional, setBiayaOperasional] = useState<number>(0);

  // State Vendor & HPP
  const [vendorNama, setVendorNama] = useState<string>('AMRIN');
  const [totalBiayaVendor, setTotalBiayaVendor] = useState<number>(0);
  const [dpVendor, setDpVendor] = useState<number>(0);
  const [catatanFinance, setCatatanFinance] = useState<string>('');

  // Multi-termin DP payments (US-9.7 & US-9.10)
  const [pembayaranList, setPembayaranList] = useState<CustomerPayment[]>([]);

  // State untuk form input / edit baris termin
  const [isAddingPayment, setIsAddingPayment] = useState<boolean>(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [payTanggal, setPayTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payJenis, setPayJenis] = useState<'dp' | 'termin' | 'pelunasan'>('termin');
  const [payNominal, setPayNominal] = useState<number>(0);
  const [payRekening, setPayRekening] = useState<string>('Transfer BCA');
  const [payKeterangan, setPayKeterangan] = useState<string>('');

  // Dirty Form Tracking & Guard (US-9.8)
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Inisialisasi state saat currentOrder ditemukan
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

  // Daftar opsi vendor dinamis: gabungan dari DEFAULT_VENDOR_OPTIONS, koleksi vendors, dan vendorName di orders (US-9.15)
  const vendorOptions = useMemo<Array<{ value: string; label: string; badge?: string }>>(() => {
    const list: Array<{ value: string; label: string; badge?: string }> = DEFAULT_VENDOR_OPTIONS.map((v) => ({
      value: v.value,
      label: v.label,
      badge: 'badge' in v ? (v as { badge: string }).badge : undefined,
    }));

    // 1. Tambahkan dari koleksi vendors di Firestore
    vendors.forEach((v) => {
      if (v.nama && !list.some((opt) => opt.value.toLowerCase() === v.nama.toLowerCase())) {
        list.push({ value: v.nama, label: v.nama, badge: 'Mitra Aktif' });
      }
    });

    // 2. Tambahkan vendor unik yang tercatat di orders (Vendor Wisnu, LAJUWARNA, dll.)
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

    // 3. Pastikan vendor saat ini ada di list jika order memiliki vendorName khusus
    if (currentOrder?.vendorName && currentOrder.vendorName.trim() && currentOrder.vendorName !== '-') {
      if (!list.some((opt) => opt.value.toLowerCase() === currentOrder.vendorName!.toLowerCase())) {
        list.push({ value: currentOrder.vendorName, label: currentOrder.vendorName, badge: 'Saat Ini' });
      }
    }

    return list;
  }, [vendors, orders, currentOrder]);

  // Kalkulasi Finansial Realtime
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

  // Handler Termin Pembayaran
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

  // Guard Navigasi Keluar (US-9.8)
  const handleBackToFinance = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      router.push('/');
    }
  };

  // Submit Perubahan Finansial ke Firestore SSOT (US-9.7, US-9.8)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // Loading State
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
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Master Finansial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8ECF2] text-slate-900 pb-28">
      <Toaster richColors position="top-right" />

      {/* 1. Header & Breadcrumb Navigasi Eksekutif (US-9.8) */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToFinance}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Kembali ke Master Finansial"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {currentOrder.noInv}
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  Edit Finansial Order & Termin DP
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentOrder.customerName} &bull; {currentOrder.projectName || 'Proyek Garmen'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToFinance}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* 2. KARTU ALOKASI PEMBAYARAN & THRESHOLD 70% PRODUKSI (US-9.10 - VisualKainDB Standard) */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-card-double space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Percent className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Alokasi Pembayaran & Threshold 70% Produksi Vendor
                </h2>
                <p className="text-xs text-slate-400">
                  SOP Standar VisualKain: Pesanan hanya boleh naik potong/jahit vendor jika DP ≥ 70%
                </p>
              </div>
            </div>

            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-extrabold border',
                isSiapProduksi
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              )}
            >
              {isSiapProduksi ? 'Siap Produksi (≥ 70%)' : 'Menunggu DP 70%'}
            </span>
          </div>

          {/* 4-Box Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            {/* Box 1: Total Invoice */}
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-medium leading-tight">Total Nilai Tagihan</span>
              <div className="font-mono text-sm sm:text-base font-extrabold text-slate-900 mt-1 tabular-nums">
                {formatRupiah(netInvoice)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">100% Nilai Kontrak</span>
            </div>

            {/* Box 2: Terbayar Konsumen */}
            <div className="rounded-xl bg-teal-50/70 p-3 border border-teal-100/90">
              <span className="text-teal-700/80 block text-[10px] font-medium leading-tight">Sudah Dibayar Konsumen</span>
              <div className="font-mono text-sm sm:text-base font-extrabold text-teal-800 mt-1 tabular-nums">
                {formatRupiah(nominalDpCustomer)}
              </div>
              <span className="text-[10px] font-bold text-teal-700 mt-0.5 block">
                {dpPersenCustomer.toFixed(1)}% Terkumpul
              </span>
            </div>

            {/* Box 3: Target 70% Produksi */}
            <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-100/90">
              <span className="text-blue-700/80 block text-[10px] font-medium leading-tight">Target 70% Syarat Jahit</span>
              <div className="font-mono text-sm sm:text-base font-extrabold text-blue-900 mt-1 tabular-nums">
                {formatRupiah(target70)}
              </div>
              <span className="text-[10px] text-blue-600 mt-0.5 block">0.7 &times; Nilai Invoice</span>
            </div>

            {/* Box 4: Sisa Pelunasan 30% */}
            <div className="rounded-xl bg-purple-50/70 p-3 border border-purple-100/90">
              <span className="text-purple-700/80 block text-[10px] font-medium leading-tight">Sisa Pelunasan Akhir</span>
              <div className="font-mono text-sm sm:text-base font-extrabold text-purple-900 mt-1 tabular-nums">
                {formatRupiah(sisaPelunasanCustomer)}
              </div>
              <span className="text-[10px] text-purple-600 mt-0.5 block">Dibayar sebelum kirim</span>
            </div>
          </div>

          {/* Visual Progress Bar dengan Marker 70% */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Progres Akumulasi Pembayaran</span>
              <span className="font-mono font-bold text-slate-800">{dpPersenCustomer.toFixed(1)}%</span>
            </div>

            <div className="relative h-3.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              {/* Garis batas 70% */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                style={{ left: '70%' }}
                title="Batas Minimal 70% Siap Produksi"
              />
              {/* Fill progress */}
              <div
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  isSiapProduksi ? 'bg-emerald-500' : 'bg-amber-500'
                )}
                style={{ width: `${Math.min(100, Math.max(0, dpPersenCustomer))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>DP 1 (Booking)</span>
              <span className="text-slate-600 font-semibold">&uarr; Batas 70% Naik Produksi</span>
              <span>100% Lunas Penuh</span>
            </div>
          </div>

          {/* Status Alert Box (US-9.10) */}
          {isSiapProduksi ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Syarat 70% Terpenuhi:</strong> Konsumen telah melunasi{' '}
                <span className="font-mono font-bold">{formatRupiah(nominalDpCustomer)}</span> ({dpPersenCustomer.toFixed(1)}%).
                Pesanan resmi siap dinaikkan ke jadwal potong & jahit vendor konveksi. Sisa tagihan pelunasan akhir adalah{' '}
                <span className="font-mono font-bold">{formatRupiah(sisaPelunasanCustomer)}</span>.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Perhatian Jadwal Produksi:</strong> Pembayaran baru mencapai{' '}
                <span className="font-mono font-bold">{formatRupiah(nominalDpCustomer)}</span> ({dpPersenCustomer.toFixed(1)}%).
                Masih <strong className="text-rose-700">kurang {formatRupiah(sisaMenuju70)}</strong> agar pesanan memenuhi ambang batas 70% untuk dipotong dan dijahit oleh vendor.
              </div>
            </div>
          )}
        </section>

        {/* 3. FORM SECTION 1: NILAI TAGIHAN & BIAYA OPERASIONAL */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-card-double space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Receipt className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">1. Nilai Tagihan Invoice & Biaya Operasional</h3>
              <p className="text-xs text-slate-400">Atur nominal tagihan kotor, diskon, dan beban operasional proyek</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Nilai Tagihan Kotor (Rp)</label>
              <CurrencyInput
                value={totalInvoice}
                onValueChange={(val: number) => {
                  setTotalInvoice(val);
                  setIsDirty(true);
                }}
                className="h-10 text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Sebelum potongan diskon</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Diskon Konsumen (Rp)</label>
              <CurrencyInput
                value={diskon}
                onValueChange={(val: number) => {
                  setDiskon(val);
                  setIsDirty(true);
                }}
                className="h-10 text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Potongan harga resmi</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Biaya Operasional Order (Rp)</label>
              <CurrencyInput
                value={biayaOperasional}
                onValueChange={(val: number) => {
                  setBiayaOperasional(val);
                  setIsDirty(true);
                }}
                className="h-10 text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Ongkir sample, bordir film, packing</span>
            </div>
          </div>
        </section>

        {/* 4. FORM SECTION 2: RIWAYAT TERMIN PEMBAYARAN KONSUMEN (US-9.7, US-9.2) */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-card-double space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">2. Riwayat Mutasi Termin Pembayaran Konsumen</h3>
                <p className="text-xs text-slate-400">
                  Daftar cicilan nyata konsumen. Total otomatis tersinkron ke Master Finansial tanpa reload
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
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-teal-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-teal-700 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Termin Pembayaran</span>
              </button>
            )}
          </div>

          {/* Form In-line Tambah / Edit Termin */}
          {isAddingPayment && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                <h4 className="text-xs font-bold text-teal-900">
                  {editingPaymentId ? 'Edit Termin Pembayaran' : 'Tambah Termin Pembayaran Baru'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPayment(false);
                    setEditingPaymentId(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Tutup Form
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Bayar</label>
                  <input
                    type="date"
                    value={payTanggal}
                    onChange={(e) => setPayTanggal(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Termin</label>
                  <CustomSelect
                    value={payJenis}
                    onValueChange={(val) => setPayJenis(val as typeof payJenis)}
                    options={JENIS_PEMBAYARAN_OPTIONS}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                  <CurrencyInput
                    value={payNominal}
                    onValueChange={setPayNominal}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Rekening Tujuan</label>
                  <CustomSelect
                    value={payRekening}
                    onValueChange={setPayRekening}
                    options={DEFAULT_PAYMENT_CHANNELS}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Catatan / Bukti Referensi</label>
                <input
                  type="text"
                  placeholder="Contoh: Transfer Bank BCA an PT Harapan Jaya - Ref #8271"
                  value={payKeterangan}
                  onChange={(e) => setPayKeterangan(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPayment(false);
                    setEditingPaymentId(null);
                  }}
                  className="inline-flex h-8 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePaymentEntry}
                  className="inline-flex h-8 items-center rounded-xl bg-teal-600 px-3.5 text-xs font-bold text-white hover:bg-teal-700 cursor-pointer"
                >
                  {editingPaymentId ? 'Perbarui Baris' : 'Tambahkan Baris'}
                </button>
              </div>
            </div>
          )}

          {/* Tabel Daftar Baris Termin Pembayaran (Dengan Tombol Edit & Hapus - US-9.2) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5 font-bold">TANGGAL</th>
                  <th className="px-3.5 py-2.5 font-bold">JENIS TERMIN</th>
                  <th className="px-3.5 py-2.5 font-bold">REKENING & CATATAN</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">NOMINAL (RP)</th>
                  <th className="px-3.5 py-2.5 font-bold text-center w-24">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {pembayaranList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      Belum ada termin cicilan yang dicatat. Klik "+ Tambah Termin Pembayaran" di atas.
                    </td>
                  </tr>
                ) : (
                  pembayaranList.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3.5 py-2.5 font-medium whitespace-nowrap">{p.tanggal}</td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[10px] font-bold border inline-block',
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
                      <td className="px-3.5 py-2.5 text-slate-600">{p.keterangan || '-'}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiah(p.nominal)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditPayment(p)}
                            title="Edit Termin Ini"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePaymentEntry(p.id)}
                            title="Hapus Termin Ini"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                <tr>
                  <td colSpan={3} className="px-3.5 py-2.5 text-right">
                    Total Uang Masuk Konsumen Terkumpul:
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-emerald-700 font-extrabold tabular-nums">
                    {formatRupiah(nominalDpCustomer)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* 5. FORM SECTION 3: MITRA VENDOR & BIAYA POKOK HPP */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-card-double space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">3. Kewajiban Beban Pokok Mitra Vendor (HPP)</h3>
              <p className="text-xs text-slate-400">Pilih mitra konveksi pelaksana, modal HPP PO, dan dana yang telah diserahkan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mitra Vendor Konveksi</label>
              <CustomSelect
                value={vendorNama}
                onValueChange={(val) => {
                  setVendorNama(val);
                  setIsDirty(true);
                }}
                options={vendorOptions}
                className="h-10 text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Mitra pelaksana produksi</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Biaya HPP Vendor (Rp)</label>
              <CurrencyInput
                value={totalBiayaVendor}
                onValueChange={(val: number) => {
                  setTotalBiayaVendor(val);
                  setIsDirty(true);
                }}
                className="h-10 text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Pokok tagihan konveksi</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">DP Diserahkan ke Vendor (Rp)</label>
              <CurrencyInput
                value={dpVendor}
                onValueChange={(val: number) => {
                  setDpVendor(val);
                  setIsDirty(true);
                }}
                className="h-10 text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Dana nyata keluar dari kas</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Sisa Utang yang Masih Harus Dibayar ke Vendor:</span>
            <span className={cn('font-mono font-extrabold tabular-nums text-sm', sisaPembayaranVendor > 0 ? 'text-rose-600' : 'text-emerald-700')}>
              {sisaPembayaranVendor > 0 ? formatRupiah(sisaPembayaranVendor) : 'Rp 0 (LUNAS VENDOR)'}
            </span>
          </div>
        </section>

        {/* 6. FORM SECTION 4: RINGKASAN MARGIN BERSIH (TANPA PROFIT AKTUAL - US-9.11) */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-card-double space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Layers className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">4. Ringkasan Margin & Laba Bersih Proyek</h3>
              <p className="text-xs text-slate-400">Kalkulasi hak margin bersih VisualKain atas pesanan ini</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Net Invoice</span>
              <span className="font-mono font-bold text-slate-900 block mt-0.5">{formatRupiah(netInvoice)}</span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Total Modal HPP</span>
              <span className="font-mono font-bold text-slate-700 block mt-0.5">{formatRupiah(totalBiayaVendor)}</span>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
              <span className="text-emerald-700 block text-[10px] font-medium">Profit Bersih</span>
              <span className="font-mono font-extrabold text-emerald-800 block mt-0.5">{formatRupiah(netProfit)}</span>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
              <span className="text-emerald-700 block text-[10px] font-medium">Margin Bersih (%)</span>
              <span className="font-mono font-extrabold text-emerald-800 block mt-0.5">{marginPercent.toFixed(1)}%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Internal Keuangan</label>
            <textarea
              rows={2}
              placeholder="Catatan finance terkait revisi kain, toleransi DP, atau kesepakatan vendor..."
              value={catatanFinance}
              onChange={(e) => {
                setCatatanFinance(e.target.value);
                setIsDirty(true);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-teal-500 focus:outline-none placeholder-slate-400"
            />
          </div>
        </section>
      </main>

      {/* 7. STICKY ACTION BAR DI BAGIAN BAWAH (ERGONOMIS MOBILE & DESKTOP) (US-9.8) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Status Perubahan:
            </span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-bold border',
                isDirty
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              )}
            >
              {isDirty ? 'Ada Perubahan Belum Disimpan' : 'Data Tersinkron'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToFinance}
              className="inline-flex h-9.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              Batal & Kembali
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex h-9.5 items-center gap-1.5 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Finansial'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8. DIRTY FORM GUARD CONFIRMATION MODAL (US-9.8) */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
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
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Tetap di Halaman
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  router.push('/');
                }}
                className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                Buang & Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

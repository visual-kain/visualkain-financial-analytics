'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseFinance } from '@/hooks/useFirebaseFinance';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CustomSelect } from '@/components/ui/custom-select';
import { formatRupiah, formatCompactRupiah, cn } from '@/lib/utils';
import { DEFAULT_VENDOR_OPTIONS, DEFAULT_PAYMENT_CHANNELS } from '@/lib/constants';
import type { Order, VendorPayment, CashOutflowCategory } from '@/types';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  Save,
  WalletCards,
  TrendingDown,
  Building2,
  Calendar,
  CreditCard,
  Layers,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const KATEGORI_BEBAN_OPTIONS: Array<{ value: CashOutflowCategory; label: string }> = [
  { value: 'Operasional', label: 'Biaya Operasional Umum (Listrik, Sewa, Server)' },
  { value: 'Gaji/Upah', label: 'Gaji, Upah Jahit & Borongan' },
  { value: 'Marketing dan Penjualan', label: 'Marketing & Promosi (Iklan, Ads)' },
  { value: 'Logistik', label: 'Logistik & Pengiriman (Ongkir, Ekspedisi)' },
  { value: 'Keuangan', label: 'Biaya Keuangan & Administrasi Bank' },
  { value: 'Pajak', label: 'Pajak Usaha' },
  { value: 'Biaya Lain', label: 'Beban Pengeluaran Lainnya' },
];

const JENIS_BAYAR_VENDOR_OPTIONS = [
  { value: 'dp_vendor', label: 'DP Vendor (Uang Muka Mulai Potong/Jahit)', badge: 'Awal' },
  { value: 'termin_vendor', label: 'Termin Vendor (Progres Pengerjaan)', badge: 'Progres' },
  { value: 'pelunasan_vendor', label: 'Pelunasan Vendor (Pengambilan Barang)', badge: 'Selesai' },
];

export default function CashOutNewPage() {
  const router = useRouter();
  const { orders, vendors, updateOrderFinance, addKas } = useFirebaseFinance();

  // Form Mode: Beban Operasional vs Bayar Vendor
  const [entryMode, setEntryMode] = useState<'operasional' | 'vendor'>('operasional');

  // Fields Beban Operasional
  const [kategori, setKategori] = useState<CashOutflowCategory>('Operasional');

  // Fields Vendor
  const [selectedVendorNama, setSelectedVendorNama] = useState<string>('AMRIN');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [jenisBayarVendor, setJenisBayarVendor] = useState<'dp_vendor' | 'termin_vendor' | 'pelunasan_vendor'>('dp_vendor');

  // Fields Umum
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [nominal, setNominal] = useState<number>(0);
  const [sumberRekening, setSumberRekening] = useState<string>('Transfer BCA');
  const [noVoucher, setNoVoucher] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');

  // Guard & Loading State
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Dynamic Vendor Options (Gabungan DEFAULT, Firestore vendors, dan orders)
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

    return list;
  }, [vendors, orders]);

  // Selected Order Object (jika bayar vendor ditautkan ke order)
  const selectedOrder = useMemo<Order | undefined>(() => {
    if (!selectedOrderId) return undefined;
    return orders.find((o) => o.id === selectedOrderId || o.noInv === selectedOrderId);
  }, [orders, selectedOrderId]);

  // Dropdown Order Terkait Vendor Terpilih
  const orderOptionsForVendor = useMemo(() => {
    const matched = orders.filter(
      (o) =>
        o.vendorName &&
        o.vendorName.toLowerCase().trim() === selectedVendorNama.toLowerCase().trim()
    );
    return [
      { value: '', label: '-- Pilih Order / Bebas (Tidak Terikat Order) --' },
      ...matched.map((o) => {
        const sisaBayar = Math.max(0, o.totalHpp - (o.totalDibayarKeVendor || 0));
        return {
          value: o.id,
          label: `${o.noInv} - ${o.projectName || '-'} [Total HPP: ${formatCompactRupiah(o.totalHpp)}, Sisa Utang: ${formatCompactRupiah(sisaBayar)}]`,
        };
      }),
    ];
  }, [orders, selectedVendorNama]);

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      router.push('/?tab=cashout');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nominal <= 0) {
      toast.error('Nominal pengeluaran kas harus lebih dari Rp 0');
      return;
    }

    if (!keterangan.trim()) {
      toast.error('Keterangan pengeluaran wajib diisi');
      return;
    }

    try {
      setIsSaving(true);
      const voucherText = noVoucher.trim() ? `[Voucher: ${noVoucher.trim()}] ` : '';
      const ketFull = `${voucherText}${sumberRekening} - ${keterangan.trim() || (entryMode === 'vendor' ? `Bayar ${selectedVendorNama}` : kategori)}`;

      if (entryMode === 'vendor') {
        // 1. Simpan Transaksi Kas Keluar
        await addKas({
          tanggal,
          tipe: 'keluar',
          nominal,
          kategori: 'Pembayaran Vendor',
          keterangan: `Pembayaran Vendor (${selectedVendorNama})${selectedOrder ? ` untuk ${selectedOrder.noInv}` : ''}: ${ketFull}`,
        });

        // 2. Jika ditautkan ke pesanan, update akumulasi pembayaran vendor di order
        if (selectedOrder) {
          const currentDibayar = selectedOrder.totalDibayarKeVendor || 0;
          const newDibayar = currentDibayar + nominal;
          const totalHpp = selectedOrder.totalHpp || 0;

          await updateOrderFinance(selectedOrder.id, {
            totalDibayarKeVendor: newDibayar,
            statusPembayaranVendor:
              newDibayar >= totalHpp && totalHpp > 0
                ? 'lunas_vendor'
                : newDibayar > 0
                ? 'dp_vendor'
                : 'belum_bayar',
          });
        }

        toast.success(`Pengeluaran pembayaran vendor ${selectedVendorNama} berhasil dicatat!`);
      } else {
        // Beban Operasional Biasa
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
      toast.error('Gagal mencatat pengeluaran kas ke database');
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
                <span>Kas Keluar</span>
                <span>/</span>
                <span className="text-rose-700">Pencatatan Baru</span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
                Catat Pengeluaran Kas &amp; Bayar Vendor
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200">
              <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
              <span>Arus Kas Keluar</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="w-full max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Pilihan Jenis Pengeluaran */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Jenis Pengeluaran Kas</h3>
                <p className="text-xs text-slate-400">Pilih apakah kas keluar untuk operasional umum atau setoran vendor</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEntryMode('operasional');
                  setIsDirty(true);
                }}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                  entryMode === 'operasional'
                    ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm',
                  entryMode === 'operasional' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                )}>
                  <WalletCards className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">Beban Operasional &amp; Rutin</div>
                  <div className="text-[11px] text-slate-500">Gaji, sewa tempat, listrik, logistik, atk &amp; admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntryMode('vendor');
                  setIsDirty(true);
                }}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                  entryMode === 'vendor'
                    ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm',
                  entryMode === 'vendor' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                )}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">Pembayaran Mitra Vendor</div>
                  <div className="text-[11px] text-slate-500">DP vendor, termin jahit, atau pelunasan tagihan vendor</div>
                </div>
              </button>
            </div>

            {/* Sub-form: Dropdown jika Mode Operasional */}
            {entryMode === 'operasional' ? (
              <div className="pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kategori Beban Operasional <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={kategori}
                  onValueChange={(val) => {
                    setKategori(val as CashOutflowCategory);
                    setIsDirty(true);
                  }}
                  options={KATEGORI_BEBAN_OPTIONS}
                  className="w-full h-11"
                />
              </div>
            ) : (
              /* Sub-form: Detail Vendor jika Mode Vendor */
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Pilih Mitra Vendor <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                      value={selectedVendorNama}
                      onValueChange={(val) => {
                        setSelectedVendorNama(val);
                        setSelectedOrderId('');
                        setIsDirty(true);
                      }}
                      options={vendorOptions}
                      className="w-full h-11"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Jenis Pembayaran Vendor <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                      value={jenisBayarVendor}
                      onValueChange={(val) => {
                        setJenisBayarVendor(val as 'dp_vendor' | 'termin_vendor' | 'pelunasan_vendor');
                        setIsDirty(true);
                      }}
                      options={JENIS_BAYAR_VENDOR_OPTIONS}
                      className="w-full h-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tautkan ke Pesanan Tertentu (Opsional)
                  </label>
                  <CustomSelect
                    value={selectedOrderId}
                    onValueChange={(val) => {
                      setSelectedOrderId(val);
                      setIsDirty(true);
                    }}
                    options={orderOptionsForVendor}
                    className="w-full h-11"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Jika ditautkan ke pesanan, sisa utang vendor pada order terkait akan otomatis terpotong.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Rincian Transaksi Kas Keluar */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <CreditCard className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rincian Nominal &amp; Sumber Kas</h3>
                <p className="text-xs text-slate-400">Masukkan nilai pengeluaran kas dan rekening pencairan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tanggal Pengeluaran <span className="text-rose-500">*</span>
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

              {/* Nominal Pengeluaran */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
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

              {/* Sumber Rekening */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sumber Rekening Pencairan <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={sumberRekening}
                  onValueChange={(val) => {
                    setSumberRekening(val);
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

              {/* Nomor Voucher / Bukti */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
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

            {/* Keterangan Pengeluaran */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Keterangan / Rincian Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={keterangan}
                onChange={(e) => {
                  setKeterangan(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Contoh: Pembayaran DP 50% jahit seragam himpunan kemeja ke vendor Cititex..."
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
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengeluaran Kas'}</span>
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
              Anda memiliki input pengeluaran kas yang belum tersimpan ke sistem. Tinggalkan halaman ini?
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
                  router.push('/?tab=cashout');
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

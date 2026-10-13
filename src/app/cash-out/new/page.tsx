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
  CreditCard,
  Layers,
  AlertTriangle,
} from 'lucide-react';

const KATEGORI_BEBAN_OPTIONS: Array<{ value: CashOutflowCategory; label: string }> = [
  { value: 'Operasional', label: 'Biaya Operasional Umum (Listrik, Sewa, Admin)' },
  { value: 'Gaji/Upah', label: 'Gaji, Upah Jahit & Tim' },
  { value: 'Sponsorship/Sosial', label: 'Sponsorship & Kegiatan Sosial' },
  { value: 'Iklan/Marketing', label: 'Iklan & Marketing (Ads, Promosi)' },
  { value: 'Bahan Baku', label: 'Belanja Bahan Baku & Aksesoris' },
  { value: 'Perawatan Web/Sistem', label: 'Perawatan Web & Sistem IT' },
  { value: 'Transport/Ongkir', label: 'Transportasi, Kurir & Ongkir' },
  { value: 'Pajak/Retribusi', label: 'Pajak & Retribusi Usaha' },
  { value: 'Keuangan', label: 'Biaya Keuangan & Administrasi Bank' },
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

  const [entryMode, setEntryMode] = useState<'operasional' | 'vendor'>('operasional');
  const [kategori, setKategori] = useState<CashOutflowCategory>('Operasional');

  const [selectedVendorNama, setSelectedVendorNama] = useState<string>('AMRIN');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [jenisBayarVendor, setJenisBayarVendor] = useState<'dp_vendor' | 'termin_vendor' | 'pelunasan_vendor'>('dp_vendor');

  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [nominal, setNominal] = useState<number>(0);
  const [sumberRekening, setSumberRekening] = useState<string>('Transfer BCA');
  const [noVoucher, setNoVoucher] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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

  const selectedOrder = useMemo<Order | undefined>(() => {
    if (!selectedOrderId) return undefined;
    return orders.find((o) => o.id === selectedOrderId || o.noInv === selectedOrderId);
  }, [orders, selectedOrderId]);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

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
        if (selectedOrder) {
          const currentDibayar = selectedOrder.totalDibayarKeVendor || 0;
          const newDibayar = currentDibayar + nominal;
          const totalHpp = selectedOrder.totalHpp || 0;
          const existingList: VendorPayment[] = Array.isArray(selectedOrder.vendorPembayaranList)
            ? [...selectedOrder.vendorPembayaranList]
            : [];

          existingList.push({
            id: `vp-${Date.now()}`,
            vendorName: selectedVendorNama,
            tanggal,
            nominal,
            jenis: jenisBayarVendor,
            keterangan: `Pembayaran Vendor (${selectedVendorNama}) untuk ${selectedOrder.noInv}: ${ketFull}`,
            catatan: `Pembayaran Vendor (${selectedVendorNama}) untuk ${selectedOrder.noInv}: ${ketFull}`,
          });

          await updateOrderFinance(selectedOrder.id, {
            totalDibayarKeVendor: newDibayar,
            vendorPembayaranList: existingList,
            statusPembayaranVendor:
              newDibayar >= totalHpp && totalHpp > 0
                ? 'lunas_vendor'
                : newDibayar > 0
                ? 'dp_vendor'
                : 'belum_bayar',
          });
        } else {
          await addKas({
            tanggal,
            tipe: 'keluar',
            nominal,
            kategori: 'Pembayaran Vendor',
            keterangan: `Pembayaran Vendor (${selectedVendorNama}): ${ketFull}`,
          });
        }

        toast.success(`Pengeluaran pembayaran vendor ${selectedVendorNama} berhasil dicatat!`);
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
      toast.error('Gagal mencatat pengeluaran kas ke database');
    } finally {
      setIsSaving(false);
    }
  };

  const vendorDebtSummary = useMemo(() => {
    if (entryMode !== 'vendor' || !selectedOrder) return null;
    const totalHpp = selectedOrder.totalHpp || 0;
    const existingPaid = selectedOrder.totalDibayarKeVendor || 0;
    const newTotalPaid = existingPaid + nominal;
    const sisaUtang = Math.max(0, totalHpp - newTotalPaid);
    return { totalHpp, existingPaid, newTotalPaid, sisaUtang };
  }, [entryMode, selectedOrder, nominal]);

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
                <span>Kas Keluar</span>
                <span>/</span>
                <span className="text-rose-700">Pencatatan Baru</span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 truncate">
                Catat Pengeluaran Kas &amp; Bayar Vendor
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-slate-100 sm:border-t-0">
            <span
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-bold border shrink-0',
                isDirty
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              )}
            >
              {isDirty ? 'Belum Disimpan' : 'Arus Kas Keluar'}
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
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 sm:px-5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5 shrink-0" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengeluaran'}</span>
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
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <Layers className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">1. Jenis Pengeluaran Kas</h2>
                  <p className="text-xs text-slate-500">Pilih apakah kas keluar untuk operasional umum atau setoran vendor</p>
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
                    <div className="text-xs font-bold text-slate-900">Pembayaran Mitra Vendor</div>
                    <div className="text-[11px] text-slate-500">DP vendor, termin jahit, atau pelunasan tagihan vendor</div>
                  </div>
                </button>
              </div>

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
                    options={KATEGORI_BEBAN_OPTIONS}
                    className="w-full h-11"
                  />
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
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
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
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
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
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
                    <p className="text-[11px] text-slate-500 mt-1">
                      Jika ditautkan ke pesanan, sisa utang vendor pada order terkait akan otomatis terpotong.
                    </p>
                  </div>
                </div>
              )}
            </section>

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
                    options={DEFAULT_PAYMENT_CHANNELS.map((ch) => ({
                      value: ch.value,
                      label: ch.label,
                      badge: 'badge' in ch ? (ch as { badge: string }).badge : undefined,
                    }))}
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
                  placeholder="Contoh: Pembayaran DP 50% jahit seragam himpunan kemeja ke vendor Cititex..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </section>
          </div>

          {/* Right Sticky Column: Vendor Debt Simulation & Voucher Summary */}
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
                        {selectedOrder.noInv} &bull; {selectedVendorNama}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[11px] font-extrabold border shrink-0',
                      vendorDebtSummary.sisaUtang <= 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    )}
                  >
                    {vendorDebtSummary.sisaUtang <= 0 ? 'Lunas Vendor' : 'DP / Cicilan'}
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
                    <span className="text-teal-800 block text-[11px] font-medium">Total Setelah Setoran Ini</span>
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

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Jenis Pengeluaran:</span>
                  <span className="font-bold text-slate-800">
                    {entryMode === 'vendor' ? `Mitra Vendor (${selectedVendorNama})` : `Operasional (${kategori})`}
                  </span>
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
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-[0.96] transition-transform duration-150 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4 shrink-0" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengeluaran Kas'}</span>
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
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-transform duration-150 cursor-pointer"
              >
                Lanjutkan Mengisi
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  router.push('/?tab=cashout');
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

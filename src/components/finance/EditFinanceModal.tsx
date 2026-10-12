'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Pencil,
  DollarSign,
  Building,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Receipt,
  Shirt,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  DEFAULT_VENDOR_OPTIONS,
  DEFAULT_PAYMENT_CHANNELS,
} from '@/lib/constants';
import { formatRupiah } from '@/lib/utils';
import type { MasterFinanceRow, Order, CustomerPayment } from '@/types';
import { toast } from 'sonner';

interface EditFinanceModalProps {
  isOpen: boolean;
  order: MasterFinanceRow | null;
  onClose: () => void;
  onSave: (orderId: string, updatedData: Partial<Order>) => Promise<void> | void;
}

const JENIS_PEMBAYARAN_OPTIONS = [
  { value: 'dp', label: 'DP 1 (Booking & Antrian)', badge: 'Awal' },
  { value: 'termin', label: 'DP 2 (Tambahan menuju 70%)', badge: 'Produksi' },
  { value: 'pelunasan', label: 'Pelunasan Akhir (30%)', badge: 'Selesai' },
];

export function EditFinanceModal({ isOpen, order, onClose, onSave }: EditFinanceModalProps) {
  const [totalInvoice, setTotalInvoice] = useState<number>(0);
  const [diskon, setDiskon] = useState<number>(0);
  const [biayaOperasional, setBiayaOperasional] = useState<number>(0);

  // Harga per sleeve (read/edit)
  const [hargaPendek, setHargaPendek] = useState<number>(100000);
  const [hargaPanjang, setHargaPanjang] = useState<number>(110000);

  // Multi-termin DP payments
  const [pembayaranList, setPembayaranList] = useState<CustomerPayment[]>([]);

  // State untuk baris input termin baru
  const [isAddingPayment, setIsAddingPayment] = useState<boolean>(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [newPayTanggal, setNewPayTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newPayJenis, setNewPayJenis] = useState<'dp' | 'termin' | 'pelunasan'>('termin');
  const [newPayNominal, setNewPayNominal] = useState<number>(0);
  const [newPayRekening, setNewPayRekening] = useState<string>('Transfer BCA');
  const [newPayKeterangan, setNewPayKeterangan] = useState<string>('');

  // Vendor & HPP
  const [vendorNama, setVendorNama] = useState<string>('AMRIN');
  const [totalBiayaVendor, setTotalBiayaVendor] = useState<number>(0);
  const [dpVendor, setDpVendor] = useState<number>(0);
  const [catatanFinance, setCatatanFinance] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setTotalInvoice(order.totalJumlah + (order.diskon || 0));
      setDiskon(order.diskon || 0);
      setBiayaOperasional(order.biayaOperasional || 0);
      setTotalBiayaVendor(order.totalBiayaVendor || 0);
      setDpVendor(order.dpVendor || 0);
      setCatatanFinance('');

      // Inisialisasi daftar termin cicilan
      if (order.pembayaranList && order.pembayaranList.length > 0) {
        setPembayaranList(order.pembayaranList);
      } else if (order.nominalDpCustomer > 0) {
        setPembayaranList([
          {
            id: `pay-${Date.now()}`,
            orderId: order.id,
            noInv: order.noInv,
            tanggal: order.tanggalInv,
            nominal: order.nominalDpCustomer,
            jenis: 'dp',
            keterangan: 'DP Awal (Transfer Bank BCA)',
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setPembayaranList([]);
      }
      setIsAddingPayment(false);
      setEditingPaymentId(null);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // Akumulasi riil DP customer dari tabel termin
  const nominalDpCustomer = pembayaranList.reduce((acc, p) => acc + p.nominal, 0);

  // Real-time metrics
  const netInvoice = Math.max(0, totalInvoice - diskon);
  const sisaPelunasanCustomer = Math.max(0, netInvoice - nominalDpCustomer);
  const sisaPembayaranVendor = Math.max(0, totalBiayaVendor - dpVendor);
  const profitBersih = netInvoice - totalBiayaVendor - biayaOperasional;
  const profitPercent = netInvoice > 0 ? (profitBersih / netInvoice) * 100 : 0;
  const dpPersenCustomer = netInvoice > 0 ? (nominalDpCustomer / netInvoice) * 100 : 0;
  const sisaMenuju70 = Math.max(0, (0.7 * netInvoice) - nominalDpCustomer);
  const isSiapProduksi = dpPersenCustomer >= 70;

  const handleStartEditPayment = (pay: CustomerPayment) => {
    setEditingPaymentId(pay.id);
    setNewPayTanggal(pay.tanggal);
    setNewPayJenis(pay.jenis);
    setNewPayNominal(pay.nominal);
    const parts = (pay.keterangan || '').split(' - ');
    if (parts.length > 1) {
      setNewPayRekening(parts[0]);
      setNewPayKeterangan(parts.slice(1).join(' - '));
    } else {
      setNewPayKeterangan(pay.keterangan || '');
    }
    setIsAddingPayment(true);
  };

  const handleSavePaymentEntry = () => {
    if (newPayNominal <= 0) {
      toast.error('Nominal pembayaran termin harus lebih dari Rp 0');
      return;
    }

    const ketText = newPayKeterangan ? `${newPayRekening} - ${newPayKeterangan}` : `${newPayRekening}`;

    if (editingPaymentId) {
      setPembayaranList((prev) =>
        prev.map((p) =>
          p.id === editingPaymentId
            ? {
                ...p,
                tanggal: newPayTanggal || new Date().toISOString().slice(0, 10),
                jenis: newPayJenis,
                nominal: newPayNominal,
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
        orderId: order.id,
        noInv: order.noInv,
        tanggal: newPayTanggal || new Date().toISOString().slice(0, 10),
        nominal: newPayNominal,
        jenis: newPayJenis,
        keterangan: ketText,
        createdAt: new Date().toISOString(),
      };
      setPembayaranList((prev) => [...prev, newPayment]);
      toast.success(`Termin ${newPayJenis.toUpperCase()} sebesar ${formatRupiah(newPayment.nominal)} ditambahkan!`);
    }

    setNewPayNominal(0);
    setNewPayKeterangan('');
    setIsAddingPayment(false);
  };

  const handleRemovePaymentEntry = (paymentId: string) => {
    if (editingPaymentId === paymentId) {
      setEditingPaymentId(null);
      setIsAddingPayment(false);
    }
    setPembayaranList((prev) => prev.filter((p) => p.id !== paymentId));
    toast.info('Baris termin pembayaran dihapus');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (netInvoice <= 0) {
      toast.error('Nilai bersih tagihan invoice harus lebih dari Rp 0');
      return;
    }

    try {
      setIsSaving(true);
      const updatedPayload: Partial<Order> = {
        totalInvoice: netInvoice,
        diskon,
        biayaOperasional,
        pembayaranList,
        totalUangMasukCustomer: nominalDpCustomer,
        totalHpp: totalBiayaVendor,
        totalDibayarKeVendor: dpVendor,
        catatanFinance,
        statusPembayaran:
          nominalDpCustomer >= netInvoice ? 'lunas' : nominalDpCustomer > 0 ? 'parsial' : 'belum_bayar',
        statusPembayaranVendor:
          dpVendor >= totalBiayaVendor ? 'lunas_vendor' : dpVendor > 0 ? 'dp_vendor' : 'belum_bayar',
      };

      await onSave(order.id, updatedPayload);
      toast.success(`Data finansial invoice ${order.noInv} berhasil diperbarui!`);
      onClose();
    } catch {
      toast.error('Gagal menyimpan perubahan ke database');
    } finally {
      setIsSaving(false);
    }
  };

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
          className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl z-10 max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Pencil className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Edit Finansial Order — {order.noInv}
                  </h3>
                  <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700 border border-teal-200">
                    {order.namaCustomer}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Project: <strong className="text-slate-600">{order.namaProject}</strong> &bull; Metodologi Pencatatan Multi-Termin DP & SOP 70% Produksi
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Scrollable Body */}
          <form id="edit-finance-form" onSubmit={handleSubmit} className="mt-4 space-y-5 overflow-y-auto pr-1 flex-1">
            {/* Read-Only Context Badges (Produksi & Volume) */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-bold text-slate-700">
                <Shirt className="h-3.5 w-3.5 text-teal-600" />
                Spesifikasi Garmen:
              </span>
              <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-slate-700 border border-slate-200">
                Total Qty: {order.totalQty} pcs
              </span>
              <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-slate-700 border border-slate-200">
                Bahan: COTTON COMBED 30S
              </span>
              <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-slate-700 border border-slate-200">
                Warna: Hitam
              </span>
              <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-slate-700 border border-slate-200">
                Metode: Sablon Manual
              </span>
              <span className="text-[10px] text-slate-400 ml-auto italic">
                Data produksi terkunci (Read-Only)
              </span>
            </div>

            {/* Section 1: Penetapan Harga Jual & Tagihan Konsumen */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-teal-600" />
                  1. Penetapan Harga Jual & Tagihan Konsumen
                </span>
                <span className="text-xs font-bold font-mono text-slate-800">
                  Tagihan Bersih: {formatRupiah(netInvoice)}
                </span>
              </div>

              {/* Grid 4 Kolom dengan Label Height Terkunci agar Input Sejajar Sempurna */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="h-8 flex items-end pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Harga Jual Pendek (Rp)
                  </label>
                  <CurrencyInput
                    value={hargaPendek}
                    onValueChange={setHargaPendek}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="h-8 flex items-end pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Harga Jual Panjang (Rp)
                  </label>
                  <CurrencyInput
                    value={hargaPanjang}
                    onValueChange={setHargaPanjang}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="h-8 flex items-end pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Total Nilai Tagihan (Rp)
                  </label>
                  <CurrencyInput
                    value={totalInvoice}
                    onValueChange={setTotalInvoice}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="h-8 flex items-end pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Diskon Pesanan (Rp)
                  </label>
                  <CurrencyInput
                    value={diskon}
                    onValueChange={setDiskon}
                    placeholder="0"
                    className="text-rose-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Riwayat Pencatatan Pembayaran Bertahap (Multi-Termin DP) */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-teal-100 pb-2.5 mb-3 gap-2">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-teal-700" />
                    2. Riwayat Pembayaran Termin Customer (DP 1, DP 2 & Pelunasan)
                  </span>
                  <p className="text-[11px] text-teal-700 mt-0.5">
                    Total Masuk: <strong className="font-mono">{formatRupiah(nominalDpCustomer)}</strong> ({dpPersenCustomer.toFixed(1)}%)
                  </p>
                </div>

                {/* Status Badge Threshold */}
                <div>
                  {dpPersenCustomer >= 100 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Lunas 100% (Siap Kirim)
                    </span>
                  ) : isSiapProduksi ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                      DP 2 ({dpPersenCustomer.toFixed(1)}% &bull; Siap Produksi Potong/Jahit)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      DP 1 Parsial &bull; Kurang {formatRupiah(sisaMenuju70)} menuju 70%
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-Tabel Daftar Termin */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="px-3 py-2">Tanggal</th>
                      <th className="px-3 py-2">Jenis Termin</th>
                      <th className="px-3 py-2">Keterangan / Rekening</th>
                      <th className="px-3 py-2 text-right">Nominal (Rp)</th>
                      <th className="px-2 py-2 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pembayaranList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400">
                          Belum ada catatan pembayaran DP yang masuk.
                        </td>
                      </tr>
                    ) : (
                      pembayaranList.map((pay, idx) => (
                        <tr key={pay.id || idx} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2.5 font-mono text-slate-700">{pay.tanggal}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                pay.jenis === 'pelunasan'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : pay.jenis === 'termin'
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {pay.jenis === 'pelunasan' ? 'Pelunasan 30%' : pay.jenis === 'termin' ? 'DP 2 (Tambahan)' : 'DP 1 (Awal)'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">{pay.keterangan || '-'}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-teal-700 tabular-num">
                            {formatRupiah(pay.nominal)}
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditPayment(pay)}
                                title="Edit baris pembayaran ini"
                                className="text-slate-400 hover:text-teal-600 transition-colors p-1 active:scale-95"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePaymentEntry(pay.id)}
                                title="Hapus baris pembayaran ini"
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1 active:scale-95"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Form Tambah / Edit Termin (Expandable) */}
              {isAddingPayment ? (
                <div className="mt-3 rounded-xl border border-teal-200 bg-white p-3 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[11px] font-bold text-teal-900">
                      {editingPaymentId ? 'Edit Cicilan / Termin Pembayaran' : 'Form Input Cicilan / Termin Pembayaran Baru'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingPayment(false);
                        setEditingPaymentId(null);
                        setNewPayNominal(0);
                        setNewPayKeterangan('');
                      }}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                    <div>
                      <label className="h-6 flex items-end pb-0.5 text-[10px] font-bold text-slate-500">Tanggal</label>
                      <input
                        type="date"
                        value={newPayTanggal}
                        onChange={(e) => setNewPayTanggal(e.target.value)}
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="h-6 flex items-end pb-0.5 text-[10px] font-bold text-slate-500">Jenis Termin</label>
                      <CustomSelect
                        value={newPayJenis}
                        onValueChange={(val) => setNewPayJenis(val as typeof newPayJenis)}
                        options={JENIS_PEMBAYARAN_OPTIONS}
                        className="h-9 w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="h-6 flex items-end pb-0.5 text-[10px] font-bold text-slate-500">Metode / Bank</label>
                      <CustomSelect
                        value={newPayRekening}
                        onValueChange={setNewPayRekening}
                        options={DEFAULT_PAYMENT_CHANNELS}
                        className="h-9 w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="h-6 flex items-end pb-0.5 text-[10px] font-bold text-slate-500">Nominal (Rp)</label>
                      <CurrencyInput
                        value={newPayNominal}
                        onValueChange={setNewPayNominal}
                        placeholder="0"
                        className="h-9 text-teal-700"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Catatan tambahan (cth: Bukti transfer via m-Banking BCA)"
                      value={newPayKeterangan}
                      onChange={(e) => setNewPayKeterangan(e.target.value)}
                      className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSavePaymentEntry}
                      className="h-9 px-4 rounded-xl bg-teal-600 text-xs font-bold text-white hover:bg-teal-700 active:scale-95 transition-all shadow-sm"
                    >
                      {editingPaymentId ? 'Simpan Perubahan' : 'Simpan Baris Termin'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPaymentId(null);
                      setNewPayNominal(0);
                      setNewPayKeterangan('');
                      setIsAddingPayment(true);
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-teal-300 bg-white px-3.5 py-2 text-xs font-bold text-teal-700 shadow-sm hover:bg-teal-50 active:scale-95 transition-all"
                  >
                    <Plus className="h-4 w-4 text-teal-600" />
                    <span>Catat Pembayaran Baru (DP 1 / DP 2 / Pelunasan)</span>
                  </button>

                  <span className="text-xs text-slate-500">
                    Sisa Pelunasan: <strong className="text-amber-700 font-mono font-bold">{formatRupiah(sisaPelunasanCustomer)}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Section 3: Komitmen Mitra Vendor & Biaya Pokok (HPP) */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-blue-600" />
                  3. Komitmen Mitra Vendor & Biaya Pokok (HPP)
                </span>
                <span className="text-[11px] text-slate-500">
                  Sisa Utang Vendor: <strong className="text-rose-600 font-mono">{formatRupiah(sisaPembayaranVendor)}</strong>
                </span>
              </div>

              {/* Grid 3 Kolom dengan Label Sejajar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="h-8 flex items-end pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Mitra Vendor
                  </label>
                  <CustomSelect
                    value={vendorNama}
                    onValueChange={setVendorNama}
                    options={DEFAULT_VENDOR_OPTIONS}
                    className="h-10 w-full"
                  />
                </div>

                <div>
                  <label className="h-8 flex items-end pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Total HPP Vendor (Rp)
                  </label>
                  <CurrencyInput
                    value={totalBiayaVendor}
                    onValueChange={setTotalBiayaVendor}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="h-8 flex items-end pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Kas Keluar ke Vendor (Rp)
                  </label>
                  <CurrencyInput
                    value={dpVendor}
                    onValueChange={setDpVendor}
                    placeholder="0"
                    className="text-blue-700"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Biaya Operasional & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="h-8 flex items-end pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Biaya Operasional Invoice (Rp)
                </label>
                <CurrencyInput
                  value={biayaOperasional}
                  onValueChange={setBiayaOperasional}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="h-8 flex items-end pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Catatan Rekonsiliasi Finance
                </label>
                <input
                  type="text"
                  placeholder="Catatan pelunasan, revisi sablon, dll."
                  value={catatanFinance}
                  onChange={(e) => setCatatanFinance(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            {/* Live Margin & Profit Calculation Card */}
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Kalkulasi Profit & Margin Bersih Real-Time
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-emerald-700 font-mono tabular-num">
                      {formatRupiah(profitBersih)}
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      Margin: {profitPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  <p>Formula: Tagihan Bersih ({formatRupiah(netInvoice)})</p>
                  <p>- HPP Vendor ({formatRupiah(totalBiayaVendor)}) - OpEx ({formatRupiah(biayaOperasional)})</p>
                </div>
              </div>
            </div>
          </form>

          {/* Sticky Footer Action Buttons (Pin at bottom, always accessible) */}
          <div className="border-t border-slate-100 bg-white pt-3 mt-1 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              form="edit-finance-form"
              disabled={isSaving}
              className="min-h-[44px] flex-1 sm:flex-none rounded-xl bg-teal-600 px-6 text-xs font-bold text-white shadow-md hover:bg-teal-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan Finansial'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

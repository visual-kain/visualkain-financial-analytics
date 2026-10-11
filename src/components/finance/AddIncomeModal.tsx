'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlusCircle, Building, Calendar, DollarSign, FileText } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { REKENING_OPTIONS } from '@/lib/constants';
import type { CashTransaction } from '@/types';
import { toast } from 'sonner';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIncome: (tx: CashTransaction) => void;
}

const KATEGORI_OPTIONS = [
  { value: 'Modal Tambahan / Setoran Pemilik', label: 'Modal Tambahan / Setoran Pemilik' },
  { value: 'Penyesuaian Saldo Awal Bank BCA', label: 'Penyesuaian Saldo Awal Rekening BCA' },
  { value: 'Pendapatan Non-Project / Jasa Lain', label: 'Pendapatan Non-Project / Jasa Lain' },
  { value: 'Refund / Cashback Vendor', label: 'Refund / Cashback Kelebihan Bayar Vendor' },
];

export function AddIncomeModal({ isOpen, onClose, onAddIncome }: AddIncomeModalProps) {
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kategori, setKategori] = useState<string>('Modal Tambahan / Setoran Pemilik');
  const [nominal, setNominal] = useState<number>(0);
  const [keterangan, setKeterangan] = useState('');
  const [rekening, setRekening] = useState('bca');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || nominal <= 0) {
      toast.error('Nominal pemasukan harus lebih dari Rp 0');
      return;
    }
    if (!keterangan.trim()) {
      toast.error('Mohon isi keterangan sumber pemasukan');
      return;
    }

    const rekeningLabel = REKENING_OPTIONS.find((r) => r.value === rekening)?.label.split(' - ')[0] || 'BCA';

    const newTx: CashTransaction = {
      id: `in-${Date.now()}`,
      tanggal,
      tipe: 'masuk',
      nominal,
      kategori: 'Saldo Awal',
      keterangan: `[${kategori}] ${keterangan} (${rekeningLabel})`,
    };

    onAddIncome(newTx);
    toast.success(`Pemasukan kas Rp ${nominal.toLocaleString('id-ID')} berhasil dicatat ke Kas Riil!`);
    onClose();
    setNominal(0);
    setKeterangan('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <PlusCircle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Tambah Pemasukan Kas Baru
                </h3>
                <p className="text-xs text-slate-400">
                  Pencatatan modal disetor, penyesuaian rekening, atau penerimaan non-invoice
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  Tanggal Penerimaan
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Building className="h-3 w-3 text-slate-400" />
                  Rekening Penerima
                </label>
                <CustomSelect
                  value={rekening}
                  onValueChange={setRekening}
                  options={REKENING_OPTIONS}
                  className="mt-1 h-10 w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                Kategori Pemasukan
              </label>
              <CustomSelect
                value={kategori}
                onValueChange={setKategori}
                options={KATEGORI_OPTIONS}
                className="mt-1 h-10 w-full"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-slate-400" />
                Nominal Pemasukan (Rp)
              </label>
              <CurrencyInput
                value={nominal}
                onValueChange={setNominal}
                placeholder="0"
                className="mt-1 h-11 w-full text-base font-bold text-teal-700"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-slate-400" />
                Keterangan / Berita Acara
              </label>
              <input
                type="text"
                placeholder="Contoh: Tambahan modal likuiditas awal bulan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-xl px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white shadow-md hover:bg-teal-700 active:scale-95 transition-all"
              >
                Simpan Pemasukan Kas
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

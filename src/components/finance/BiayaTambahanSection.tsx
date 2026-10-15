'use client';

import React, { useEffect, useId, useState } from 'react';
import { ListPlus, Pencil, Trash2 } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CustomSelect } from '@/components/ui/custom-select';
import { formatRupiah, cn } from '@/lib/utils';
import { BIAYA_TAMBAHAN_SUMBER_OPTIONS, summarizeBiayaTambahan } from '@/lib/biaya-tambahan';
import type { BiayaTambahanItem, BiayaTambahanSumber } from '@/types';

interface BiayaTambahanSectionProps {
  items: BiayaTambahanItem[];
  onChange: (items: BiayaTambahanItem[]) => void;
  onPendingChange?: (hasPending: boolean) => void;
}

const SUMBER_TONE: Record<BiayaTambahanSumber, string> = {
  customer: 'bg-teal-50 border-teal-200 text-teal-800',
  vendor: 'bg-blue-50 border-blue-200 text-blue-800',
  lainnya: 'bg-amber-50 border-amber-200 text-amber-800',
};

function sumberLabel(sumber: BiayaTambahanSumber): string {
  return BIAYA_TAMBAHAN_SUMBER_OPTIONS.find((o) => o.value === sumber)?.label ?? sumber;
}

export function BiayaTambahanSection({ items, onChange, onPendingChange }: BiayaTambahanSectionProps) {
  const uid = useId();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState(0);
  const [sumber, setSumber] = useState<BiayaTambahanSumber>('customer');

  const summary = summarizeBiayaTambahan(items);
  const canSubmit = keterangan.trim().length > 0 && nominal > 0;
  const sumberHint = BIAYA_TAMBAHAN_SUMBER_OPTIONS.find((o) => o.value === sumber)?.hint;
  const hasPending = keterangan.trim().length > 0 || nominal > 0;

  useEffect(() => {
    onPendingChange?.(hasPending);
  }, [hasPending, onPendingChange]);

  const reset = () => {
    setEditingId(null);
    setKeterangan('');
    setNominal(0);
    setSumber('customer');
  };

  const submit = () => {
    if (!canSubmit) return;
    const item: BiayaTambahanItem = {
      id: editingId ?? `bt-${Date.now()}`,
      keterangan: keterangan.trim(),
      nominal,
      sumber,
    };
    onChange(editingId ? items.map((i) => (i.id === editingId ? item : i)) : [...items, item]);
    reset();
  };

  const startEdit = (item: BiayaTambahanItem) => {
    setEditingId(item.id);
    setKeterangan(item.keterangan);
    setNominal(item.nominal);
    setSumber(item.sumber);
  };

  const remove = (id: string) => {
    if (editingId === id) reset();
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card-double space-y-5">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
          <ListPlus className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-slate-900">2. Rincian Biaya Tambahan</h2>
          <p className="text-xs text-slate-500">Catat setiap biaya tambahan beserta asalnya: customer, vendor, atau lainnya</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        {(['customer', 'vendor', 'lainnya'] as const).map((key) => (
          <div key={key} className={cn('rounded-xl border p-3', SUMBER_TONE[key])}>
            <span className="block text-[11px] leading-tight opacity-90">{sumberLabel(key)}</span>
            <div className="mt-1 font-mono text-sm font-extrabold tabular-nums">{formatRupiah(summary[key])}</div>
            <span className="text-[10px] opacity-80">
              {key === 'customer' ? 'Menambah tagihan' : key === 'vendor' ? 'Menambah HPP' : 'Menambah biaya operasional'}
            </span>
          </div>
        ))}
        <div
          className={cn(
            'rounded-xl border p-3',
            summary.selisih < 0 ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          )}
        >
          <span className="block text-[11px] leading-tight opacity-90">Selisih untuk VisualKain</span>
          <div className="mt-1 font-mono text-sm font-extrabold tabular-nums">{formatRupiah(summary.selisih)}</div>
          <span className="text-[10px] opacity-80">Customer − vendor − lainnya</span>
        </div>
      </div>

      <div
        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
            e.preventDefault();
            submit();
          }
        }}
      >
        <h3 className="text-xs font-bold text-slate-900">{editingId ? 'Edit Biaya Tambahan' : 'Tambah Biaya Tambahan'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label htmlFor={`${uid}-ket`} className="block text-[11px] font-bold text-slate-700 mb-1">Keterangan</label>
            <input
              id={`${uid}-ket`}
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Bordir nama dada"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div>
            <label htmlFor={`${uid}-nom`} className="block text-[11px] font-bold text-slate-700 mb-1">Nominal (Rp)</label>
            <CurrencyInput id={`${uid}-nom`} value={nominal} onValueChange={setNominal} placeholder="Rp 0" className="h-11 text-sm font-bold font-mono" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-700 mb-1">Asal Biaya</span>
            <CustomSelect
              value={sumber}
              onValueChange={(v) => setSumber(v as BiayaTambahanSumber)}
              options={BIAYA_TAMBAHAN_SUMBER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              className="h-11 w-full"
            />
          </div>
        </div>
        {sumberHint && <p className="text-[11px] text-slate-500">{sumberHint}</p>}
        <div className="flex items-center justify-end gap-2">
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal edit
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex h-10 items-center rounded-xl bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {editingId ? 'Perbarui biaya' : 'Tambahkan biaya'}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">
          Belum ada biaya tambahan untuk pesanan ini.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn('flex flex-col gap-2 px-3.5 py-2.5 text-xs sm:flex-row sm:items-center', editingId === item.id && 'bg-amber-50/60')}
            >
              {/* Keterangan dan nominal dipisah baris di mobile; dalam satu baris flex-wrap, teks basis-0 menyusut hingga pecah per huruf. */}
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <span className={cn('rounded-md border px-1.5 py-0.5 text-[10px] font-bold shrink-0', SUMBER_TONE[item.sumber])}>
                  {sumberLabel(item.sumber)}
                </span>
                <span className="min-w-0 flex-1 font-semibold text-slate-800 break-words">{item.keterangan}</span>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                <span className="font-mono font-bold text-slate-900 tabular-nums">{formatRupiah(item.nominal)}</span>
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    aria-label={`Edit ${item.keterangan}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={`Hapus ${item.keterangan}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

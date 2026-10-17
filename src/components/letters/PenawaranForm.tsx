'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import type { PenawaranFormState, PenawaranItem } from '@/lib/letters';
import { cn, formatRupiah } from '@/lib/utils';
import { FIELD_GRID, FIELD_SPAN, FormSection, INPUT_CLASS, READONLY_INPUT_CLASS, TextAreaField, TextField } from './fields';

type ItemField = 'desc' | 'satuan' | 'qty' | 'harga';

interface PenawaranFormProps {
  form: PenawaranFormState;
  items: PenawaranItem[];
  onChange: (patch: Partial<PenawaranFormState>) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: ItemField, value: string | number) => void;
}

// Tabel butuh sekitar 680px agar header tidak terpecah per huruf; di bawah itu tiap item tampil sebagai kartu.
const TABLE_MIN_WIDTH = 680;

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

const CELL_INPUT = 'h-10 text-xs';
const LABEL_CLASS = 'block text-[11px] font-bold text-slate-600';

export function PenawaranForm({ form, items, onChange, onAddItem, onRemoveItem, onUpdateItem }: PenawaranFormProps) {
  const [itemsRef, itemsWidth] = useElementWidth<HTMLDivElement>();
  const asTable = itemsWidth >= TABLE_MIN_WIDTH;
  const saved = Boolean(form.noPenawaran);
  const uid = useId();
  const lastDescId = `${uid}-desc-${items.length - 1}`;
  const shouldFocusLast = useRef(false);

  useEffect(() => {
    if (!shouldFocusLast.current) return;
    shouldFocusLast.current = false;
    document.getElementById(lastDescId)?.focus();
  }, [items.length, lastDescId]);

  const addItem = () => {
    shouldFocusLast.current = true;
    onAddItem();
  };

  const canRemove = items.length > 1;
  const removeTitle = canRemove ? 'Hapus baris' : 'Minimal satu baris';

  return (
    <>
      <FormSection title="Informasi Dokumen">
        <div className={FIELD_GRID}>
          <TextField
            label="No. Penawaran"
            value={form.noPenawaran || 'Otomatis saat disimpan'}
            readOnly
            aria-readonly="true"
            inputClassName={cn(READONLY_INPUT_CLASS, !saved && 'font-normal italic text-slate-500')}
          />
          <TextField label="Tanggal" type="date" value={form.tanggal} onChange={(e) => onChange({ tanggal: e.target.value })} />
          <TextField
            label="Perihal"
            className={FIELD_SPAN}
            value={form.perihal}
            onChange={(e) => onChange({ perihal: e.target.value })}
            placeholder="Cth: Penawaran Harga Seragam Kantor"
          />
        </div>
      </FormSection>

      <FormSection title="Kepada Yth.">
        <div className={FIELD_GRID}>
          <TextField
            label="Nama Perusahaan"
            value={form.perusahaan}
            onChange={(e) => onChange({ perusahaan: e.target.value })}
            placeholder="PT. Contoh Perusahaan"
          />
          <TextField label="Contact Person" value={form.cp} onChange={(e) => onChange({ cp: e.target.value })} placeholder="Nama PIC" />
          <TextField
            label="Alamat"
            value={form.alamat}
            onChange={(e) => onChange({ alamat: e.target.value })}
            placeholder="Alamat lengkap perusahaan"
          />
          <TextField
            label="Telepon / Email"
            value={form.telpEmail}
            onChange={(e) => onChange({ telpEmail: e.target.value })}
            placeholder="081xxx / email@company.com"
          />
        </div>
      </FormSection>

      <FormSection
        title="Daftar Barang / Jasa"
        action={
          <Button variant="outline" size="sm" onClick={addItem} className="h-11 text-[11px] sm:h-9">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Tambah baris
          </Button>
        }
      >
        <div ref={itemsRef}>
          {asTable ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full table-fixed border-collapse text-xs">
                <caption className="sr-only">Daftar barang atau jasa</caption>
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="w-9 px-2 py-2 text-center">No</th>
                    <th scope="col" className="px-2 py-2 text-left">Deskripsi</th>
                    <th scope="col" className="w-16 px-2 py-2 text-left">Qty</th>
                    <th scope="col" className="w-20 px-2 py-2 text-left">Satuan</th>
                    <th scope="col" className="w-32 whitespace-nowrap px-2 py-2 text-left">Harga Satuan</th>
                    <th scope="col" className="w-32 px-2 py-2 text-right">Jumlah</th>
                    <th scope="col" className="w-11 px-1 py-2"><span className="sr-only">Hapus</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={index} className="align-top">
                      <td className="px-2 py-2 pt-3 text-center font-bold tabular-nums text-slate-500">{item.no}</td>
                      <td className="px-1.5 py-1.5">
                        <input
                          id={`${uid}-desc-${index}`}
                          aria-label={`Deskripsi baris ${item.no}`}
                          type="text"
                          value={item.desc}
                          onChange={(e) => onUpdateItem(index, 'desc', e.target.value)}
                          placeholder="Cth: Kaos Polo Hitam"
                          className={cn(INPUT_CLASS, CELL_INPUT)}
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <input
                          aria-label={`Qty baris ${item.no}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={item.qty || ''}
                          onChange={(e) => onUpdateItem(index, 'qty', Number(e.target.value) || 0)}
                          placeholder="0"
                          className={cn(INPUT_CLASS, CELL_INPUT, 'tabular-nums')}
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <input
                          aria-label={`Satuan baris ${item.no}`}
                          type="text"
                          value={item.satuan}
                          onChange={(e) => onUpdateItem(index, 'satuan', e.target.value)}
                          placeholder="pcs"
                          className={cn(INPUT_CLASS, CELL_INPUT)}
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <label htmlFor={`${uid}-harga-${index}`} className="sr-only">
                          Harga satuan baris {item.no}
                        </label>
                        <CurrencyInput
                          id={`${uid}-harga-${index}`}
                          value={item.harga || ''}
                          onValueChange={(v) => onUpdateItem(index, 'harga', v)}
                          placeholder="Rp 0"
                        />
                      </td>
                      <td className="px-2 py-2 pt-3 text-right font-bold tabular-nums text-slate-800">{formatRupiah(item.jumlah)}</td>
                      <td className="px-1 py-1">
                        <RemoveButton disabled={!canRemove} title={removeTitle} label={`Hapus baris ${item.no}`} onClick={() => onRemoveItem(index)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item, index) => (
                <li key={index} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-teal-600 px-2 text-xs font-bold text-white tabular-nums">
                      {item.no}
                    </span>
                    <RemoveButton disabled={!canRemove} title={removeTitle} label={`Hapus baris ${item.no}`} onClick={() => onRemoveItem(index)} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`${uid}-desc-${index}`} className={LABEL_CLASS}>
                      Deskripsi
                    </label>
                    <input
                      id={`${uid}-desc-${index}`}
                      type="text"
                      value={item.desc}
                      onChange={(e) => onUpdateItem(index, 'desc', e.target.value)}
                      placeholder="Cth: Kaos Polo Hitam Lengan Pendek"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor={`${uid}-qty-${index}`} className={LABEL_CLASS}>
                        Qty
                      </label>
                      <input
                        id={`${uid}-qty-${index}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={item.qty || ''}
                        onChange={(e) => onUpdateItem(index, 'qty', Number(e.target.value) || 0)}
                        placeholder="0"
                        className={cn(INPUT_CLASS, 'tabular-nums')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`${uid}-satuan-${index}`} className={LABEL_CLASS}>
                        Satuan
                      </label>
                      <input
                        id={`${uid}-satuan-${index}`}
                        type="text"
                        value={item.satuan}
                        onChange={(e) => onUpdateItem(index, 'satuan', e.target.value)}
                        placeholder="pcs"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor={`${uid}-harga-${index}`} className={LABEL_CLASS}>
                        Harga Satuan
                      </label>
                      <CurrencyInput
                        id={`${uid}-harga-${index}`}
                        value={item.harga || ''}
                        onValueChange={(v) => onUpdateItem(index, 'harga', v)}
                        className="h-11 text-base sm:h-10 sm:text-xs"
                        placeholder="Rp 0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className={LABEL_CLASS}>Jumlah</span>
                      <div className="flex h-11 items-center justify-end rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs font-bold tabular-nums text-slate-800 sm:h-10">
                        {formatRupiah(item.jumlah)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-[11px] leading-snug text-slate-500">Jumlah dihitung otomatis dari Qty x Harga Satuan. Penawaran ini tidak mencetak grand total.</p>
      </FormSection>

      <FormSection title="Catatan & Syarat Pembayaran">
        <TextAreaField
          label="Catatan"
          rows={4}
          value={form.catatan}
          onChange={(e) => onChange({ catatan: e.target.value })}
          placeholder="Cth: Pembayaran DP 50% setelah PO, pelunasan setelah barang selesai. Harga berlaku 30 hari."
          hint="Setiap baris menjadi satu baris catatan di kertas."
        />
      </FormSection>
    </>
  );
}

function RemoveButton({ disabled, title, label, onClick }: { disabled: boolean; title: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}

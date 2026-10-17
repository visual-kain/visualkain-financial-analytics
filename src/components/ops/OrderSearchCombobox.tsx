'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { formatDate, timestampToDate } from '@/lib/legacy/formatters';
import type { LegacyOrder } from '@/lib/legacy/types';
import { cn } from '@/lib/utils';

interface OrderSearchComboboxProps {
  orders: LegacyOrder[];
  selected: LegacyOrder | undefined;
  onSelect: (order: LegacyOrder | undefined) => void;
  placeholder?: string;
}

/** Pencarian order seperti `visualkaindb` invoice/PO: 4 terbaru saat kosong, maksimal 10 hasil. */
export function filterOrdersForSearch(orders: LegacyOrder[], term: string): LegacyOrder[] {
  const q = term.trim().toLowerCase();
  if (!q) return orders.slice(0, 4);
  return orders
    .filter((o) =>
      [o.noInv, o.namaCustomer, o.namaProject, o.jenisMetodeProduksi].some((v) => String(v || '').toLowerCase().includes(q))
    )
    .slice(0, 10);
}

export function OrderSearchCombobox({ orders, selected, onSelect, placeholder = 'Cari No. Invoice, customer, project...' }: OrderSearchComboboxProps) {
  const uid = useId();
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => filterOrdersForSearch(orders, term), [orders, term]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => setHighlight(0), [term]);

  const choose = (order: LegacyOrder) => {
    onSelect(order);
    setTerm('');
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label htmlFor={`${uid}-input`} className="sr-only">
        Pilih order
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={`${uid}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setHighlight((h) => Math.min(h + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter' && open && results[highlight]) {
              e.preventDefault();
              choose(results[highlight]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={selected ? `${selected.noInv} - ${selected.namaCustomer}` : placeholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-base font-semibold text-slate-800 sm:text-xs placeholder-slate-500 shadow-2xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:h-10"
        />
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            aria-label="Hapus pilihan order"
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div
          id={`${uid}-list`}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl"
        >
          {!term.trim() && (
            <div className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Rekomendasi Terbaru</div>
          )}
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-slate-500">Tidak ada order yang cocok.</div>
          ) : (
            results.map((o, idx) => {
              const created = timestampToDate(o.createdAt);
              return (
                <button
                  key={o.id}
                  type="button"
                  role="option"
                  aria-selected={idx === highlight}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => choose(o)}
                  className={cn(
                    'flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left',
                    idx === highlight ? 'bg-teal-50' : 'hover:bg-slate-50'
                  )}
                >
                  <span className="text-xs font-bold text-slate-900">
                    <span className="text-teal-700">{o.noInv}</span> - {o.namaCustomer}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {o.namaProject || '-'} &bull; {created ? formatDate(created) : '-'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

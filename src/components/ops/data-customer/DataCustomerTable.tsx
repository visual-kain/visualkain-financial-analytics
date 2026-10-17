'use client';

import React from 'react';
import { FileText, Pencil, Shirt, Trash2 } from 'lucide-react';
import { AccImageThumb } from '@/components/ops/AccImageThumb';
import { OrderStatusBadge } from '@/components/ops/OrderStatusBadge';
import { Shimmer } from '@/components/ui/shimmer';
import { formatDateTime, formatRelativeTime } from '@/lib/legacy/formatters';
import { formatShortIsoDate, isDeadlineOverdue, type DataCustomerRow } from '@/lib/data-customer';
import { cn } from '@/lib/utils';

export interface DataCustomerActions {
  onOpen: (row: DataCustomerRow) => void;
  onEdit: (row: DataCustomerRow) => void;
  onTechpack: (row: DataCustomerRow) => void;
  onInvoice: (row: DataCustomerRow) => void;
  onDelete: (row: DataCustomerRow) => void;
}

interface DataCustomerTableProps extends DataCustomerActions {
  rows: DataCustomerRow[];
  loading: boolean;
  selectedId: string | null;
  onHover: (row: DataCustomerRow) => void;
  today: string;
  emptyState: React.ReactNode;
}

const TH = 'border-b border-slate-200 bg-slate-100 px-1.5 py-2 text-left align-bottom text-[9px] font-bold uppercase leading-tight text-slate-600 break-normal';
const TD = 'border-b border-slate-100 px-1.5 py-2.5 align-top';
const TEXT = 'whitespace-normal break-words hyphens-auto leading-snug';
const NUM = 'text-center font-mono tabular-nums font-semibold text-slate-800';

/**
 * Lebar dasar tiap kolom. Tabel memakai table-fixed selebar layar: bila layar lebih lebar, sisa ruang dibagi
 * proporsional; di bawah total lebar ini baru muncul scroll horizontal (feedback klien 17 Okt 2026, K-33).
 */
const COLS = [66, 84, 84, 58, 62, 56, 60, 44, 52, 38, 44, 44, 44, 44, 44, 60, 44, 90, 68];
const STATUS_RIGHT = COLS[COLS.length - 1];

/** Kolom sesuai screenshot klien ke-1 + STATUS (K-12); teks turun baris di lebar kolom tetap (K-6). */
export function DataCustomerTable({ rows, loading, selectedId, onHover, today, emptyState, ...actions }: DataCustomerTableProps) {
  return (
    <div className="max-h-[calc(100vh-280px)] min-h-[320px] overflow-auto">
      <table
        className="w-full table-fixed border-separate border-spacing-0 text-left text-[11px] text-slate-700"
        style={{ minWidth: COLS.reduce((a, w) => a + w, 0) }}
      >
        <colgroup>
          {COLS.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className={cn(TH, 'sticky left-0 top-0 z-30 bg-teal-50 text-teal-800 shadow-[1px_0_0_0_#e2e8f0]')}>No Inv</th>
            <th className={cn(TH, 'sticky top-0 z-20')}>Nama Customer</th>
            <th className={cn(TH, 'sticky top-0 z-20')}>Nama Project</th>
            <th className={cn(TH, 'sticky top-0 z-20')}>Delivery Date (Deadline)</th>
            <th className={cn(TH, 'sticky top-0 z-20')}>Jenis Metode Produksi</th>
            <th className={cn(TH, 'sticky top-0 z-20')}>Kategori</th>
            <th className={cn(TH, 'sticky top-0 z-20')}>Jenis Bahan</th>
            <th className={cn(TH, 'sticky top-0 z-20')}>Warna</th>
            <th className={cn(TH, 'sticky top-0 z-20')}>Created By</th>
            <th className={cn(TH, 'sticky top-0 z-20 text-center')}>Raw Acc Cust</th>
            <th className={cn(TH, 'sticky top-0 z-20 bg-teal-50 px-1 text-center text-teal-800')}>Total (Qty)</th>
            <th className={cn(TH, 'sticky top-0 z-20 px-1 text-center')}>Total Tanpa Lengan</th>
            <th className={cn(TH, 'sticky top-0 z-20 px-1 text-center')}>Total Pendek</th>
            <th className={cn(TH, 'sticky top-0 z-20 px-1 text-center')}>Total 3/4 Tangan</th>
            <th className={cn(TH, 'sticky top-0 z-20 px-1 text-center')}>Total Panjang</th>
            <th className={cn(TH, 'sticky top-0 z-20')}>Vendor</th>
            <th className={cn(TH, 'sticky top-0 z-20')}>Dibuat</th>
            <th className={cn(TH, 'sticky top-0 z-30 text-center shadow-[-1px_0_0_0_#e2e8f0]')} style={{ right: STATUS_RIGHT }}>
              Status
            </th>
            <th className={cn(TH, 'sticky right-0 top-0 z-30 text-center shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]')}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 19 }).map((__, j) => (
                  <td key={j} className={TD}>
                    <Shimmer className="h-4 w-full rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={19} className="p-6">
                {emptyState}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const selected = row.id === selectedId;
              const overdue = isDeadlineOverdue(row, today);
              const stickyBg = selected ? 'bg-teal-50' : 'bg-white group-hover:bg-[#f6fbfb]';
              return (
                <tr
                  key={row.id}
                  data-row-id={row.id}
                  aria-selected={selected}
                  onMouseEnter={() => onHover(row)}
                  onClick={() => actions.onOpen(row)}
                  className={cn('group cursor-pointer transition-colors', selected ? 'bg-teal-50' : 'hover:bg-[#f6fbfb]')}
                >
                  <td className={cn(TD, 'sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0]', stickyBg, selected && 'shadow-[inset_3px_0_0_0_#0d9488,1px_0_0_0_#e2e8f0]')}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.onOpen(row);
                      }}
                      title="Detail order"
                      className="cursor-pointer whitespace-nowrap font-mono font-bold text-teal-700 underline-offset-2 hover:underline"
                    >
                      {row.noInv || '-'}
                    </button>
                  </td>
                  <td className={cn(TD, TEXT, 'font-semibold text-slate-900')}>{row.namaCustomer || '-'}</td>
                  <td className={cn(TD, TEXT, 'text-slate-600')}>{row.namaProject || '-'}</td>
                  <td className={cn(TD, 'tabular-nums')}>
                    <span className={cn(overdue && 'font-bold text-rose-700')}>{row.deadline ? formatShortIsoDate(row.deadline) : '-'}</span>
                    {overdue && <span className="mt-0.5 block text-[9px] font-bold uppercase leading-tight text-rose-600">Lewat deadline</span>}
                  </td>
                  <td className={cn(TD, TEXT)}>{row.jenisMetodeProduksi || '-'}</td>
                  <td className={cn(TD, TEXT)}>{row.kategoriOrder || '-'}</td>
                  <td className={cn(TD, TEXT)}>{row.jenisBahan || '-'}</td>
                  <td className={cn(TD, TEXT)}>{row.warna || '-'}</td>
                  <td className={cn(TD, TEXT, 'text-slate-600')}>{row.createdBy || '-'}</td>
                  <td className={cn(TD, 'text-center')} onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <AccImageThumb url={row.accCustUrl} label={`${row.noInv} - ${row.namaCustomer}`} />
                    </div>
                  </td>
                  <td className={cn(TD, NUM, 'bg-teal-50/40 font-extrabold text-teal-900')}>{row.qtyTotal}</td>
                  <td className={cn(TD, NUM)}>{row.qtyTanpaLengan}</td>
                  <td className={cn(TD, NUM)}>{row.qtyPendek}</td>
                  <td className={cn(TD, NUM)}>{row.qtyTigaPerempat}</td>
                  <td className={cn(TD, NUM)}>{row.qtyPanjang}</td>
                  <td className={cn(TD, TEXT)}>{row.vendorName}</td>
                  <td className={cn(TD, TEXT, 'text-slate-600')} title={formatDateTime(row.createdAt)}>
                    {formatRelativeTime(row.createdAt)}
                  </td>
                  <td className={cn(TD, 'sticky z-10 px-1 text-center shadow-[-1px_0_0_0_#e2e8f0]', stickyBg)} style={{ right: STATUS_RIGHT }}>
                    <OrderStatusBadge status={row.status} compact className="gap-1 px-1.5 text-[9.5px]" />
                  </td>
                  <td className={cn(TD, 'sticky right-0 z-10 px-1 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]', stickyBg)} onClick={(e) => e.stopPropagation()}>
                    <RowActions row={row} {...actions} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

const ACTION_BTN = 'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-transform duration-150 active:scale-[0.96]';
// Versi HP: ikon + label agar maksud tombol jelas tanpa tooltip.
const ACTION_BTN_LG = 'flex h-12 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border text-[10px] font-bold transition-transform duration-150 active:scale-[0.96]';

export function RowActions({ row, onOpen, onEdit, onTechpack, onInvoice, onDelete, size = 'sm' }: DataCustomerActions & { row: DataCustomerRow; size?: 'sm' | 'lg' }) {
  const lg = size === 'lg';
  const btn = lg ? ACTION_BTN_LG : ACTION_BTN;
  const label = (text: string) => (lg ? <span className="truncate">{text}</span> : null);
  return (
    // Versi tabel memakai grid 2×2 agar kolom aksi sempit; detail dibuka lewat klik baris atau No Inv.
    <div className={cn(lg ? 'flex w-full items-center gap-1.5' : 'grid grid-cols-2 justify-items-center gap-0.5')}>
      {!row.archived && (
        <button type="button" onClick={() => onEdit(row)} title="Edit order" aria-label={`Edit ${row.noInv}`} className={cn(btn, 'border-teal-200 bg-teal-50/90 text-teal-700 hover:bg-teal-100')}>
          <Pencil className="h-3.5 w-3.5" />
          {label('Edit')}
        </button>
      )}
      <button type="button" onClick={() => onTechpack(row)} title="Tech Pack" aria-label={`Tech Pack ${row.noInv}`} className={cn(btn, 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100')}>
        <Shirt className="h-3.5 w-3.5" />
        {label('Techpack')}
      </button>
      <button type="button" onClick={() => onInvoice(row)} title="Invoice" aria-label={`Invoice ${row.noInv}`} className={cn(btn, 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100')}>
        <FileText className="h-3.5 w-3.5" />
        {label('Invoice')}
      </button>
      {!row.archived && (
        <button type="button" onClick={() => onDelete(row)} title="Hapus order" aria-label={`Hapus ${row.noInv}`} className={cn(btn, 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100')}>
          <Trash2 className="h-3.5 w-3.5" />
          {label('Hapus')}
        </button>
      )}
    </div>
  );
}

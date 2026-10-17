'use client';

import React from 'react';
import { CalendarClock } from 'lucide-react';
import { AccImageThumb } from '@/components/ops/AccImageThumb';
import { OrderStatusBadge } from '@/components/ops/OrderStatusBadge';
import { RowActions, type DataCustomerActions } from '@/components/ops/data-customer/DataCustomerTable';
import { Shimmer } from '@/components/ui/shimmer';
import { formatDateTime, formatRelativeTime } from '@/lib/legacy/formatters';
import { formatShortIsoDate, isDeadlineOverdue, type DataCustomerRow } from '@/lib/data-customer';
import { cn } from '@/lib/utils';

interface DataCustomerCardsProps extends DataCustomerActions {
  rows: DataCustomerRow[];
  loading: boolean;
  today: string;
  emptyState: React.ReactNode;
}

const QTY_CELLS: Array<{ key: keyof DataCustomerRow; label: string }> = [
  { key: 'qtyTanpaLengan', label: 'Tanpa Lengan' },
  { key: 'qtyPendek', label: 'Pendek' },
  { key: 'qtyTigaPerempat', label: '3/4' },
  { key: 'qtyPanjang', label: 'Panjang' },
];

/** Tampilan HP/tablet: teks maksimal satu baris (K-6), ketuk kartu membuka detail. */
export function DataCustomerCards({ rows, loading, today, emptyState, ...actions }: DataCustomerCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3.5">
            <Shimmer className="h-5 w-24 rounded-md" />
            <Shimmer className="h-4 w-3/4 rounded" />
            <Shimmer className="h-3 w-1/2 rounded" />
            <Shimmer className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) return <div className="p-3">{emptyState}</div>;

  return (
    <div className="grid grid-cols-1 gap-3 bg-slate-50/40 p-3 sm:grid-cols-2">
      {rows.map((row) => {
        const overdue = isDeadlineOverdue(row, today);
        return (
          <article
            key={row.id}
            onClick={() => actions.onOpen(row)}
            className="flex min-w-0 cursor-pointer flex-col gap-2.5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-card-double transition-colors hover:border-teal-300"
          >
            <div className="flex min-w-0 items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="shrink-0 whitespace-nowrap rounded-md border border-teal-200/90 bg-teal-50 px-2 py-0.5 text-[11px] font-black tracking-tight text-teal-900">
                {row.noInv || '-'}
              </span>
              <OrderStatusBadge status={row.status} compact className="min-w-0" />
            </div>

            <div className="flex min-w-0 items-start gap-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <h3 className="truncate text-[13px] font-extrabold leading-snug text-slate-900">{row.namaCustomer || '-'}</h3>
                <p className="truncate text-[11px] font-medium text-slate-500">{row.namaProject || '-'}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {[row.jenisMetodeProduksi, row.kategoriOrder, row.jenisBahan, row.warna].filter(Boolean).join(' • ') || '-'}
                </p>
              </div>
              {row.accCustUrl && (
                <div onClick={(e) => e.stopPropagation()}>
                  <AccImageThumb url={row.accCustUrl} label={`${row.noInv} - ${row.namaCustomer}`} size="md" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-center">
              <div className="flex min-w-0 flex-col justify-between rounded-xl border border-teal-100 bg-teal-50/70 px-1 py-1.5">
                <span className="block text-[9.5px] font-semibold leading-tight text-teal-800">Total</span>
                <span className="block text-sm font-extrabold tabular-nums text-teal-900">{row.qtyTotal}</span>
              </div>
              {QTY_CELLS.map((cell) => (
                <div key={cell.key} className="flex min-w-0 flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-1 py-1.5">
                  <span className="block text-[9.5px] font-semibold leading-tight text-slate-500">{cell.label}</span>
                  <span className="block text-sm font-bold tabular-nums text-slate-800">{row[cell.key] as number}</span>
                </div>
              ))}
            </div>

            <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className={cn('inline-flex min-w-0 items-center gap-1 truncate', overdue && 'font-bold text-rose-700')}>
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{row.deadline ? formatShortIsoDate(row.deadline) : 'Deadline -'}{overdue ? ' (lewat)' : ''}</span>
              </span>
              <span className="shrink-0" title={formatDateTime(row.createdAt)}>
                {formatRelativeTime(row.createdAt)}
              </span>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="truncate">Vendor: <strong className="font-semibold text-slate-700">{row.vendorName}</strong></span>
              <span className="truncate">Oleh: <strong className="font-semibold text-slate-700">{row.createdBy || '-'}</strong></span>
            </div>

            <div className="border-t border-slate-100 pt-2" onClick={(e) => e.stopPropagation()}>
              <RowActions row={row} {...actions} size="lg" />
            </div>
          </article>
        );
      })}
    </div>
  );
}

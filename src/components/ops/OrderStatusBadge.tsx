import React from 'react';
import { STATUS_FILTER_LABELS, STATUS_LABELS, type OrderStatus } from '@/lib/legacy/types';
import { cn } from '@/lib/utils';

// Warna mengikuti kelompok tint baris visualkaindb: menunggu (amber), produksi (sky), kirim (teal), selesai (emerald).
const STATUS_TONE: Record<OrderStatus, string> = {
  received: 'bg-amber-50 text-amber-800 border-amber-200',
  payment: 'bg-amber-50 text-amber-800 border-amber-200',
  production: 'bg-sky-50 text-sky-800 border-sky-200',
  finishing: 'bg-sky-50 text-sky-800 border-sky-200',
  qc: 'bg-sky-50 text-sky-800 border-sky-200',
  packing: 'bg-sky-50 text-sky-800 border-sky-200',
  delivery: 'bg-teal-50 text-teal-800 border-teal-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const DOT_TONE: Record<OrderStatus, string> = {
  received: 'bg-amber-500',
  payment: 'bg-amber-500',
  production: 'bg-sky-500',
  finishing: 'bg-sky-500',
  qc: 'bg-sky-500',
  packing: 'bg-sky-500',
  delivery: 'bg-teal-500',
  completed: 'bg-emerald-500',
};

export function OrderStatusBadge({ status, compact = false, className }: { status: OrderStatus; compact?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold',
        STATUS_TONE[status],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_TONE[status])} aria-hidden />
      <span className="truncate">{compact ? STATUS_FILTER_LABELS[status] : STATUS_LABELS[status]}</span>
    </span>
  );
}

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Strip merah di tepi kiri baris/kartu yang memuat nilai minus (K-5). */
export const NEGATIVE_ROW_STRIP = 'shadow-[inset_3px_0_0_0_#e11d48]';

export function isNegativeValue(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value < 0;
}

interface NegativeAwareValueProps {
  value: number;
  children: React.ReactNode;
  /** Penjelasan penyebab minus, tampil sebagai tooltip dan teks pembaca layar. */
  reason?: string;
  className?: string;
  /** Kelas untuk nilai non-minus. */
  positiveClassName?: string;
}

/** Nilai angka yang otomatis diberi latar rose, teks merah, dan ikon peringatan saat minus. */
export function NegativeAwareValue({ value, children, reason = 'Nilai minus', className, positiveClassName }: NegativeAwareValueProps) {
  if (!isNegativeValue(value)) {
    return <span className={cn('tabular-nums', className, positiveClassName)}>{children}</span>;
  }
  return (
    <span
      title={reason}
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 font-bold tabular-nums text-rose-700 ring-1 ring-inset ring-rose-200',
        className
      )}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden />
      <span>{children}</span>
      <span className="sr-only">{reason}</span>
    </span>
  );
}

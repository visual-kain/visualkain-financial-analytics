import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'pulse' | 'wave' | 'metallic';
}

/**
 * Shimmer Loading Primitive untuk Next.js App Router (RSC & Client compatible)
 * Memanfaatkan Tailwind pseudo-element mask tanpa external bundle overhead.
 */
export function Shimmer({ className, variant = 'wave', ...props }: ShimmerProps) {
  const gradientClass =
    variant === 'metallic'
      ? 'before:via-slate-200/50'
      : 'before:via-white/40';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-slate-200/80',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer',
        `before:bg-gradient-to-r before:from-transparent ${gradientClass} before:to-transparent`,
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton khusus untuk 6 Kartu Ringkasan Finansial VisualKain
 */
export function MetricCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-32 rounded-lg" />
        <Shimmer className="h-8 w-8 rounded-xl" />
      </div>
      <div className="mt-4 space-y-2">
        <Shimmer className="h-8 w-44 rounded-lg" />
        <Shimmer className="h-3 w-52 rounded" />
      </div>
    </div>
  );
}

/**
 * Skeleton untuk Chart Grafik Finansial (Recharts Spline Area / Donut)
 */
export function ChartSkeleton({ title }: { title?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="text-sm font-semibold text-slate-700">
            {title || <Shimmer className="h-5 w-40 rounded" />}
          </div>
          <Shimmer className="mt-1 h-3 w-56 rounded" />
        </div>
        <Shimmer className="h-8 w-24 rounded-lg" />
      </div>
      <div className="mt-6 flex h-64 items-end justify-between gap-3 px-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex w-full flex-col items-center gap-2">
            <Shimmer
              className="w-full rounded-t-lg"
              style={{ height: `${20 + ((i * 19) % 75)}%` }}
            />
            <Shimmer className="h-2 w-6 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton untuk Tabel Ledger Transaksi Finansial
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4">
        <Shimmer className="h-5 w-36 rounded" />
        <Shimmer className="h-8 w-28 rounded-lg" />
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-slate-50">
            <Shimmer className="h-4 w-24 rounded" />
            <Shimmer className="h-4 w-40 rounded" />
            <Shimmer className="h-4 w-20 rounded" />
            <Shimmer className="h-4 w-28 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

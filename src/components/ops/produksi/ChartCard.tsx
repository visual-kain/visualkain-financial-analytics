'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Kerangka kartu chart Ringkasan Produksi, mengikuti susunan kartu dashboard visualkaindb fase 4-6. */
export function ChartCard({
  icon: Icon,
  tone,
  title,
  subtitle,
  aside,
  children,
  className,
}: {
  icon: LucideIcon;
  tone: string;
  title: string;
  subtitle?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double sm:p-5', className)}>
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border', tone)}>
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[11px] leading-snug text-slate-500 sm:text-xs">{subtitle}</p>}
          </div>
        </div>
        {aside && <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string; title?: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-8 cursor-pointer whitespace-nowrap rounded-lg px-2.5 text-[11px] font-bold transition-colors',
            value === o.value ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TooltipShell({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-[170px] rounded-xl border border-slate-700/60 bg-slate-900/95 px-3 py-2.5 text-xs text-white shadow-xl backdrop-blur-md">
      <div className="mb-1.5 border-b border-slate-700/70 pb-1 text-[11px] font-semibold text-slate-400">{title}</div>
      {children}
    </div>
  );
}

export function TooltipRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-slate-300">
        {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
        {label}
      </span>
      <strong className="font-mono tabular-nums" style={color ? { color } : undefined}>
        {value}
      </strong>
    </div>
  );
}

/** Kotak cekung untuk ringkasan di dalam kartu (pengganti `surface-well` visualkaindb). */
export function Well({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] sm:p-4', className)}>
      {children}
    </div>
  );
}

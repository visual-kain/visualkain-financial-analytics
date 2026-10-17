import React from 'react';
import { CARD } from '@/components/ops/cost-profit/styles';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Kartu satu bagian di tab Database: judul, jumlah data, dan tombol tambah di kanan atas. */
export function SectionCard({ icon, title, description, count, action, className, children }: SectionCardProps) {
  return (
    <section className={cn(CARD, 'overflow-hidden', className)}>
      <header className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700" aria-hidden>
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
              {title}
              {typeof count === 'number' && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-600">{count}</span>
              )}
            </h2>
            {description && <p className="mt-0.5 text-[11px] leading-snug text-slate-500 sm:text-xs">{description}</p>}
          </div>
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{action}</div>}
      </header>
      {children}
    </section>
  );
}

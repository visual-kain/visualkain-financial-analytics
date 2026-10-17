import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Badge kecil di atas judul, misalnya modul atau No. Invoice. */
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

/** Kartu header halaman, gaya yang sama dengan header dashboard finansial. */
export function PageHeader({ title, subtitle, eyebrow, actions, backHref, backLabel = 'Kembali', className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        '-mx-3.5 -mt-4 rounded-b-2xl border-b border-slate-200/90 bg-white/95 px-3.5 pb-3.5 pt-3 shadow-card-double backdrop-blur-md sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border sm:p-5 lg:p-6',
        className
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          {(backHref || eyebrow) && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {backHref && (
                <Link
                  href={backHref}
                  className="inline-flex h-8 items-center gap-1 rounded-lg pr-2 text-[11px] font-bold text-slate-500 transition-colors hover:text-teal-700 sm:text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {backLabel}
                </Link>
              )}
              {eyebrow}
            </div>
          )}
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle && (
            <p className="max-w-3xl text-[11px] leading-snug text-slate-500 sm:text-xs sm:leading-relaxed">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 sm:w-auto lg:border-t-0 lg:pt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function EyebrowBadge({ children, tone = 'teal' }: { children: React.ReactNode; tone?: 'teal' | 'slate' | 'amber' }) {
  const tones = {
    teal: 'border-teal-200/80 bg-teal-50 text-teal-800',
    slate: 'border-slate-200/90 bg-slate-50 text-slate-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-bold shadow-2xs sm:px-2.5 sm:py-1 sm:text-xs', tones[tone])}>
      {children}
    </span>
  );
}

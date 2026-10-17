'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { navItemById, resolveActiveNavId } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Badge kecil di atas judul, misalnya modul atau No. Invoice. */
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  /** Ikon tile desktop; default mengikuti menu navigasi halaman aktif. */
  icon?: LucideIcon;
  className?: string;
}

/**
 * Kartu header halaman. Di bawah lg tampilannya tetap seperti semula (permintaan klien 17 Okt 2026); di desktop
 * dibuat lebih padat: tile ikon, judul sebaris dengan badge, deskripsi satu baris, dan aksi rata kanan.
 */
export function PageHeader({ title, subtitle, eyebrow, actions, backHref, backLabel = 'Kembali', icon, className }: PageHeaderProps) {
  // usePathname bernilai null bila dirender di luar App Router (misalnya test komponen langsung).
  const pathname = usePathname() ?? '';
  const Icon = icon ?? navItemById(resolveActiveNavId(pathname, null))?.icon;

  return (
    <div
      className={cn(
        '-mx-3.5 -mt-4 rounded-b-2xl border-b border-slate-200/90 bg-white/95 px-3.5 pb-3.5 pt-3 shadow-card-double backdrop-blur-md sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border sm:p-5 lg:relative lg:overflow-hidden lg:px-6 lg:py-4',
        className
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 bg-gradient-to-l from-teal-50/80 via-teal-50/25 to-transparent lg:block" />
      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        {Icon && (
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white text-teal-700 shadow-btn-secondary lg:flex">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        )}
        <div className="min-w-0 space-y-1 lg:flex-1 lg:space-y-0.5">
          {(backHref || eyebrow) && (
            <div className={cn('flex flex-wrap items-center gap-1.5 sm:gap-2', !backHref && 'lg:hidden')}>
              {backHref && (
                <Link
                  href={backHref}
                  className="inline-flex h-8 items-center gap-1 rounded-lg pr-2 text-[11px] font-bold text-slate-500 transition-colors hover:text-teal-700 sm:text-xs lg:h-6"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {backLabel}
                </Link>
              )}
              {eyebrow && <span className="contents lg:hidden">{eyebrow}</span>}
            </div>
          )}
          <div className="lg:flex lg:flex-wrap lg:items-center lg:gap-2.5">
            <h1 title={title} className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl lg:line-clamp-2 lg:text-[22px] lg:leading-tight">
              {title}
            </h1>
            {eyebrow && <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:gap-1.5">{eyebrow}</div>}
          </div>
          {subtitle && (
            <p title={subtitle} className="max-w-3xl text-[11px] leading-snug text-slate-500 sm:text-xs sm:leading-relaxed lg:line-clamp-1 lg:max-w-4xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 sm:w-auto lg:max-w-[55%] lg:shrink-0 lg:justify-end lg:border-t-0 lg:pt-0">
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

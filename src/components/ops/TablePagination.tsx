'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  unit?: string;
  onPageChange: (page: number) => void;
}

export function pageWindow(page: number, totalPages: number, maxVisible = 5): number[] {
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

/** Bilah halaman bergaya tabel master finansial. */
export function TablePagination({ page, pageSize, total, unit = 'order', onPageChange }: TablePaginationProps) {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = pageWindow(page, totalPages);
  const btn = 'h-10 min-w-[40px] cursor-pointer rounded-xl px-2.5 text-xs font-bold transition-all active:scale-95 sm:h-9 sm:min-w-[36px]';

  return (
    <div className="flex select-none flex-col gap-3 border-t border-slate-100 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="text-center text-xs font-medium text-slate-500 sm:text-left">
        Menampilkan <strong className="tabular-nums text-slate-800">{start}</strong>–<strong className="tabular-nums text-slate-800">{end}</strong> dari{' '}
        <strong className="tabular-nums text-slate-800">{total}</strong> {unit}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Halaman sebelumnya"
          className={cn(btn, 'inline-flex items-center gap-1 border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35')}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>
        {pages[0] > 1 && (
          <>
            <button type="button" onClick={() => onPageChange(1)} className={cn(btn, 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>
              1
            </button>
            {pages[0] > 2 && <span className="px-1 text-xs text-slate-400">&hellip;</span>}
          </>
        )}
        {pages.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onPageChange(num)}
            aria-current={num === page ? 'page' : undefined}
            className={cn(
              btn,
              num === page ? 'bg-teal-600 font-extrabold text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50'
            )}
          >
            {num}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-xs text-slate-400">&hellip;</span>}
            <button type="button" onClick={() => onPageChange(totalPages)} className={cn(btn, 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>
              {totalPages}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Halaman berikutnya"
          className={cn(btn, 'inline-flex items-center gap-1 border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35')}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

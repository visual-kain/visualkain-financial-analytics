'use client';

import React, { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, Pencil, Plus, RefreshCw, Search, Trash2, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { EyebrowBadge, PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/modal';
import { Shimmer } from '@/components/ui/shimmer';
import type { LetterLoadState } from '@/hooks/useLetters';
import { formatIsoDateLong } from '@/lib/legacy/formatters';
import { filterLetterRows, letterYears, sortLetterRows, type LetterRow } from '@/lib/letters';
import { cn } from '@/lib/utils';
import { INPUT_CLASS, OUTLINE_BUTTON_CLASS } from './fields';

interface LetterListViewProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  /** Kata benda huruf kecil untuk teks, misalnya "surat" atau "penawaran". */
  noun: string;
  numberLabel: string;
  /** Awalan route, misalnya "/kerjasama". */
  basePath: string;
  newLabel: string;
  rows: LetterRow[];
  state: LetterLoadState;
  onRetry: () => void;
  onDelete: (row: LetterRow) => Promise<void>;
}

const TEXT_CELL = 'whitespace-normal break-words px-3 py-3 align-top';
const NEW_LINK_CLASS =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-teal-700 bg-teal-600 px-4 text-xs font-medium text-white shadow-btn-primary transition-all hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 active:scale-[0.97] sm:h-10';

export function LetterListView({
  title,
  subtitle,
  icon,
  noun,
  numberLabel,
  basePath,
  newLabel,
  rows,
  state,
  onRetry,
  onDelete,
}: LetterListViewProps) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [year, setYear] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<LetterRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(() => sortLetterRows(rows), [rows]);
  const years = useMemo(() => letterYears(rows), [rows]);
  const yearOptions = useMemo(
    () => [{ value: 'all', label: 'Semua tahun' }, ...years.map((y) => ({ value: String(y), label: String(y) }))],
    [years]
  );
  const activeYear = year === 'all' || years.includes(Number(year)) ? year : 'all';
  const visible = useMemo(
    () => filterLetterRows(sorted, { year: activeYear === 'all' ? 'all' : Number(activeYear), query }),
    [sorted, activeYear, query]
  );
  const filtering = query.trim() !== '' || activeYear !== 'all';

  const resetFilters = () => {
    setQuery('');
    setYear('all');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget);
      toast.success(`${capitalize(noun)} ${deleteTarget.nomor} dihapus`);
    } catch (err) {
      console.warn(`[Firebase] Hapus ${noun} gagal:`, err instanceof Error ? err.message : err);
      toast.error(`${capitalize(noun)} belum terhapus. Periksa koneksi internet lalu coba lagi.`);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const newButton = (
    <Link href={`${basePath}/new`} className={cn(NEW_LINK_CLASS, 'flex-1 sm:flex-none')}>
      <Plus className="h-4 w-4" aria-hidden />
      {newLabel}
    </Link>
  );

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        eyebrow={<EyebrowBadge tone="slate">{icon}Dokumen</EyebrowBadge>}
        actions={newButton}
      />

      <Card className="space-y-3 p-3.5 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <label htmlFor={searchId} className="sr-only">
              Cari {noun}
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id={searchId}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nomor, perihal, atau perusahaan..."
              className={cn(INPUT_CLASS, 'pl-9 pr-10')}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Tahun</span>
            <CustomSelect
              value={activeYear}
              onValueChange={setYear}
              options={yearOptions}
              icon={<CalendarDays className="h-3.5 w-3.5" aria-hidden />}
              className="h-11 min-w-36 sm:h-10"
            />
          </div>
        </div>
        {state === 'ready' && (
          <p className="text-[11px] font-semibold text-slate-500" aria-live="polite">
            {filtering ? `${visible.length} dari ${rows.length} ${noun}` : `${rows.length} ${noun}`}
          </p>
        )}
      </Card>

      {state === 'loading' && <ListSkeleton />}

      {state === 'error' && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-xs text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-bold">Daftar {noun} gagal dimuat.</p>
              <p className="mt-0.5 text-rose-800">Periksa koneksi internet lalu coba lagi.</p>
            </div>
          </div>
          <Button variant="outline" onClick={onRetry} className={cn(OUTLINE_BUTTON_CLASS, 'self-start sm:self-auto')}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Coba lagi
          </Button>
        </div>
      )}

      {state === 'ready' && rows.length === 0 && (
        <Card className="p-3.5 sm:p-4">
          <EmptyState
            title={`Belum ada ${noun}`}
            description={`${capitalize(noun)} yang disimpan akan tampil di sini dengan nomor otomatis.`}
            className="py-10"
            action={
              <Link href={`${basePath}/new`} className={cn(NEW_LINK_CLASS, 'mt-2')}>
                <Plus className="h-4 w-4" aria-hidden />
                {newLabel}
              </Link>
            }
          />
        </Card>
      )}

      {state === 'ready' && rows.length > 0 && visible.length === 0 && (
        <Card className="p-3.5 sm:p-4">
          <EmptyState
            title={`Tidak ada ${noun} yang cocok`}
            description="Ubah kata kunci atau pilih tahun lain."
            className="py-10"
            action={
              <Button variant="outline" onClick={resetFilters} className={cn(OUTLINE_BUTTON_CLASS, 'mt-2')}>
                Reset filter
              </Button>
            }
          />
        </Card>
      )}

      {state === 'ready' && visible.length > 0 && (
        <>
          <Card className="hidden overflow-hidden p-0 xl:block">
            <table className="w-full table-fixed border-collapse text-xs">
              <caption className="sr-only">Daftar {noun}</caption>
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="w-40 px-3 py-2.5 text-left">{numberLabel}</th>
                  <th scope="col" className="w-32 px-3 py-2.5 text-left">Tanggal</th>
                  <th scope="col" className="px-3 py-2.5 text-left">Perihal</th>
                  <th scope="col" className="w-44 px-3 py-2.5 text-left 2xl:w-56">Perusahaan</th>
                  <th scope="col" className="w-28 px-3 py-2.5 text-left">Dibuat oleh</th>
                  <th scope="col" className="w-24 px-3 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-teal-50/40">
                    <td className="px-3 py-3 align-top">
                      <Link
                        href={`${basePath}/${row.id}`}
                        className="whitespace-nowrap font-bold tabular-nums text-teal-700 hover:underline focus:outline-none focus-visible:underline"
                      >
                        {row.nomor || '-'}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top tabular-nums text-slate-600">{formatIsoDateLong(row.tanggal) || '-'}</td>
                    <td className={cn(TEXT_CELL, 'font-semibold text-slate-800')}>{row.perihal || '-'}</td>
                    <td className={cn(TEXT_CELL, 'text-slate-700')}>{row.perusahaan || '-'}</td>
                    <td className={cn(TEXT_CELL, 'text-slate-600')}>{row.createdBy || '-'}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`${basePath}/${row.id}`}
                          aria-label={`Buka ${noun} ${row.nomor}`}
                          title="Buka"
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          aria-label={`Hapus ${noun} ${row.nomor}`}
                          title="Hapus"
                          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <ul className="grid gap-3 lg:grid-cols-2 xl:hidden">
            {visible.map((row) => (
              <li key={row.id}>
                <Card className="space-y-2.5 p-3.5">
                  <Link href={`${basePath}/${row.id}`} className="block min-w-0 space-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold tabular-nums text-teal-700">{row.nomor || '-'}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-slate-500">
                        <CalendarDays className="h-3 w-3" aria-hidden />
                        {formatIsoDateLong(row.tanggal) || '-'}
                      </span>
                    </div>
                    <p className="truncate text-sm font-bold text-slate-900">{row.perihal || '-'}</p>
                    <p className="truncate text-xs text-slate-700">{row.perusahaan || '-'}</p>
                    <p className="flex items-center gap-1 truncate text-[11px] text-slate-500">
                      <User className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate">{row.createdBy || '-'}</span>
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-2.5">
                    <Link
                      href={`${basePath}/${row.id}`}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-btn-secondary hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Buka
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(row)}
                      aria-label={`Hapus ${noun} ${row.nomor}`}
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Hapus ${noun}?`}
        description={
          deleteTarget && (
            <>
              {capitalize(noun)} <strong>{deleteTarget.nomor}</strong> untuk <strong>{deleteTarget.perusahaan || 'tanpa nama perusahaan'}</strong> akan dihapus permanen.
              Nomor ini tidak dipakai ulang oleh {noun} lain.
            </>
          )
        }
        confirmLabel={`Ya, hapus ${noun}`}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat daftar">
      <Card className="hidden space-y-3 p-4 xl:block">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-50 py-2 last:border-b-0">
            <Shimmer className="h-4 w-36 rounded" />
            <Shimmer className="h-4 w-28 rounded" />
            <Shimmer className="h-4 flex-1 rounded" />
            <Shimmer className="h-4 w-40 rounded" />
            <Shimmer className="h-4 w-24 rounded" />
          </div>
        ))}
      </Card>
      <div className="grid gap-3 lg:grid-cols-2 xl:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-2.5 p-3.5">
            <div className="flex items-center justify-between">
              <Shimmer className="h-3.5 w-28 rounded" />
              <Shimmer className="h-3 w-24 rounded" />
            </div>
            <Shimmer className="h-4 w-3/4 rounded" />
            <Shimmer className="h-3.5 w-1/2 rounded" />
            <Shimmer className="h-11 w-full rounded-xl" />
          </Card>
        ))}
      </div>
    </div>
  );
}

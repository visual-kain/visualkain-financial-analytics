'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { AlertCircle, Archive, Download, Plus, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { DataCustomerTable } from '@/components/ops/data-customer/DataCustomerTable';
import { DataCustomerCards } from '@/components/ops/data-customer/DataCustomerCards';
import { DeleteOrderDialog } from '@/components/ops/data-customer/DeleteOrderDialog';
import { TablePagination } from '@/components/ops/TablePagination';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { useOpsData } from '@/context/OpsDataContext';
import { todayInJakarta } from '@/lib/constants';
import {
  countByStatus,
  filterDataCustomerRows,
  matchesSearch,
  scopeRows,
  toDataCustomerRow,
  type DataCustomerRow,
} from '@/lib/data-customer';
import { STATUS_FILTER_LABELS, STATUS_ORDER, type LegacyOrder } from '@/lib/legacy/types';
import { cn } from '@/lib/utils';

const STATUS_VALUES = ['all', ...STATUS_ORDER] as const;
const SCOPE_VALUES = ['current', 'archive'] as const;
const PAGE_SIZES = [10, 25, 50];

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

function DataCustomerContent() {
  const router = useRouter();
  const { orders, ordersState, error, retry, getVendorName } = useOpsData();
  const [query, setQuery] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      status: parseAsStringLiteral(STATUS_VALUES).withDefault('all'),
      scope: parseAsStringLiteral(SCOPE_VALUES).withDefault('current'),
      page: parseAsInteger.withDefault(1),
      size: parseAsInteger.withDefault(10),
    },
    { history: 'replace' }
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LegacyOrder | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const today = todayInJakarta();
  const pageSize = PAGE_SIZES.includes(query.size) ? query.size : 10;

  const allRows = useMemo(() => orders.map((o) => toDataCustomerRow(o, getVendorName(o.vendorId))), [orders, getVendorName]);
  const searchedScope = useMemo(
    () => scopeRows(allRows, query.scope).filter((r) => matchesSearch(r, query.q)),
    [allRows, query.scope, query.q]
  );
  const counts = useMemo(() => countByStatus(searchedScope), [searchedScope]);
  const filtered = useMemo(
    () => filterDataCustomerRows(allRows, { search: query.q, status: query.status, scope: query.scope }),
    [allRows, query.q, query.status, query.scope]
  );
  const archiveCount = useMemo(() => allRows.filter((r) => r.archived).length, [allRows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const pageRows = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const setPage = useCallback((p: number) => void setQuery({ page: p }), [setQuery]);

  const actions = useMemo(
    () => ({
      onOpen: (row: DataCustomerRow) => router.push(`/data-customer/${row.id}`),
      onEdit: (row: DataCustomerRow) => router.push(`/data-customer/${row.id}/edit`),
      onTechpack: (row: DataCustomerRow) => router.push(`/data-customer/${row.id}/techpack`),
      onInvoice: (row: DataCustomerRow) => router.push(`/invoice?order=${row.id}`),
      onDelete: (row: DataCustomerRow) => setDeleteTarget(row.order),
    }),
    [router]
  );

  // Pintasan keyboard memakai indeks pada daftar terfilter (bukan indeks per halaman), memperbaiki bug legacy di halaman 2+.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (deleteTarget || document.querySelector('[role="dialog"]')) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        router.push('/data-customer/new');
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (ctrl && e.key === 'ArrowLeft') {
        e.preventDefault();
        setPage(Math.max(1, page - 1));
        return;
      }
      if (ctrl && e.key === 'ArrowRight') {
        e.preventDefault();
        setPage(Math.min(totalPages, page + 1));
        return;
      }
      if (filtered.length === 0) return;
      const idx = selectedId ? filtered.findIndex((r) => r.id === selectedId) : -1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = e.key === 'ArrowDown' ? Math.min(filtered.length - 1, idx + 1) : Math.max(0, idx - 1);
        const row = filtered[next];
        setSelectedId(row.id);
        const targetPage = Math.floor(next / pageSize) + 1;
        if (targetPage !== page) setPage(targetPage);
        requestAnimationFrame(() => document.querySelector(`[data-row-id="${row.id}"]`)?.scrollIntoView({ block: 'nearest' }));
        return;
      }
      const row = idx >= 0 ? filtered[idx] : null;
      if (!row) return;
      if (e.key === 'Enter') actions.onOpen(row);
      else if (e.key.toLowerCase() === 'e' && !row.archived) actions.onEdit(row);
      else if (e.key.toLowerCase() === 't') actions.onTechpack(row);
      else if (e.key === 'Delete' && !row.archived) actions.onDelete(row);
      else if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selectedId, page, pageSize, totalPages, actions, deleteTarget, router, setPage]);

  const filterLabel = [
    query.scope === 'archive' ? 'Arsip sebelum Okt 2026' : 'Mulai Okt 2026',
    query.status === 'all' ? 'Semua status' : STATUS_FILTER_LABELS[query.status],
    query.q ? `Cari "${query.q}"` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const handleExport = async () => {
    try {
      // exceljs dimuat saat dibutuhkan agar halaman tetap ringan di HP.
      const { exportDataCustomerToExcel } = await import('@/lib/excel-export-ops');
      await exportDataCustomerToExcel(filtered, filterLabel);
      toast.success('Data Customer berhasil diekspor ke Excel');
    } catch (err) {
      console.error('[data-customer] Ekspor gagal:', err);
      toast.error('Gagal mengekspor Excel');
    }
  };

  const loading = ordersState === 'loading';
  const isFiltered = !!query.q || query.status !== 'all';
  const emptyState = (
    <EmptyState
      title={isFiltered ? 'Tidak ada order yang cocok' : query.scope === 'archive' ? 'Belum ada order arsip' : 'Belum ada order mulai Oktober 2026'}
      description={isFiltered ? 'Ubah kata kunci atau filter status.' : 'Order baru akan muncul di sini setelah disimpan.'}
      action={
        isFiltered ? (
          <button
            type="button"
            onClick={() => setQuery({ q: '', status: 'all', page: 1 })}
            className="mt-1 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50 shadow-btn-secondary font-medium"
          >
            <X className="h-3.5 w-3.5" /> Reset filter
          </button>
        ) : query.scope === 'current' ? (
          <Link href="/data-customer/new" className="mt-1 inline-flex h-10 items-center gap-1.5 rounded-xl bg-teal-600 px-3 text-xs text-white hover:bg-teal-700 border border-teal-700 shadow-btn-primary font-medium">
            <Plus className="h-4 w-4" /> Order Baru
          </Link>
        ) : undefined
      }
    />
  );

  return (
    <>
      <PageHeader
        eyebrow={<EyebrowBadge>Produksi</EyebrowBadge>}
        title="Data Customer"
        subtitle="Seluruh order produksi: identitas customer, spesifikasi produksi, rincian qty per jenis lengan, dan vendor. Default menampilkan order mulai Oktober 2026."
        actions={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 shadow-btn-secondary font-medium"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Ekspor Excel
            </button>
            <Link
              href="/data-customer/new"
              title="Order baru (Ctrl+N)"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3.5 text-xs text-white hover:bg-teal-700 active:scale-[0.98] sm:h-10 border border-teal-700 shadow-btn-primary font-medium"
            >
              <Plus className="h-4 w-4" />
              Order Baru
            </Link>
          </div>
        }
      />

      {ordersState === 'error' && (
        <div role="alert" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Gagal memuat Data Customer{error ? ` (${error})` : ''}.
          </span>
          <button type="button" onClick={retry} className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 font-bold text-rose-800 hover:bg-rose-100">
            <RefreshCw className="h-3.5 w-3.5" /> Coba lagi
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card-double">
        <div className="space-y-3 border-b border-slate-100 p-3 sm:p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="search"
                value={query.q}
                onChange={(e) => setQuery({ q: e.target.value, page: 1 })}
                placeholder="Cari nama, project, No. Invoice, atau metode..."
                aria-label="Cari Data Customer"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-800 sm:text-xs placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:h-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="grid flex-1 grid-cols-2 rounded-xl bg-slate-100 p-1 lg:flex-none" role="group" aria-label="Periode data">
                {SCOPE_VALUES.map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    aria-pressed={query.scope === scope}
                    onClick={() => setQuery({ scope, page: 1 })}
                    className={cn(
                      'inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[11px] font-bold transition-colors',
                      query.scope === scope ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    {scope === 'archive' && <Archive className="h-3.5 w-3.5" />}
                    {scope === 'current' ? 'Mulai Okt 2026' : `Arsip (${archiveCount})`}
                  </button>
                ))}
              </div>
              <div className="hidden lg:block">
                <CustomSelect
                  value={String(pageSize)}
                  onValueChange={(v) => setQuery({ size: Number(v), page: 1 })}
                  className="h-10"
                  options={PAGE_SIZES.map((s) => ({ value: String(s), label: `${s} / halaman` }))}
                />
              </div>
            </div>
          </div>

          <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter status">
            {STATUS_VALUES.map((status) => {
              const active = query.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setQuery({ status, page: 1 })}
                  className={cn(
                    'inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors',
                    active ? 'border-teal-600 bg-teal-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-800'
                  )}
                >
                  {status === 'all' ? 'Semua' : STATUS_FILTER_LABELS[status]}
                  <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', active ? 'bg-white/20' : 'bg-slate-100 text-slate-500')}>
                    {counts[status] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {query.scope === 'archive' && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
              Arsip sebelum Oktober 2026 hanya bisa dilihat dan dicetak ulang (invoice dan techpack), tidak bisa diedit atau dihapus.
            </p>
          )}
        </div>

        <div className="lg:hidden">
          <DataCustomerCards rows={pageRows} loading={loading} today={today} emptyState={emptyState} {...actions} />
        </div>
        <div className="hidden lg:block">
          <DataCustomerTable
            rows={pageRows}
            loading={loading}
            selectedId={selectedId}
            onHover={(row) => setSelectedId(row.id)}
            today={today}
            emptyState={emptyState}
            {...actions}
          />
          <p className="border-t border-slate-100 px-5 py-2 text-[11px] text-slate-400">
            Pintasan: ↑/↓ pilih baris • Enter detail • E edit • T techpack • Del hapus • Ctrl+N order baru • Ctrl+F cari • Ctrl+←/→ ganti halaman
          </p>
        </div>

        {!loading && <TablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />}
      </section>

      <DeleteOrderDialog order={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}

export default function DataCustomerPage() {
  return (
    <Suspense fallback={null}>
      <DataCustomerContent />
    </Suspense>
  );
}

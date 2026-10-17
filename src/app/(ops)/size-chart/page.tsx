'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useQueryState } from 'nuqs';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { SizeChartDialog } from '@/components/ops/size-chart/SizeChartDialog';
import { SizeChartDetail, SizeChartList } from '@/components/ops/size-chart/SizeChartDetail';
import { ConfirmDialog } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Shimmer } from '@/components/ui/shimmer';
import { useOpsData } from '@/context/OpsDataContext';
import { deleteSizeChart } from '@/lib/firestore/master-repo';
import type { SizeChart } from '@/lib/legacy/types';

function SizeChartContent() {
  const { sizeCharts, sizeChartsState, error, retry, orders } = useOpsData();
  const [selectedParam, setSelectedParam] = useQueryState('id');
  const [editing, setEditing] = useState<SizeChart | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SizeChart | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ordersByChart = useMemo(() => {
    const map = new Map<string, typeof orders>();
    orders.forEach((o) => {
      if (!o.sizeChartId) return;
      map.set(o.sizeChartId, [...(map.get(o.sizeChartId) || []), o]);
    });
    return map;
  }, [orders]);
  const usage = (id: string) => ordersByChart.get(id)?.length ?? 0;

  // Pilihan dari URL; bila tidak ada atau sudah dihapus, tampilkan size chart pertama.
  const selected = sizeCharts.find((c) => c.id === selectedParam) ?? sizeCharts[0];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSizeChart(deleteTarget.id);
      toast.success(`Size chart "${deleteTarget.nama}" dihapus`);
      if (selectedParam === deleteTarget.id) void setSelectedParam(null);
      setDeleteTarget(null);
    } catch (err) {
      console.error('[size-chart] Gagal menghapus:', err);
      toast.error('Gagal menghapus size chart');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={<EyebrowBadge>Operasional</EyebrowBadge>}
        title="Size Chart"
        subtitle="Kelola ukuran panjang dan lebar per size (XS sampai 5XL). Size chart dipilih di form order dan tercetak di halaman 3 techpack."
        actions={
          <button type="button" onClick={openCreate} className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 text-xs text-white hover:bg-teal-700 sm:h-10 sm:w-auto border border-teal-700 shadow-btn-primary font-medium">
            <Plus className="h-4 w-4" /> Buat Size Chart
          </button>
        }
      />

      {sizeChartsState === 'error' && (
        <div role="alert" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Gagal memuat size chart{error ? ` (${error})` : ''}.
          </span>
          <button type="button" onClick={retry} className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 font-bold text-rose-800">
            <RefreshCw className="h-3.5 w-3.5" /> Coba lagi
          </button>
        </div>
      )}

      {sizeChartsState === 'loading' ? (
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
          <Shimmer className="h-40 w-full rounded-2xl" />
          <Shimmer className="h-96 w-full rounded-2xl" />
        </div>
      ) : !selected ? (
        <EmptyState
          className="min-h-[300px] bg-white"
          title="Belum ada size chart"
          description="Klik tombol Buat Size Chart untuk membuat yang pertama."
          action={
            <button type="button" onClick={openCreate} className="mt-1 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-3 text-xs text-white border border-teal-700 shadow-btn-primary font-medium">
              <Plus className="h-4 w-4" /> Buat Size Chart
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <SizeChartList charts={sizeCharts} selectedId={selected.id} usage={usage} onSelect={(id) => void setSelectedParam(id)} />
          <SizeChartDetail
            chart={selected}
            orders={ordersByChart.get(selected.id) ?? []}
            onEdit={() => {
              setEditing(selected);
              setDialogOpen(true);
            }}
            onDelete={() => setDeleteTarget(selected)}
          />
        </div>
      )}

      <SizeChartDialog open={dialogOpen} chart={editing} onClose={() => setDialogOpen(false)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus size chart?"
        description={
          deleteTarget ? (
            <>
              Size chart <strong className="text-slate-900">{deleteTarget.nama}</strong> akan dihapus permanen.
              {usage(deleteTarget.id) > 0 && ` ${usage(deleteTarget.id)} order yang memakainya tidak lagi menampilkan halaman size chart di techpack.`}
            </>
          ) : null
        }
        confirmLabel="Hapus"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

export default function SizeChartPage() {
  return (
    <Suspense fallback={null}>
      <SizeChartContent />
    </Suspense>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Shimmer } from '@/components/ui/shimmer';
import { useOpsData } from '@/context/OpsDataContext';
import { SIZES } from '@/lib/legacy/calculations';
import { addSizeChart, deleteSizeChart, emptySizeChartSizes, updateSizeChart } from '@/lib/firestore/master-repo';
import type { SizeChart, SizeChartData } from '@/lib/legacy/types';

function SizeChartDialog({ open, chart, onClose }: { open: boolean; chart: SizeChart | null; onClose: () => void }) {
  const [nama, setNama] = useState('');
  const [sizes, setSizes] = useState<Record<string, SizeChartData>>(emptySizeChartSizes());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Diisi ulang hanya saat dialog dibuka; bug legacy mereset form setiap DataProvider render ulang.
  useEffect(() => {
    if (!open) return;
    setNama(chart?.nama ?? '');
    const base = emptySizeChartSizes();
    SIZES.forEach((s) => {
      const d = chart?.sizes?.[s];
      if (d) base[s] = { panjang: Number(d.panjang) || 0, lebar: Number(d.lebar) || 0 };
    });
    setSizes(base);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setValue = (size: string, key: keyof SizeChartData, raw: string) => {
    const value = Math.max(0, Number(raw) || 0);
    setSizes((prev) => ({ ...prev, [size]: { ...prev[size], [key]: value } }));
  };

  const save = async () => {
    const clean = nama.trim();
    if (!clean) {
      setError('Nama size chart wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (chart) await updateSizeChart(chart.id, clean, sizes);
      else await addSizeChart(clean, sizes);
      toast.success(chart ? `Size chart "${clean}" diperbarui` : `Size chart "${clean}" dibuat`);
      onClose();
    } catch (err) {
      console.error('[size-chart] Gagal menyimpan:', err);
      toast.error('Gagal menyimpan size chart');
    } finally {
      setSaving(false);
    }
  };

  const input =
    'h-11 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-semibold tabular-nums focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:h-10';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={chart ? 'Edit Size Chart' : 'Buat Size Chart'}
      description="Ukuran dalam satuan centimeter (cm)."
      busy={saving}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:h-10">
            Batal
          </button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 sm:h-10">
            {saving ? 'Menyimpan...' : 'Simpan Size Chart'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="sc-nama" className="mb-1.5 block text-xs font-bold text-slate-700">
            Nama Size Chart <span className="text-rose-500">*</span>
          </label>
          <input
            id="sc-nama"
            autoFocus
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Kaos Reguler Dewasa"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:h-10"
          />
          {error && <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>}
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-wide text-slate-500">
              <th className="pb-2 text-left">Size</th>
              <th className="pb-2">Panjang (cm)</th>
              <th className="pb-2">Lebar (cm)</th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map((s) => (
              <tr key={s}>
                <td className="py-1 pr-2 font-bold text-slate-800">{s}</td>
                <td className="px-1 py-1">
                  <input type="number" inputMode="decimal" min={0} step={0.5} value={sizes[s]?.panjang || ''} placeholder="0" onChange={(e) => setValue(s, 'panjang', e.target.value)} aria-label={`Panjang ${s}`} className={input} />
                </td>
                <td className="py-1 pl-1">
                  <input type="number" inputMode="decimal" min={0} step={0.5} value={sizes[s]?.lebar || ''} placeholder="0" onChange={(e) => setValue(s, 'lebar', e.target.value)} aria-label={`Lebar ${s}`} className={input} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default function SizeChartPage() {
  const { sizeCharts, sizeChartsState, error, retry, orders } = useOpsData();
  const [editing, setEditing] = useState<SizeChart | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SizeChart | null>(null);
  const [deleting, setDeleting] = useState(false);

  const usageCount = (id: string) => orders.filter((o) => o.sizeChartId === id).length;

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
          <button type="button" onClick={openCreate} className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-teal-700 sm:h-10 sm:w-auto">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : sizeCharts.length === 0 ? (
        <EmptyState
          className="min-h-[300px] bg-white"
          title="Belum ada size chart"
          description="Klik tombol Buat Size Chart untuk membuat yang pertama."
          action={
            <button type="button" onClick={openCreate} className="mt-1 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-3 text-xs font-bold text-white">
              <Plus className="h-4 w-4" /> Buat Size Chart
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sizeCharts.map((chart) => {
            const used = usageCount(chart.id);
            return (
              <article key={chart.id} className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double">
                <div className="flex items-start gap-3">
                  <img src="/img/shirt.jpg" alt="" className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-contain p-1" />
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-sm font-bold text-slate-900">{chart.nama}</h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">{used > 0 ? `Dipakai ${used} order` : 'Belum dipakai order'}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(chart);
                        setDialogOpen(true);
                      }}
                      aria-label={`Edit ${chart.nama}`}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(chart)}
                      aria-label={`Hapus ${chart.nama}`}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <table className="mt-3 w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[10.5px] uppercase tracking-wide text-slate-600">
                      <th className="rounded-l-lg px-2 py-1.5 text-left">Size</th>
                      <th className="px-2 py-1.5 text-right">Pjg</th>
                      <th className="rounded-r-lg px-2 py-1.5 text-right">Lbr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZES.map((s) => (
                      <tr key={s} className="border-b border-slate-100 last:border-0">
                        <td className="px-2 py-1 font-semibold text-slate-800">{s}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{chart.sizes?.[s]?.panjang ?? 0}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{chart.sizes?.[s]?.lebar ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            );
          })}
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
              {usageCount(deleteTarget.id) > 0 && ` ${usageCount(deleteTarget.id)} order yang memakainya tidak lagi menampilkan halaman size chart di techpack.`}
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

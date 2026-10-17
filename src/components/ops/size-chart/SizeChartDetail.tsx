'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Loader2, Pencil, Ruler, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SIZES } from '@/lib/legacy/calculations';
import type { LegacyOrder, SizeChart } from '@/lib/legacy/types';
import { cn } from '@/lib/utils';
import { SizeChartGuide, downloadSizeChartJpg, sizeChartFileName } from './SizeChartGuide';

function value(chart: SizeChart, size: string, key: 'panjang' | 'lebar'): number {
  return Number(chart.sizes?.[size]?.[key] ?? 0) || 0;
}

interface SizeChartDetailProps {
  chart: SizeChart;
  orders: LegacyOrder[];
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Panel detail satu size chart dengan poster Measurement Guide desain klien (17 Okt 2026) yang bisa diunduh
 * sebagai JPG untuk dikirim ke customer. Angka ukuran tidak diubah.
 */
export function SizeChartDetail({ chart, orders, onEdit, onDelete }: SizeChartDetailProps) {
  const recent = orders.slice(0, 6);
  const guideRef = useRef<SVGSVGElement>(null);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    if (!guideRef.current || downloading) return;
    setDownloading(true);
    try {
      await downloadSizeChartJpg(guideRef.current, sizeChartFileName(chart));
      toast.success('Size chart diunduh sebagai JPG.');
    } catch {
      toast.error('Gagal membuat JPG. Muat ulang halaman lalu coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card-double">
      <header className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-teal-700">Size Chart</p>
          <h2 className="mt-0.5 break-words text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">{chart.nama}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {orders.length > 0 ? `Dipakai di ${orders.length} order` : 'Belum dipakai order'} &bull; Satuan centimeter (cm)
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="col-span-2 inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-teal-700 bg-teal-600 px-4 text-xs font-medium text-white shadow-btn-primary hover:bg-teal-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 sm:h-10"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download JPG
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 text-xs text-teal-800 hover:bg-teal-100 sm:h-10 shadow-btn-secondary font-medium"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs text-rose-700 hover:bg-rose-100 sm:h-10 shadow-btn-secondary font-medium"
          >
            <Trash2 className="h-3.5 w-3.5" /> Hapus
          </button>
        </div>
      </header>

      <div className="space-y-4 p-3 sm:p-5">
        <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SizeChartGuide ref={guideRef} chart={chart} className="block h-auto w-full" />
        </figure>

        <div className="overflow-hidden rounded-2xl border border-slate-200 md:hidden">
          <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">Tabel ukuran untuk dibaca di HP</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2.5 text-left">Size</th>
                <th className="px-3 py-2.5 text-right">Panjang (cm)</th>
                <th className="px-3 py-2.5 text-right">Lebar (cm)</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {SIZES.map((s) => (
                <tr key={s} className="border-t border-slate-100">
                  <td className="px-3 py-2.5 font-sans font-bold text-slate-800">{s}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{value(chart, s, 'panjang')}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{value(chart, s, 'lebar')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 p-3.5 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-800">Order yang memakai size chart ini</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-600">{orders.length}</span>
          </div>
          {recent.length === 0 ? (
            <p className="text-xs text-slate-500">Belum ada order. Pilih size chart ini di form order agar tercetak di halaman 3 techpack.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/data-customer/${o.id}`}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs transition-colors hover:border-teal-300 hover:bg-teal-50/50"
                  >
                    <span className="shrink-0 font-extrabold text-teal-700">{o.noInv}</span>
                    <span className="min-w-0 truncate text-slate-600">{o.namaCustomer}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {orders.length > recent.length && <p className="mt-2 text-[11px] text-slate-500">+{orders.length - recent.length} order lainnya di Data Customer.</p>}
        </div>
      </div>
    </section>
  );
}

interface SizeChartListProps {
  charts: SizeChart[];
  selectedId: string | undefined;
  usage: (id: string) => number;
  onSelect: (id: string) => void;
}

/** Daftar size chart: baris geser di HP/tablet, kolom tetap di desktop. */
export function SizeChartList({ charts, selectedId, usage, onSelect }: SizeChartListProps) {
  return (
    <nav aria-label="Daftar size chart" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Daftar Size Chart</h2>
        <span className="text-[11px] font-bold tabular-nums text-slate-400">{charts.length}</span>
      </div>
      <ul className="-mx-3.5 flex gap-2.5 overflow-x-auto px-3.5 pb-1 sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible">
        {charts.map((chart) => {
          const active = chart.id === selectedId;
          const used = usage(chart.id);
          return (
            <li key={chart.id} className="min-w-[230px] lg:min-w-0">
              <button
                type="button"
                onClick={() => onSelect(chart.id)}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                  active ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-slate-200 bg-white hover:border-teal-300'
                )}
              >
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500')}>
                  <Ruler className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm font-bold text-slate-900">{chart.nama}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">{used > 0 ? `Dipakai ${used} order` : 'Belum dipakai'}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

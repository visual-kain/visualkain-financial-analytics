'use client';

import React from 'react';
import { MapPin, MessageCircle, Pencil, Phone, Trash2, UserRound } from 'lucide-react';
import { Shimmer } from '@/components/ui/shimmer';
import type { VendorDoc } from '@/lib/legacy/types';
import { buildWaChatUrl } from '@/lib/vendors';
import { cn } from '@/lib/utils';

export interface VendorListProps {
  vendors: VendorDoc[];
  orderCounts: Map<string, number>;
  /** False selama data order belum siap, saat jumlah pemakaian belum bisa dipastikan. */
  countsReady: boolean;
  loading: boolean;
  emptyState: React.ReactNode;
  onEdit: (vendor: VendorDoc) => void;
  onDelete: (vendor: VendorDoc) => void;
}

function OrderCount({ count, ready }: { count: number; ready: boolean }) {
  if (!ready) return <span className="text-slate-400">-</span>;
  return (
    <span
      className={cn(
        'inline-flex min-w-7 items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums',
        count > 0 ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 bg-slate-50 text-slate-500'
      )}
    >
      {count}
    </span>
  );
}

const TH = 'border-b border-slate-200 bg-slate-100 px-3 py-2.5 text-left align-bottom text-[10.5px] font-bold uppercase leading-tight tracking-wide text-slate-600';
const TD = 'border-b border-slate-100 px-3 py-3 align-top';
const TEXT = 'whitespace-normal break-words leading-snug';
const ICON_BTN = 'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-transform duration-150 active:scale-[0.96]';

/** Desktop: teks turun baris di lebar kolom (K-6); angka dan nomor tetap satu baris. */
export function VendorTable({ vendors, orderCounts, countsReady, loading, emptyState, onEdit, onDelete }: VendorListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-left text-xs text-slate-700">
        <thead>
          <tr>
            <th className={cn(TH, 'min-w-[120px]')}>Nama Vendor</th>
            <th className={cn(TH, 'min-w-[140px]')}>Alamat</th>
            <th className={cn(TH, 'min-w-[128px]')}>No. WhatsApp</th>
            <th className={cn(TH, 'min-w-[100px]')}>PIC</th>
            <th className={cn(TH, 'w-[64px] text-center')}>Order</th>
            <th className={cn(TH, 'w-[104px] text-center')}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((__, j) => (
                  <td key={j} className={TD}>
                    <Shimmer className="h-4 w-full rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : vendors.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-6">
                {emptyState}
              </td>
            </tr>
          ) : (
            vendors.map((vendor) => {
              const waUrl = buildWaChatUrl(vendor.wa);
              return (
                <tr key={vendor.id} className="transition-colors hover:bg-[#f6fbfb]">
                  <td className={cn(TD, TEXT, 'font-bold text-slate-900')}>{vendor.nama}</td>
                  <td className={cn(TD, TEXT, 'text-slate-600')}>{vendor.alamat || '-'}</td>
                  <td className={TD}>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="whitespace-nowrap tabular-nums">{vendor.wa || '-'}</span>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Chat WhatsApp ${vendor.nama}`}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          <MessageCircle className="h-3 w-3" /> Chat
                        </a>
                      )}
                    </div>
                  </td>
                  <td className={cn(TD, TEXT)}>{vendor.pic || '-'}</td>
                  <td className={cn(TD, 'text-center')}>
                    <OrderCount count={orderCounts.get(vendor.id) ?? 0} ready={countsReady} />
                  </td>
                  <td className={TD}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(vendor)}
                        title="Edit vendor"
                        aria-label={`Edit ${vendor.nama}`}
                        className={cn(ICON_BTN, 'border-teal-200 bg-teal-50/90 text-teal-700 hover:bg-teal-100')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(vendor)}
                        title="Hapus vendor"
                        aria-label={`Hapus ${vendor.nama}`}
                        className={cn(ICON_BTN, 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

const CARD_BTN = 'inline-flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold transition-transform duration-150 active:scale-[0.97]';

/** HP dan tablet: teks maksimal satu baris, lengkapnya ada di tooltip dan dialog edit (K-6). */
export function VendorCards({ vendors, orderCounts, countsReady, loading, emptyState, onEdit, onDelete }: VendorListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2" aria-busy="true" aria-label="Memuat vendor">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3.5">
            <Shimmer className="h-5 w-2/3 rounded" />
            <Shimmer className="h-3 w-full rounded" />
            <Shimmer className="h-3 w-3/4 rounded" />
            <Shimmer className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (vendors.length === 0) return <div className="p-3">{emptyState}</div>;

  return (
    <div className="grid grid-cols-1 gap-3 bg-slate-50/40 p-3 sm:grid-cols-2">
      {vendors.map((vendor) => {
        const waUrl = buildWaChatUrl(vendor.wa);
        return (
          <article
            key={vendor.id}
            className="flex min-w-0 flex-col gap-2.5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-card-double"
          >
            <div className="flex min-w-0 items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="min-w-0 truncate text-[13px] font-extrabold text-slate-900" title={vendor.nama}>
                {vendor.nama}
              </h3>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-slate-500">
                Order <OrderCount count={orderCounts.get(vendor.id) ?? 0} ready={countsReady} />
              </span>
            </div>

            <ul className="space-y-1.5 text-[11px] text-slate-600">
              <li className="flex min-w-0 items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span className="sr-only">Alamat:</span>
                <span className="truncate" title={vendor.alamat || undefined}>
                  {vendor.alamat || '-'}
                </span>
              </li>
              <li className="flex min-w-0 items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span className="sr-only">No. WhatsApp:</span>
                <span className="truncate tabular-nums">{vendor.wa || '-'}</span>
              </li>
              <li className="flex min-w-0 items-center gap-2">
                <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span className="sr-only">PIC:</span>
                <span className="truncate" title={vendor.pic || undefined}>
                  {vendor.pic || '-'}
                </span>
              </li>
            </ul>

            <div className="flex items-center gap-2 border-t border-slate-100 pt-2.5">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat WhatsApp ${vendor.nama}`}
                  className={cn(CARD_BTN, 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Chat
                </a>
              )}
              <button
                type="button"
                onClick={() => onEdit(vendor)}
                aria-label={`Edit ${vendor.nama}`}
                className={cn(CARD_BTN, 'border-teal-200 bg-teal-50/90 text-teal-700 hover:bg-teal-100')}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(vendor)}
                aria-label={`Hapus ${vendor.nama}`}
                className={cn(CARD_BTN, 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100')}
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

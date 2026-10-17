'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { OrderStatusBadge } from '@/components/ops/OrderStatusBadge';
import { formatShortIsoDate } from '@/lib/data-customer';
import { calculateTotals } from '@/lib/legacy/calculations';
import type { LegacyOrder } from '@/lib/legacy/types';
import { deadlineRadar, sleeveTotals, type DeadlineTone } from '@/lib/production-summary';
import { cn } from '@/lib/utils';
import { ChartCard, Well } from './ChartCard';

const SLEEVES = [
  { key: 'pendek', label: 'Pendek', color: '#14b8a6' },
  { key: 'tigaPerempat', label: '3/4 Tangan', color: '#0ea5e9' },
  { key: 'panjang', label: 'Panjang', color: '#6366f1' },
  { key: 'tanpaLengan', label: 'Tanpa Lengan', color: '#f59e0b' },
] as const;

const COUNTERS: Array<{
  tone: DeadlineTone;
  label: string;
  box: string;
  dot: string;
}> = [
  {
    tone: 'aman',
    label: 'Aman (>3 hari)',
    box: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  {
    tone: 'mendesak',
    label: 'Mendesak (H-3)',
    box: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  {
    tone: 'lewat',
    label: 'Telat',
    box: 'border-rose-200 bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
  },
];

const ROW_TONE: Record<DeadlineTone, { row: string; name: string; days: string }> = {
  lewat: {
    row: 'border-rose-200 bg-rose-50/50',
    name: 'text-rose-800',
    days: 'text-rose-600',
  },
  mendesak: {
    row: 'border-amber-200 bg-amber-50/40',
    name: 'text-amber-900',
    days: 'text-amber-600',
  },
  aman: {
    row: 'border-slate-200/80 bg-white',
    name: 'text-slate-900',
    days: 'text-emerald-600',
  },
};

/**
 * Pengganti OperationalRadarCard visualkaindb. Bilah proporsi HPP vs laba diganti proporsi qty aktif per jenis lengan
 * karena halaman produksi tidak memuat angka uang; penghitung deadline dan antrean tetap sama polanya.
 */
export function QueueRadarCard({ orders, today }: { orders: LegacyOrder[]; today: string }) {
  const radar = useMemo(() => deadlineRadar(orders, today), [orders, today]);
  const sleeve = useMemo(() => sleeveTotals(orders.filter((o) => o.status !== 'completed')), [orders]);
  const activeCount = radar.items.length + radar.undated.length;

  return (
    <ChartCard
      icon={CalendarClock}
      tone="border-indigo-200 bg-indigo-50 text-indigo-700"
      title="Struktur Qty & Antrean Produksi"
      subtitle={`Qty aktif per jenis lengan dan radar deadline • Hari ini ${formatShortIsoDate(today)}`}
      aside={
        <span
          className={cn(
            'rounded-lg border px-2.5 py-1 text-[11px] font-bold tabular-nums',
            radar.counts.lewat > 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'
          )}
        >
          {radar.counts.lewat > 0 ? `${radar.counts.lewat} Terlambat` : `${activeCount} Order Aktif`}
        </span>
      }
    >
      <Well>
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold">
          <span className="text-slate-600">Proporsi Qty Aktif per Jenis Lengan</span>
          <span className="font-mono tabular-nums text-indigo-700">{sleeve.total.toLocaleString('id-ID')} pcs</span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          {SLEEVES.map((s) =>
            sleeve[s.key] > 0 ? (
              <span
                key={s.key}
                title={`${s.label}: ${sleeve[s.key]} pcs`}
                style={{
                  width: `${(sleeve[s.key] / sleeve.total) * 100}%`,
                  background: s.color,
                }}
              />
            ) : null
          )}
        </div>
        <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
          {SLEEVES.map((s) => (
            <li key={s.key} className="min-w-0 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="truncate">{s.label}</span>
              </span>
              <span className="mt-0.5 block font-mono font-semibold tabular-nums text-slate-900">
                {sleeve[s.key]} pcs
                <span className="ml-1 font-normal text-slate-400">{sleeve.total > 0 ? `${Math.round((sleeve[s.key] / sleeve.total) * 100)}%` : '0%'}</span>
              </span>
            </li>
          ))}
        </ul>
      </Well>

      <div className="grid grid-cols-3 gap-2">
        {COUNTERS.map((c) => (
          <div key={c.tone} className={cn('flex min-w-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 text-center', c.box)}>
            <span className="flex items-center gap-1 text-[10.5px] font-semibold">
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', c.dot)} />
              <span className="truncate">{c.label}</span>
            </span>
            <strong className="font-mono text-lg font-semibold tabular-nums">{radar.counts[c.tone]}</strong>
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col border-t border-slate-100 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-900">Antrean Produksi Aktif ({activeCount} order)</span>
          <span className="text-[11px] text-slate-500">Status & sisa hari</span>
        </div>
        {activeCount > 0 ? (
          <ul className="max-h-[260px] space-y-1.5 overflow-y-auto pr-0.5">
            {radar.items.map(({ order, tone, label }) => (
              <QueueRow key={order.id} order={order} tone={tone} label={label} />
            ))}
            {radar.undated.map((order) => (
              <QueueRow key={order.id} order={order} tone="aman" label="Tanpa deadline" muted />
            ))}
          </ul>
        ) : (
          <p className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Tidak ada antrean pesanan aktif saat ini.
          </p>
        )}
      </div>
    </ChartCard>
  );
}

function QueueRow({ order, tone, label, muted = false }: { order: LegacyOrder; tone: DeadlineTone; label: string; muted?: boolean }) {
  const t = ROW_TONE[tone];
  return (
    <li>
      <Link
        href={`/data-customer/${order.id}`}
        className={cn('flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2 transition-colors hover:border-teal-300', t.row)}
      >
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <strong className={cn('truncate text-xs font-semibold', t.name)}>{order.namaCustomer || 'Tanpa Nama'}</strong>
            <span className="shrink-0 rounded-md border border-slate-200 bg-white/80 px-1.5 font-mono text-[10px] font-semibold text-slate-600">
              {order.noInv}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
            {String(order.kategoriOrder || 'Pesanan')} &bull;{' '}
            <span className="font-mono font-semibold text-slate-700">{calculateTotals(order).totalPesanan} pcs</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-right">
          <span>
            <span className={cn('block text-[11px] font-bold', muted ? 'text-slate-400' : t.days)}>{label}</span>
            <span className="block font-mono text-[10px] text-slate-400">{order.deadline ? `DL ${formatShortIsoDate(String(order.deadline))}` : 'DL -'}</span>
          </span>
          <span className="hidden sm:block">
            <OrderStatusBadge status={order.status} compact />
          </span>
        </span>
      </Link>
    </li>
  );
}

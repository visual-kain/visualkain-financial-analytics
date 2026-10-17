'use client';

import React, { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import type { LegacyOrder } from '@/lib/legacy/types';
import { leaderboard } from '@/lib/production-summary';
import { cn } from '@/lib/utils';
import { ChartCard, Segmented } from './ChartCard';

type Tab = 'customer' | 'bahan' | 'vendor';

const TABS: ReadonlyArray<{ value: Tab; label: string }> = [
  { value: 'customer', label: 'Customer' },
  { value: 'bahan', label: 'Bahan' },
  { value: 'vendor', label: 'Vendor' },
];

const EMPTY: Record<Tab, string> = {
  customer: 'Belum ada customer.',
  bahan: 'Belum ada data bahan.',
  vendor: 'Belum ada order yang punya vendor.',
};

/** Juara 1-3 memakai aksen emas, perak, perunggu seperti MarketLeaderboardBento visualkaindb. */
const MEDAL = [
  {
    row: 'border-amber-200 bg-amber-50/40',
    badge: 'border-amber-200 bg-amber-100 text-amber-800',
    bar: 'bg-amber-500',
  },
  {
    row: 'border-slate-200 bg-slate-50/60',
    badge: 'border-slate-200 bg-slate-100 text-slate-600',
    bar: 'bg-teal-500',
  },
  {
    row: 'border-orange-200 bg-orange-50/40',
    badge: 'border-orange-200 bg-orange-100 text-orange-700',
    bar: 'bg-teal-500',
  },
];
const PLAIN = {
  row: 'border-slate-200/80 bg-white',
  badge: 'border-slate-200 bg-slate-50 text-slate-500',
  bar: 'bg-teal-500',
};

/**
 * Leaderboard visualkaindb versi produksi: peringkat berdasarkan jumlah order (bukan omzet), dan tab Top Margin
 * diganti Vendor karena halaman ini tidak menampilkan angka uang.
 */
export function LeaderboardCard({ orders, getVendorName }: { orders: LegacyOrder[]; getVendorName: (id: string | undefined) => string }) {
  const [tab, setTab] = useState<Tab>('customer');
  const rows = useMemo(() => {
    if (tab === 'customer') return leaderboard(orders, (o) => String(o.namaCustomer || ''));
    if (tab === 'bahan') return leaderboard(orders, (o) => String(o.jenisBahan || ''));
    return leaderboard(orders, (o) => {
      const name = o.vendorId ? getVendorName(o.vendorId) : String(o.vendorName || '');
      return name === '-' ? '' : name;
    });
  }, [orders, tab, getVendorName]);

  return (
    <ChartCard
      icon={Trophy}
      tone="border-amber-200 bg-amber-50 text-amber-700"
      title="Leaderboard Order"
      subtitle="Peringkat customer, bahan, dan vendor berdasarkan jumlah order"
      aside={<Segmented label="Kategori peringkat" value={tab} onChange={setTab} options={TABS} />}
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">{EMPTY[tab]}</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r, i) => {
            const m = MEDAL[i] ?? PLAIN;
            return (
              <li key={r.label} className={cn('flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5', m.row)}>
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span
                    className={cn('flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg border font-mono text-[11px] font-semibold', m.badge)}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-900" title={r.label}>
                      {r.label}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      <span className="font-mono">{r.count}</span> order &bull; <span className="font-mono">{r.pcs.toLocaleString('id-ID')}</span> pcs
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-[13px] font-semibold tabular-nums text-slate-900">
                    {r.count} <span className="font-sans text-[11px] font-medium text-slate-500">order</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1 w-12 overflow-hidden rounded-full bg-slate-200 sm:w-14">
                      <span className={cn('block h-full rounded-full', m.bar)} style={{ width: `${r.ratio}%` }} />
                    </span>
                    <span
                      className="rounded-md border border-teal-200 bg-teal-50 px-1.5 font-mono text-[10px] font-semibold text-teal-700"
                      title="Porsi dari total pcs"
                    >
                      {r.sharePct}%
                    </span>
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </ChartCard>
  );
}

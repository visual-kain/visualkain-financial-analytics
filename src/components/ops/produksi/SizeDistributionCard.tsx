'use client';

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Ruler } from 'lucide-react';
import { CATEGORY_DISPLAY_ORDER, CATEGORY_LABELS, type CategoryType } from '@/lib/legacy/calculations';
import type { LegacyOrder } from '@/lib/legacy/types';
import { sizeDistribution, type SizeRow } from '@/lib/production-summary';
import { ChartCard, TooltipRow, TooltipShell } from './ChartCard';

const SLEEVE_COLORS: Record<CategoryType, string> = {
  pendek: '#14b8a6',
  tigaPerempat: '#0ea5e9',
  panjang: '#6366f1',
  tanpaLengan: '#f59e0b',
};

function SizeTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: SizeRow }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <TooltipShell title={`Ukuran ${row.size}`}>
      <div className="space-y-1">
        {CATEGORY_DISPLAY_ORDER.filter((c) => row[c] > 0).map((c) => (
          <TooltipRow key={c} label={CATEGORY_LABELS[c]} value={`${row[c]} pcs`} color={SLEEVE_COLORS[c]} />
        ))}
        <div className="border-t border-slate-700/70 pt-1">
          <TooltipRow label="Total" value={`${row.total} pcs`} />
        </div>
      </div>
    </TooltipShell>
  );
}

/** Kebutuhan potong per ukuran untuk order yang belum selesai, ditumpuk per jenis lengan. */
export function SizeDistributionCard({ orders }: { orders: LegacyOrder[] }) {
  const rows = useMemo(() => sizeDistribution(orders.filter((o) => o.status !== 'completed')), [orders]);
  const total = rows.reduce((acc, r) => acc + r.total, 0);
  const top = [...rows].sort((a, b) => b.total - a.total)[0];
  const used = CATEGORY_DISPLAY_ORDER.filter((c) => rows.some((r) => r[c] > 0));

  return (
    <ChartCard
      icon={Ruler}
      tone="border-teal-200 bg-teal-50 text-teal-700"
      title="Distribusi Ukuran Aktif"
      subtitle="Qty belum selesai per ukuran, ditumpuk per jenis lengan"
      aside={
        <span className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-teal-800">
          {total.toLocaleString('id-ID')} pcs
        </span>
      }
    >
      {total === 0 ? (
        <p className="py-10 text-center text-xs text-slate-500">Belum ada qty aktif.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[11px]">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {used.map((c) => (
                <span key={c} className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: SLEEVE_COLORS[c] }} />
                  {CATEGORY_LABELS[c]}
                </span>
              ))}
            </span>
            {top && (
              <span className="font-semibold text-slate-800">
                Terbanyak: <strong className="text-teal-700">{top.size}</strong> <span className="font-mono text-slate-500">({top.total} pcs)</span>
              </span>
            )}
          </div>
          <div className="h-[240px] w-full sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="size" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <YAxis width={38} allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<SizeTooltip />} cursor={{ fill: 'rgba(148,163,184,0.12)' }} />
                {used.map((c) => (
                  <Bar key={c} dataKey={c} stackId="size" fill={SLEEVE_COLORS[c]} maxBarSize={36} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </ChartCard>
  );
}

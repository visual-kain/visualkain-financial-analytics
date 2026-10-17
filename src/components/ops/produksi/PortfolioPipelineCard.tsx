'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, Layers } from 'lucide-react';
import { OrderStatusBadge } from '@/components/ops/OrderStatusBadge';
import { calculateTotals } from '@/lib/legacy/calculations';
import { STATUS_FILTER_LABELS, type LegacyOrder, type OrderStatus } from '@/lib/legacy/types';
import { categoryMix, pipelineCounts, type CategorySlice } from '@/lib/production-summary';
import { ChartCard, TooltipRow, TooltipShell, Well } from './ChartCard';

/** Palet kategori dan warna stasiun dari ProductionPortfolioMix visualkaindb. */
const CATEGORY_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6'];
const STAGE_COLORS: Record<OrderStatus, string> = {
  received: '#94a3b8',
  payment: '#f59e0b',
  approval: '#8b5cf6',
  production: '#3b82f6',
  delivery: '#10b981',
  completed: '#0d9488',
};

type Slice = CategorySlice & { color: string };

function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Slice }> }) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <TooltipShell title={s.name}>
      <div className="space-y-1">
        <TooltipRow label="Order" value={`${s.count} (${s.percentage}%)`} color={s.color} />
        <TooltipRow label="Volume" value={`${s.pcs.toLocaleString('id-ID')} pcs`} />
      </div>
    </TooltipShell>
  );
}

export function PortfolioPipelineCard({ orders }: { orders: LegacyOrder[] }) {
  const slices = useMemo<Slice[]>(
    () =>
      categoryMix(orders).map((c, i) => ({
        ...c,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      })),
    [orders]
  );
  const totalPcs = slices.reduce((acc, s) => acc + s.pcs, 0);
  const stages = useMemo(() => pipelineCounts(orders), [orders]);
  const active = useMemo(() => orders.filter((o) => o.status !== 'completed'), [orders]);

  return (
    <ChartCard
      icon={Layers}
      tone="border-sky-200 bg-sky-50 text-sky-700"
      title="Portofolio Kategori & Pipeline Produksi"
      subtitle="Distribusi jenis pakaian dan alur pengerjaan aktif"
      aside={
        <span className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold tabular-nums text-sky-800">
          {active.length} Order Aktif
        </span>
      }
    >
      <Well className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-5">
        <div className="relative h-[112px] sm:h-[135px]">
          {slices.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<DonutTooltip />} />
                <Pie data={slices} dataKey="count" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={3} stroke="none">
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-lg font-semibold leading-none tabular-nums text-slate-900 sm:text-xl">
              {totalPcs > 1000 ? `${(totalPcs / 1000).toFixed(1)}k` : totalPcs}
            </span>
            <span className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wide text-slate-500">Total Pcs</span>
          </div>
        </div>
        <ul className="min-w-0 space-y-1.5">
          {slices.slice(0, 4).map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="truncate font-semibold text-slate-800" title={s.name}>
                  {s.name}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2 tabular-nums">
                <span className="font-mono text-[11px] text-slate-500">{s.pcs} pcs</span>
                <span className="w-10 text-right font-mono font-semibold text-slate-900">{s.percentage}%</span>
              </span>
            </li>
          ))}
          {slices.length > 4 && <li className="text-[11px] text-slate-400">+{slices.length - 4} kategori lain</li>}
        </ul>
      </Well>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Alur Pipeline Produksi</span>
          <span className="text-[11px] text-slate-500">6 tahap alur kerja</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
          {stages.map((st) => {
            const on = st.count > 0;
            const c = STAGE_COLORS[st.status];
            return (
              <Link
                key={st.status}
                href={`/data-customer?status=${st.status}`}
                className="flex min-w-0 flex-col gap-0.5 rounded-xl border px-2 py-2 transition-all hover:-translate-y-0.5 sm:px-2.5"
                style={
                  on
                    ? {
                        borderColor: `${c}66`,
                        background: '#fff',
                        boxShadow: `0 2px 6px ${c}1f`,
                      }
                    : {
                        borderColor: 'rgba(15,23,42,0.07)',
                        background: '#f8fafc',
                      }
                }
              >
                <span className="flex items-center justify-between gap-1">
                  <span className="truncate text-[10.5px] font-semibold" style={{ color: on ? c : '#64748b' }}>
                    {STATUS_FILTER_LABELS[st.status]}
                  </span>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      background: on ? c : '#cbd5e1',
                      boxShadow: on ? `0 0 0 2px ${c}33` : undefined,
                    }}
                  />
                </span>
                <span className="flex items-baseline gap-1">
                  <strong className="font-mono text-[15px] font-semibold tabular-nums" style={{ color: on ? '#0f172a' : '#94a3b8' }}>
                    {st.count}
                  </strong>
                  <span className="truncate font-mono text-[10px] text-slate-500">{st.pcs > 0 ? `${st.pcs} pcs` : 'order'}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-900">Pesanan di Workshop ({active.length} order)</span>
          <span className="text-[11px] text-slate-500">Status aktual</span>
        </div>
        {active.length > 0 ? (
          <ul className="max-h-[168px] space-y-1.5 overflow-y-auto pr-0.5">
            {active.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/data-customer/${o.id}`}
                  className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 transition-colors hover:border-teal-300 hover:bg-teal-50/30"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <strong className="truncate text-xs font-semibold text-slate-900">{o.namaCustomer || 'Customer'}</strong>
                      <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-semibold text-slate-600">
                        {o.noInv}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {String(o.kategoriOrder || 'Pesanan')}
                      <span className="font-mono font-semibold"> ({calculateTotals(o).totalPesanan} pcs)</span>
                    </span>
                  </span>
                  <OrderStatusBadge status={o.status} compact className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Semua pesanan telah selesai diproduksi.
          </p>
        )}
      </div>
    </ChartCard>
  );
}

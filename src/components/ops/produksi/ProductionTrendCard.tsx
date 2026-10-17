'use client';

import React, { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronDown, Star, TrendingUp } from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import { todayInJakarta } from '@/lib/constants';
import type { LegacyOrder } from '@/lib/legacy/types';
import { adaptiveTicks, monthlyVolume, orderYears, peakMonth, summarizeYear, type MonthVolume } from '@/lib/production-summary';
import { cn } from '@/lib/utils';
import { ChartCard, Segmented, TooltipRow, TooltipShell } from './ChartCard';

type Metric = 'pcs' | 'count';
type Scale = 'adaptive' | 'linear';
type ChartType = 'area' | 'bar';

const METRIC = {
  pcs: {
    color: '#0d9488',
    legend: 'Volume Output (Pcs)',
    unit: 'pcs',
    floor: 100,
  },
  count: { color: '#0284c7', legend: 'Jumlah Order', unit: 'order', floor: 10 },
} as const;

const fmt = (n: number) => n.toLocaleString('id-ID');

function MiniKpi({
  title,
  badge,
  badgeTone,
  value,
  footLeft,
  footRight,
}: {
  title: string;
  badge: string;
  badgeTone: string;
  value: React.ReactNode;
  footLeft: React.ReactNode;
  footRight?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] sm:px-3.5 sm:py-3">
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <span className="max-w-full truncate text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</span>
        <span className={cn('max-w-full shrink-0 truncate rounded-full border px-1.5 py-px text-[10px] font-bold', badgeTone)}>{badge}</span>
      </div>
      <div className="mt-1 truncate font-mono text-lg font-semibold tracking-tight text-slate-900 tabular-nums sm:text-xl">{value}</div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2 text-[10.5px] text-slate-500">
        <span className="min-w-0 truncate">{footLeft}</span>
        {footRight && <span className="shrink-0 font-semibold text-teal-700">{footRight}</span>}
      </div>
    </div>
  );
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: MonthVolume }> }) {
  if (!active || !payload?.length) return null;
  const m = payload[0].payload;
  return (
    <TooltipShell title={m.label}>
      <div className="space-y-1">
        <TooltipRow label="Volume produksi" value={`${fmt(m.pcs)} pcs`} color={METRIC.pcs.color} />
        <TooltipRow label="Jumlah order" value={`${m.count} order`} color={METRIC.count.color} />
        {m.count > 0 && <TooltipRow label="Rata-rata / order" value={`${Math.round(m.pcs / m.count)} pcs`} />}
      </div>
    </TooltipShell>
  );
}

/**
 * Pengganti FinancialTrendChart visualkaindb untuk halaman produksi: hanya mode volume (pcs dan jumlah order)
 * karena Ringkasan Produksi tidak menampilkan angka uang (US-13.14).
 */
export function ProductionTrendCard({ orders }: { orders: LegacyOrder[] }) {
  const [metric, setMetric] = useState<Metric>('pcs');
  const [scale, setScale] = useState<Scale>('adaptive');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [showTable, setShowTable] = useState(false);
  const [yearPick, setYearPick] = useState('');

  const years = useMemo(() => orderYears(orders), [orders]);
  const year = years.includes(Number(yearPick)) ? Number(yearPick) : (years[0] ?? Number(todayInJakarta().slice(0, 4)));
  const months = useMemo(() => monthlyVolume(orders, year), [orders, year]);
  const summary = useMemo(() => summarizeYear(months), [months]);
  const prevPcs = useMemo(() => (years.includes(year - 1) ? summarizeYear(monthlyVolume(orders, year - 1)).pcs : 0), [orders, years, year]);
  const growth = prevPcs > 0 ? ((summary.pcs - prevPcs) / prevPcs) * 100 : null;
  const peak = peakMonth(months, metric);
  const peakPcs = peakMonth(months, 'pcs');
  const avg = metric === 'pcs' ? summary.avgPcsPerMonth : summary.avgCountPerMonth;
  const ticks = scale === 'adaptive' ? adaptiveTicks(Math.max(...months.map((m) => m[metric])), METRIC[metric].floor) : undefined;
  const color = METRIC[metric].color;
  const yearOptions = (years.length ? years : [year]).map((y) => ({
    value: String(y),
    label: `Tahun ${y}`,
  }));

  // Array berkunci, bukan Fragment: Recharts 2 hanya mengenali komponen yang menjadi anak langsung chart.
  const axes = [
    <CartesianGrid key="grid" stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />,
    <XAxis
      key="x"
      dataKey="label"
      tickFormatter={(v: string) => v.slice(0, 3)}
      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
      axisLine={{ stroke: '#cbd5e1' }}
      tickLine={false}
    />,
    <YAxis
      key="y"
      width={38}
      scale={scale === 'adaptive' ? 'sqrt' : 'linear'}
      domain={[0, 'dataMax']}
      ticks={ticks}
      allowDecimals={false}
      tick={{ fontSize: 10, fill: '#64748b' }}
      axisLine={false}
      tickLine={false}
    />,
    <Tooltip key="tip" content={<TrendTooltip />} cursor={chartType === 'bar' ? { fill: 'rgba(148,163,184,0.12)' } : { stroke: '#cbd5e1' }} />,
    avg > 0 ? <ReferenceLine key="avg" y={avg} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} /> : null,
  ];

  return (
    <ChartCard
      icon={TrendingUp}
      tone="border-teal-200 bg-teal-50 text-teal-700"
      title="Tren Kapasitas Produksi"
      subtitle="Volume output dan jumlah order per bulan (berdasarkan tanggal invoice)"
      aside={
        <>
          <Segmented
            label="Metrik"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'pcs', label: 'Volume Pcs' },
              { value: 'count', label: 'Jumlah Order' },
            ]}
          />
          <Segmented
            label="Skala"
            value={scale}
            onChange={setScale}
            options={[
              {
                value: 'adaptive',
                label: 'Adaptif',
                title: 'Skala akar: bulan bervolume kecil tetap terbaca di samping lonjakan',
              },
              { value: 'linear', label: 'Linier' },
            ]}
          />
          <Segmented
            label="Jenis grafik"
            value={chartType}
            onChange={setChartType}
            options={[
              { value: 'area', label: 'Area' },
              { value: 'bar', label: 'Batang' },
            ]}
          />
          <CustomSelect aria-label="Tahun" value={String(year)} onValueChange={setYearPick} options={yearOptions} className="h-10 w-[128px]" />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <MiniKpi
          title={`Volume ${year}`}
          badge={growth === null ? 'Aktif' : `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% vs thn lalu`}
          badgeTone={growth !== null && growth < 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-teal-200 bg-teal-50 text-teal-800'}
          value={
            <>
              {fmt(summary.pcs)} <span className="text-xs font-semibold text-slate-500">pcs</span>
            </>
          }
          footLeft={
            <>
              Order masuk <strong className="font-mono text-slate-800">{summary.count}</strong>
            </>
          }
        />
        <MiniKpi
          title="Rata-rata / Bulan"
          badge={`${summary.activeMonths} bln aktif`}
          badgeTone="border-slate-200 bg-white text-slate-600"
          value={
            <>
              {fmt(summary.avgPcsPerMonth)} <span className="text-xs font-semibold text-slate-500">pcs</span>
            </>
          }
          footLeft={
            <>
              Estimasi tahunan <strong className="font-mono text-slate-800">{fmt(summary.avgPcsPerMonth * 12)}</strong> pcs
            </>
          }
        />
        <MiniKpi
          title="Rata-rata / Order"
          badge={`${summary.count} order`}
          badgeTone="border-sky-200 bg-sky-50 text-sky-800"
          value={
            <>
              {fmt(summary.avgPcsPerOrder)} <span className="text-xs font-semibold text-slate-500">pcs</span>
            </>
          }
          footLeft={
            <>
              ± <strong className="font-mono text-slate-800">{summary.avgCountPerMonth.toLocaleString('id-ID')}</strong> order / bulan
            </>
          }
        />
        <MiniKpi
          title="Bulan Puncak"
          badge={peakPcs ? `${fmt(peakPcs.pcs)} pcs` : '-'}
          badgeTone="border-amber-200 bg-amber-50 text-amber-800"
          value={<span className="font-sans">{peakPcs?.label ?? '-'}</span>}
          footLeft={peakPcs ? `${peakPcs.count} order di bulan ini` : 'Belum ada order'}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            {METRIC[metric].legend}
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-3.5 border-t-2 border-dashed border-slate-400" />
            Garis rata-rata: <span className="font-mono">{avg.toLocaleString('id-ID')}</span> {METRIC[metric].unit}
          </span>
          {scale === 'adaptive' && <span className="rounded-md bg-teal-50 px-1.5 py-0.5 font-semibold text-teal-700">Skala adaptif aktif</span>}
        </div>
        {peak && (
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            Puncak:
            <strong style={{ color }}>
              {peak.label} ({fmt(peak[metric])} {METRIC[metric].unit})
            </strong>
          </span>
        )}
      </div>

      <div className="h-[240px] w-full sm:h-[270px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={months} margin={{ top: 12, right: 8, left: -6, bottom: 0 }}>
              <defs>
                <linearGradient id="prodTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.32} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              {axes}
              <Area
                type="monotone"
                dataKey={metric}
                stroke={color}
                strokeWidth={2.5}
                fill="url(#prodTrendFill)"
                dot={{ r: 3.5, fill: color, strokeWidth: 1.5, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={months} margin={{ top: 12, right: 8, left: -6, bottom: 0 }}>
              {axes}
              <Bar dataKey={metric} fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          aria-expanded={showTable}
          onClick={() => setShowTable((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between gap-2 text-xs font-bold text-teal-700 hover:text-teal-800"
        >
          <span className="flex items-center gap-1.5">
            <ChevronDown className={cn('h-4 w-4 transition-transform', !showTable && '-rotate-90')} aria-hidden />
            {showTable ? 'Sembunyikan rincian bulanan' : 'Lihat rincian bulanan'}
          </span>
          <span className="text-[11px] font-medium text-slate-400">{showTable ? 'Tutup tabel' : '12 bulan'}</span>
        </button>
        {showTable && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[420px] text-xs">
              <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-bold">Bulan</th>
                  <th className="px-3 py-2 text-center font-bold">Order</th>
                  <th className="px-3 py-2 text-right font-bold">Produksi</th>
                  <th className="px-3 py-2 text-right font-bold">Pcs / Order</th>
                  <th className="px-3 py-2 text-right font-bold">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {months.map((m) => (
                  <tr key={m.month0} className={cn(m.count === 0 && 'text-slate-400')}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{m.label}</td>
                    <td className="px-3 py-2 text-center font-mono tabular-nums">{m.count}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-teal-700">{m.pcs > 0 ? `${fmt(m.pcs)} pcs` : '-'}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{m.count > 0 ? Math.round(m.pcs / m.count) : '-'}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {summary.pcs > 0 && m.pcs > 0 ? `${((m.pcs / summary.pcs) * 100).toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-900">
                <tr>
                  <td className="px-3 py-2">Total {year}</td>
                  <td className="px-3 py-2 text-center font-mono tabular-nums">{summary.count}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{fmt(summary.pcs)} pcs</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{summary.avgPcsPerOrder || '-'}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{summary.pcs > 0 ? '100%' : '-'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </ChartCard>
  );
}

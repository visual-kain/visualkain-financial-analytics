'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatRupiah, formatCompactRupiah } from '@/lib/utils';
import { ChartSkeleton } from '@/components/ui/shimmer';
import { TrendingUp, PieChart as PieIcon, Info } from 'lucide-react';

export interface TrendDataPoint {
  periode: string;
  kasMasuk: number;
  kasKeluar: number;
  netCash: number;
}

export interface DonutDataPoint {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsChartsProps {
  trendData?: TrendDataPoint[];
  donutData?: DonutDataPoint[];
  isLoading?: boolean;
}

const defaultTrendData: TrendDataPoint[] = [
  { periode: '1 Okt', kasMasuk: 1200000, kasKeluar: 600000, netCash: 600000 },
  { periode: '2 Okt', kasMasuk: 850000, kasKeluar: 400000, netCash: 450000 },
  { periode: '3 Okt', kasMasuk: 2100000, kasKeluar: 950000, netCash: 1150000 },
  { periode: '4 Okt', kasMasuk: 1420000, kasKeluar: 986000, netCash: 434000 },
  { periode: '5 Okt', kasMasuk: 950000, kasKeluar: 300000, netCash: 650000 },
  { periode: '6 Okt', kasMasuk: 1800000, kasKeluar: 800000, netCash: 1000000 },
  { periode: '7 Okt', kasMasuk: 2400000, kasKeluar: 1200000, netCash: 1200000 },
];

const defaultDonutData: DonutDataPoint[] = [
  { name: 'Hak Pokok Vendor (HPP)', value: 686000, color: '#f59e0b' },
  { name: 'Saldo Margin VisualKain', value: 434000, color: '#10b981' },
];

export function AnalyticsCharts({
  trendData = defaultTrendData,
  donutData = defaultDonutData,
  isLoading = false,
}: AnalyticsChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartSkeleton title="Tren Arus Kas Riil (Inflow vs Outflow)" />
        </div>
        <div>
          <ChartSkeleton title="Alokasi Dana: Vendor vs Margin" />
        </div>
      </div>
    );
  }

  const totalAlokasi = donutData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Grafik Tren Arus Kas Riil (Spline Area Chart) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card-double lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Tren Arus Kas Riil (Inflow vs Outflow)
              </h3>
              <p className="text-xs text-slate-400">
                Penerimaan kas bersih terhadap realisasi beban kas harian
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Kas Masuk
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              Kas Keluar
            </span>
          </div>
        </div>

        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 12, right: 15, left: 10, bottom: 4 }}>
              <defs>
                <linearGradient id="gradientMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="periode"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                dy={4}
              />
              <YAxis
                width={72}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                tickFormatter={formatCompactRupiah}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TrendDataPoint;
                    return (
                      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/95 p-3 text-xs text-white shadow-xl backdrop-blur-md">
                        <div className="font-semibold text-slate-300">{data.periode}</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between gap-4 text-emerald-400">
                            <span>Kas Masuk:</span>
                            <span className="tabular-nums font-semibold">
                              {formatRupiah(data.kasMasuk)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-rose-400">
                            <span>Kas Keluar:</span>
                            <span className="tabular-nums font-semibold">
                              {formatRupiah(data.kasKeluar)}
                            </span>
                          </div>
                          <div className="border-t border-slate-700 pt-1 text-slate-200 flex items-center justify-between gap-4">
                            <span>Net Kas:</span>
                            <span className="tabular-nums font-semibold">
                              {formatRupiah(data.netCash)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="kasMasuk"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradientMasuk)"
              />
              <Area
                type="monotone"
                dataKey="kasKeluar"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradientKeluar)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Donut Chart Alokasi Kantong Dana: Hak Pokok Vendor vs Margin */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card-double">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <PieIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Alokasi Hak Dana (Escrow)
            </h3>
            <p className="text-xs text-slate-400">
              Proporsi Pokok Vendor vs Margin Bersih
            </p>
          </div>
        </div>

        <div className="relative mt-2 flex h-56 items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                innerRadius={60}
                outerRadius={84}
                paddingAngle={4}
                dataKey="value"
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 text-xs text-white shadow-xl backdrop-blur-md">
                        <div className="font-semibold">{data.name}</div>
                        <div className="mt-1 font-mono font-bold text-amber-400">
                          {formatRupiah(Number(data.value))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Total Dana
            </span>
            <span className="font-mono text-xs font-bold text-slate-800">
              {formatRupiah(totalAlokasi)}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
          {donutData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600">{item.name}</span>
              </div>
              <span className="font-mono font-semibold text-slate-800">
                {formatRupiah(item.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Audit Transparency Note (Menjawab feedback client: "data ini dr mana") */}
        <div className="mt-3.5 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-500 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Info className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>Transparansi Sumber & Formula Data</span>
          </div>
          <p className="text-[10.5px] leading-relaxed text-slate-600">
            Dihitung otomatis dari akumulasi uang masuk customer pada order periode aktif:
          </p>
          <div className="space-y-1 text-[10px] font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60">
            <div>&bull; <strong className="text-amber-700">Hak Vendor (HPP)</strong> = &Sigma; (Uang Masuk &times; (HPP &divide; Total Order))</div>
            <div>&bull; <strong className="text-emerald-700">Margin VisualKain</strong> = &Sigma; (Uang Masuk &times; (Laba &divide; Total Order))</div>
          </div>
        </div>
      </div>
    </div>
  );
}

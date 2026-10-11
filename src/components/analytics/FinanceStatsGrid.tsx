'use client';

import React, { useState, useMemo } from 'react';
import { formatRupiah, formatCompactRupiah } from '@/lib/utils';
import type { FinancialSummary, MetricDrawerType, Order } from '@/types';
import { MetricCardSkeleton } from '@/components/ui/shimmer';
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  ClockAlert,
  HandCoins,
  Receipt,
  ArrowRight,
} from 'lucide-react';

interface FinanceStatsGridProps {
  summary?: FinancialSummary;
  isLoading?: boolean;
  orders?: Order[];
  orderCountWithDebt?: number;
  activeOrderCount?: number;
  onSelectMetric?: (metric: MetricDrawerType) => void;
}

export function FinanceStatsGrid({
  summary,
  isLoading = false,
  orders = [],
  orderCountWithDebt = 4,
  activeOrderCount = 6,
  onSelectMetric,
}: FinanceStatsGridProps) {


  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* 1. Omzet (Realtime) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectMetric?.('omzet')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('omzet')}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-card-hover cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-lg p-2 bg-sky-50 text-sky-600">
              <Receipt className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                Realtime
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-600" />
            </div>
          </div>
          <h4 className="mt-3 text-xs font-semibold text-slate-500">
            Omzet (Realtime)
          </h4>
          <div className="mt-1 text-lg font-bold tracking-tight text-slate-900 tabular-nums">
            {formatRupiah(summary.omzetTotal)}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 font-medium">
          {summary.omzetLunasCount} lunas + {summary.omzetBerjalanCount} berjalan
        </p>
      </div>

      {/* 2. Profit (Realtime) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectMetric?.('profit')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('profit')}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-card-hover cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-lg p-2 bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Net Margin
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
            </div>
          </div>
          <h4 className="mt-3 text-xs font-semibold text-slate-500">
            Profit (Realtime)
          </h4>
          <div className="mt-1 text-lg font-bold tracking-tight text-emerald-700 tabular-nums">
            {formatRupiah(summary.totalProfitRealtime)}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 font-medium">
          Margin {summary.profitMarginPercent.toFixed(1)}%
        </p>
      </div>

      {/* 3. Saldo Periode */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectMetric?.('saldo')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('saldo')}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-card-hover cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-lg p-2 bg-teal-50 text-teal-600">
              <Wallet className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                Kas Riil
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600" />
            </div>
          </div>
          <h4 className="mt-3 text-xs font-semibold text-slate-500">
            Saldo Periode
          </h4>
          <div className="mt-1 text-lg font-bold tracking-tight text-slate-900 tabular-nums">
            {formatRupiah(summary.saldoKasRiil)}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 font-medium truncate" title={`Masuk ${formatCompactRupiah(summary.totalKasMasuk)} - Vendor ${formatCompactRupiah(summary.totalDibayarKeVendor)} - Cashout ${formatCompactRupiah(summary.bebanOperasionalNonVendor)}`}>
          Masuk {formatCompactRupiah(summary.totalKasMasuk)} - Vendor {formatCompactRupiah(summary.totalDibayarKeVendor)} - Cashout {formatCompactRupiah(summary.bebanOperasionalNonVendor)}
        </p>
      </div>

      {/* 4. Uang Keluar */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectMetric?.('cashout')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('cashout')}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-card-hover cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-lg p-2 bg-rose-50 text-rose-600">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                Outflow
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-600" />
            </div>
          </div>
          <h4 className="mt-3 text-xs font-semibold text-slate-500">
            Uang Keluar
          </h4>
          <div className="mt-1 text-lg font-bold tracking-tight text-slate-900 tabular-nums">
            {formatRupiah(summary.totalKasKeluar)}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 font-medium">
          {summary.kasKeluarCount} transaksi — klik detail
        </p>
      </div>

      {/* 5. Utang Vendor */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectMetric?.('vendor_debt')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('vendor_debt')}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-card-hover cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-lg p-2 bg-amber-50 text-amber-600">
              <ClockAlert className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                Kewajiban
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600" />
            </div>
          </div>

          <h4 className="mt-3 text-xs font-semibold text-slate-500">
            Utang Vendor
          </h4>

          <div className="mt-1 text-lg font-bold tracking-tight text-slate-900 tabular-nums">
            {formatRupiah(summary.totalUtangVendor)}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 font-medium">
          {summary.vendorDebtCount} PO berjalan
        </p>
      </div>

      {/* 6. Outstanding Customer */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectMetric?.('outstanding')}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('outstanding')}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-card-hover cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center rounded-lg p-2 bg-indigo-50 text-indigo-600">
              <HandCoins className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                Hak Tagih
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
            </div>
          </div>
          <h4 className="mt-3 text-xs font-semibold text-slate-500">
            Outstanding Customer
          </h4>
          <div className="mt-1 text-lg font-bold tracking-tight text-slate-900 tabular-nums">
            {formatRupiah(summary.totalPiutangCustomer)}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 font-medium">
          {summary.unpaidCustomerCount} order belum lunas
        </p>
      </div>
    </div>
  );
}

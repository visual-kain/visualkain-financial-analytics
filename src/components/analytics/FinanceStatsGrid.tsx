'use client';

import React from 'react';
import { formatRupiah, formatCompactRupiah, cn } from '@/lib/utils';
import type { FinancialSummary, MetricDrawerType, Order } from '@/types';
import { MetricCardSkeleton } from '@/components/ui/shimmer';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ClockAlert,
  HandCoins,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
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
  onSelectMetric,
}: FinanceStatsGridProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const isSaldoMinus = summary.saldoKasRiil < 0;
  const isProfitMinus = summary.totalProfitRealtime < 0;
  const danaTersedia = summary.saldoKasRiil;
  const hutangVendor = summary.totalUtangVendor;
  const selisihCover = danaTersedia - hutangVendor;
  const isTercover = selisihCover >= 0;
  const persenTercover =
    hutangVendor > 0
      ? Math.max(0, Math.min(100, (Math.max(0, danaTersedia) / hutangVendor) * 100))
      : 100;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Dana Masuk */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMetric?.('cashin')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('cashin')}
          className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-card-hover cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-lg p-1.5 sm:p-2 bg-emerald-50 text-emerald-600">
                <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700">
                  Kas Masuk
                </span>
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
              </div>
            </div>
            <h4 className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              Dana Masuk
            </h4>
            <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tracking-tight text-emerald-700 tabular-nums truncate">
              {formatRupiah(summary.totalKasMasuk)}
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            DP / pelunasan order & kas masuk
          </p>
        </div>

        {/* 2. Dana Keluar */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMetric?.('cashout')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('cashout')}
          className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-card-hover cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-lg p-1.5 sm:p-2 bg-rose-50 text-rose-600">
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="rounded-full border border-rose-200 bg-rose-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-rose-700">
                  Kas Keluar
                </span>
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-600" />
              </div>
            </div>
            <h4 className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              Dana Keluar
            </h4>
            <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tracking-tight text-rose-600 tabular-nums truncate">
              {formatRupiah(summary.totalKasKeluar)}
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            {summary.kasKeluarCount} transaksi (vendor & kas)
          </p>
        </div>

        {/* 3. Dana Tersedia (Saldo Kas) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMetric?.('saldo')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('saldo')}
          className={cn(
            'group relative flex flex-col justify-between rounded-2xl border bg-white p-3 sm:p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 cursor-pointer',
            isSaldoMinus
              ? 'border-rose-200/90 hover:border-rose-300 hover:shadow-card-hover'
              : 'border-slate-200/90 hover:border-teal-300 hover:shadow-card-hover'
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'inline-flex items-center rounded-lg p-1.5 sm:p-2 transition-colors',
                  isSaldoMinus ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : 'bg-teal-50 text-teal-600'
                )}
              >
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span
                  className={cn(
                    'rounded-full border px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold transition-colors',
                    isSaldoMinus
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-teal-200 bg-teal-50 text-teal-700'
                  )}
                >
                  {isSaldoMinus ? 'Defisit Kas' : 'Dana Ada'}
                </span>
                <ArrowRight
                  className={cn(
                    'h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-0.5',
                    isSaldoMinus ? 'text-rose-300 group-hover:text-rose-600' : 'text-slate-300 group-hover:text-teal-600'
                  )}
                />
              </div>
            </div>
            <h4 className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              Dana Tersedia (Saldo Kas)
            </h4>
            <div
              className={cn(
                'mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tracking-tight tabular-nums truncate',
                isSaldoMinus ? 'text-rose-600' : 'text-slate-900'
              )}
            >
              {formatRupiah(summary.saldoKasRiil)}
            </div>
          </div>
          <p
            className={cn(
              'mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] font-medium truncate',
              isSaldoMinus ? 'text-rose-500 font-semibold' : 'text-slate-400'
            )}
            title={`Masuk ${formatCompactRupiah(summary.totalKasMasuk)} - Keluar ${formatCompactRupiah(summary.totalKasKeluar)}`}
          >
            Masuk {formatCompactRupiah(summary.totalKasMasuk)} - Keluar {formatCompactRupiah(summary.totalKasKeluar)}
          </p>
        </div>

        {/* 4. Sisa Customer (Piutang) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMetric?.('outstanding')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('outstanding')}
          className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-card-hover cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-lg p-1.5 sm:p-2 bg-indigo-50 text-indigo-600">
                <HandCoins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-indigo-700">
                  Tagihan
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
              </div>
            </div>
            <h4 className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              Sisa Customer (Piutang)
            </h4>
            <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tracking-tight text-slate-900 tabular-nums truncate">
              {formatRupiah(summary.totalPiutangCustomer)}
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            {summary.unpaidCustomerCount} order belum lunas
          </p>
        </div>

        {/* 5. Sisa Hutang ke Vendor */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMetric?.('vendor_debt')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('vendor_debt')}
          className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-card-hover cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-lg p-1.5 sm:p-2 bg-amber-50 text-amber-600">
                <ClockAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-700">
                  Kewajiban
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600" />
              </div>
            </div>
            <h4 className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              Sisa Hutang ke Vendor
            </h4>
            <div className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tracking-tight text-slate-900 tabular-nums truncate">
              {formatRupiah(summary.totalUtangVendor)}
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            {summary.vendorDebtCount} PO belum lunas
          </p>
        </div>

        {/* 6. Profit & Omzet (Realtime) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMetric?.('profit')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectMetric?.('profit')}
          className={cn(
            'group relative flex flex-col justify-between rounded-2xl border bg-white p-3 sm:p-4 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 cursor-pointer',
            isProfitMinus
              ? 'border-rose-200/90 hover:border-rose-300 hover:shadow-card-hover'
              : 'border-slate-200/90 hover:border-sky-300 hover:shadow-card-hover'
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'inline-flex items-center rounded-lg p-1.5 sm:p-2 transition-colors',
                  isProfitMinus ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : 'bg-sky-50 text-sky-600'
                )}
              >
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span
                  className={cn(
                    'rounded-full border px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold transition-colors',
                    isProfitMinus
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-sky-200 bg-sky-50 text-sky-700'
                  )}
                >
                  Margin {summary.profitMarginPercent.toFixed(0)}%
                </span>
                <ArrowRight
                  className={cn(
                    'h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-0.5',
                    isProfitMinus ? 'text-rose-300 group-hover:text-rose-600' : 'text-slate-300 group-hover:text-sky-600'
                  )}
                />
              </div>
            </div>
            <h4 className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
              Profit & Omzet
            </h4>
            <div
              className={cn(
                'mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold tracking-tight tabular-nums truncate',
                isProfitMinus ? 'text-rose-600' : 'text-slate-900'
              )}
            >
              {formatRupiah(summary.totalProfitRealtime)}
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            Omzet {formatCompactRupiah(summary.omzetTotal)} ({summary.omzetLunasCount + summary.omzetBerjalanCount} order)
          </p>
        </div>
      </div>

      {/* Ringkasan Langsung: Apakah Dana yang Ada Bisa Tercover ke Hutang Vendor & Sisanya Berapa */}
      <div
        className={cn(
          'rounded-2xl border p-3.5 sm:p-4 shadow-card-double transition-all',
          isTercover
            ? 'border-emerald-200/90 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/30'
            : 'border-amber-200/90 bg-gradient-to-r from-amber-50/70 via-white to-rose-50/30'
        )}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Status Cover Hutang Vendor & Sisa Dana
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
                  isTercover
                    ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                    : 'border-amber-300 bg-amber-100 text-amber-900'
                )}
              >
                {isTercover ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    TERCOVER PENUH (100%)
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                    BELUM TERCOVER PENUH ({persenTercover.toFixed(1)}%)
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isTercover ? (
                <>
                  Dana yang ada saat ini (
                  <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(danaTersedia)}</span>) cukup
                  untuk melunasi seluruh sisa hutang ke vendor (
                  <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(hutangVendor)}</span>) dengan
                  sisa bersih{' '}
                  <span className="font-bold text-emerald-700 tabular-nums">+{formatRupiah(selisihCover)}</span>.
                </>
              ) : (
                <>
                  Dana yang ada saat ini (
                  <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(danaTersedia)}</span>) belum
                  cukup menutup sisa hutang ke vendor (
                  <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(hutangVendor)}</span>).
                  Kurang{' '}
                  <span className="font-bold text-rose-600 tabular-nums">
                    {formatRupiah(Math.abs(selisihCover))}
                  </span>
                  , namun masih ada sisa tagihan customer{' '}
                  <span className="font-bold text-indigo-700 tabular-nums">
                    {formatRupiah(summary.totalPiutangCustomer)}
                  </span>{' '}
                  yang belum cair.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 lg:min-w-[540px]">
            <div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Dana yang Ada
              </div>
              <div className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">
                {formatRupiah(danaTersedia)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Sisa Hutang Vendor
              </div>
              <div className="mt-0.5 text-sm font-bold text-amber-700 tabular-nums">
                {formatRupiah(hutangVendor)}
              </div>
            </div>
            <div
              className={cn(
                'rounded-xl border px-3 py-2',
                isTercover
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-rose-200 bg-rose-50/70'
              )}
            >
              <div
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider',
                  isTercover ? 'text-emerald-700' : 'text-rose-700'
                )}
              >
                {isTercover ? 'Sisa Dana Bersih' : 'Kekurangan Cover Hutang'}
              </div>
              <div
                className={cn(
                  'mt-0.5 text-sm font-bold tabular-nums',
                  isTercover ? 'text-emerald-800' : 'text-rose-700'
                )}
              >
                {isTercover
                  ? `+${formatRupiah(selisihCover)}`
                  : `-${formatRupiah(Math.abs(selisihCover))}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

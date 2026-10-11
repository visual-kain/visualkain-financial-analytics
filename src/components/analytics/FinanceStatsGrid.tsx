'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils';
import type { FinancialSummary } from '@/types';
import { MetricCardSkeleton } from '@/components/ui/shimmer';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ClockAlert,
  HandCoins,
  TrendingUp,
} from 'lucide-react';

interface FinanceStatsGridProps {
  summary?: FinancialSummary;
  isLoading?: boolean;
  orderCountWithDebt?: number;
  activeOrderCount?: number;
}

export function FinanceStatsGrid({
  summary,
  isLoading = false,
  orderCountWithDebt = 4,
  activeOrderCount = 6,
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

  const cards = [
    {
      id: 'saldo-kas',
      title: 'Saldo Kas VisualKain',
      amount: summary.saldoKasRiil,
      subtitle: 'Kas Masuk - Kas Keluar (Sinkron Bank)',
      icon: Wallet,
      accent: 'emerald',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'Kas Riil',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'uang-masuk',
      title: 'Total Uang Masuk',
      amount: summary.totalKasMasuk,
      subtitle: 'Akumulasi DP & cicilan konsumen',
      icon: ArrowDownLeft,
      accent: 'teal',
      iconBg: 'bg-teal-50 text-teal-600',
      badge: 'Inflow',
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      id: 'uang-keluar',
      title: 'Total Uang Keluar',
      amount: summary.totalKasKeluar,
      subtitle: 'Beban operasional & vendor',
      icon: ArrowUpRight,
      accent: 'rose',
      iconBg: 'bg-rose-50 text-rose-600',
      badge: 'Outflow',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'utang-vendor',
      title: 'Total Utang Vendor',
      amount: summary.totalUtangVendor,
      subtitle: `Dari ${orderCountWithDebt} pesanan proses vendor`,
      icon: ClockAlert,
      accent: 'amber',
      iconBg: 'bg-amber-50 text-amber-600',
      badge: 'Kewajiban',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'piutang-customer',
      title: 'Total Piutang Konsumen',
      amount: summary.totalPiutangCustomer,
      subtitle: `Dari ${activeOrderCount} invoice aktif`,
      icon: HandCoins,
      accent: 'sky',
      iconBg: 'bg-sky-50 text-sky-600',
      badge: 'Hak Tagih',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'estimasi-profit',
      title: 'Estimasi Profit Bersih',
      amount: summary.estimasiProfitBersih,
      subtitle: 'Margin riil - beban operasional',
      icon: TrendingUp,
      accent: 'emerald',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'Net Margin',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double transition-all duration-200 hover:shadow-card-hover hover:border-slate-300"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center rounded-lg p-2 ${card.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${card.badgeClass}`}>
                  {card.badge}
                </span>
              </div>
              <h4 className="mt-3 text-xs font-medium text-slate-500">
                {card.title}
              </h4>
              <div className="mt-1 text-lg font-bold tracking-tight text-slate-900 tabular-nums">
                {formatRupiah(card.amount)}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}

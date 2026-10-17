'use client';

import React, { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, Hourglass, Plus, Scissors, Truck } from 'lucide-react';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { LeaderboardCard } from '@/components/ops/produksi/LeaderboardCard';
import { PortfolioPipelineCard } from '@/components/ops/produksi/PortfolioPipelineCard';
import { ProductionTrendCard } from '@/components/ops/produksi/ProductionTrendCard';
import { QueueRadarCard } from '@/components/ops/produksi/QueueRadarCard';
import { SizeDistributionCard } from '@/components/ops/produksi/SizeDistributionCard';
import { EmptyState } from '@/components/ui/empty-state';
import { Shimmer } from '@/components/ui/shimmer';
import { useOpsData } from '@/context/OpsDataContext';
import { todayInJakarta } from '@/lib/constants';
import { isArchivedOrder } from '@/lib/order-form';
import { computeKpi } from '@/lib/production-summary';
import { cn } from '@/lib/utils';

const SCOPES = ['current', 'all'] as const;

function KpiCard({ icon: Icon, tone, title, value, hint, href }: { icon: typeof Scissors; tone: string; title: string; value: React.ReactNode; hint: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 shadow-card-double transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-card-hover sm:p-4"
    >
      <div className="flex items-center justify-between">
        <span className={cn('inline-flex items-center rounded-lg p-1.5 sm:p-2', tone)}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600" />
      </div>
      <h3 className="mt-2 truncate text-[11px] font-semibold text-slate-500 sm:mt-3 sm:text-xs">{title}</h3>
      <div className="mt-0.5 truncate text-base font-bold tracking-tight tabular-nums text-slate-900 sm:text-xl">{value}</div>
      <p className="mt-1.5 truncate text-[10px] font-medium text-slate-400 sm:text-[11px]">{hint}</p>
    </Link>
  );
}

function ProduksiContent() {
  const { orders, ordersState, getVendorName } = useOpsData();
  const [scope, setScope] = useQueryState('scope', parseAsStringLiteral(SCOPES).withDefault('current'));
  const today = todayInJakarta();
  const scoped = useMemo(() => (scope === 'all' ? orders : orders.filter((o) => !isArchivedOrder(o))), [orders, scope]);
  const kpi = useMemo(() => computeKpi(scoped, today), [scoped, today]);

  return (
    <>
      <PageHeader
        eyebrow={<EyebrowBadge>Produksi</EyebrowBadge>}
        title="Ringkasan Produksi"
        subtitle="Antrean dan progres produksi, deadline yang perlu dikejar, serta komposisi order. Angka uang ada di Ringkasan Finansial."
        actions={
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Periode">
              {SCOPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={scope === s}
                  onClick={() => setScope(s)}
                  className={cn('h-9 cursor-pointer rounded-lg px-3 text-[11px] font-bold transition-colors', scope === s ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                >
                  {s === 'current' ? 'Mulai Okt 2026' : 'Semua periode'}
                </button>
              ))}
            </div>
            <Link
              href="/data-customer/new"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-teal-700 bg-teal-600 px-4 text-xs font-medium text-white shadow-btn-primary hover:bg-teal-700 active:scale-[0.98] sm:h-10"
            >
              <Plus className="h-4 w-4" /> Order Baru
            </Link>
          </div>
        }
      />

      {ordersState === 'loading' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Shimmer key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <Shimmer className="h-[420px] w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <Shimmer className="h-96 w-full rounded-2xl" />
            <Shimmer className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      ) : scoped.length === 0 ? (
        <EmptyState className="min-h-[300px] bg-white" title="Belum ada order pada periode ini" description="Order baru akan muncul di ringkasan setelah disimpan di Data Customer." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <KpiCard icon={ClipboardList} tone="bg-teal-50 text-teal-700" title="Order Aktif" value={kpi.aktif.count} hint={`${kpi.aktif.pcs} pcs belum selesai`} href="/data-customer" />
            <KpiCard icon={Hourglass} tone="bg-amber-50 text-amber-700" title="Antrean" value={kpi.antrean.count} hint={`Diterima & pembayaran • ${kpi.antrean.pcs} pcs`} href="/data-customer?status=received" />
            <KpiCard icon={Scissors} tone="bg-sky-50 text-sky-700" title="Dalam Produksi" value={kpi.produksi.count} hint={`Produksi s.d. packing • ${kpi.produksi.pcs} pcs`} href="/data-customer?status=production" />
            <KpiCard icon={Truck} tone="bg-indigo-50 text-indigo-700" title="Pengiriman" value={kpi.pengiriman.count} hint={`${kpi.pengiriman.pcs} pcs dalam pengiriman`} href="/data-customer?status=delivery" />
            <KpiCard icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" title="Selesai" value={kpi.selesai.count} hint={`${kpi.selesai.pcs} pcs terselesaikan`} href="/data-customer?status=completed" />
          </div>

          {kpi.lewatDeadline > 0 && (
            <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              {kpi.lewatDeadline} order aktif sudah lewat deadline. Cek Antrean Produksi Aktif di bawah.
            </div>
          )}

          <ProductionTrendCard orders={scoped} />

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <PortfolioPipelineCard orders={scoped} />
            <QueueRadarCard orders={scoped} today={today} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <LeaderboardCard orders={scoped} getVendorName={getVendorName} />
            <SizeDistributionCard orders={scoped} />
          </div>
        </>
      )}
    </>
  );
}

export default function ProduksiPage() {
  return (
    <Suspense fallback={null}>
      <ProduksiContent />
    </Suspense>
  );
}

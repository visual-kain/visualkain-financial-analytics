'use client';

import React, { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ClipboardList, Hourglass, Plus, Scissors, Truck } from 'lucide-react';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { OrderStatusBadge } from '@/components/ops/OrderStatusBadge';
import { EmptyState } from '@/components/ui/empty-state';
import { Shimmer } from '@/components/ui/shimmer';
import { useOpsData } from '@/context/OpsDataContext';
import { todayInJakarta } from '@/lib/constants';
import { formatShortIsoDate } from '@/lib/data-customer';
import { STATUS_FILTER_LABELS } from '@/lib/legacy/types';
import { isArchivedOrder } from '@/lib/order-form';
import { computeKpi, deadlineRadar, pipelineCounts, rankBy, sleeveTotals, type DeadlineTone, type ShareRow } from '@/lib/production-summary';
import { cn } from '@/lib/utils';

const SCOPES = ['current', 'all'] as const;

const TONE: Record<DeadlineTone, { chip: string; text: string; label: string }> = {
  lewat: { chip: 'border-rose-200 bg-rose-50 text-rose-700', text: 'text-rose-700', label: 'Lewat' },
  mendesak: { chip: 'border-amber-200 bg-amber-50 text-amber-800', text: 'text-amber-700', label: 'H-3' },
  aman: { chip: 'border-emerald-200 bg-emerald-50 text-emerald-700', text: 'text-emerald-700', label: 'Aman' },
};

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

function ShareList({ rows, emptyText, pcsOnly = false }: { rows: ShareRow[]; emptyText: string; pcsOnly?: boolean }) {
  if (rows.length === 0) return <p className="text-xs text-slate-500">{emptyText}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-semibold text-slate-800" title={r.label}>
              {r.label}
            </span>
            <span className="shrink-0 tabular-nums text-slate-500">
              {pcsOnly ? (
                <>
                  <strong className="text-slate-900">{r.pcs}</strong> pcs
                </>
              ) : (
                <>
                  <strong className="text-slate-900">{r.count}</strong> order &bull; {r.pcs} pcs
                </>
              )}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.max(4, Math.round(r.share * 100))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('min-w-0 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double sm:p-5', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProduksiContent() {
  const { orders, ordersState } = useOpsData();
  const [scope, setScope] = useQueryState('scope', parseAsStringLiteral(SCOPES).withDefault('current'));
  const today = todayInJakarta();
  const scoped = useMemo(() => (scope === 'all' ? orders : orders.filter((o) => !isArchivedOrder(o))), [orders, scope]);
  const kpi = useMemo(() => computeKpi(scoped, today), [scoped, today]);
  const pipeline = useMemo(() => pipelineCounts(scoped), [scoped]);
  const radar = useMemo(() => deadlineRadar(scoped, today), [scoped, today]);
  const kategori = useMemo(() => rankBy(scoped, (o) => String(o.kategoriOrder || '')), [scoped]);
  const bahan = useMemo(() => rankBy(scoped, (o) => String(o.jenisBahan || '')), [scoped]);
  const customer = useMemo(() => rankBy(scoped, (o) => String(o.namaCustomer || '')), [scoped]);
  const sleeve = useMemo(() => sleeveTotals(scoped.filter((o) => o.status !== 'completed')), [scoped]);
  const pipelineMax = Math.max(1, ...pipeline.map((p) => p.count));

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
          <Shimmer className="h-64 w-full rounded-2xl" />
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
              {kpi.lewatDeadline} order aktif sudah lewat deadline. Cek daftar Radar Deadline di bawah.
            </div>
          )}

          <Panel title="Pipeline 8 Tahap">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
              {pipeline.map((p) => (
                <Link
                  key={p.status}
                  href={`/data-customer?status=${p.status}`}
                  className="flex min-w-0 flex-col justify-between gap-2 rounded-xl border border-slate-200 p-3 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
                >
                  <span className="truncate text-[11px] font-semibold text-slate-500">{STATUS_FILTER_LABELS[p.status]}</span>
                  <span className="text-xl font-bold tabular-nums text-slate-900">{p.count}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-teal-500" style={{ width: `${p.count === 0 ? 0 : Math.max(6, Math.round((p.count / pipelineMax) * 100))}%` }} />
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
            <Panel
              title="Radar Deadline"
              action={
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <CalendarClock className="h-3.5 w-3.5" /> Hari ini {formatShortIsoDate(today)}
                </span>
              }
            >
              <div className="mb-3 grid grid-cols-3 gap-2">
                {(['lewat', 'mendesak', 'aman'] as DeadlineTone[]).map((t) => (
                  <div key={t} className={cn('rounded-xl border px-2.5 py-2 text-center', TONE[t].chip)}>
                    <span className="block text-lg font-bold tabular-nums">{radar.counts[t]}</span>
                    <span className="block truncate text-[10.5px] font-semibold">{TONE[t].label}</span>
                  </div>
                ))}
              </div>
              {radar.items.length === 0 ? (
                <p className="text-xs text-slate-500">Tidak ada order aktif dengan deadline.</p>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                  {radar.items.slice(0, 8).map(({ order, label, tone }) => (
                    <li key={order.id}>
                      <Link href={`/data-customer/${order.id}`} className="flex min-w-0 items-center gap-3 px-3 py-2.5 text-xs hover:bg-slate-50">
                        <span className="shrink-0 font-extrabold text-teal-700">{order.noInv}</span>
                        <span className="min-w-0 flex-1 truncate text-slate-700">
                          {order.namaCustomer}
                          {order.namaProject ? <span className="text-slate-400"> &bull; {order.namaProject}</span> : null}
                        </span>
                        <span className="hidden shrink-0 sm:block">
                          <OrderStatusBadge status={order.status} compact />
                        </span>
                        <span className={cn('shrink-0 text-right font-bold tabular-nums', TONE[tone].text)}>
                          {label}
                          <span className="block text-[10px] font-medium text-slate-400">{formatShortIsoDate(String(order.deadline))}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {radar.tanpaDeadline > 0 && <p className="mt-2 text-[11px] text-slate-500">{radar.tanpaDeadline} order aktif belum punya deadline.</p>}
            </Panel>

            <Panel title="Qty Belum Selesai per Jenis Lengan">
              <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2.5">
                <span className="block text-[11px] font-semibold text-teal-800">Total pcs aktif</span>
                <span className="block text-2xl font-bold tabular-nums text-teal-900">{sleeve.total}</span>
              </div>
              <ShareList
                rows={[
                  { label: 'Pendek', count: sleeve.pendek, pcs: sleeve.pendek, share: sleeve.total ? sleeve.pendek / sleeve.total : 0 },
                  { label: '3/4 Tangan', count: sleeve.tigaPerempat, pcs: sleeve.tigaPerempat, share: sleeve.total ? sleeve.tigaPerempat / sleeve.total : 0 },
                  { label: 'Panjang', count: sleeve.panjang, pcs: sleeve.panjang, share: sleeve.total ? sleeve.panjang / sleeve.total : 0 },
                  { label: 'Tanpa Lengan', count: sleeve.tanpaLengan, pcs: sleeve.tanpaLengan, share: sleeve.total ? sleeve.tanpaLengan / sleeve.total : 0 },
                ]}
                emptyText="Belum ada qty aktif."
                pcsOnly
              />
            </Panel>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
            <Panel title="Portofolio Kategori">
              <ShareList rows={kategori} emptyText="Belum ada kategori." />
            </Panel>
            <Panel title="Bahan Terbanyak">
              <ShareList rows={bahan} emptyText="Belum ada data bahan." />
            </Panel>
            <Panel title="Customer Teraktif">
              <ShareList rows={customer} emptyText="Belum ada customer." />
            </Panel>
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

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, Calculator, FileText, MessageCircle, Pencil, Shirt, Trash2 } from 'lucide-react';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { AccImageThumb } from '@/components/ops/AccImageThumb';
import { OrderStatusBadge } from '@/components/ops/OrderStatusBadge';
import { DeleteOrderDialog } from '@/components/ops/data-customer/DeleteOrderDialog';
import { NegativeAwareValue, isNegativeValue } from '@/components/ui/negative-value';
import { useOpsData } from '@/context/OpsDataContext';
import { mapFinanceOrderDoc } from '@/lib/finance-order-mapper';
import { transformToMasterRows } from '@/lib/financial-calculator';
import {
  CATEGORY_DISPLAY_ORDER,
  CATEGORY_LABELS,
  SIZES,
  calculateTotals,
  getSizeExtraPrice,
  priceKey,
  qtyKey,
  vendorPriceKey,
} from '@/lib/legacy/calculations';
import { formatDateTime, formatIsoDateLong, formatRelativeTime, timestampToDate } from '@/lib/legacy/formatters';
import { isArchivedOrder } from '@/lib/order-form';
import type { LegacyOrder } from '@/lib/legacy/types';
import { cn, formatRupiah, normalizeWaNumber } from '@/lib/utils';

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double sm:p-5', className)}>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-slate-800">{children || '-'}</dd>
    </div>
  );
}

function MoneyRow({ label, value, strong, negativeReason }: { label: string; value: number; strong?: boolean; negativeReason?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-2', strong && 'border-t border-slate-200 pt-2.5')}>
      <span className={cn('text-xs text-slate-600', strong && 'font-bold text-slate-900')}>{label}</span>
      <NegativeAwareValue value={value} reason={negativeReason} className={cn('text-sm', strong ? 'font-extrabold' : 'font-semibold')} positiveClassName="text-slate-900">
        {formatRupiah(value)}
      </NegativeAwareValue>
    </div>
  );
}

export function OrderDetailView({ order }: { order: LegacyOrder }) {
  const router = useRouter();
  const { getVendorName, getSizeChart } = useOpsData();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const archived = isArchivedOrder(order);
  const vendorName = getVendorName(order.vendorId);
  const sizeChart = getSizeChart(order.sizeChartId);
  const legacy = calculateTotals(order);
  const finance = useMemo(() => transformToMasterRows([mapFinanceOrderDoc(order.id, order, () => vendorName)])[0], [order, vendorName]);
  const created = timestampToDate(order.createdAt);
  const updated = timestampToDate(order.updatedAt);
  const wa = normalizeWaNumber(order.noWaCustomer);
  const prodDetails = [order.prodDetail1, order.prodDetail2, order.prodDetail3, order.prodDetail4].filter((d): d is string => !!d);
  const categoriesWithQty = CATEGORY_DISPLAY_ORDER.filter((cat) => legacy.qtyPerKategori[cat] > 0);
  const hasNegative = [finance.profitBersih, finance.profitPercent].some(isNegativeValue);

  const btn = 'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold shadow-2xs active:scale-[0.98] sm:h-10';

  return (
    <>
      <PageHeader
        backHref="/data-customer"
        backLabel="Data Customer"
        eyebrow={
          <>
            <EyebrowBadge>{order.noInv}</EyebrowBadge>
            <OrderStatusBadge status={order.status} />
            {archived && (
              <EyebrowBadge tone="amber">
                <Archive className="h-3.5 w-3.5" /> Arsip
              </EyebrowBadge>
            )}
          </>
        }
        title={order.namaCustomer || 'Tanpa nama customer'}
        subtitle={order.namaProject || undefined}
        actions={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {!archived && (
              <Link href={`/data-customer/${order.id}/edit`} className={cn(btn, 'bg-teal-600 text-white hover:bg-teal-700')}>
                <Pencil className="h-4 w-4" /> Edit Order
              </Link>
            )}
            <Link href={`/data-customer/${order.id}/techpack`} className={cn(btn, 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>
              <Shirt className="h-4 w-4 text-indigo-600" /> Techpack
            </Link>
            <Link href={`/invoice?order=${order.id}`} className={cn(btn, 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>
              <FileText className="h-4 w-4 text-sky-600" /> Invoice
            </Link>
            {!archived && (
              <Link href={`/orders/${order.id}/edit`} className={cn(btn, 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>
                <Calculator className="h-4 w-4 text-emerald-600" /> Edit Finansial
              </Link>
            )}
            {!archived && (
              <button type="button" onClick={() => setDeleteOpen(true)} className={cn(btn, 'cursor-pointer border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100')}>
                <Trash2 className="h-4 w-4" /> Hapus
              </button>
            )}
          </div>
        }
      />

      {archived && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
          Order sebelum Oktober 2026 bersifat arsip: bisa dilihat dan dicetak ulang, tetapi tidak bisa diedit atau dihapus.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="min-w-0 space-y-4 lg:col-span-2 lg:space-y-6">
          <Section title="Customer & Project">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Tanggal Invoice">{formatIsoDateLong(order.tanggalInv)}</Field>
              <Field label="Deadline Pengiriman">{order.deadline ? formatIsoDateLong(order.deadline) : 'Belum ditentukan'}</Field>
              <Field label="No. WhatsApp">
                {order.noWaCustomer ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {order.noWaCustomer}
                    {wa && (
                      <a
                        href={`https://wa.me/${wa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Chat
                      </a>
                    )}
                  </span>
                ) : null}
              </Field>
              <Field label="Vendor">{vendorName}</Field>
            </dl>
          </Section>

          <Section title="Produksi">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Metode Produksi">{order.jenisMetodeProduksi}</Field>
              <Field label="Kategori">{order.kategoriOrder}</Field>
              <Field label="Jenis Bahan">{order.jenisBahan}</Field>
              <Field label="Warna">{order.warna}</Field>
            </dl>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <h3 className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Detail Produksi</h3>
                {prodDetails.length > 0 ? (
                  <ol className="mt-1.5 space-y-1.5">
                    {prodDetails.map((d, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-800">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[10px] font-bold text-teal-700">{i + 1}</span>
                        <span className="break-words">{d}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">Tidak ada detail produksi.</p>
                )}
              </div>
              <div>
                <h3 className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Catatan</h3>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{order.notes || 'Tidak ada catatan tambahan.'}</p>
              </div>
            </div>
          </Section>

          <Section title={`Rincian Qty (${legacy.totalPesanan} pcs)`}>
            {categoriesWithQty.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada qty.</p>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-[10.5px] uppercase tracking-wide text-slate-600">
                        <th className="rounded-l-lg px-3 py-2 text-left">Jenis Lengan</th>
                        {SIZES.map((s) => (
                          <th key={s} className="px-2 py-2 text-center">{s}</th>
                        ))}
                        <th className="rounded-r-lg px-3 py-2 text-center">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesWithQty.map((cat) => (
                        <tr key={cat} className="border-b border-slate-100">
                          <td className="px-3 py-2 font-semibold text-slate-800">{CATEGORY_LABELS[cat]}</td>
                          {SIZES.map((s) => {
                            const q = Number(order[qtyKey(cat, s)] || 0);
                            return (
                              <td key={s} className={cn('px-2 py-2 text-center tabular-nums', q > 0 ? 'font-bold text-slate-900' : 'text-slate-300')}>
                                {q}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center font-extrabold tabular-nums text-teal-800">{legacy.qtyPerKategori[cat]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2.5 md:hidden">
                  {categoriesWithQty.map((cat) => (
                    <div key={cat} className="rounded-xl border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{CATEGORY_LABELS[cat]}</span>
                        <span className="font-extrabold tabular-nums text-teal-800">{legacy.qtyPerKategori[cat]} pcs</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {SIZES.filter((s) => Number(order[qtyKey(cat, s)] || 0) > 0).map((s) => (
                          <div key={s} className="rounded-lg bg-slate-50 px-1 py-1 text-center">
                            <span className="block text-[10px] font-semibold text-slate-500">{s}</span>
                            <span className="block text-sm font-bold tabular-nums text-slate-900">{Number(order[qtyKey(cat, s)])}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>

          <Section title="Harga per Pcs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10.5px] uppercase tracking-wide text-slate-600">
                    <th className="rounded-l-lg px-3 py-2 text-left">Jenis Lengan</th>
                    <th className="px-3 py-2 text-right">Harga Jual</th>
                    <th className="rounded-r-lg px-3 py-2 text-right">Harga Modal Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORY_DISPLAY_ORDER.map((cat) => (
                    <tr key={cat} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-semibold text-slate-800">{CATEGORY_LABELS[cat]}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(Number(order[priceKey(cat)] || 0))}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(Number(order[vendorPriceKey(cat)] || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Tambahan ukuran besar per pcs (jual dan modal): 2XL +{formatRupiah(getSizeExtraPrice('2XL'))}, 3XL +{formatRupiah(getSizeExtraPrice('3XL'))}, 4XL +
              {formatRupiah(getSizeExtraPrice('4XL'))}, 5XL +{formatRupiah(getSizeExtraPrice('5XL'))}. Diskon: {formatRupiah(Number(order.diskonHarga || 0))}.
            </p>
          </Section>
        </div>

        <div className="min-w-0 space-y-4 lg:space-y-6">
          <Section title="Ringkasan Finansial" className={cn(hasNegative && 'border-rose-200')}>
            <div className="divide-y divide-slate-100">
              <MoneyRow label="Total Tagihan Customer" value={finance.totalJumlah} />
              <MoneyRow label="Modal Vendor (HPP)" value={finance.totalBiayaVendor} />
              <MoneyRow label="Biaya Operasional" value={finance.biayaOperasional} />
              <MoneyRow label="Profit" value={finance.profitBersih} strong negativeReason="Profit minus: harga jual di bawah HPP vendor + biaya" />
              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-xs text-slate-600">Margin</span>
                <NegativeAwareValue value={finance.profitPercent} reason="Margin minus" className="text-sm font-bold" positiveClassName="text-emerald-700">
                  {finance.profitPercent.toFixed(1)}%
                </NegativeAwareValue>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-2.5">
                <span className="block text-[10px] font-semibold text-teal-800">Dibayar Customer</span>
                <span className="block text-sm font-extrabold tabular-nums text-teal-900">{formatRupiah(finance.nominalDpCustomer)}</span>
                <span className="block text-[10px] text-teal-700">Sisa {formatRupiah(finance.sisaPelunasanCustomer)}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <span className="block text-[10px] font-semibold text-slate-600">Dibayar ke Vendor</span>
                <span className="block text-sm font-extrabold tabular-nums text-slate-900">{formatRupiah(finance.dpVendor)}</span>
                <span className="block text-[10px] text-slate-500">Sisa {formatRupiah(finance.sisaPembayaranVendor)}</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Angka sama dengan Data Table finansial. Pembayaran dicatat di Dana Masuk dan Dana Keluar.</p>
          </Section>

          <Section title="ACC Customer">
            {order.accCustUrl ? (
              <AccImageThumb url={order.accCustUrl} label={`${order.noInv} - ${order.namaCustomer}`} size="lg" />
            ) : (
              <p className="text-sm text-slate-500">Belum ada gambar ACC.</p>
            )}
          </Section>

          <Section title="Size Chart">
            {sizeChart ? (
              <>
                <p className="mb-2 text-sm font-bold text-slate-800">{sizeChart.nama}</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[10.5px] uppercase text-slate-600">
                      <th className="rounded-l-lg px-2 py-1.5 text-left">Size</th>
                      <th className="px-2 py-1.5 text-right">Panjang</th>
                      <th className="rounded-r-lg px-2 py-1.5 text-right">Lebar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZES.map((s) => (
                      <tr key={s} className="border-b border-slate-100">
                        <td className="px-2 py-1 font-semibold">{s}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{sizeChart.sizes?.[s]?.panjang ?? 0} cm</td>
                        <td className="px-2 py-1 text-right tabular-nums">{sizeChart.sizes?.[s]?.lebar ?? 0} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-sm text-slate-500">Tanpa size chart.</p>
            )}
          </Section>

          <Section title="Riwayat Data">
            <dl className="space-y-2.5">
              <Field label="Dibuat oleh">{order.createdBy || '-'}</Field>
              <Field label="Dibuat">{created ? `${formatRelativeTime(created)} (${formatDateTime(created)})` : '-'}</Field>
              <Field label="Terakhir diubah">{updated ? formatDateTime(updated) : '-'}</Field>
            </dl>
          </Section>
        </div>
      </div>

      <DeleteOrderDialog order={deleteOpen ? order : null} onClose={() => setDeleteOpen(false)} onDeleted={() => router.push('/data-customer')} />
    </>
  );
}

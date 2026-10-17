'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import { Landmark, Plus, Printer, Save } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { OrderSearchCombobox } from '@/components/ops/OrderSearchCombobox';
import { OrderStatusBadge } from '@/components/ops/OrderStatusBadge';
import { BankAccountModal, readStoredBank } from '@/components/ops/invoice/BankAccountModal';
import { PaperViewport, PrintPortal, printWithTitle } from '@/components/legacy/PaperViewport';
import InvoicePaper, { DEFAULT_BANK_INFO } from '@/components/legacy/InvoicePaper';
import { Shimmer } from '@/components/ui/shimmer';
import { useOpsData } from '@/context/OpsDataContext';
import { saveTargetDp } from '@/lib/firestore/orders-repo';
import { invoicePaymentDateLabel, invoicePaymentsForOrder } from '@/lib/invoice-payments';
import { isArchivedOrder } from '@/lib/order-form';
import type { BankAccountInfo, LegacyOrder } from '@/lib/legacy/types';
import { formatRupiah } from '@/lib/utils';

function InvoiceContent() {
  const { orders, ordersState, getOrderById } = useOpsData();
  const [orderId, setOrderId] = useQueryState('order');
  const [bank, setBank] = useState<BankAccountInfo>(DEFAULT_BANK_INFO);
  const [bankOpen, setBankOpen] = useState(false);
  const [targetDraft, setTargetDraft] = useState('70');
  const [savingTarget, setSavingTarget] = useState(false);

  useEffect(() => setBank(readStoredBank()), []);

  const order = orderId ? getOrderById(orderId) : undefined;
  const archived = order ? isArchivedOrder(order) : false;
  const savedTarget = Number(order?.targetDpPersen) || 70;

  useEffect(() => {
    setTargetDraft(String(savedTarget));
  }, [order?.id, savedTarget]);

  const targetValue = Math.min(100, Math.max(1, Number(targetDraft) || 70));
  const effectiveOrder = useMemo<LegacyOrder | undefined>(() => (order ? { ...order, targetDpPersen: targetValue } : undefined), [order, targetValue]);
  const payments = useMemo(() => (order ? invoicePaymentsForOrder(order) : undefined), [order]);

  const handleSaveTarget = async () => {
    if (!order) return;
    setSavingTarget(true);
    try {
      await saveTargetDp(order.id, targetValue);
      toast.success(`Target DP ${targetValue}% disimpan ke ${order.noInv}`);
    } catch (err) {
      console.error('[invoice] Gagal simpan target DP:', err);
      toast.error('Gagal menyimpan target DP');
    } finally {
      setSavingTarget(false);
    }
  };

  const handlePrint = () => {
    if (!order) {
      toast.warning('Pilih order dulu sebelum mencetak');
      return;
    }
    printWithTitle(`${order.noInv}_${order.namaCustomer}`);
  };

  return (
    <>
      <PageHeader
        eyebrow={<EyebrowBadge>Dokumen</EyebrowBadge>}
        title="Invoice"
        subtitle="Pilih order untuk menampilkan invoice. Tampilan kertas sama dengan VisualKainDB; pembayaran diambil dari Dana Masuk."
        actions={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <button
              type="button"
              onClick={() => setBankOpen(true)}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 sm:h-10"
            >
              <Landmark className="h-3.5 w-3.5 text-slate-500" />
              <span className="truncate">Rekening ({bank.bankName})</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!order}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
            >
              <Printer className="h-4 w-4" /> Cetak / Print
            </button>
          </div>
        }
      />

      <section className="grid gap-4 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-card-double sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-6">
        <div className="min-w-0 space-y-3">
          <label className="block text-xs font-bold text-slate-700">Pilih / Cari Invoice</label>
          {ordersState === 'loading' ? (
            <Shimmer className="h-10 w-full rounded-xl" />
          ) : (
            <OrderSearchCombobox orders={orders} selected={order} onSelect={(o) => setOrderId(o ? o.id : null)} />
          )}
          {order && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs">
              <span className="font-extrabold text-teal-800">{order.noInv}</span>
              <span className="min-w-0 truncate font-semibold text-slate-800">{order.namaCustomer}</span>
              <OrderStatusBadge status={order.status} compact />
              <Link href={`/data-customer/${order.id}`} className="ml-auto text-[11px] font-bold text-teal-700 hover:underline">
                Detail order
              </Link>
            </div>
          )}
        </div>

        {order && (
          <div className="grid min-w-0 gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
            <div>
              <label htmlFor="target-dp" className="mb-1.5 block text-xs font-bold text-slate-700">
                Target DP Produksi (%)
              </label>
              <div className="flex gap-1.5">
                <input
                  id="target-dp"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  value={targetDraft}
                  disabled={archived}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-bold tabular-nums focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100 sm:h-10"
                />
                {!archived && targetValue !== savedTarget && (
                  <button
                    type="button"
                    onClick={handleSaveTarget}
                    disabled={savingTarget}
                    aria-label="Simpan target DP"
                    className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 sm:h-10 sm:w-10"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">Pembayaran Diterima</span>
                {!archived && (
                  <Link href="/cash-in/new" className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline">
                    <Plus className="h-3.5 w-3.5" /> Catat di Dana Masuk
                  </Link>
                )}
              </div>
              {payments && payments.rows.length > 0 ? (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {payments.rows.map((row) => (
                    <li key={row.key} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                      <span className="min-w-0 truncate text-slate-700">
                        {row.label} {row.tanggal ? <span className="text-slate-400">({invoicePaymentDateLabel(row.tanggal)})</span> : null}
                      </span>
                      <span className="shrink-0 font-bold tabular-nums text-slate-900">{formatRupiah(row.nominal)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-[11px] text-slate-500">Belum ada pembayaran tercatat untuk order ini.</p>
              )}
            </div>
          </div>
        )}
      </section>

      <PaperViewport>
        <InvoicePaper order={effectiveOrder} payments={payments} bankInfo={bank} />
      </PaperViewport>
      {effectiveOrder && (
        <PrintPortal>
          <InvoicePaper order={effectiveOrder} payments={payments} bankInfo={bank} />
        </PrintPortal>
      )}

      <BankAccountModal open={bankOpen} active={bank} onClose={() => setBankOpen(false)} onApply={setBank} />
    </>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={null}>
      <InvoiceContent />
    </Suspense>
  );
}

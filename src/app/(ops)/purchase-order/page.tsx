'use client';

import React, { Suspense, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ClipboardList, Printer, RefreshCw } from 'lucide-react';
import { POPaper } from '@/components/legacy/POPaper';
import { PaperViewport, PrintPortal, printWithTitle } from '@/components/legacy/PaperViewport';
import { EyebrowBadge, PageHeader } from '@/components/layout/PageHeader';
import { OrderSearchCombobox } from '@/components/ops/OrderSearchCombobox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Shimmer } from '@/components/ui/shimmer';
import { useOpsData } from '@/context/OpsDataContext';
import { formatPoNumber } from '@/lib/document-number';
import type { LegacyOrder } from '@/lib/legacy/types';
import { cn } from '@/lib/utils';

function PurchaseOrderView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { orders, vendors, ordersState, retry, getOrderById } = useOpsData();

  const orderId = searchParams.get('order');
  const order = orderId ? getOrderById(orderId) : undefined;
  const vendor = useMemo(() => (order?.vendorId ? vendors.find((v) => v.id === order.vendorId) : undefined), [order, vendors]);

  const selectOrder = useCallback(
    (next: LegacyOrder | undefined) => {
      router.replace(next ? `${pathname}?order=${encodeURIComponent(next.id)}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const handlePrint = () => {
    if (!order) return;
    printWithTitle(`${formatPoNumber(order.noInv)}_${vendor?.nama || 'Vendor'}`);
  };

  const missingOrder = ordersState === 'ready' && Boolean(orderId) && !order;

  return (
    <>
      <PageHeader
        title="Purchase Order"
        subtitle="Pilih order untuk membuat PO ke vendor. Nomor PO mengikuti No. Invoice dan tidak disimpan terpisah."
        eyebrow={
          <EyebrowBadge tone="slate">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden />
            Dokumen
          </EyebrowBadge>
        }
        actions={
          <Button
            variant="secondary"
            onClick={handlePrint}
            disabled={!order}
            className="h-11 flex-1 border-teal-700 bg-teal-600 text-xs hover:bg-teal-700 focus:ring-teal-500/40 sm:h-10 sm:flex-none"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Cetak PO
          </Button>
        }
      />

      <Card className="space-y-3 p-3.5 sm:p-4">
        <p className="text-[11px] font-bold text-slate-600">Pilih order untuk dibuatkan PO</p>
        {ordersState === 'loading' ? (
          <Shimmer className="h-11 w-full rounded-xl sm:h-10" />
        ) : (
          <OrderSearchCombobox orders={orders} selected={order} onSelect={selectOrder} />
        )}
        {order && (
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-600">
            <div className="flex gap-1.5">
              <dt className="font-bold text-slate-500">No. PO</dt>
              <dd className="font-bold tabular-nums text-teal-700">{formatPoNumber(order.noInv)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-bold text-slate-500">Vendor</dt>
              <dd className={cn('font-semibold', vendor ? 'text-slate-800' : 'text-amber-700')}>{vendor?.nama || 'Belum dipilih'}</dd>
            </div>
          </dl>
        )}
        {order && !vendor && (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
            Order ini belum punya vendor. Kertas PO akan menampilkan &quot;BELUM DIPILIH&quot;. Pilih vendor lewat Edit Order.
          </p>
        )}
      </Card>

      {ordersState === 'error' && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-xs text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-bold">Daftar order gagal dimuat.</p>
              <p className="mt-0.5 text-rose-800">Periksa koneksi internet lalu coba lagi.</p>
            </div>
          </div>
          <Button variant="outline" onClick={retry} className="h-11 self-start text-xs sm:h-10 sm:self-auto">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Coba lagi
          </Button>
        </div>
      )}

      {ordersState === 'loading' && (
        <Card className="space-y-3 p-4" aria-busy="true" aria-label="Memuat order">
          <Shimmer className="h-6 w-1/3 rounded" />
          <Shimmer className="h-64 w-full rounded-xl" />
        </Card>
      )}

      {ordersState === 'ready' && !order && (
        <Card className="p-3.5 sm:p-4">
          <EmptyState
            title={missingOrder ? 'Order tidak ditemukan' : 'Belum ada order dipilih'}
            description={
              missingOrder
                ? 'Order di tautan ini mungkin sudah dihapus. Pilih order lain lewat kolom pencarian.'
                : 'Cari No. Invoice, customer, atau project di atas untuk menampilkan Purchase Order.'
            }
            className="py-12"
          />
        </Card>
      )}

      {order && (
        <>
          <PaperViewport>
            <POPaper order={order} vendor={vendor} />
          </PaperViewport>
          <PrintPortal>
            <POPaper order={order} vendor={vendor} />
          </PrintPortal>
        </>
      )}
    </>
  );
}

export default function PurchaseOrderPage() {
  return (
    <Suspense fallback={<Shimmer className="h-24 w-full rounded-2xl" />}>
      <PurchaseOrderView />
    </Suspense>
  );
}

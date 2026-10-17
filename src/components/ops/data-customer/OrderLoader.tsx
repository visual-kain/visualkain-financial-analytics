'use client';

import React from 'react';
import Link from 'next/link';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import { useOpsData } from '@/context/OpsDataContext';
import type { LegacyOrder } from '@/lib/legacy/types';

/** Menunggu data order termuat sebelum merender layar turunan; bug legacy menampilkan "tidak ditemukan" saat masih memuat. */
export function OrderLoader({ orderId, children }: { orderId: string; children: (order: LegacyOrder) => React.ReactNode }) {
  const { getOrderById, ordersState, retry } = useOpsData();
  const order = getOrderById(orderId);

  if (ordersState === 'loading') {
    return (
      <div className="space-y-4">
        <Shimmer className="h-28 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Shimmer className="h-72 w-full rounded-2xl lg:col-span-2" />
          <Shimmer className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        className="min-h-[320px] bg-white"
        title={ordersState === 'error' ? 'Gagal memuat order' : 'Order tidak ditemukan'}
        description={ordersState === 'error' ? 'Periksa koneksi lalu coba lagi.' : 'Order mungkin sudah dihapus.'}
        action={
          ordersState === 'error' ? (
            <button type="button" onClick={retry} className="mt-1 inline-flex h-10 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
              Coba lagi
            </button>
          ) : (
            <Link href="/data-customer" className="mt-1 inline-flex h-10 items-center rounded-xl bg-teal-600 px-3 text-xs font-bold text-white">
              Kembali ke Data Customer
            </Link>
          )
        }
      />
    );
  }

  return <>{children(order)}</>;
}

'use client';

import { use } from 'react';
import { OrderLoader } from '@/components/ops/data-customer/OrderLoader';
import { OrderForm } from '@/components/ops/data-customer/OrderForm';
import { EmptyState } from '@/components/ui/empty-state';
import { isArchivedOrder } from '@/lib/order-form';

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <OrderLoader orderId={id}>
      {(order) =>
        isArchivedOrder(order) ? (
          <EmptyState className="min-h-[320px] bg-white" title="Order arsip tidak bisa diedit" description="Order sebelum Oktober 2026 hanya bisa dilihat dan dicetak ulang." />
        ) : (
          <OrderForm key={order.id} mode="edit" order={order} />
        )
      }
    </OrderLoader>
  );
}

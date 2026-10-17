'use client';

import { use } from 'react';
import { OrderLoader } from '@/components/ops/data-customer/OrderLoader';
import { OrderDetailView } from '@/components/ops/data-customer/OrderDetailView';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OrderLoader orderId={id}>{(order) => <OrderDetailView order={order} />}</OrderLoader>;
}

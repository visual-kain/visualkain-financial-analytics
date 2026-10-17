'use client';

import { Shimmer } from '@/components/ui/shimmer';
import { OrderForm } from '@/components/ops/data-customer/OrderForm';
import { useOpsData } from '@/context/OpsDataContext';

export default function NewOrderPage() {
  const { ordersState } = useOpsData();
  // Form menunggu daftar order agar No. Invoice awal dihitung dari data lengkap.
  if (ordersState === 'loading') return <Shimmer className="h-[480px] w-full rounded-2xl" />;
  return <OrderForm mode="create" />;
}

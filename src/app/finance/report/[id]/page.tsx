'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FinanceReportView } from '@/components/finance/FinanceReportView';
import { useFirebaseFinance } from '@/hooks/useFirebaseFinance';

export default function FinanceReportPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { orders, vendors } = useFirebaseFinance();

  const order = orders.find((o) => o.id === orderId || o.noInv === orderId);

  const getVendorById = (id: string) => {
    const v = vendors.find((vend) => vend.id === id);
    return v ? { nama: v.nama, pic: '-' } : undefined;
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const noInv = order?.noInv || 'Invoice';
    const projectName =
      order?.namaProject ||
      order?.projectName ||
      order?.namaCustomer ||
      order?.customerName ||
      'Laporan_Finansial';
    const cleanTitle = `${noInv} - ${projectName}`.replace(/[/\\?%*:|"<>]/g, '-').trim();
    document.title = cleanTitle;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  return <FinanceReportView order={order} getVendorById={getVendorById} onBack={() => router.push('/')} onPrint={handlePrint} />;
}

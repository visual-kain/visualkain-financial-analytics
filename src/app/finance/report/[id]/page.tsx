'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import FinanceReportPaper from '@/components/finance/FinanceReportPaper';
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

  return (
    <div className="min-h-screen bg-[#e2e8f0] p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-[210mm]">
        <div className="techpack-actions no-print">
          <button
            type="button"
            className="btn btn-back"
            onClick={() => router.push('/')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Kembali ke Finansial</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Laporan</span>
          </button>
        </div>

        <div className="invoice-preview-wrapper shadow-lg rounded-xl" id="techpackPreviewWrapper">
          <FinanceReportPaper order={order} getVendorById={getVendorById} />
        </div>
      </div>
    </div>
  );
}

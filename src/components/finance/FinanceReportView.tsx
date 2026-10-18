'use client';

import React from 'react';
import FinanceReportPaper from '@/components/finance/FinanceReportPaper';
import { PaperZoom } from '@/components/ui/paper-zoom';
import type { Order } from '@/types';

interface FinanceReportViewProps {
  order: Order | undefined;
  getVendorById: (id: string) => { nama?: string; pic?: string } | undefined;
  onBack: () => void;
  onPrint: () => void;
}

/** Tampilan halaman laporan finansial order; kertas diperkecil utuh di HP seperti invoice (feedback 18 Okt 2026). */
export function FinanceReportView({ order, getVendorById, onBack, onPrint }: FinanceReportViewProps) {
  return (
    <div className="min-h-screen bg-[#e2e8f0] p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-[210mm]">
        <div className="techpack-actions no-print">
          <button type="button" className="btn btn-back" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Kembali ke Finansial</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={onPrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Laporan</span>
          </button>
        </div>

        <div className="invoice-preview-wrapper shadow-lg rounded-xl" id="techpackPreviewWrapper">
          <PaperZoom>
            <FinanceReportPaper order={order} getVendorById={getVendorById} />
          </PaperZoom>
        </div>
      </div>
    </div>
  );
}

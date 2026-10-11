'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FinanceReportPaper from './FinanceReportPaper';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  getVendorById?: (id: string) => { nama?: string; pic?: string } | undefined;
}

export function InvoicePreviewModal({
  isOpen,
  order,
  onClose,
  getVendorById,
}: InvoicePreviewModalProps) {
  if (!isOpen || !order) return null;

  const targetOrder = order.originalOrder || order;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
        {/* Backdrop Click-to-Close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-transparent"
        />

        {/* Modal Paper Container */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-[210mm] flex flex-col items-center my-4"
        >
          {/* Top Actions Bar (Identik dengan visualkaindb) */}
          <div className="techpack-actions no-print">
            <button
              type="button"
              className="btn btn-back"
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Finance</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.print()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print Laporan</span>
            </button>
          </div>

          {/* Laporan Finansial Paper (Porting SSOT VisualKainDB) */}
          <div className="invoice-preview-wrapper w-full max-w-full overflow-x-auto shadow-2xl rounded-xl" id="techpackPreviewWrapper">
            <FinanceReportPaper order={targetOrder} getVendorById={getVendorById} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export type EditKasStatus = 'none' | 'loading' | 'missing' | 'ready';

export function resolveEditKasStatus(editKasId: string | null, found: boolean, kasReady: boolean): EditKasStatus {
  if (!editKasId) return 'none';
  if (found) return 'ready';
  return kasReady ? 'missing' : 'loading';
}

export function EditKasStatusNotice({ status }: { status: EditKasStatus }) {
  if (status === 'loading') {
    return (
      <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        Memuat transaksi yang akan diedit...
      </div>
    );
  }
  if (status === 'missing') {
    return (
      <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        Transaksi tidak ditemukan atau berada di luar periode pembukuan. Penyimpanan dinonaktifkan agar data tidak tertimpa.
      </div>
    );
  }
  return null;
}

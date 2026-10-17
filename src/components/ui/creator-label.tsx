import React from 'react';
import { UserRound } from 'lucide-react';
import type { AuditFields } from '@/lib/audit';
import { cn } from '@/lib/utils';

/**
 * Label "dibuat oleh" untuk baris tabel dan kartu (K-36). Pengubah terakhir ditampilkan bila berbeda dari pembuat;
 * data lama tanpa jejak ditandai "Tidak tercatat" agar terlihat bedanya dengan input baru.
 */
export function CreatorLabel({ audit, className, showEditor = true }: { audit: AuditFields | undefined; className?: string; showEditor?: boolean }) {
  const createdBy = audit?.createdBy?.trim();
  const updatedBy = audit?.updatedBy?.trim();
  const editor = showEditor && updatedBy && updatedBy !== createdBy ? updatedBy : '';
  const title = [
    createdBy ? `Dibuat oleh ${createdBy}${audit?.createdByEmail ? ` (${audit.createdByEmail})` : ''}` : 'Pembuat tidak tercatat (data lama atau dari aplikasi lain)',
    updatedBy ? `Terakhir diubah oleh ${updatedBy}${audit?.updatedByEmail ? ` (${audit.updatedByEmail})` : ''}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <span title={title} className={cn('inline-flex min-w-0 max-w-full items-start gap-1 text-[11px] leading-snug', createdBy ? 'text-slate-600' : 'text-slate-400', className)}>
      <UserRound className="mt-px h-3 w-3 shrink-0" aria-hidden />
      <span className="min-w-0 break-words">
        {createdBy || 'Tidak tercatat'}
        {editor && <span className="block text-[10px] text-slate-400">diubah {editor}</span>}
      </span>
    </span>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MarkupDialog } from '@/components/ops/cost-profit/MarkupDialog';
import { SectionCard } from '@/components/ops/cost-profit/SectionCard';
import { BTN_DANGER_SOFT, BTN_EDIT, BTN_PRIMARY } from '@/components/ops/cost-profit/styles';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/modal';
import { Shimmer } from '@/components/ui/shimmer';
import { findOverlappingRules, formatMarkupPersen, formatQtyRange, type MarkupDoc } from '@/lib/cost-profit';
import { deleteMarkup } from '@/lib/firestore/cost-profit-repo';
import { cn } from '@/lib/utils';
import { CreatorLabel } from '@/components/ui/creator-label';

interface MarkupSectionProps {
  markupList: MarkupDoc[];
  loading: boolean;
}

export function MarkupSection({ markupList, loading }: MarkupSectionProps) {
  const [dialog, setDialog] = useState<{ open: boolean; rule: MarkupDoc | null }>({ open: false, rule: null });
  const [deleteTarget, setDeleteTarget] = useState<MarkupDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const overlapCounts = useMemo(() => {
    const counts = new Map<string, number>();
    markupList.forEach((m) => counts.set(m.id, findOverlappingRules(m, markupList, m.id).length));
    return counts;
  }, [markupList]);
  const hasOverlap = [...overlapCounts.values()].some((n) => n > 0);

  const openAdd = () => setDialog({ open: true, rule: null });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMarkup(deleteTarget.id);
      toast.success('Aturan markup dihapus');
      setDeleteTarget(null);
    } catch (err) {
      console.error('[cost-profit] Gagal menghapus aturan markup:', err);
      toast.error('Gagal menghapus aturan markup. Periksa koneksi lalu coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SectionCard
      icon={<Percent className="h-5 w-5" />}
      title="Aturan Markup Harga"
      description="Kalkulator memakai aturan pertama yang rentang Qty-nya memuat jumlah pesanan. Qty di luar semua rentang memakai +0%."
      count={loading ? undefined : markupList.length}
      action={
        <button type="button" onClick={openAdd} className={BTN_PRIMARY}>
          <Plus className="h-4 w-4" /> Tambah Aturan
        </button>
      }
    >
      {loading ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Memuat aturan markup">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : markupList.length === 0 ? (
        <div className="p-4 sm:p-5">
          <EmptyState
            className="py-10"
            title="Belum ada aturan markup"
            description="Tanpa aturan, harga jual di kalkulator sama dengan harga modal."
            action={
              <button type="button" onClick={openAdd} className={cn(BTN_PRIMARY, 'mt-1')}>
                <Plus className="h-4 w-4" /> Tambah Aturan
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3 p-4 sm:p-5">
          {hasOverlap && (
            <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              Ada rentang Qty yang tumpang tindih. Di rentang bersama, aturan dengan Qty Min terkecil yang dipakai.
            </p>
          )}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {markupList.map((m) => {
              const overlap = overlapCounts.get(m.id) ?? 0;
              return (
                <li key={m.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card-double">
                  <p className="font-mono text-3xl font-extrabold tabular-nums text-teal-700">{formatMarkupPersen(m.persen)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{formatQtyRange(m.qtyMin, m.qtyMax)}</p>
                  <CreatorLabel audit={m} className="mt-1.5" />
                  {overlap > 0 && (
                    <p className="mt-2 inline-flex items-center gap-1 self-start rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-800">
                      <AlertTriangle className="h-3 w-3" aria-hidden /> Tumpang tindih dengan {overlap} aturan
                    </p>
                  )}
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                    <button type="button" onClick={() => setDialog({ open: true, rule: m })} aria-label={`Edit aturan ${formatMarkupPersen(m.persen)} ${formatQtyRange(m.qtyMin, m.qtyMax)}`} className={BTN_EDIT}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(m)} aria-label={`Hapus aturan ${formatMarkupPersen(m.persen)} ${formatQtyRange(m.qtyMin, m.qtyMax)}`} className={BTN_DANGER_SOFT}>
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <MarkupDialog open={dialog.open} rule={dialog.rule} rules={markupList} onClose={() => setDialog({ open: false, rule: null })} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus aturan markup?"
        description={
          deleteTarget ? (
            <>
              Aturan <strong className="text-slate-900">{formatMarkupPersen(deleteTarget.persen)}</strong> untuk{' '}
              <strong className="text-slate-900">{formatQtyRange(deleteTarget.qtyMin, deleteTarget.qtyMax)}</strong> akan dihapus permanen. Qty di rentang ini memakai +0% bila tidak ada aturan lain yang cocok.
            </>
          ) : null
        }
        confirmLabel="Hapus"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </SectionCard>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BahanDialog } from '@/components/ops/cost-profit/BahanDialog';
import { SectionCard } from '@/components/ops/cost-profit/SectionCard';
import { BTN_DANGER_SOFT, BTN_EDIT, BTN_PRIMARY, ICON_BTN_DANGER, ICON_BTN_EDIT } from '@/components/ops/cost-profit/styles';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/modal';
import { NEGATIVE_ROW_STRIP, NegativeAwareValue, isNegativeValue } from '@/components/ui/negative-value';
import { Shimmer } from '@/components/ui/shimmer';
import type { BahanDoc } from '@/lib/cost-profit';
import { deleteBahan } from '@/lib/firestore/cost-profit-repo';
import type { KategoriDoc } from '@/lib/legacy/types';
import { cn, formatRupiah } from '@/lib/utils';

interface BahanSectionProps {
  bahanList: BahanDoc[];
  kategoriList: KategoriDoc[];
  loading: boolean;
}

const NO_KATEGORI = 'Tanpa kategori';

export function BahanSection({ bahanList, kategoriList, loading }: BahanSectionProps) {
  const [dialog, setDialog] = useState<{ open: boolean; bahan: BahanDoc | null }>({ open: false, bahan: null });
  const [deleteTarget, setDeleteTarget] = useState<BahanDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const kategoriName = useMemo(() => new Map(kategoriList.map((k) => [k.id, k.nama])), [kategoriList]);
  const nameOf = (b: BahanDoc) => kategoriName.get(b.kategoriId) ?? NO_KATEGORI;

  const openAdd = () => setDialog({ open: true, bahan: null });
  const openEdit = (bahan: BahanDoc) => setDialog({ open: true, bahan });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBahan(deleteTarget.id);
      toast.success(`Bahan "${deleteTarget.nama}" dihapus`);
      setDeleteTarget(null);
    } catch (err) {
      console.error('[cost-profit] Gagal menghapus bahan:', err);
      toast.error('Gagal menghapus bahan. Periksa koneksi lalu coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  const addButton = (
    <button type="button" onClick={openAdd} className={BTN_PRIMARY}>
      <Plus className="h-4 w-4" /> Tambah Bahan
    </button>
  );

  return (
    <SectionCard
      icon={<Package className="h-5 w-5" />}
      title="Daftar Bahan & Harga Modal"
      description="Harga modal per pcs untuk setiap bahan."
      count={loading ? undefined : bahanList.length}
      action={addButton}
    >
      {loading ? (
        <div className="space-y-2.5 p-4 sm:p-5" aria-busy="true" aria-label="Memuat bahan">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : bahanList.length === 0 ? (
        <div className="p-4 sm:p-5">
          <EmptyState
            className="py-10"
            title="Belum ada bahan"
            description={kategoriList.length === 0 ? 'Buat kategori terlebih dulu, lalu tambahkan bahan beserta harga modalnya.' : 'Tambahkan bahan beserta harga modal per pcs.'}
            action={
              <button type="button" onClick={openAdd} className={cn(BTN_PRIMARY, 'mt-1')}>
                <Plus className="h-4 w-4" /> Tambah Bahan
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <table className="w-full table-fixed text-xs">
              <colgroup>
                <col className="w-[26%]" />
                <col />
                <col className="w-[22%]" />
                <col className="w-[128px]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-100 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  <th scope="col" className="px-4 py-3 text-left">
                    Kategori
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    Nama Bahan
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Harga Modal / Pcs
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {bahanList.map((b) => (
                  <tr key={b.id} className={cn('border-t border-slate-100 transition-colors hover:bg-slate-50/70', isNegativeValue(b.harga) && NEGATIVE_ROW_STRIP)}>
                    <td className={cn('break-words px-4 py-3 align-top', kategoriName.has(b.kategoriId) ? 'text-slate-600' : 'font-semibold text-amber-700')}>{nameOf(b)}</td>
                    <td className="break-words px-4 py-3 align-top font-semibold text-slate-900">{b.nama}</td>
                    <td className="px-4 py-3 text-right align-top font-mono text-[13px] font-bold text-slate-900">
                      <NegativeAwareValue value={b.harga} reason="Harga modal minus, perbaiki lewat Edit">
                        {formatRupiah(b.harga)}
                      </NegativeAwareValue>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <div className="flex justify-center gap-1.5">
                        <button type="button" onClick={() => openEdit(b)} aria-label={`Edit bahan ${b.nama}`} title="Edit" className={ICON_BTN_EDIT}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(b)} aria-label={`Hapus bahan ${b.nama}`} title="Hapus" className={ICON_BTN_DANGER}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-3 bg-slate-50/40 p-3 sm:grid-cols-2 md:hidden">
            {bahanList.map((b) => (
              <li
                key={b.id}
                className={cn('min-w-0 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-card-double', isNegativeValue(b.harga) && NEGATIVE_ROW_STRIP)}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold leading-snug text-slate-900">{b.nama}</p>
                    <p className={cn('truncate text-[11px] font-medium', kategoriName.has(b.kategoriId) ? 'text-slate-500' : 'text-amber-700')}>{nameOf(b)}</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-extrabold text-slate-900">
                    <NegativeAwareValue value={b.harga} reason="Harga modal minus, perbaiki lewat Edit">
                      {formatRupiah(b.harga)}
                    </NegativeAwareValue>
                  </p>
                </div>
                <p className="mt-0.5 text-[10.5px] text-slate-400">Harga modal / pcs</p>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={() => openEdit(b)} aria-label={`Edit bahan ${b.nama}`} className={BTN_EDIT}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(b)} aria-label={`Hapus bahan ${b.nama}`} className={BTN_DANGER_SOFT}>
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <BahanDialog open={dialog.open} bahan={dialog.bahan} kategoriList={kategoriList} onClose={() => setDialog({ open: false, bahan: null })} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus bahan?"
        description={
          deleteTarget ? (
            <>
              Bahan <strong className="text-slate-900">{deleteTarget.nama}</strong> ({nameOf(deleteTarget)}) akan dihapus permanen dan tidak muncul lagi di kalkulator.
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

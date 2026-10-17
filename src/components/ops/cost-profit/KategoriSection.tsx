'use client';

import React, { useId, useMemo, useState } from 'react';
import { Plus, Tags, X } from 'lucide-react';
import { toast } from 'sonner';
import { SectionCard } from '@/components/ops/cost-profit/SectionCard';
import { BTN_PRIMARY, FIELD_ERROR, FIELD_INPUT } from '@/components/ops/cost-profit/styles';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/modal';
import { Shimmer } from '@/components/ui/shimmer';
import { getKategoriDeleteBlock, validateKategoriName, type BahanDoc } from '@/lib/cost-profit';
import { deleteKategori } from '@/lib/firestore/cost-profit-repo';
import { addKategori } from '@/lib/firestore/master-repo';
import type { KategoriDoc } from '@/lib/legacy/types';
import { cn } from '@/lib/utils';

interface KategoriSectionProps {
  kategoriList: KategoriDoc[];
  bahanList: BahanDoc[];
  loading: boolean;
}

export function KategoriSection({ kategoriList, bahanList, loading }: KategoriSectionProps) {
  const uid = useId();
  const [nama, setNama] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KategoriDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const bahanCount = useMemo(() => {
    const counts = new Map<string, number>();
    bahanList.forEach((b) => counts.set(b.kategoriId, (counts.get(b.kategoriId) ?? 0) + 1));
    return counts;
  }, [bahanList]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateKategoriName(nama, kategoriList);
    if (error) {
      setFormError(error);
      return;
    }
    const clean = nama.trim();
    setAdding(true);
    try {
      await addKategori(clean);
      toast.success(`Kategori "${clean}" ditambahkan`);
      setNama('');
      setFormError(null);
    } catch (err) {
      console.error('[cost-profit] Gagal menambah kategori:', err);
      toast.error('Gagal menambah kategori. Periksa koneksi lalu coba lagi.');
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteKategori(deleteTarget.id);
      toast.success(`Kategori "${deleteTarget.nama}" dihapus`);
      setDeleteTarget(null);
    } catch (err) {
      console.error('[cost-profit] Gagal menghapus kategori:', err);
      toast.error('Gagal menghapus kategori. Periksa koneksi lalu coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  const blockedReason = deleteTarget ? getKategoriDeleteBlock(deleteTarget, bahanList) : null;

  return (
    <SectionCard
      icon={<Tags className="h-5 w-5" />}
      title="Manajemen Kategori"
      description="Kelompok bahan yang dipilih di kalkulator dan form order."
      count={loading ? undefined : kategoriList.length}
    >
      <div className="space-y-4 p-4 sm:p-5">
        {loading ? (
          <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Memuat kategori">
            {[88, 120, 100, 76].map((w) => (
              <Shimmer key={w} className="h-11 rounded-full sm:h-10" style={{ width: w }} />
            ))}
          </div>
        ) : kategoriList.length === 0 ? (
          <EmptyState className="py-8" title="Belum ada kategori" description="Ketik nama kategori di bawah lalu tekan Tambah." />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {kategoriList.map((k) => (
              <li
                key={k.id}
                className="inline-flex h-11 max-w-full items-center rounded-full border border-slate-200 bg-slate-50 pl-3.5 text-xs font-semibold text-slate-800 sm:h-10"
              >
                <span className="min-w-0 truncate" title={k.nama}>
                  {k.nama}
                </span>
                <span className="ml-2 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-slate-500 ring-1 ring-inset ring-slate-200">
                  {bahanCount.get(k.id) ?? 0}
                  <span className="sr-only"> bahan</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(k)}
                  aria-label={`Hapus kategori ${k.nama}`}
                  title="Hapus kategori"
                  className="ml-0.5 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:h-10 sm:w-10"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <label htmlFor={`${uid}-nama`} className="sr-only">
              Nama kategori baru
            </label>
            <input
              id={`${uid}-nama`}
              type="text"
              value={nama}
              onChange={(e) => {
                setNama(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Ketik nama kategori baru lalu tekan Enter"
              aria-invalid={!!formError}
              aria-describedby={formError ? `${uid}-error` : undefined}
              disabled={adding}
              className={cn(FIELD_INPUT, 'font-medium')}
            />
            {formError && (
              <p id={`${uid}-error`} role="alert" className={FIELD_ERROR}>
                {formError}
              </p>
            )}
          </div>
          <button type="submit" disabled={adding || !nama.trim()} className={cn(BTN_PRIMARY, 'w-full sm:w-auto')}>
            <Plus className="h-4 w-4" />
            {adding ? 'Menambah...' : 'Tambah'}
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={blockedReason ? 'Kategori masih dipakai' : 'Hapus kategori?'}
        description={
          deleteTarget ? (
            <>
              Kategori <strong className="text-slate-900">{deleteTarget.nama}</strong>
              {blockedReason ? ' tidak bisa dihapus.' : ' akan dihapus permanen dan tidak muncul lagi di pilihan kategori.'}
            </>
          ) : null
        }
        confirmLabel="Hapus"
        busy={deleting}
        blockedReason={blockedReason}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </SectionCard>
  );
}

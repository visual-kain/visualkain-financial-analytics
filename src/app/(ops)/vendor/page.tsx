'use client';

import React, { useMemo, useState } from 'react';
import { AlertCircle, Plus, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { VendorDialog } from '@/components/ops/vendor/VendorDialog';
import { VendorCards, VendorTable } from '@/components/ops/vendor/VendorList';
import { BTN_OUTLINE, BTN_PRIMARY, FIELD } from '@/components/ops/vendor/styles';
import { ConfirmDialog } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { useOpsData } from '@/context/OpsDataContext';
import { VendorInUseError, deleteVendor } from '@/lib/firestore/vendors-repo';
import type { VendorDoc } from '@/lib/legacy/types';
import { countOrdersByVendor, filterVendors, getVendorDeleteBlockReason } from '@/lib/vendors';

export default function VendorPage() {
  // Context belum menyediakan status muat khusus vendor, jadi status order dipakai: jumlah pemakaian butuh order siap.
  const { vendors, orders, ordersState, vendorsState, error, retry } = useOpsData();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorDoc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const orderCounts = useMemo(() => countOrdersByVendor(orders), [orders]);
  const filtered = useMemo(() => filterVendors(vendors, search), [vendors, search]);
  const loading = ordersState === 'loading' || vendorsState === 'loading';
  const countsReady = ordersState === 'ready';
  const hasLoadError = ordersState === 'error' || vendorsState === 'error' || error !== null;
  const isSearching = search.trim() !== '';

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (vendor: VendorDoc) => {
    setEditing(vendor);
    setDialogOpen(true);
  };

  const blockedReason = deleteTarget ? getVendorDeleteBlockReason(orderCounts.get(deleteTarget.id) ?? 0, countsReady) : null;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteTarget.id);
      toast.success(`Vendor "${deleteTarget.nama}" dihapus`);
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof VendorInUseError) {
        toast.error('Vendor masih dipakai order. Ganti vendor di order tersebut lebih dulu.');
      } else {
        console.error('[vendor] Gagal menghapus:', err);
        toast.error('Gagal menghapus vendor. Periksa koneksi lalu coba lagi.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const emptyState = (
    <EmptyState
      title={isSearching ? 'Tidak ada vendor yang cocok' : 'Belum ada vendor'}
      description={isSearching ? 'Ubah kata kunci pencarian.' : 'Tambahkan vendor pertama agar bisa dipilih di form order.'}
      action={
        isSearching ? (
          <button type="button" onClick={() => setSearch('')} className={`${BTN_OUTLINE} mt-1`}>
            <X className="h-3.5 w-3.5" /> Reset pencarian
          </button>
        ) : (
          <button type="button" onClick={openCreate} className={`${BTN_PRIMARY} mt-1`}>
            <Plus className="h-4 w-4" /> Tambah Vendor
          </button>
        )
      }
    />
  );

  const listProps = { vendors: filtered, orderCounts, countsReady, loading, emptyState, onEdit: openEdit, onDelete: setDeleteTarget };

  return (
    <>
      <PageHeader
        eyebrow={<EyebrowBadge>Produksi</EyebrowBadge>}
        title="Data Vendor"
        subtitle="Master vendor produksi: alamat, WhatsApp, dan PIC. Vendor yang masih dipakai order tidak bisa dihapus."
        actions={
          <button type="button" onClick={openCreate} className={`${BTN_PRIMARY} w-full sm:w-auto`}>
            <Plus className="h-4 w-4" /> Tambah Vendor
          </button>
        }
      />

      {hasLoadError && (
        <div role="alert" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Gagal memuat data vendor atau order{error ? ` (${error})` : ''}. Jumlah order dan tombol hapus dinonaktifkan sampai data termuat.
          </span>
          <button
            type="button"
            onClick={retry}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 font-bold text-rose-800 hover:bg-rose-100 sm:h-10"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Coba lagi
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card-double">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, PIC, WhatsApp, atau alamat..."
              aria-label="Cari vendor"
              className={`${FIELD} pl-9`}
            />
          </div>
          {!loading && (
            <p className="text-xs text-slate-500">
              <strong className="tabular-nums text-slate-800">{filtered.length}</strong>
              {isSearching ? ` dari ${vendors.length}` : ''} vendor
            </p>
          )}
        </div>

        <div className="lg:hidden">
          <VendorCards {...listProps} />
        </div>
        <div className="hidden lg:block">
          <VendorTable {...listProps} />
        </div>
      </section>

      <VendorDialog open={dialogOpen} vendor={editing} vendors={vendors} onClose={() => setDialogOpen(false)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus vendor?"
        description={
          deleteTarget ? (
            <>
              Vendor <strong className="text-slate-900">{deleteTarget.nama}</strong> akan dihapus permanen.
            </>
          ) : null
        }
        confirmLabel="Hapus vendor"
        busy={deleting}
        blockedReason={blockedReason}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

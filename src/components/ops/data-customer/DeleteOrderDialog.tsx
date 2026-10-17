'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/modal';
import { deleteOrder } from '@/lib/firestore/orders-repo';
import { getDeleteBlockReason } from '@/lib/order-form';
import type { LegacyOrder } from '@/lib/legacy/types';

interface DeleteOrderDialogProps {
  order: LegacyOrder | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteOrderDialog({ order, onClose, onDeleted }: DeleteOrderDialogProps) {
  const [busy, setBusy] = useState(false);
  const blockedReason = order ? getDeleteBlockReason(order) : null;

  const confirm = async () => {
    if (!order) return;
    setBusy(true);
    try {
      await deleteOrder(order);
      toast.success(`Order ${order.noInv} dihapus`);
      onClose();
      onDeleted?.();
    } catch (err) {
      console.error('[data-customer] Gagal hapus order:', err);
      toast.error('Gagal menghapus order. Periksa koneksi lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDialog
      open={!!order}
      title="Hapus order?"
      description={
        order ? (
          <>
            Order <strong className="text-slate-900">{order.noInv}</strong> atas nama{' '}
            <strong className="text-slate-900">{order.namaCustomer || '-'}</strong> akan dihapus permanen beserta data tracking-nya.
          </>
        ) : null
      }
      confirmLabel="Hapus permanen"
      busy={busy}
      blockedReason={blockedReason}
      onConfirm={confirm}
      onClose={onClose}
    />
  );
}

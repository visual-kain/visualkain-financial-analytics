'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CATEGORY_DISPLAY_ORDER, CATEGORY_LABELS, type CategoryType } from '@/lib/legacy/calculations';
import { addKategori } from '@/lib/firestore/master-repo';
import type { VendorDoc } from '@/lib/legacy/types';
import { formatRupiah } from '@/lib/utils';

const FIELD = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:h-10';
const BTN_SECONDARY = 'inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:h-10';
const BTN_PRIMARY = 'inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 sm:h-10';

interface VendorPriceModalProps {
  open: boolean;
  vendors: VendorDoc[];
  vendorId: string;
  prices: Record<CategoryType, number>;
  onClose: () => void;
  onSave: (vendorId: string, prices: Record<CategoryType, number>) => void;
}

/** Modal "Harga Modal Vendor" (OrderForm lama): nilai baru disimpan ke dokumen saat order disimpan. */
export function VendorPriceModal({ open, vendors, vendorId, prices, onClose, onSave }: VendorPriceModalProps) {
  const [draftVendor, setDraftVendor] = useState(vendorId);
  const [draft, setDraft] = useState(prices);

  useEffect(() => {
    if (open) {
      setDraftVendor(vendorId);
      setDraft(prices);
    }
    // Draft diisi ulang hanya saat modal dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Harga Modal Vendor"
      description="Harga per pcs sebelum tambahan ukuran besar (2XL ke atas)."
      footer={
        <>
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draftVendor, draft);
              onClose();
            }}
            className={BTN_PRIMARY}
          >
            Simpan Harga Vendor
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="vendor-select" className="mb-1.5 block text-xs font-bold text-slate-700">
            Pilih Vendor
          </label>
          <select id="vendor-select" value={draftVendor} onChange={(e) => setDraftVendor(e.target.value)} className={FIELD}>
            <option value="">-- Pilih Vendor --</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nama}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CATEGORY_DISPLAY_ORDER.map((cat) => (
            <div key={cat}>
              <label htmlFor={`modal-${cat}`} className="mb-1.5 block text-xs font-bold text-slate-700">
                Harga Modal {CATEGORY_LABELS[cat]} (per pcs)
              </label>
              <CurrencyInput id={`modal-${cat}`} value={draft[cat] || ''} onValueChange={(v) => setDraft((d) => ({ ...d, [cat]: v }))} className="h-11 sm:h-10" />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

interface AddKategoriModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: (nama: string) => void;
}

export function AddKategoriModal({ open, onClose, onAdded }: AddKategoriModalProps) {
  const [nama, setNama] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setNama('');
  }, [open]);

  const save = async () => {
    const clean = nama.trim();
    if (!clean) return;
    setBusy(true);
    try {
      await addKategori(clean);
      toast.success(`Kategori "${clean}" ditambahkan`);
      onAdded(clean);
      onClose();
    } catch (err) {
      console.error('[order-form] Gagal menambah kategori:', err);
      toast.error('Gagal menyimpan kategori');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Kategori"
      size="sm"
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={BTN_SECONDARY}>
            Batal
          </button>
          <button type="button" onClick={save} disabled={busy || !nama.trim()} className={BTN_PRIMARY}>
            {busy ? 'Menyimpan...' : 'Simpan'}
          </button>
        </>
      }
    >
      <label htmlFor="kategori-baru" className="mb-1.5 block text-xs font-bold text-slate-700">
        Nama Kategori (contoh: Kaos)
      </label>
      <input
        id="kategori-baru"
        autoFocus
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void save();
          }
        }}
        placeholder="Nama Kategori"
        className={FIELD}
      />
    </Modal>
  );
}

/** Pengganti SweetAlert "Pelunasan Vendor Belum Lengkap": pembayaran vendor kini dicatat di Dana Keluar (K-16). */
export function VendorUnpaidDialog({ open, outstanding, onClose }: { open: boolean; outstanding: number; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pelunasan Vendor Belum Lengkap"
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Ubah Status Sendiri
          </button>
          <Link href="/cash-out/new" className={BTN_PRIMARY}>
            Catat Pembayaran Vendor
          </Link>
        </>
      }
    >
      <p className="text-xs leading-relaxed text-slate-600">
        Order belum lunas ke vendor. Sisa utang vendor: <strong className="text-rose-600">{formatRupiah(outstanding)}</strong>. Catat pelunasan vendor di Dana
        Keluar dulu, lalu ubah status ke Selesai.
      </p>
    </Modal>
  );
}

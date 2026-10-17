'use client';

import React, { useId, useState } from 'react';
import { toast } from 'sonner';
import { keepDialogOpenWhenSelectEscapes } from '@/components/ops/cost-profit/dialog-utils';
import { BTN_PRIMARY, BTN_SECONDARY, FIELD_ERROR, FIELD_INPUT, FIELD_LABEL } from '@/components/ops/cost-profit/styles';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CustomSelect } from '@/components/ui/custom-select';
import { Modal } from '@/components/ui/modal';
import { validateBahanInput, type BahanDoc } from '@/lib/cost-profit';
import { addBahan, updateBahan } from '@/lib/firestore/cost-profit-repo';
import type { KategoriDoc } from '@/lib/legacy/types';
import { cn } from '@/lib/utils';

interface BahanDialogProps {
  open: boolean;
  /** null berarti tambah bahan baru. */
  bahan: BahanDoc | null;
  kategoriList: KategoriDoc[];
  onClose: () => void;
}

/** Form dipasang ulang setiap dialog dibuka, sehingga snapshot Firestore tidak menimpa isian yang sedang diketik. */
export function BahanDialog({ open, bahan, kategoriList, onClose }: BahanDialogProps) {
  if (!open) return null;
  return <BahanDialogForm key={bahan?.id ?? 'new'} bahan={bahan} kategoriList={kategoriList} onClose={onClose} />;
}

function BahanDialogForm({ bahan, kategoriList, onClose }: Omit<BahanDialogProps, 'open'>) {
  const uid = useId();
  const formId = `${uid}-form`;
  const isEdit = !!bahan;
  const [kategoriId, setKategoriId] = useState(bahan?.kategoriId ?? '');
  const [nama, setNama] = useState(bahan?.nama ?? '');
  const [harga, setHarga] = useState(bahan?.harga ?? 0);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  // Kategori bahan lama bisa sudah terhapus; dianggap belum dipilih agar bahan tidak menggantung.
  const activeKategoriId = kategoriList.some((k) => k.id === kategoriId) ? kategoriId : '';
  const input = { kategoriId: activeKategoriId, nama, harga };
  const errors = validateBahanInput(input, { isEdit });
  const visible = showErrors ? errors : {};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      if (bahan) await updateBahan(bahan.id, input);
      else await addBahan(input);
      toast.success(isEdit ? `Bahan "${nama.trim()}" diperbarui` : `Bahan "${nama.trim()}" ditambahkan`);
      onClose();
    } catch (err) {
      console.error('[cost-profit] Gagal menyimpan bahan:', err);
      toast.error('Gagal menyimpan bahan. Periksa koneksi lalu coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit Bahan' : 'Tambah Bahan'}
      description="Harga modal per pcs dipakai kalkulator untuk menghitung harga jual."
      busy={saving}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={BTN_SECONDARY}>
            Batal
          </button>
          <button type="submit" form={formId} disabled={saving} className={BTN_PRIMARY}>
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Bahan'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} onKeyDown={keepDialogOpenWhenSelectEscapes} noValidate className="space-y-4">
        <div>
          <span id={`${uid}-kategori`} className={FIELD_LABEL}>
            Kategori <span className="text-rose-500">*</span>
          </span>
          <div role="group" aria-labelledby={`${uid}-kategori`}>
            <CustomSelect
              value={activeKategoriId}
              onValueChange={setKategoriId}
              placeholder="Pilih kategori"
              options={kategoriList.map((k) => ({ value: k.id, label: k.nama }))}
              className="h-11 w-full text-sm sm:h-10 sm:text-xs"
            />
          </div>
          {visible.kategoriId && (
            <p role="alert" className={FIELD_ERROR}>
              {visible.kategoriId}
            </p>
          )}
          {kategoriList.length === 0 && (
            <p className="mt-1 text-[11px] font-semibold text-amber-800">Belum ada kategori. Tambahkan dulu di bagian Manajemen Kategori.</p>
          )}
        </div>

        <div>
          <label htmlFor={`${uid}-nama`} className={FIELD_LABEL}>
            Nama Bahan <span className="text-rose-500">*</span>
          </label>
          <input
            id={`${uid}-nama`}
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Cotton Combed 30s"
            autoFocus={isEdit}
            aria-invalid={!!visible.nama}
            className={cn(FIELD_INPUT, 'font-medium')}
          />
          {visible.nama && (
            <p role="alert" className={FIELD_ERROR}>
              {visible.nama}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${uid}-harga`} className={FIELD_LABEL}>
            Harga Modal / Pcs <span className="text-rose-500">*</span>
          </label>
          <CurrencyInput
            id={`${uid}-harga`}
            value={harga || ''}
            onValueChange={setHarga}
            required
            className="h-11 text-base sm:h-10 sm:text-xs"
          />
          {visible.harga && (
            <p role="alert" className={FIELD_ERROR}>
              {visible.harga}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}

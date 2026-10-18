'use client';

import React, { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { BTN_OUTLINE, BTN_PRIMARY, FIELD } from '@/components/ops/vendor/styles';
import { Modal } from '@/components/ui/modal';
import { createVendor, updateVendor } from '@/lib/firestore/vendors-repo';
import type { VendorDoc } from '@/lib/legacy/types';
import { EMPTY_VENDOR_FORM, validateVendorForm, vendorToFormValues, type VendorFormValues } from '@/lib/vendors';
import { cn } from '@/lib/utils';

interface VendorDialogProps {
  open: boolean;
  /** Vendor yang diedit; `null` untuk vendor baru. */
  vendor: VendorDoc | null;
  vendors: VendorDoc[];
  onClose: () => void;
}

export function VendorDialog({ open, vendor, vendors, onClose }: VendorDialogProps) {
  const uid = useId();
  const formId = `${uid}-vendor-form`;
  const [values, setValues] = useState<VendorFormValues>(EMPTY_VENDOR_FORM);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Diisi ulang hanya saat dialog dibuka, bukan setiap daftar vendor berubah, agar ketikan tidak tertimpa.
  useEffect(() => {
    if (!open) return;
    setValues(vendorToFormValues(vendor));
    setNameError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setField = (key: keyof VendorFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === 'nama') setNameError(null);
  };

  const save = async () => {
    const result = validateVendorForm(values, vendors, vendor?.id);
    if (!result.ok) {
      setNameError(result.errors.nama);
      return;
    }
    setSaving(true);
    try {
      if (vendor) await updateVendor(vendor.id, result.values);
      else await createVendor(result.values);
      toast.success(vendor ? `Vendor "${result.values.nama}" diperbarui` : `Vendor "${result.values.nama}" ditambahkan`);
      onClose();
    } catch (err) {
      console.error('[vendor] Gagal menyimpan:', err);
      toast.error('Gagal menyimpan vendor. Periksa koneksi lalu coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vendor ? 'Edit Vendor' : 'Tambah Vendor'}
      description="Data vendor dipakai di form order dan modul finansial."
      busy={saving}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={BTN_OUTLINE}>
            Batal
          </button>
          <button type="submit" form={formId} disabled={saving} className={BTN_PRIMARY}>
            {saving ? 'Menyimpan...' : 'Simpan Vendor'}
          </button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div>
          <label htmlFor={`${uid}-nama`} className="mb-1.5 block text-xs font-bold text-slate-700">
            Nama Vendor <span className="text-rose-500">*</span>
          </label>
          <input
            id={`${uid}-nama`}
            autoFocus
            value={values.nama}
            onChange={(e) => setField('nama', e.target.value)}
            placeholder="Nama toko atau perusahaan"
            aria-invalid={!!nameError}
            aria-describedby={nameError ? `${uid}-nama-error` : undefined}
            className={cn(FIELD, nameError && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20')}
          />
          {nameError && (
            <p id={`${uid}-nama-error`} role="alert" className="mt-1 text-[11px] font-semibold text-rose-600">
              {nameError}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-alamat`} className="mb-1.5 block text-xs font-bold text-slate-700">
            Alamat
          </label>
          <textarea
            id={`${uid}-alamat`}
            rows={2}
            value={values.alamat}
            onChange={(e) => setField('alamat', e.target.value)}
            placeholder="Alamat lengkap"
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-xs"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-wa`} className="mb-1.5 block text-xs font-bold text-slate-700">
              No. WhatsApp
            </label>
            <input
              id={`${uid}-wa`}
              type="tel"
              inputMode="tel"
              value={values.wa}
              onChange={(e) => setField('wa', e.target.value)}
              placeholder="Contoh: 08123456789"
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-pic`} className="mb-1.5 block text-xs font-bold text-slate-700">
              PIC (Contact Person)
            </label>
            <input
              id={`${uid}-pic`}
              value={values.pic}
              onChange={(e) => setField('pic', e.target.value)}
              placeholder="Nama orang yang dihubungi"
              className={FIELD}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

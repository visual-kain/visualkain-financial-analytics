'use client';

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useRekeningMaster } from '@/hooks/useRekeningMaster';
import { rekeningLabel, type RekeningAccount, type RekeningInput } from '@/lib/rekening-master';
import type { ManageMode } from '@/components/finance/ManageActions';

export { ManageActions, type ManageMode } from '@/components/finance/ManageActions';

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

interface MasterFormDialogProps {
  open: boolean;
  title: string;
  description?: string;
  fields: ReadonlyArray<FieldDef>;
  initialValues: Record<string, string>;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
}

// Dirender lewat portal agar Enter di dalam dialog tidak men-submit form halaman (cash-in/cash-out membungkus kolom dengan <form>).
function MasterFormDialog({ open, title, description, fields, initialValues, onClose, onSubmit }: MasterFormDialogProps) {
  const uid = useId();
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setError(null);
      setSaving(false);
    }
    // initialValues sengaja tidak menjadi dependensi: form diisi ulang hanya saat dialog dibuka.
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, saving, onClose]);

  if (!open || !mounted) return null;

  const submit = async () => {
    const missing = fields.find((f) => f.required && !(values[f.key] || '').trim());
    if (missing) {
      setError(`${missing.label} wajib diisi`);
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSubmit(values);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan data');
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
            e.preventDefault();
            void submit();
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 id={`${uid}-title`} className="text-sm font-bold text-slate-900">{title}</h4>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((f, idx) => (
            <div key={f.key}>
              <label htmlFor={`${uid}-${f.key}`} className="block text-xs font-bold text-slate-700 mb-1.5">
                {f.label} {f.required && <span className="text-rose-500">*</span>}
              </label>
              <input
                id={`${uid}-${f.key}`}
                type="text"
                autoFocus={idx === 0}
                value={values[f.key] || ''}
                placeholder={f.placeholder}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              {f.hint && <p className="mt-1 text-[11px] text-slate-500">{f.hint}</p>}
            </div>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-xl bg-teal-600 px-4 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const REKENING_FIELDS: ReadonlyArray<FieldDef> = [
  { key: 'namaBank', label: 'Nama Bank / Akun', placeholder: 'Contoh: Bank BCA', required: true },
  { key: 'nomor', label: 'Nomor Rekening', placeholder: 'Contoh: 8830-1928-41' },
  { key: 'atasNama', label: 'Atas Nama', placeholder: 'Contoh: PT VISUAL KAIN INDONESIA' },
];

interface RekeningDialogState {
  mode: ManageMode;
  target: RekeningAccount | null;
  onSaved?: (kode: string) => void;
}

/** Daftar rekening + dialog tambah/edit; halaman cukup merender `dialog` dan mengoper `open` ke tombol. */
export function useRekeningManager() {
  const { accounts, options, saveRekening } = useRekeningMaster();
  const [state, setState] = useState<RekeningDialogState | null>(null);

  const open = useCallback(
    (mode: ManageMode, kode?: string | null, onSaved?: (kode: string) => void) => {
      const target = mode === 'edit' ? accounts.find((a) => a.kode === kode) ?? null : null;
      if (mode === 'edit' && !target) {
        toast.error('Pilih rekening yang ingin diedit terlebih dahulu');
        return;
      }
      setState({ mode, target, onSaved });
    },
    [accounts]
  );

  const close = useCallback(() => setState(null), []);

  const initialValues = useMemo<Record<string, string>>(
    () => ({
      namaBank: state?.target?.namaBank ?? '',
      nomor: state?.target?.nomor ?? '',
      atasNama: state?.target?.atasNama ?? '',
    }),
    [state]
  );

  const dialog = (
    <MasterFormDialog
      open={state !== null}
      title={state?.mode === 'edit' ? 'Edit Rekening' : 'Tambah Rekening'}
      description={
        state?.mode === 'edit' && state.target
          ? `Mengubah ${rekeningLabel(state.target)}. Transaksi lama tetap terhubung ke rekening ini.`
          : 'Rekening baru langsung tersedia di semua form dana masuk dan keluar.'
      }
      fields={REKENING_FIELDS}
      initialValues={initialValues}
      onClose={close}
      onSubmit={async (values) => {
        const input: RekeningInput = { namaBank: values.namaBank || '', nomor: values.nomor || '', atasNama: values.atasNama || '' };
        const saved = await saveRekening(input, state?.mode === 'edit' ? state.target?.kode : null);
        toast.success(state?.mode === 'edit' ? 'Rekening berhasil diperbarui' : 'Rekening baru berhasil ditambahkan');
        state?.onSaved?.(saved.kode);
        setState(null);
      }}
    />
  );

  return { accounts, options, open, dialog };
}

interface VendorFormDialogProps {
  open: boolean;
  mode: ManageMode;
  initialNama: string;
  isMasterVendor: boolean;
  onClose: () => void;
  onSubmit: (nama: string) => Promise<void>;
}

export function VendorFormDialog({ open, mode, initialNama, isMasterVendor, onClose, onSubmit }: VendorFormDialogProps) {
  const initialValues = useMemo(() => ({ nama: mode === 'edit' ? initialNama : '' }), [mode, initialNama]);
  return (
    <MasterFormDialog
      open={open}
      title={mode === 'edit' ? 'Edit Nama Vendor' : 'Tambah Vendor Baru'}
      description={
        mode === 'edit'
          ? isMasterVendor
            ? 'Nama baru berlaku untuk semua pesanan yang terhubung ke vendor ini, termasuk di aplikasi operasional VisualKainDB.'
            : 'Vendor ini belum ada di master. Nama hasil edit akan disimpan sebagai vendor baru.'
          : 'Vendor baru disimpan ke master vendor dan langsung dipilih untuk pesanan ini.'
      }
      fields={[{ key: 'nama', label: 'Nama Vendor', placeholder: 'Contoh: LAJUWARNA', required: true }]}
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={(values) => onSubmit(values.nama || '')}
    />
  );
}

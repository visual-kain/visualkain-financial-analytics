'use client';

import React, { useId, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BTN_PRIMARY, BTN_SECONDARY, FIELD_ERROR, FIELD_INPUT, FIELD_LABEL } from '@/components/ops/cost-profit/styles';
import { Modal } from '@/components/ui/modal';
import {
  DEFAULT_MARKUP_FORM,
  findOverlappingRules,
  formatMarkupPersen,
  formatQtyRange,
  parseNumericField,
  validateMarkupInput,
  type MarkupDoc,
} from '@/lib/cost-profit';
import { addMarkup, updateMarkup } from '@/lib/firestore/cost-profit-repo';
import { cn } from '@/lib/utils';

interface MarkupDialogProps {
  open: boolean;
  /** null berarti tambah aturan baru. */
  rule: MarkupDoc | null;
  rules: MarkupDoc[];
  onClose: () => void;
}

/** Form dipasang ulang setiap dialog dibuka, sehingga snapshot Firestore tidak menimpa isian yang sedang diketik. */
export function MarkupDialog({ open, rule, rules, onClose }: MarkupDialogProps) {
  if (!open) return null;
  return <MarkupDialogForm key={rule?.id ?? 'new'} rule={rule} rules={rules} onClose={onClose} />;
}

function MarkupDialogForm({ rule, rules, onClose }: Omit<MarkupDialogProps, 'open'>) {
  const uid = useId();
  const formId = `${uid}-form`;
  const isEdit = !!rule;
  const [qtyMin, setQtyMin] = useState(String(rule?.qtyMin ?? DEFAULT_MARKUP_FORM.qtyMin));
  const [qtyMax, setQtyMax] = useState(String(rule?.qtyMax ?? DEFAULT_MARKUP_FORM.qtyMax));
  const [persen, setPersen] = useState(String(rule?.persen ?? DEFAULT_MARKUP_FORM.persen));
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const input = { qtyMin: parseNumericField(qtyMin), qtyMax: parseNumericField(qtyMax), persen: parseNumericField(persen) };
  const errors = validateMarkupInput(input);
  const visible = showErrors ? errors : {};
  // Peringatan saja, tidak memblokir simpan: rentang yang beririsan tetap sah (aturan pertama yang dipakai).
  const overlaps = !errors.qtyMin && !errors.qtyMax ? findOverlappingRules(input, rules, rule?.id) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      if (rule) await updateMarkup(rule.id, input);
      else await addMarkup(input);
      toast.success(isEdit ? 'Aturan markup diperbarui' : 'Aturan markup ditambahkan');
      onClose();
    } catch (err) {
      console.error('[cost-profit] Gagal menyimpan aturan markup:', err);
      toast.error('Gagal menyimpan aturan markup. Periksa koneksi lalu coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const numberInput = (id: string, value: string, onChange: (v: string) => void, invalid: boolean, min: number) => (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      step={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={invalid}
      className={cn(FIELD_INPUT, 'font-mono')}
    />
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit Aturan Markup' : 'Tambah Aturan Markup'}
      description="Tentukan rentang jumlah pesanan (Qty) untuk mendapatkan persentase markup tertentu."
      busy={saving}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={BTN_SECONDARY}>
            Batal
          </button>
          <button type="submit" form={formId} disabled={saving} className={BTN_PRIMARY}>
            {saving ? 'Menyimpan...' : 'Simpan Aturan'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${uid}-min`} className={FIELD_LABEL}>
              Qty Min (Dari)
            </label>
            {numberInput(`${uid}-min`, qtyMin, setQtyMin, !!visible.qtyMin, 1)}
            {visible.qtyMin && (
              <p role="alert" className={FIELD_ERROR}>
                {visible.qtyMin}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`${uid}-max`} className={FIELD_LABEL}>
              Qty Max (Sampai)
            </label>
            {numberInput(`${uid}-max`, qtyMax, setQtyMax, !!visible.qtyMax, 1)}
            {visible.qtyMax && (
              <p role="alert" className={FIELD_ERROR}>
                {visible.qtyMax}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor={`${uid}-persen`} className={FIELD_LABEL}>
            Persentase Markup (%)
          </label>
          {numberInput(`${uid}-persen`, persen, setPersen, !!visible.persen, 0)}
          {visible.persen && (
            <p role="alert" className={FIELD_ERROR}>
              {visible.persen}
            </p>
          )}
        </div>

        {overlaps.length > 0 && (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <p className="flex items-start gap-2 font-bold">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              Rentang ini tumpang tindih dengan aturan lain
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-9 font-medium">
              {overlaps.map((o) => (
                <li key={o.id}>
                  {formatMarkupPersen(o.persen)} ({formatQtyRange(o.qtyMin, o.qtyMax)})
                </li>
              ))}
            </ul>
            <p className="mt-1.5 pl-6 leading-relaxed">
              Di rentang bersama, kalkulator memakai aturan dengan Qty Min terkecil. Aturan tetap bisa disimpan.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}

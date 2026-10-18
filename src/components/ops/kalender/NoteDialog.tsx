'use client';

import React, { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { BTN_OUTLINE, BTN_PRIMARY, FIELD } from '@/components/ops/kalender/styles';
import { Modal } from '@/components/ui/modal';
import { formatLongDate, normalizeDateKey } from '@/lib/calendar';
import { addCalendarNote } from '@/lib/firestore/calendar-notes-repo';
import { cn } from '@/lib/utils';

interface NoteDialogProps {
  /** Tanggal awal; `null` berarti dialog tertutup. */
  initialDate: string | null;
  onClose: () => void;
}

export function NoteDialog({ initialDate, onClose }: NoteDialogProps) {
  const uid = useId();
  const formId = `${uid}-note-form`;
  const [date, setDate] = useState('');
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<{ date?: string; text?: string }>({});
  const [saving, setSaving] = useState(false);

  // Diisi ulang hanya saat dialog dibuka agar ketikan tidak hilang ketika data kalender di belakang berubah.
  useEffect(() => {
    if (!initialDate) return;
    setDate(initialDate);
    setText('');
    setErrors({});
  }, [initialDate]);

  const save = async () => {
    const cleanDate = normalizeDateKey(date);
    const cleanText = text.trim();
    const next: { date?: string; text?: string } = {};
    if (!cleanDate) next.date = 'Pilih tanggal yang valid';
    if (!cleanText) next.text = 'Catatan wajib diisi';
    setErrors(next);
    if (!cleanDate || !cleanText) return;

    setSaving(true);
    try {
      await addCalendarNote(cleanDate, cleanText);
      toast.success(`Catatan ditambahkan untuk ${formatLongDate(cleanDate)}`);
      onClose();
    } catch (err) {
      console.error('[kalender] Gagal menyimpan catatan:', err);
      toast.error('Gagal menyimpan catatan. Periksa koneksi lalu coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!initialDate}
      onClose={onClose}
      title="Tambah Catatan"
      description={date ? formatLongDate(date) : undefined}
      busy={saving}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={BTN_OUTLINE}>
            Batal
          </button>
          <button type="submit" form={formId} disabled={saving} className={BTN_PRIMARY}>
            {saving ? 'Menyimpan...' : 'Simpan Catatan'}
          </button>
        </>
      }
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div>
          <label htmlFor={`${uid}-date`} className="mb-1.5 block text-xs font-bold text-slate-700">
            Tanggal <span className="text-rose-500">*</span>
          </label>
          <input
            id={`${uid}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!errors.date}
            className={cn(FIELD, errors.date && 'border-rose-400')}
          />
          {errors.date && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.date}</p>}
        </div>
        <div>
          <label htmlFor={`${uid}-text`} className="mb-1.5 block text-xs font-bold text-slate-700">
            Catatan <span className="text-rose-500">*</span>
          </label>
          <textarea
            id={`${uid}-text`}
            autoFocus
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                void save();
              }
            }}
            placeholder="Tulis catatan untuk tanggal ini..."
            aria-invalid={!!errors.text}
            className={cn(
              'w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-xs',
              errors.text && 'border-rose-400'
            )}
          />
          {errors.text && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.text}</p>}
        </div>
      </form>
    </Modal>
  );
}

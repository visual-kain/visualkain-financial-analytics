'use client';

import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/modal';
import { KERJASAMA_DEFAULT_TEXT, type KerjasamaFormState } from '@/lib/letters';
import { cn } from '@/lib/utils';
import { FIELD_GRID, FIELD_SPAN, FormSection, READONLY_INPUT_CLASS, TextAreaField, TextField } from './fields';

interface KerjasamaFormProps {
  form: KerjasamaFormState;
  onChange: (patch: Partial<KerjasamaFormState>) => void;
}

export function KerjasamaForm({ form, onChange }: KerjasamaFormProps) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const saved = Boolean(form.noSurat);

  return (
    <>
      <FormSection title="Informasi Surat">
        <div className={FIELD_GRID}>
          <TextField
            label="No. Surat"
            value={form.noSurat || 'Otomatis saat disimpan'}
            readOnly
            aria-readonly="true"
            inputClassName={cn(READONLY_INPUT_CLASS, !saved && 'font-normal italic text-slate-500')}
          />
          <TextField label="Tanggal" type="date" value={form.tanggal} onChange={(e) => onChange({ tanggal: e.target.value })} />
          <TextField
            label="Lampiran"
            className={FIELD_SPAN}
            value={form.lampiran}
            onChange={(e) => onChange({ lampiran: e.target.value })}
            placeholder="Cth: Company Profile, Portofolio"
          />
          <TextField
            label="Perihal"
            className={FIELD_SPAN}
            value={form.perihal}
            onChange={(e) => onChange({ perihal: e.target.value })}
            placeholder="Cth: Pengajuan Kerjasama Bidang Konveksi"
          />
        </div>
      </FormSection>

      <FormSection title="Kepada Yth.">
        <div className={FIELD_GRID}>
          <TextField
            label="Nama Perusahaan / Brand"
            value={form.perusahaan}
            onChange={(e) => onChange({ perusahaan: e.target.value })}
            placeholder="PT. Contoh Brand"
          />
          <TextField
            label="Divisi / Jabatan PIC"
            value={form.divisi}
            onChange={(e) => onChange({ divisi: e.target.value })}
            placeholder="HRD / Procurement / GM"
          />
          <TextField label="Alamat" value={form.alamat} onChange={(e) => onChange({ alamat: e.target.value })} placeholder="Alamat perusahaan" />
          <TextField label="Di Tempat" value={form.diTempat} onChange={(e) => onChange({ diTempat: e.target.value })} placeholder="Di Tempat" />
        </div>
      </FormSection>

      <FormSection
        title="Isi Surat"
        action={
          <Button variant="ghost" size="sm" onClick={() => setRestoreOpen(true)} className="h-11 text-[11px] sm:h-8">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Pulihkan teks standar
          </Button>
        }
      >
        <p className="text-[11px] leading-snug text-slate-500">
          Opsional, ubah bila perlu. Tekan Enter untuk baris baru. Teks tebal memakai <code className="rounded bg-slate-100 px-1 font-semibold text-slate-700">{'<b>teks</b>'}</code>, miring{' '}
          <code className="rounded bg-slate-100 px-1 font-semibold text-slate-700">{'<i>teks</i>'}</code>.
        </p>
        <TextAreaField label="Paragraf Pembuka" rows={4} value={form.pembuka} onChange={(e) => onChange({ pembuka: e.target.value })} />
        <TextAreaField label="Paragraf Profil (Tentang Kami)" rows={9} value={form.profil} onChange={(e) => onChange({ profil: e.target.value })} />
        <TextAreaField label="Paragraf Keunggulan" rows={7} value={form.keunggulan} onChange={(e) => onChange({ keunggulan: e.target.value })} />
        <TextAreaField label="Paragraf Penutup" rows={5} value={form.penutup} onChange={(e) => onChange({ penutup: e.target.value })} />
      </FormSection>

      <ConfirmDialog
        open={restoreOpen}
        title="Pulihkan teks standar?"
        description="Keempat paragraf kembali ke teks bawaan VisualKain. Perubahan yang sudah Anda ketik di paragraf akan hilang. Data lain tidak berubah."
        confirmLabel="Ya, pulihkan"
        tone="primary"
        onConfirm={() => {
          onChange({
            pembuka: KERJASAMA_DEFAULT_TEXT.pembuka,
            profil: KERJASAMA_DEFAULT_TEXT.profil,
            keunggulan: KERJASAMA_DEFAULT_TEXT.keunggulan,
            penutup: KERJASAMA_DEFAULT_TEXT.penutup,
          });
          setRestoreOpen(false);
        }}
        onClose={() => setRestoreOpen(false)}
      />
    </>
  );
}

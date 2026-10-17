'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Handshake } from 'lucide-react';
import { toast } from 'sonner';
import { KerjasamaPaper } from '@/components/legacy/KerjasamaPaper';
import { printWithTitle } from '@/components/legacy/PaperViewport';
import { useAuth } from '@/context/AuthContext';
import { useBeforeUnloadGuard } from '@/hooks/useBeforeUnloadGuard';
import { createKerjasama, deleteKerjasama, updateKerjasama } from '@/lib/firestore/letters-repo';
import {
  defaultKerjasamaForm,
  kerjasamaDocToForm,
  validateKerjasamaForm,
  type KerjasamaDoc,
  type KerjasamaFormState,
} from '@/lib/letters';
import { KerjasamaForm } from './KerjasamaForm';
import { LetterEditorLayout } from './LetterEditorLayout';

const PENDING_NUMBER = 'Otomatis saat disimpan';

export function KerjasamaEditor({ doc }: { doc?: KerjasamaDoc }) {
  const router = useRouter();
  const { profile } = useAuth();
  const [form, setForm] = useState<KerjasamaFormState>(() => (doc ? kerjasamaDocToForm(doc) : defaultKerjasamaForm()));
  const [savedId, setSavedId] = useState<string | null>(doc?.id ?? null);
  const [baseline, setBaseline] = useState(() => JSON.stringify(form));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Ref menahan klik ganda sebelum state `saving` sempat dirender; satu klik ekstra bisa menghanguskan satu nomor.
  const savingRef = useRef(false);

  const dirty = JSON.stringify(form) !== baseline;
  useBeforeUnloadGuard(dirty);

  const patch = useCallback((changes: Partial<KerjasamaFormState>) => {
    setForm((prev) => ({ ...prev, ...changes }));
    setFormError(null);
  }, []);

  const handleSave = async () => {
    if (savingRef.current) return;
    const problem = validateKerjasamaForm(form);
    if (problem) {
      setFormError(problem);
      toast.error(problem);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    const submitted = form;
    try {
      if (!savedId) {
        const created = await createKerjasama(submitted, { name: profile?.name ?? '', email: profile?.email ?? '' });
        setForm((prev) => ({ ...prev, noSurat: created.nomor }));
        setBaseline(JSON.stringify({ ...submitted, noSurat: created.nomor }));
        setSavedId(created.id);
        toast.success(`Surat tersimpan dengan nomor ${created.nomor}`);
        router.replace(`/kerjasama/${created.id}`);
      } else {
        await updateKerjasama(savedId, submitted);
        setBaseline(JSON.stringify(submitted));
        toast.success('Perubahan surat tersimpan');
      }
    } catch (err) {
      console.warn('[Firebase] Simpan surat kerjasama gagal:', err instanceof Error ? err.message : err);
      toast.error('Surat belum tersimpan. Periksa koneksi internet lalu coba lagi.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!form.noSurat) return;
    printWithTitle(`${form.noSurat}_${form.perusahaan || 'Surat Kerjasama'}`);
  };

  const handleDelete = async () => {
    if (!savedId) return;
    try {
      await deleteKerjasama(savedId);
      toast.success(`Surat ${form.noSurat} dihapus`);
      router.replace('/kerjasama');
    } catch (err) {
      console.warn('[Firebase] Hapus surat kerjasama gagal:', err instanceof Error ? err.message : err);
      toast.error('Surat belum terhapus. Periksa koneksi internet lalu coba lagi.');
    }
  };

  return (
    <LetterEditorLayout
      title="Pengajuan Kerjasama"
      noun="surat"
      icon={<Handshake className="h-3.5 w-3.5" aria-hidden />}
      listHref="/kerjasama"
      listLabel="Daftar surat"
      nomor={form.noSurat}
      dirty={dirty}
      saving={saving}
      formError={formError}
      onSave={handleSave}
      onPrint={handlePrint}
      onDelete={savedId ? handleDelete : undefined}
      deleteDescription={
        <>
          Surat <strong>{form.noSurat}</strong> untuk <strong>{form.perusahaan || 'tanpa nama perusahaan'}</strong> akan dihapus permanen. Nomor ini tidak dipakai
          ulang oleh surat lain.
        </>
      }
      form={<KerjasamaForm form={form} onChange={patch} />}
      preview={<KerjasamaPaper formData={{ ...form, noSurat: form.noSurat || PENDING_NUMBER }} />}
      printCopy={form.noSurat ? <KerjasamaPaper formData={form} /> : null}
    />
  );
}

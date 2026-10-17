'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileSignature } from 'lucide-react';
import { toast } from 'sonner';
import { PenawaranPaper } from '@/components/legacy/PenawaranPaper';
import { printWithTitle } from '@/components/legacy/PaperViewport';
import { useAuth } from '@/context/AuthContext';
import { useBeforeUnloadGuard } from '@/hooks/useBeforeUnloadGuard';
import { createPenawaran, deletePenawaran, updatePenawaran } from '@/lib/firestore/letters-repo';
import {
  addPenawaranItem,
  defaultPenawaranForm,
  defaultPenawaranItems,
  penawaranDocToForm,
  removePenawaranItem,
  updatePenawaranItem,
  validatePenawaranForm,
  type PenawaranDoc,
  type PenawaranFormState,
  type PenawaranItem,
} from '@/lib/letters';
import { LetterEditorLayout } from './LetterEditorLayout';
import { PenawaranForm } from './PenawaranForm';

const PENDING_NUMBER = 'Otomatis saat disimpan';

interface EditorState {
  form: PenawaranFormState;
  items: PenawaranItem[];
}

function initialState(doc?: PenawaranDoc): EditorState {
  if (doc) return penawaranDocToForm(doc);
  return { form: defaultPenawaranForm(), items: defaultPenawaranItems() };
}

export function PenawaranEditor({ doc }: { doc?: PenawaranDoc }) {
  const router = useRouter();
  const { profile } = useAuth();
  const [state, setState] = useState<EditorState>(() => initialState(doc));
  const [savedId, setSavedId] = useState<string | null>(doc?.id ?? null);
  const [baseline, setBaseline] = useState(() => JSON.stringify(state));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Ref menahan klik ganda sebelum state `saving` sempat dirender; satu klik ekstra bisa menghanguskan satu nomor.
  const savingRef = useRef(false);

  const { form, items } = state;
  const dirty = JSON.stringify(state) !== baseline;
  useBeforeUnloadGuard(dirty);

  const patch = useCallback((changes: Partial<PenawaranFormState>) => {
    setState((prev) => ({ ...prev, form: { ...prev.form, ...changes } }));
    setFormError(null);
  }, []);
  const addItem = useCallback(() => setState((prev) => ({ ...prev, items: addPenawaranItem(prev.items) })), []);
  const removeItem = useCallback((index: number) => setState((prev) => ({ ...prev, items: removePenawaranItem(prev.items, index) })), []);
  const updateItem = useCallback(
    (index: number, field: 'desc' | 'satuan' | 'qty' | 'harga', value: string | number) =>
      setState((prev) => ({ ...prev, items: updatePenawaranItem(prev.items, index, field, value) })),
    []
  );

  const handleSave = async () => {
    if (savingRef.current) return;
    const problem = validatePenawaranForm(form);
    if (problem) {
      setFormError(problem);
      toast.error(problem);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    const submitted = state;
    try {
      if (!savedId) {
        const created = await createPenawaran(submitted.form, submitted.items, { name: profile?.name ?? '', email: profile?.email ?? '' });
        setState((prev) => ({ ...prev, form: { ...prev.form, noPenawaran: created.nomor } }));
        setBaseline(JSON.stringify({ ...submitted, form: { ...submitted.form, noPenawaran: created.nomor } }));
        setSavedId(created.id);
        toast.success(`Penawaran tersimpan dengan nomor ${created.nomor}`);
        router.replace(`/penawaran/${created.id}`);
      } else {
        await updatePenawaran(savedId, submitted.form, submitted.items);
        setBaseline(JSON.stringify(submitted));
        toast.success('Perubahan penawaran tersimpan');
      }
    } catch (err) {
      console.warn('[Firebase] Simpan penawaran gagal:', err instanceof Error ? err.message : err);
      toast.error('Penawaran belum tersimpan. Periksa koneksi internet lalu coba lagi.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!form.noPenawaran) return;
    printWithTitle(`${form.noPenawaran}_${form.perusahaan || 'Penawaran'}`);
  };

  const handleDelete = async () => {
    if (!savedId) return;
    try {
      await deletePenawaran(savedId);
      toast.success(`Penawaran ${form.noPenawaran} dihapus`);
      router.replace('/penawaran');
    } catch (err) {
      console.warn('[Firebase] Hapus penawaran gagal:', err instanceof Error ? err.message : err);
      toast.error('Penawaran belum terhapus. Periksa koneksi internet lalu coba lagi.');
    }
  };

  return (
    <LetterEditorLayout
      title="Penawaran Harga"
      noun="penawaran"
      icon={<FileSignature className="h-3.5 w-3.5" aria-hidden />}
      listHref="/penawaran"
      listLabel="Daftar penawaran"
      nomor={form.noPenawaran}
      dirty={dirty}
      saving={saving}
      formError={formError}
      onSave={handleSave}
      onPrint={handlePrint}
      onDelete={savedId ? handleDelete : undefined}
      deleteDescription={
        <>
          Penawaran <strong>{form.noPenawaran}</strong> untuk <strong>{form.perusahaan || 'tanpa nama perusahaan'}</strong> akan dihapus permanen. Nomor ini tidak
          dipakai ulang oleh penawaran lain.
        </>
      }
      form={<PenawaranForm form={form} items={items} onChange={patch} onAddItem={addItem} onRemoveItem={removeItem} onUpdateItem={updateItem} />}
      preview={<PenawaranPaper formData={{ ...form, noPenawaran: form.noPenawaran || PENDING_NUMBER }} items={items} />}
      printCopy={form.noPenawaran ? <PenawaranPaper formData={form} items={items} /> : null}
    />
  );
}

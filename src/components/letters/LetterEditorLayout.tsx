'use client';

import React, { useId, useState } from 'react';
import { AlertTriangle, Loader2, Printer, Save, Trash2 } from 'lucide-react';
import { EyebrowBadge, PageHeader } from '@/components/layout/PageHeader';
import { PaperViewport, PrintPortal } from '@/components/legacy/PaperViewport';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { DANGER_BUTTON_CLASS, OUTLINE_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from './fields';

type Tab = 'form' | 'preview';

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'form', label: 'Form' },
  { id: 'preview', label: 'Pratinjau' },
];

interface LetterEditorLayoutProps {
  title: string;
  /** Kata benda untuk teks bantu, misalnya "surat" atau "penawaran". */
  noun: string;
  icon: React.ReactNode;
  listHref: string;
  listLabel: string;
  /** Nomor dokumen; kosong selama dokumen belum pernah disimpan. */
  nomor: string;
  dirty: boolean;
  saving: boolean;
  formError: string | null;
  onSave: () => void;
  onPrint: () => void;
  /** Dipanggil setelah user menyetujui dialog hapus; hanya tersedia untuk dokumen yang sudah tersimpan. */
  onDelete?: () => Promise<void>;
  deleteDescription?: React.ReactNode;
  form: React.ReactNode;
  preview: React.ReactNode;
  /** Salinan kertas untuk dicetak; null selama nomor belum ada. */
  printCopy: React.ReactNode | null;
}

export function LetterEditorLayout({
  title,
  noun,
  icon,
  listHref,
  listLabel,
  nomor,
  dirty,
  saving,
  formError,
  onSave,
  onPrint,
  onDelete,
  deleteDescription,
  form,
  preview,
  printCopy,
}: LetterEditorLayoutProps) {
  const uid = useId();
  const [tab, setTab] = useState<Tab>('form');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saved = Boolean(nomor);

  const selectTab = (next: Tab, focus = false) => {
    setTab(next);
    if (focus) document.getElementById(`${uid}-tab-${next}`)?.focus();
  };

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      selectTab(tab === 'form' ? 'preview' : 'form', true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      selectTab('form', true);
    } else if (e.key === 'End') {
      e.preventDefault();
      selectTab('preview', true);
    }
  };

  const confirmDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const badge = !saved ? (
    <EyebrowBadge tone="amber">Belum disimpan</EyebrowBadge>
  ) : dirty ? (
    <EyebrowBadge tone="amber">
      {nomor} &bull; ada perubahan
    </EyebrowBadge>
  ) : (
    <EyebrowBadge>{nomor}</EyebrowBadge>
  );

  const saveButton = (extraClass?: string) => (
    <Button variant="secondary" onClick={onSave} disabled={saving} className={cn(PRIMARY_BUTTON_CLASS, extraClass)}>
      {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
      {saving ? 'Menyimpan...' : 'Simpan'}
    </Button>
  );

  return (
    <>
      <PageHeader
        title={title}
        subtitle={
          saved
            ? `Nomor ${noun} tetap sama walau isi atau tanggal diubah. Cetak memakai tampilan yang sedang terbuka.`
            : `Nomor ${noun} dibuat otomatis saat pertama kali disimpan. Tombol Cetak aktif setelah ${noun} tersimpan.`
        }
        eyebrow={
          <>
            <EyebrowBadge tone="slate">{icon}Dokumen</EyebrowBadge>
            {badge}
          </>
        }
        backHref={listHref}
        backLabel={listLabel}
        actions={
          <>
            {saveButton('flex-1 sm:flex-none')}
            <Button
              variant="outline"
              onClick={onPrint}
              disabled={!saved}
              title={saved ? undefined : `Simpan ${noun} dulu untuk mendapatkan nomor`}
              className={cn(OUTLINE_BUTTON_CLASS, 'flex-1 sm:flex-none')}
            >
              <Printer className="h-4 w-4" aria-hidden />
              Cetak
            </Button>
            {onDelete && (
              <Button variant="outline" onClick={() => setConfirmOpen(true)} className={cn(DANGER_BUTTON_CLASS, 'flex-1 sm:flex-none')}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Hapus
              </Button>
            )}
          </>
        }
      />

      <div
        role="tablist"
        aria-label="Tampilan editor"
        onKeyDown={onTabKeyDown}
        className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200/90 bg-white p-1 shadow-card-double xl:hidden"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              id={`${uid}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${uid}-panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => selectTab(t.id)}
              className={cn(
                'h-11 cursor-pointer rounded-xl text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50',
                active ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:items-start">
        <div
          id={`${uid}-panel-form`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-form`}
          className={cn('min-w-0', tab !== 'form' && 'hidden xl:block')}
        >
          <Card className="space-y-5 p-4 sm:p-5">
            {form}
            {formError && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {formError}
              </div>
            )}
            <div className="border-t border-slate-100 pt-4">{saveButton('w-full sm:w-auto')}</div>
          </Card>
        </div>

        <div
          id={`${uid}-panel-preview`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-preview`}
          className={cn('min-w-0 xl:sticky xl:top-6', tab !== 'preview' && 'hidden xl:block')}
        >
          <div className="xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:rounded-2xl">
            <PaperViewport>{preview}</PaperViewport>
          </div>
        </div>
      </div>

      {printCopy && <PrintPortal>{printCopy}</PrintPortal>}

      {onDelete && (
        <ConfirmDialog
          open={confirmOpen}
          title={`Hapus ${noun}?`}
          description={deleteDescription}
          confirmLabel={`Ya, hapus ${noun}`}
          busy={deleting}
          onConfirm={confirmDelete}
          onClose={() => !deleting && setConfirmOpen(false)}
        />
      )}
    </>
  );
}

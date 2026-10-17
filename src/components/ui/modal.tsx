'use client';

import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Cegah tutup lewat Esc/backdrop selama proses simpan. */
  busy?: boolean;
}

const SIZE_CLASS = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

/**
 * Dialog via portal (Enter di dalamnya tidak men-submit form halaman). Di HP tampil sebagai bottom sheet.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', busy = false }: ModalProps) {
  const uid = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      // Esc yang sudah dipakai menutup dropdown/popup di dalam dialog tidak ikut menutup dialog.
      if (e.key === 'Escape' && !busy && !e.defaultPrevented) onClose();
    };
    window.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="no-print fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs" onClick={() => !busy && onClose()} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl',
          SIZE_CLASS[size]
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 pb-3 pt-4 sm:px-5">
          <div className="min-w-0">
            <h2 id={`${uid}-title`} className="text-sm font-bold text-slate-900 sm:text-base">
              {title}
            </h2>
            {description && <div className="mt-0.5 text-xs text-slate-500">{description}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Tutup"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 sm:flex-row sm:justify-end sm:px-5 sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
  /** Bila diisi, tombol konfirmasi tidak ditampilkan dan pesan ini menjelaskan alasannya. */
  blockedReason?: string | null;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger',
  busy = false,
  onConfirm,
  onClose,
  blockedReason,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      busy={busy}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:h-10 shadow-btn-secondary font-medium"
          >
            {blockedReason ? 'Tutup' : cancelLabel}
          </button>
          {!blockedReason && onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={cn(
                'inline-flex h-11 cursor-pointer items-center justify-center rounded-xl px-4 text-xs font-bold text-white shadow-sm disabled:opacity-60 sm:h-10',
                tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'
              )}
            >
              {busy ? 'Memproses...' : confirmLabel}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-3 text-xs leading-relaxed text-slate-600">
        <div>{description}</div>
        {blockedReason && (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 font-semibold text-amber-900">
            {blockedReason}
          </div>
        )}
      </div>
    </Modal>
  );
}

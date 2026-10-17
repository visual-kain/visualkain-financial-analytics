'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Shimmer } from '@/components/ui/shimmer';
import type { LetterDocState } from '@/hooks/useLetters';
import { OUTLINE_BUTTON_CLASS } from './fields';

interface LetterDocGateProps<T> {
  result: LetterDocState<T> & { retry: () => void };
  noun: string;
  listHref: string;
  listLabel: string;
  children: (doc: T) => React.ReactNode;
}

/** Menangani status muat, tidak ditemukan, dan galat sebelum editor dokumen tersimpan ditampilkan. */
export function LetterDocGate<T>({ result, noun, listHref, listLabel, children }: LetterDocGateProps<T>) {
  if (result.status === 'ready') return <>{children(result.doc)}</>;

  const back = (
    <Link
      href={listHref}
      className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-btn-secondary hover:bg-slate-50 sm:h-10"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {listLabel}
    </Link>
  );

  if (result.status === 'loading') {
    return (
      <div aria-busy="true" aria-label={`Memuat ${noun}`} className="space-y-4">
        <Card className="space-y-3 p-4 sm:p-5">
          <Shimmer className="h-4 w-24 rounded" />
          <Shimmer className="h-7 w-56 rounded-lg" />
          <Shimmer className="h-3 w-80 max-w-full rounded" />
        </Card>
        <Card className="space-y-3 p-4 sm:p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} className="h-11 w-full rounded-xl" />
          ))}
        </Card>
      </div>
    );
  }

  if (result.status === 'missing') {
    return (
      <Card className="p-3.5 sm:p-4">
        <EmptyState
          title={`${noun.charAt(0).toUpperCase()}${noun.slice(1)} tidak ditemukan`}
          description="Dokumen ini mungkin sudah dihapus atau tautannya salah."
          className="py-12"
          action={back}
        />
      </Card>
    );
  }

  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5 text-xs text-rose-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-bold">Gagal memuat {noun}.</p>
          <p className="mt-0.5 text-rose-800">Periksa koneksi internet lalu coba lagi.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={result.retry} className={OUTLINE_BUTTON_CLASS}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Coba lagi
        </Button>
        <Link
          href={listHref}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs text-slate-700 hover:bg-slate-50 sm:h-10 shadow-btn-secondary font-medium"
        >
          {listLabel}
        </Link>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { NoteCard } from '@/components/ops/kalender/NoteCard';
import { BTN_OUTLINE } from '@/components/ops/kalender/styles';
import { EmptyState } from '@/components/ui/empty-state';
import { Shimmer } from '@/components/ui/shimmer';
import type { CalendarNotesState } from '@/hooks/useCalendarNotes';
import type { CalendarNote, MonthHighlight } from '@/lib/calendar';
import { cn } from '@/lib/utils';

interface CalendarSidePanelProps {
  monthLabel: string;
  notes: CalendarNote[];
  notesState: CalendarNotesState;
  highlights: MonthHighlight[];
  onAddNote: () => void;
  onDeleteNote: (note: CalendarNote) => void;
  onRetryNotes: () => void;
}

const CARD = 'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card-double';

/** Panel kanan di layar lebar, di bawah grid pada HP dan tablet. */
export function CalendarSidePanel({ monthLabel, notes, notesState, highlights, onAddNote, onDeleteNote, onRetryNotes }: CalendarSidePanelProps) {
  return (
    <>
      <section className={CARD} aria-labelledby="kalender-catatan">
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 p-3 sm:p-4">
          <div className="min-w-0">
            <h2 id="kalender-catatan" className="text-sm font-extrabold text-slate-900">
              Catatan Manual
            </h2>
            <p className="truncate text-[11px] text-slate-500">{monthLabel}</p>
          </div>
          <button type="button" onClick={onAddNote} className={cn(BTN_OUTLINE, 'shrink-0 px-3')}>
            <Plus className="h-4 w-4 text-slate-500" /> Tambah
          </button>
        </header>
        <div className="p-3 sm:p-4">
          {notesState === 'loading' ? (
            <div className="space-y-2" aria-busy="true" aria-label="Memuat catatan">
              {Array.from({ length: 3 }).map((_, i) => (
                <Shimmer key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : notesState === 'error' ? (
            <div role="alert" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-900">
              <span className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Gagal memuat catatan.
              </span>
              <button
                type="button"
                onClick={onRetryNotes}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 font-bold text-rose-800 hover:bg-rose-100 sm:h-10"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Coba lagi
              </button>
            </div>
          ) : notes.length === 0 ? (
            <EmptyState
              title="Belum ada catatan bulan ini"
              description="Ketuk tanggal yang kosong di kalender atau pakai tombol Tambah."
            />
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} showDate onDelete={onDeleteNote} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={CARD} aria-labelledby="kalender-riwayat">
        <header className="border-b border-slate-100 p-3 sm:p-4">
          <h2 id="kalender-riwayat" className="text-sm font-extrabold text-slate-900">
            Libur dan Terkirim
          </h2>
          <p className="truncate text-[11px] text-slate-500">{monthLabel}</p>
        </header>
        {highlights.length === 0 ? (
          <p className="p-3 text-xs text-slate-500 sm:p-4">Belum ada libur atau order terkirim pada bulan ini.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {highlights.map((item, i) => (
              <li key={`${item.date}-${i}`} className="flex items-start gap-2.5 px-3 py-2.5 sm:px-4">
                <span className="w-6 shrink-0 text-right text-xs font-extrabold tabular-nums text-slate-800">{Number(item.date.slice(8))}</span>
                <span className="min-w-0 flex-1 break-words text-xs leading-snug text-slate-600">{item.text}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold',
                    item.type === 'holiday' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  )}
                >
                  {item.type === 'holiday' ? 'Libur' : 'Selesai'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

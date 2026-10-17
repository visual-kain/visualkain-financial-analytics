'use client';

import React from 'react';
import { CalendarPlus, Trash2 } from 'lucide-react';
import { ICON_BTN } from '@/components/ops/kalender/styles';
import { buildGoogleCalendarUrl, formatDayMonth, noteEventTitle, type CalendarNote } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { CreatorLabel } from '@/components/ui/creator-label';

interface NoteCardProps {
  note: CalendarNote;
  /** Tampilkan tanggal; dimatikan bila kartu sudah berada di bawah judul tanggal. */
  showDate?: boolean;
  onDelete: (note: CalendarNote) => void;
}

export function NoteCard({ note, showDate = false, onDelete }: NoteCardProps) {
  const googleUrl = buildGoogleCalendarUrl({ title: noteEventTitle(note.text), date: note.date, details: note.text });
  return (
    <li className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="min-w-0 flex-1 space-y-0.5">
        {showDate && <p className="text-[11px] font-bold text-teal-800">{formatDayMonth(note.date)}</p>}
        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">{note.text}</p>
        <CreatorLabel audit={note} />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Tambah catatan ke Google Calendar"
          title="Tambah ke Google Calendar"
          className={cn(ICON_BTN, 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}
        >
          <CalendarPlus className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={() => onDelete(note)}
          aria-label="Hapus catatan"
          title="Hapus catatan"
          className={cn(ICON_BTN, 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

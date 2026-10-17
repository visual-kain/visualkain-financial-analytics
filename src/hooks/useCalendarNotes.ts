'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CalendarNote } from '@/lib/calendar';
import { subscribeCalendarNotes } from '@/lib/firestore/calendar-notes-repo';

export type CalendarNotesState = 'loading' | 'ready' | 'error';

export function useCalendarNotes() {
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [state, setState] = useState<CalendarNotesState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setState('loading');
    setError(null);
    return subscribeCalendarNotes(
      (next) => {
        setNotes(next);
        setState('ready');
      },
      (err) => {
        console.warn('[Firebase] Listener calendarNotes gagal:', err.message);
        setError(err.message);
        setState('error');
      }
    );
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { notes, state, error, retry };
}

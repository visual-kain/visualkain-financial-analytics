import { addDoc, collection, deleteDoc, doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeCalendarNote, sortCalendarNotes, type CalendarNote } from '@/lib/calendar';
import { createdStamp } from '@/lib/audit';
import { currentActor } from '@/lib/firestore/actor';

export const CALENDAR_NOTES_COLLECTION = 'calendarNotes';

/** Seluruh koleksi didengarkan lalu diurutkan di klien; orderBy ganda legacy butuh composite index. */
export function subscribeCalendarNotes(onData: (notes: CalendarNote[]) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(
    collection(db, CALENDAR_NOTES_COLLECTION),
    (snap) => {
      const notes = snap.docs
        .map((d) => normalizeCalendarNote(d.id, d.data()))
        .filter((n): n is CalendarNote => n !== null);
      onData(sortCalendarNotes(notes));
    },
    onError
  );
}

/** Bentuk dokumen sama dengan legacy: `createdAt` berupa string ISO, bukan Timestamp. */
export async function addCalendarNote(date: string, text: string): Promise<string> {
  const ref = await addDoc(collection(db, CALENDAR_NOTES_COLLECTION), {
    date,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    ...createdStamp(currentActor()),
  });
  return ref.id;
}

export async function deleteCalendarNote(id: string): Promise<void> {
  await deleteDoc(doc(db, CALENDAR_NOTES_COLLECTION, id));
}

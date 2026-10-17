import { calculateTotals } from '@/lib/legacy/calculations';
import { STATUS_LABELS, type LegacyOrder } from '@/lib/legacy/types';

export const WEEKDAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;

export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

/** Daftar libur tetap dari `visualkaindb`. Libur bergerak (Idul Fitri, Nyepi, dst.) memang tidak ada di sumber legacy. */
export const INDONESIAN_HOLIDAYS: Record<string, string> = {
  '01-01': 'Tahun Baru Masehi',
  '05-01': 'Hari Buruh Internasional',
  '06-01': 'Hari Lahir Pancasila',
  '08-17': 'Hari Kemerdekaan RI',
  '12-25': 'Hari Raya Natal',
};

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** `month0` berbasis nol (0 = Januari), sama dengan `Date#getMonth`. */
export function formatDateKey(year: number, month0: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${pad2(month0 + 1)}-${pad2(day)}`;
}

export interface ParsedDateKey {
  year: number;
  month0: number;
  day: number;
}

export function parseDateKey(key: string): ParsedDateKey | null {
  const match = DATE_KEY.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month0 = Number(match[2]) - 1;
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month0, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month0 || probe.getUTCDate() !== day) return null;
  return { year, month0, day };
}

/** Deadline lama bisa membawa jam ("2026-10-20T00:00"); hanya 10 karakter pertama yang dipakai, tanggal mustahil ditolak. */
export function normalizeDateKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const key = value.trim().slice(0, 10);
  return parseDateKey(key) ? key : null;
}

export function addDaysToDateKey(key: string, days: number): string {
  const parsed = parseDateKey(key);
  if (!parsed) throw new RangeError(`Tanggal tidak valid: ${key}`);
  const shifted = new Date(Date.UTC(parsed.year, parsed.month0, parsed.day + days));
  return formatDateKey(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

/** "2026-10-17" menjadi "17 Oktober 2026"; teks lain dikembalikan apa adanya. */
export function formatLongDate(key: string): string {
  const parsed = parseDateKey(key);
  if (!parsed) return key;
  return `${parsed.day} ${MONTH_NAMES[parsed.month0]} ${parsed.year}`;
}

export function formatDayMonth(key: string): string {
  const parsed = parseDateKey(key);
  if (!parsed) return key;
  return `${parsed.day} ${MONTH_NAMES[parsed.month0]}`;
}

function isSunday(parsed: ParsedDateKey): boolean {
  return new Date(Date.UTC(parsed.year, parsed.month0, parsed.day)).getUTCDay() === 0;
}

/** Nama libur nasional didahulukan atas "Hari Minggu" supaya libur yang jatuh di hari Minggu tetap terbaca. */
export function getHolidayName(key: string): string | null {
  const parsed = parseDateKey(key);
  if (!parsed) return null;
  const national = INDONESIAN_HOLIDAYS[`${pad2(parsed.month0 + 1)}-${pad2(parsed.day)}`];
  if (national) return national;
  return isSunday(parsed) ? 'Hari Minggu' : null;
}

export function isRedDate(key: string): boolean {
  return getHolidayName(key) !== null;
}

export interface CalendarCell {
  date: string;
  day: number;
  inMonth: boolean;
}

/** Grid 6 minggu × 7 hari, dimulai Minggu, selalu 42 sel. */
export function buildMonthGrid(year: number, month0: number): CalendarCell[] {
  const firstWeekday = new Date(Date.UTC(year, month0, 1)).getUTCDay();
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(Date.UTC(year, month0, 1 - firstWeekday + i));
    return {
      date: formatDateKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === month0 && d.getUTCFullYear() === year,
    };
  });
}

export interface MonthView {
  year: number;
  month: number;
}

export function shiftMonth(view: MonthView, delta: number): MonthView {
  const index = view.year * 12 + view.month + delta;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

/** Rentang legacy (3 tahun ke belakang, 6 ke depan) yang diperluas bila bulan terpilih keluar dari rentang. */
export function buildYearOptions(selectedYear: number, baseYear: number): number[] {
  const first = Math.min(baseYear - 3, selectedYear);
  const last = Math.max(baseYear + 6, selectedYear);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

export function monthPrefix(year: number, month0: number): string {
  return `${String(year).padStart(4, '0')}-${pad2(month0 + 1)}-`;
}

export type OrdersByDate = Record<string, LegacyOrder[]>;

/** Mengelompokkan order per tanggal deadline; order tanpa deadline valid dilewati. Urutan input dipertahankan. */
export function groupOrdersByDeadline(orders: ReadonlyArray<LegacyOrder>): OrdersByDate {
  const map: OrdersByDate = {};
  orders.forEach((order) => {
    const key = normalizeDateKey(order.deadline);
    if (!key) return;
    (map[key] ||= []).push(order);
  });
  return map;
}

export type DeadlineStatus = 'active' | 'completed';

export function getDeadlineStatus(orders: ReadonlyArray<Pick<LegacyOrder, 'status'>> | undefined): DeadlineStatus | null {
  if (!orders || orders.length === 0) return null;
  return orders.every((o) => o.status === 'completed') ? 'completed' : 'active';
}

/** Tanggal awal yang dipilih saat bulan berganti: hari ini bila ada di bulan itu, kalau tidak deadline pertama. */
export function pickDefaultDate(year: number, month0: number, todayKey: string, ordersByDate: OrdersByDate): string | null {
  const prefix = monthPrefix(year, month0);
  if (todayKey.startsWith(prefix)) return todayKey;
  const first = Object.keys(ordersByDate)
    .filter((key) => key.startsWith(prefix))
    .sort()[0];
  return first ?? null;
}

export interface MonthHighlight {
  date: string;
  text: string;
  type: 'holiday' | 'completed';
}

/** Libur nasional dan order selesai pada bulan itu, urut tanggal (panel "Riwayat Terkirim" legacy). */
export function buildMonthHighlights(year: number, month0: number, ordersByDate: OrdersByDate): MonthHighlight[] {
  const prefix = monthPrefix(year, month0);
  const items: MonthHighlight[] = [];
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const name = INDONESIAN_HOLIDAYS[`${pad2(month0 + 1)}-${pad2(day)}`];
    if (name) items.push({ date: formatDateKey(year, month0, day), text: name, type: 'holiday' });
  }
  Object.entries(ordersByDate).forEach(([date, orders]) => {
    if (!date.startsWith(prefix)) return;
    orders.forEach((o) => {
      if (o.status === 'completed') items.push({ date, text: `Terkirim: ${o.namaCustomer || '-'} (${o.noInv || '-'})`, type: 'completed' });
    });
  });
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export function orderEventTitle(order: Pick<LegacyOrder, 'namaCustomer' | 'namaProject' | 'noInv'>): string {
  const label = [order.namaCustomer, order.namaProject || order.noInv].filter(Boolean).join(' - ');
  return `Deadline: ${label || order.noInv || 'Order'}`;
}

export function orderEventDetails(order: LegacyOrder, baseUrl = ''): string {
  const lines = [
    `No. Invoice: ${order.noInv || '-'}`,
    `Customer: ${order.namaCustomer || '-'}`,
    order.namaProject ? `Project: ${order.namaProject}` : null,
    `Qty: ${calculateTotals(order).totalPesanan} pcs`,
    `Status: ${STATUS_LABELS[order.status] ?? order.status}`,
    baseUrl ? `Buka order: ${baseUrl}/data-customer/${order.id}` : null,
  ];
  return lines.filter((line): line is string => line !== null).join('\n');
}

export interface CalendarNote {
  id: string;
  date: string;
  text: string;
  createdAt: string;
}

/** Dokumen `calendarNotes` tanpa tanggal valid atau teks kosong dibuang. */
export function normalizeCalendarNote(id: string, data: Record<string, unknown>): CalendarNote | null {
  const date = normalizeDateKey(data.date);
  const text = typeof data.text === 'string' ? data.text.trim() : '';
  if (!date || !text) return null;
  return { id, date, text, createdAt: typeof data.createdAt === 'string' ? data.createdAt : '' };
}

/** Urut tanggal lalu waktu dibuat; dilakukan di klien agar tidak butuh composite index Firestore. */
export function sortCalendarNotes(notes: ReadonlyArray<CalendarNote>): CalendarNote[] {
  return [...notes].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export function notesForMonth(notes: ReadonlyArray<CalendarNote>, year: number, month0: number): CalendarNote[] {
  const prefix = monthPrefix(year, month0);
  return notes.filter((n) => n.date.startsWith(prefix));
}

export function groupNotesByDate(notes: ReadonlyArray<CalendarNote>): Record<string, CalendarNote[]> {
  const map: Record<string, CalendarNote[]> = {};
  notes.forEach((n) => (map[n.date] ||= []).push(n));
  return map;
}

export function noteEventTitle(text: string): string {
  const firstLine = text.trim().split(/\r?\n/)[0] ?? '';
  return `Catatan: ${firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine}`;
}

export interface GoogleCalendarEvent {
  title: string;
  /** Tanggal YYYY-MM-DD; acara dibuat sehari penuh. */
  date: string;
  details?: string;
}

const GCAL_DETAILS_LIMIT = 1500;

/** Tautan template publik Google Calendar; tidak butuh OAuth atau client id. */
export function buildGoogleCalendarUrl({ title, date, details }: GoogleCalendarEvent): string {
  const start = date.replace(/-/g, '');
  const end = addDaysToDateKey(date, 1).replace(/-/g, '');
  const params = [`action=TEMPLATE`, `text=${encodeURIComponent(title)}`, `dates=${start}/${end}`];
  if (details) {
    const trimmed = details.length > GCAL_DETAILS_LIMIT ? `${details.slice(0, GCAL_DETAILS_LIMIT - 3)}...` : details;
    params.push(`details=${encodeURIComponent(trimmed)}`);
  }
  return `https://calendar.google.com/calendar/render?${params.join('&')}`;
}

export interface CalendarEvent {
  uid: string;
  date: string;
  summary: string;
  description?: string;
}

/** Deadline dan catatan satu bulan, urut tanggal; dipakai ekspor .ics. */
export function buildMonthEvents(
  year: number,
  month0: number,
  orders: ReadonlyArray<LegacyOrder>,
  notes: ReadonlyArray<CalendarNote>,
  options: { baseUrl?: string } = {}
): CalendarEvent[] {
  const prefix = monthPrefix(year, month0);
  const events: CalendarEvent[] = [];
  Object.entries(groupOrdersByDeadline(orders)).forEach(([date, list]) => {
    if (!date.startsWith(prefix)) return;
    list.forEach((order) =>
      events.push({
        uid: `deadline-${order.id}@visualkain`,
        date,
        summary: orderEventTitle(order),
        description: orderEventDetails(order, options.baseUrl),
      })
    );
  });
  notesForMonth(notes, year, month0).forEach((note) =>
    events.push({ uid: `note-${note.id}@visualkain`, date: note.date, summary: noteEventTitle(note.text), description: note.text })
  );
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.uid.localeCompare(b.uid));
}

/** RFC 5545 section 3.3.11. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

function utf8Length(char: string): number {
  const cp = char.codePointAt(0) ?? 0;
  if (cp < 0x80) return 1;
  if (cp < 0x800) return 2;
  if (cp < 0x10000) return 3;
  return 4;
}

/** Baris iCalendar maksimal 75 oktet; lanjutan diawali satu spasi dan tidak memotong karakter multi-byte. */
export function foldIcsLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = utf8Length(char);
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function icsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildIcs(
  events: ReadonlyArray<CalendarEvent>,
  options: { now?: Date; calendarName?: string } = {}
): string {
  const stamp = icsTimestamp(options.now ?? new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VisualKain//Kalender Produksi//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(options.calendarName ?? 'Kalender Produksi VisualKain')}`,
  ];
  events.forEach((event) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${event.date.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${addDaysToDateKey(event.date, 1).replace(/-/g, '')}`,
      `SUMMARY:${escapeIcsText(event.summary)}`
    );
    if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    lines.push('TRANSP:TRANSPARENT', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}

export function icsFilename(year: number, month0: number): string {
  return `kalender-produksi-${String(year).padStart(4, '0')}-${pad2(month0 + 1)}.ics`;
}

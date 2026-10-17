import { describe, expect, it } from 'vitest';
import {
  addDaysToDateKey,
  buildGoogleCalendarUrl,
  buildIcs,
  buildMonthEvents,
  buildMonthGrid,
  buildMonthHighlights,
  buildYearOptions,
  escapeIcsText,
  foldIcsLine,
  formatLongDate,
  getDeadlineStatus,
  getHolidayName,
  groupNotesByDate,
  groupOrdersByDeadline,
  icsFilename,
  isRedDate,
  noteEventTitle,
  normalizeCalendarNote,
  normalizeDateKey,
  notesForMonth,
  orderEventDetails,
  orderEventTitle,
  parseDateKey,
  pickDefaultDate,
  shiftMonth,
  sortCalendarNotes,
  type CalendarNote,
} from '@/lib/calendar';
import type { LegacyOrder } from '@/lib/legacy/types';

function order(partial: Partial<LegacyOrder> & { id: string }): LegacyOrder {
  return { noInv: `VK26${partial.id}`, namaCustomer: 'Budi', status: 'production', ...partial } as LegacyOrder;
}

function note(partial: Partial<CalendarNote> & { id: string; date: string }): CalendarNote {
  return { text: 'Catatan', createdAt: '2026-10-01T00:00:00.000Z', ...partial };
}

const byteLength = (text: string) => new TextEncoder().encode(text).length;

describe('date keys', () => {
  it('parses valid keys and rejects impossible dates', () => {
    expect(parseDateKey('2026-10-17')).toEqual({ year: 2026, month0: 9, day: 17 });
    expect(parseDateKey('2026-02-30')).toBeNull();
    expect(parseDateKey('2026-13-01')).toBeNull();
    expect(parseDateKey('17-10-2026')).toBeNull();
  });

  it('normalizes deadlines that carry a time part and drops garbage', () => {
    expect(normalizeDateKey('2026-10-20')).toBe('2026-10-20');
    expect(normalizeDateKey(' 2026-10-20T00:00:00 ')).toBe('2026-10-20');
    expect(normalizeDateKey('besok')).toBeNull();
    expect(normalizeDateKey('2026-02-30')).toBeNull();
    expect(normalizeDateKey(undefined)).toBeNull();
    expect(normalizeDateKey(20261020)).toBeNull();
  });

  it('adds days across month, year, and leap boundaries', () => {
    expect(addDaysToDateKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToDateKey('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysToDateKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(() => addDaysToDateKey('bukan-tanggal', 1)).toThrow(RangeError);
  });

  it('formats long dates in Indonesian', () => {
    expect(formatLongDate('2026-10-05')).toBe('5 Oktober 2026');
    expect(formatLongDate('rusak')).toBe('rusak');
  });
});

describe('holidays', () => {
  it('flags Sundays and the hardcoded national holidays as red', () => {
    expect(getHolidayName('2026-10-04')).toBe('Hari Minggu');
    expect(getHolidayName('2026-08-17')).toBe('Hari Kemerdekaan RI');
    expect(getHolidayName('2026-10-05')).toBeNull();
    expect(isRedDate('2026-12-25')).toBe(true);
    expect(isRedDate('2026-10-05')).toBe(false);
  });

  it('keeps the holiday name when it falls on a Sunday', () => {
    expect(getHolidayName('2023-01-01')).toBe('Tahun Baru Masehi');
  });
});

describe('buildMonthGrid', () => {
  it('always returns 42 cells and marks the leading and trailing days as out of month', () => {
    const cells = buildMonthGrid(2026, 9);
    expect(cells).toHaveLength(42);
    expect(cells[0]).toEqual({ date: '2026-09-27', day: 27, inMonth: false });
    expect(cells[4]).toEqual({ date: '2026-10-01', day: 1, inMonth: true });
    expect(cells[41]).toEqual({ date: '2026-11-07', day: 7, inMonth: false });
    expect(cells.filter((c) => c.inMonth)).toHaveLength(31);
  });

  it('starts on the first cell when the month begins on Sunday', () => {
    const cells = buildMonthGrid(2026, 1);
    expect(cells[0]).toEqual({ date: '2026-02-01', day: 1, inMonth: true });
    expect(cells.filter((c) => c.inMonth)).toHaveLength(28);
    expect(cells[41].date).toBe('2026-03-14');
  });

  it('spills into January of the next year from December', () => {
    const cells = buildMonthGrid(2026, 11);
    expect(cells[0].date).toBe('2026-11-29');
    expect(cells[41].date).toBe('2027-01-09');
    expect(cells.filter((c) => c.inMonth)).toHaveLength(31);
  });
});

describe('month navigation', () => {
  it('wraps across years in both directions', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth({ year: 2026, month: 9 }, 0)).toEqual({ year: 2026, month: 9 });
  });

  it('keeps the legacy year range and widens it to include the selected year', () => {
    expect(buildYearOptions(2026, 2026)).toEqual([2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032]);
    expect(buildYearOptions(2020, 2026)[0]).toBe(2020);
    expect(buildYearOptions(2040, 2026).at(-1)).toBe(2040);
  });

  it('picks today, else the first deadline, else nothing', () => {
    const grouped = groupOrdersByDeadline([order({ id: 'a', deadline: '2026-11-20' }), order({ id: 'b', deadline: '2026-11-05' })]);
    expect(pickDefaultDate(2026, 9, '2026-10-17', grouped)).toBe('2026-10-17');
    expect(pickDefaultDate(2026, 10, '2026-10-17', grouped)).toBe('2026-11-05');
    expect(pickDefaultDate(2026, 11, '2026-10-17', grouped)).toBeNull();
  });
});

describe('deadlines', () => {
  it('groups orders by normalized deadline and skips orders without a valid one', () => {
    const grouped = groupOrdersByDeadline([
      order({ id: '1', deadline: '2026-10-20' }),
      order({ id: '2', deadline: '2026-10-20T00:00' }),
      order({ id: '3', deadline: '' }),
      order({ id: '4' }),
      order({ id: '5', deadline: 'segera' }),
    ]);
    expect(Object.keys(grouped)).toEqual(['2026-10-20']);
    expect(grouped['2026-10-20'].map((o) => o.id)).toEqual(['1', '2']);
  });

  it('reports completed only when every order on the date is completed', () => {
    expect(getDeadlineStatus(undefined)).toBeNull();
    expect(getDeadlineStatus([])).toBeNull();
    expect(getDeadlineStatus([{ status: 'completed' }, { status: 'completed' }])).toBe('completed');
    expect(getDeadlineStatus([{ status: 'completed' }, { status: 'production' }])).toBe('active');
  });

  it('lists holidays and delivered orders of the month in date order', () => {
    const grouped = groupOrdersByDeadline([
      order({ id: '1', deadline: '2026-05-10', status: 'completed', namaCustomer: 'Sari' }),
      order({ id: '2', deadline: '2026-05-12', status: 'production' }),
      order({ id: '3', deadline: '2026-06-01', status: 'completed' }),
    ]);
    const highlights = buildMonthHighlights(2026, 4, grouped);
    expect(highlights.map((h) => [h.date, h.type])).toEqual([
      ['2026-05-01', 'holiday'],
      ['2026-05-10', 'completed'],
    ]);
    expect(highlights[1].text).toBe('Terkirim: Sari (VK261)');
  });
});

describe('event text', () => {
  it('builds a title from customer and project, falling back to the invoice number', () => {
    expect(orderEventTitle({ namaCustomer: 'Budi', namaProject: 'Kaos Panitia', noInv: 'VK260001' })).toBe('Deadline: Budi - Kaos Panitia');
    expect(orderEventTitle({ namaCustomer: 'Budi', namaProject: '', noInv: 'VK260001' })).toBe('Deadline: Budi - VK260001');
  });

  it('includes qty from the order totals and an order link only when a base URL is given', () => {
    const o = order({ id: 'abc', noInv: 'VK260001', namaProject: 'Kaos', pendekM: 10, panjangXL: 5 });
    const plain = orderEventDetails(o);
    expect(plain).toContain('Qty: 15 pcs');
    expect(plain).toContain('Status: Produksi');
    expect(plain).not.toContain('Buka order');
    expect(orderEventDetails(o, 'https://app.example')).toContain('Buka order: https://app.example/data-customer/abc');
  });

  it('shortens long note titles to the first line', () => {
    expect(noteEventTitle('Cek bahan\nbaris dua')).toBe('Catatan: Cek bahan');
    const title = noteEventTitle('x'.repeat(100));
    expect(title).toBe(`Catatan: ${'x'.repeat(77)}...`);
  });
});

describe('buildGoogleCalendarUrl', () => {
  it('builds an all-day template URL that ends the next day', () => {
    expect(
      buildGoogleCalendarUrl({ title: 'Deadline: Budi - Kaos', date: '2026-10-20', details: 'No. Invoice: VK260001\nQty: 10 pcs' })
    ).toBe(
      'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Deadline%3A%20Budi%20-%20Kaos&dates=20261020/20261021&details=No.%20Invoice%3A%20VK260001%0AQty%3A%2010%20pcs'
    );
  });

  it('rolls the end date over the year boundary and omits empty details', () => {
    const url = buildGoogleCalendarUrl({ title: 'Tahun baru', date: '2026-12-31' });
    expect(url).toContain('dates=20261231/20270101');
    expect(url).not.toContain('details=');
  });

  it('caps very long details so the URL stays usable', () => {
    const url = buildGoogleCalendarUrl({ title: 't', date: '2026-10-20', details: 'a'.repeat(5000) });
    expect(url.length).toBeLessThan(1800);
  });

  it('rejects an invalid date instead of producing a broken link', () => {
    expect(() => buildGoogleCalendarUrl({ title: 't', date: '2026-02-30' })).toThrow(RangeError);
  });
});

describe('calendar notes', () => {
  it('normalizes valid documents and drops incomplete ones', () => {
    expect(normalizeCalendarNote('n1', { date: '2026-10-20', text: '  Cek bahan  ', createdAt: '2026-10-01T00:00:00.000Z' })).toEqual({
      id: 'n1',
      date: '2026-10-20',
      text: 'Cek bahan',
      createdAt: '2026-10-01T00:00:00.000Z',
    });
    expect(normalizeCalendarNote('n2', { date: '2026-10-20', text: '   ' })).toBeNull();
    expect(normalizeCalendarNote('n3', { date: 'kemarin', text: 'x' })).toBeNull();
    expect(normalizeCalendarNote('n4', { date: '2026-10-20', text: 'x' })?.createdAt).toBe('');
  });

  it('sorts by date, then creation time, without mutating the input', () => {
    const input = [
      note({ id: 'c', date: '2026-10-21' }),
      note({ id: 'b', date: '2026-10-20', createdAt: '2026-10-02T00:00:00.000Z' }),
      note({ id: 'a', date: '2026-10-20', createdAt: '2026-10-01T00:00:00.000Z' }),
    ];
    expect(sortCalendarNotes(input).map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(input.map((n) => n.id)).toEqual(['c', 'b', 'a']);
  });

  it('filters by month and groups by date', () => {
    const notes = [note({ id: 'a', date: '2026-10-31' }), note({ id: 'b', date: '2026-11-01' }), note({ id: 'c', date: '2026-11-01' })];
    expect(notesForMonth(notes, 2026, 10).map((n) => n.id)).toEqual(['b', 'c']);
    expect(Object.keys(groupNotesByDate(notes))).toEqual(['2026-10-31', '2026-11-01']);
    expect(groupNotesByDate(notes)['2026-11-01']).toHaveLength(2);
  });
});

describe('iCalendar export', () => {
  const now = new Date('2026-10-17T03:00:00.000Z');

  it('escapes the characters RFC 5545 reserves', () => {
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('folds lines at 75 octets and unfolds back to the original', () => {
    const line = `SUMMARY:${'a'.repeat(200)}`;
    const folded = foldIcsLine(line);
    folded.split('\r\n').forEach((part) => expect(byteLength(part)).toBeLessThanOrEqual(75));
    expect(folded.replace(/\r\n /g, '')).toBe(line);
  });

  it('does not split multi-byte characters while folding', () => {
    const line = `SUMMARY:${'界'.repeat(50)}`;
    const folded = foldIcsLine(line);
    folded.split('\r\n').forEach((part) => expect(byteLength(part)).toBeLessThanOrEqual(75));
    expect(folded.replace(/\r\n /g, '')).toBe(line);
  });

  it('writes a CRLF calendar with all-day events ending the next day', () => {
    const ics = buildIcs(
      [
        { uid: 'deadline-1@visualkain', date: '2026-12-31', summary: 'Deadline: Budi, Kaos; Panitia', description: 'Baris 1\nBaris 2' },
        { uid: 'note-2@visualkain', date: '2026-10-20', summary: 'Catatan: Cek bahan' },
      ],
      { now }
    );
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n');
    expect(ics).toContain('DTSTAMP:20261017T030000Z');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101');
    expect(ics).toContain('SUMMARY:Deadline: Budi\\, Kaos\\; Panitia');
    expect(ics).toContain('DESCRIPTION:Baris 1\\nBaris 2');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics.match(/DESCRIPTION:/g)).toHaveLength(1);
  });

  it('exports an empty but valid calendar when there are no events', () => {
    const ics = buildIcs([], { now });
    expect(ics).not.toContain('BEGIN:VEVENT');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('collects only the requested month and sorts by date', () => {
    const orders = [
      order({ id: 'a', deadline: '2026-10-25', pendekM: 3 }),
      order({ id: 'b', deadline: '2026-11-02' }),
      order({ id: 'c', deadline: '2026-10-05' }),
    ];
    const notes = [note({ id: 'n1', date: '2026-10-10', text: 'Kirim sampel' }), note({ id: 'n2', date: '2026-09-30' })];
    const events = buildMonthEvents(2026, 9, orders, notes, { baseUrl: 'https://app.example' });
    expect(events.map((e) => e.uid)).toEqual(['deadline-c@visualkain', 'note-n1@visualkain', 'deadline-a@visualkain']);
    expect(events[2].description).toContain('Qty: 3 pcs');
    expect(events[1]).toMatchObject({ summary: 'Catatan: Kirim sampel', description: 'Kirim sampel' });
  });

  it('names the file after the month', () => {
    expect(icsFilename(2026, 9)).toBe('kalender-produksi-2026-10.ics');
    expect(icsFilename(2027, 0)).toBe('kalender-produksi-2027-01.ics');
  });
});

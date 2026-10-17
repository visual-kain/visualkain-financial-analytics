import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { OpsDataFixtureProvider } from '@/context/OpsDataContext';
import { ProductionCalendar } from '@/components/ops/kalender/ProductionCalendar';
import type { LegacyOrder } from '@/lib/legacy/types';

vi.mock('@/lib/firebase', () => ({ db: {} }));

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  todayInJakarta: () => '2026-10-17',
}));

const notesRepo = vi.hoisted(() => ({
  addCalendarNote: vi.fn(async () => 'note-new'),
  deleteCalendarNote: vi.fn(async () => undefined),
}));

vi.mock('@/lib/firestore/calendar-notes-repo', () => notesRepo);

vi.mock('@/hooks/useCalendarNotes', () => ({
  useCalendarNotes: () => ({
    notes: [{ id: 'n1', date: '2026-10-24', text: 'Cek bahan', createdAt: '2026-10-01T00:00:00.000Z' }],
    state: 'ready',
    error: null,
    retry: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const orders = [
  { id: 'o1', noInv: 'VK260001', tanggalInv: '2026-10-05', namaCustomer: 'Sari', namaProject: 'Kaos Panitia', status: 'production', deadline: '2026-10-20', pendekM: 10 },
  { id: 'o2', noInv: 'VK260002', tanggalInv: '2026-10-06', namaCustomer: 'Budi', status: 'completed', deadline: '2026-10-20' },
  { id: 'o3', noInv: 'VK250099', tanggalInv: '2026-09-15', namaCustomer: 'Lama', status: 'completed', deadline: '2026-10-10' },
] as LegacyOrder[];

function renderCalendar() {
  return render(
    <OpsDataFixtureProvider data={{ orders, sizeCharts: [], kategoriList: [], vendors: [] }}>
      <ProductionCalendar />
    </OpsDataFixtureProvider>
  );
}

function stubViewport(wide: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: wide,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const day = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}`) });

beforeEach(() => {
  vi.clearAllMocks();
  stubViewport(true);
});
afterEach(cleanup);

describe('ProductionCalendar on a wide screen', () => {
  it('opens the current month with a deadline dialog when a date with orders is tapped', () => {
    renderCalendar();
    expect(screen.getByRole('region', { name: 'Kalender Oktober 2026' })).toBeTruthy();

    fireEvent.click(day('20 Oktober 2026'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Deadline: 20 Oktober 2026')).toBeTruthy();
    expect(within(dialog).getByText('VK260001')).toBeTruthy();
    expect(within(dialog).getByText('Sari')).toBeTruthy();
    expect(within(dialog).getByText('Kaos Panitia')).toBeTruthy();
    expect(within(dialog).getByText('10 pcs')).toBeTruthy();
    expect(within(dialog).getByText('Produksi')).toBeTruthy();
    expect(within(dialog).getAllByText('Selesai').length).toBeGreaterThan(0);
    expect(within(dialog).getAllByRole('link', { name: /Buka Order/ })[0].getAttribute('href')).toBe('/data-customer/o1');

    const googleHref = within(dialog).getAllByRole('link', { name: /Tambah ke Google Calendar/ })[0].getAttribute('href') ?? '';
    expect(googleHref.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE')).toBe(true);
    expect(googleHref).toContain('dates=20261020/20261021');
    expect(googleHref).toContain(encodeURIComponent('Deadline: Sari - Kaos Panitia'));
  });

  it('requires note text and saves it for the tapped empty date', async () => {
    renderCalendar();
    fireEvent.click(day('5 Oktober 2026'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Tambah Catatan')).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan Catatan' }));
    expect(await within(dialog).findByText('Catatan wajib diisi')).toBeTruthy();
    expect(notesRepo.addCalendarNote).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText(/Catatan/), { target: { value: '  Kirim sampel  ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan Catatan' }));
    await waitFor(() => expect(notesRepo.addCalendarNote).toHaveBeenCalledWith('2026-10-05', 'Kirim sampel'));
  });

  it('hides archived deadlines until the archive toggle is on', () => {
    renderCalendar();
    expect(day('10 Oktober 2026').getAttribute('aria-label')).not.toContain('deadline');
    fireEvent.click(screen.getByRole('button', { name: /Arsip \(1\)/ }));
    expect(day('10 Oktober 2026').getAttribute('aria-label')).toContain('1 deadline order');
  });

  it('moves between months with the arrows and the today shortcut', () => {
    renderCalendar();
    fireEvent.click(screen.getByRole('button', { name: 'Bulan berikutnya' }));
    expect(screen.getByRole('region', { name: 'Kalender November 2026' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hari ini' }));
    expect(screen.getByRole('region', { name: 'Kalender Oktober 2026' })).toBeTruthy();
  });

  it('lists the month notes and deletes one only after confirmation', async () => {
    renderCalendar();
    expect(screen.getAllByText('Cek bahan').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Hapus catatan' })[0]);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Hapus catatan?')).toBeTruthy();
    expect(notesRepo.deleteCalendarNote).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Hapus catatan' }));
    await waitFor(() => expect(notesRepo.deleteCalendarNote).toHaveBeenCalledWith('n1'));
  });

  it('exports the visible month as an .ics file with deadlines and notes', async () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:kalender');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    renderCalendar();
    fireEvent.click(screen.getByRole('button', { name: /Ekspor \.ics/ }));

    expect(click).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0];
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(text).toContain('SUMMARY:Deadline: Sari - Kaos Panitia');
    expect(text).toContain('SUMMARY:Catatan: Cek bahan');
    expect(text).not.toContain('VK250099');
    click.mockRestore();
  });
});

describe('ProductionCalendar on a phone', () => {
  beforeEach(() => stubViewport(false));

  it('selects the tapped day and lists its items below the grid instead of opening a dialog', () => {
    renderCalendar();
    fireEvent.click(day('20 Oktober 2026'));
    expect(screen.queryByRole('dialog')).toBeNull();

    const section = screen.getByRole('region', { name: 'Hari dipilih' });
    expect(within(section).getByText('20 Oktober 2026')).toBeTruthy();
    expect(within(section).getByText('VK260001')).toBeTruthy();
    expect(day('20 Oktober 2026').getAttribute('aria-pressed')).toBe('true');
  });

  it('starts on today and offers adding a note for it', () => {
    renderCalendar();
    const section = screen.getByRole('region', { name: 'Hari dipilih' });
    expect(within(section).getByText('17 Oktober 2026')).toBeTruthy();
    fireEvent.click(within(section).getByRole('button', { name: /Tambah Catatan/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect((screen.getByLabelText(/Tanggal/) as HTMLInputElement).value).toBe('2026-10-17');
  });
});

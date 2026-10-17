'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Archive, ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EyebrowBadge } from '@/components/layout/PageHeader';
import { CalendarGrid, CalendarGridSkeleton } from '@/components/ops/kalender/CalendarGrid';
import { CalendarSidePanel } from '@/components/ops/kalender/CalendarSidePanel';
import { DayDetail, DeadlineDialog } from '@/components/ops/kalender/DayDetail';
import { NoteDialog } from '@/components/ops/kalender/NoteDialog';
import { BTN_OUTLINE, ICON_BTN } from '@/components/ops/kalender/styles';
import { ConfirmDialog } from '@/components/ui/modal';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { Shimmer } from '@/components/ui/shimmer';
import { useOpsData } from '@/context/OpsDataContext';
import { useCalendarNotes } from '@/hooks/useCalendarNotes';
import {
  MONTH_NAMES,
  buildIcs,
  buildMonthEvents,
  buildMonthGrid,
  buildMonthHighlights,
  buildYearOptions,
  formatDateKey,
  formatLongDate,
  groupNotesByDate,
  groupOrdersByDeadline,
  icsFilename,
  monthPrefix,
  normalizeDateKey,
  notesForMonth,
  parseDateKey,
  pickDefaultDate,
  shiftMonth,
  type CalendarNote,
  type MonthView,
} from '@/lib/calendar';
import { deleteCalendarNote } from '@/lib/firestore/calendar-notes-repo';
import { todayInJakarta } from '@/lib/constants';
import { isArchivedOrder } from '@/lib/order-form';
import { cn } from '@/lib/utils';

// Di bawah breakpoint sm (HP) ketukan tanggal hanya memilih hari dan daftarnya tampil di bawah grid; dialog dipakai di layar lebar.
const WIDE_QUERY = '(min-width: 640px)';

function downloadTextFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const LEGEND: Array<{ label: string; swatch: string }> = [
  { label: 'Deadline berjalan', swatch: 'border-indigo-200 bg-indigo-100' },
  { label: 'Semua selesai', swatch: 'border-green-200 bg-green-100' },
  { label: 'Ada catatan', swatch: 'border-teal-200 bg-teal-100' },
  { label: 'Hari ini', swatch: 'border-teal-700 bg-teal-600' },
];

export function ProductionCalendar() {
  const { orders, ordersState, error, retry } = useOpsData();
  const notesData = useCalendarNotes();
  const todayKey = todayInJakarta();
  const todayParts = parseDateKey(todayKey) ?? { year: new Date().getFullYear(), month0: new Date().getMonth(), day: 1 };

  const [view, setView] = useState<MonthView>({ year: todayParts.year, month: todayParts.month0 });
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey);
  const [includeArchive, setIncludeArchive] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState<string | null>(null);
  const [noteDate, setNoteDate] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarNote | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  // Dibaca setelah mount agar tautan "Buka order" di Google Calendar tidak membuat HTML server berbeda dari klien.
  useEffect(() => setBaseUrl(window.location.origin), []);

  const archivedWithDeadline = useMemo(() => orders.filter((o) => isArchivedOrder(o) && normalizeDateKey(o.deadline)).length, [orders]);
  const scopedOrders = useMemo(() => (includeArchive ? orders : orders.filter((o) => !isArchivedOrder(o))), [orders, includeArchive]);
  const ordersByDate = useMemo(() => groupOrdersByDeadline(scopedOrders), [scopedOrders]);
  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const monthNotes = useMemo(() => notesForMonth(notesData.notes, view.year, view.month), [notesData.notes, view]);
  const notesByDate = useMemo(() => groupNotesByDate(notesData.notes), [notesData.notes]);
  const highlights = useMemo(() => buildMonthHighlights(view.year, view.month, ordersByDate), [view, ordersByDate]);
  const yearOptions = useMemo(() => buildYearOptions(view.year, todayParts.year), [view.year, todayParts.year]);

  const prefix = monthPrefix(view.year, view.month);
  const monthHasDeadline = Object.keys(ordersByDate).some((key) => key.startsWith(prefix));
  const monthLabel = `${MONTH_NAMES[view.month]} ${view.year}`;
  const loading = ordersState === 'loading';

  const goToMonth = useCallback(
    (next: MonthView) => {
      setView(next);
      setSelectedDate(pickDefaultDate(next.year, next.month, todayKey, ordersByDate));
    },
    [todayKey, ordersByDate]
  );

  const handleSelect = (date: string) => {
    setSelectedDate(date);
    if (!window.matchMedia(WIDE_QUERY).matches) return;
    if (ordersByDate[date]?.length) setDeadlineDate(date);
    else setNoteDate(date);
  };

  // Dialog deadline ditutup dulu agar tidak ada dua dialog bertumpuk (Esc akan menutup keduanya).
  const openNote = (date: string) => {
    setDeadlineDate(null);
    setNoteDate(date);
  };
  const requestDelete = (note: CalendarNote) => {
    setDeadlineDate(null);
    setDeleteTarget(note);
  };
  const defaultNoteDate = selectedDate ?? (todayKey.startsWith(prefix) ? todayKey : formatDateKey(view.year, view.month, 1));

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCalendarNote(deleteTarget.id);
      toast.success('Catatan dihapus');
      setDeleteTarget(null);
    } catch (err) {
      console.error('[kalender] Gagal menghapus catatan:', err);
      toast.error('Gagal menghapus catatan. Periksa koneksi lalu coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const events = buildMonthEvents(view.year, view.month, scopedOrders, notesData.notes, { baseUrl });
    if (events.length === 0) {
      toast.info(`Tidak ada deadline atau catatan di ${monthLabel}`);
      return;
    }
    const filename = icsFilename(view.year, view.month);
    downloadTextFile(filename, buildIcs(events), 'text/calendar;charset=utf-8');
    toast.success(`${events.length} agenda diekspor ke ${filename}`);
  };

  const quickActions = (
    <div className="flex basis-full flex-wrap items-center gap-2 sm:ml-auto sm:basis-auto">
      <button
        type="button"
        onClick={() => goToMonth({ year: todayParts.year, month: todayParts.month0 })}
        className={cn(BTN_OUTLINE, 'px-3')}
      >
        Hari ini
      </button>
      {archivedWithDeadline > 0 && (
        <button
          type="button"
          aria-pressed={includeArchive}
          onClick={() => setIncludeArchive((v) => !v)}
          title="Tampilkan deadline order sebelum Okt 2026"
          className={cn(
            'inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors sm:h-10',
            includeArchive ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-600 shadow-btn-secondary hover:bg-slate-50'
          )}
        >
          <Archive className="h-3.5 w-3.5" /> Arsip ({archivedWithDeadline})
        </button>
      )}
    </div>
  );

  const selectedOrders = selectedDate ? (ordersByDate[selectedDate] ?? []) : [];
  const selectedNotes = selectedDate ? (notesByDate[selectedDate] ?? []) : [];

  return (
    <>
      <PageHeader
        eyebrow={<EyebrowBadge>Produksi</EyebrowBadge>}
        title="Kalender Produksi"
        subtitle="Deadline order dari Data Customer, catatan manual, dan hari libur. Tambahkan per deadline ke Google Calendar atau ekspor satu bulan ke file .ics."
        actions={
          <button type="button" onClick={handleExport} disabled={loading} className={cn(BTN_OUTLINE, 'w-full sm:w-auto')}>
            <Download className="h-3.5 w-3.5 text-slate-500" /> Ekspor .ics
          </button>
        }
      />

      {ordersState === 'error' && (
        <div role="alert" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Gagal memuat deadline order{error ? ` (${error})` : ''}.
          </span>
          <button
            type="button"
            onClick={retry}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 font-bold text-rose-800 hover:bg-rose-100 sm:h-10"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Coba lagi
          </button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card-double" aria-label={`Kalender ${monthLabel}`}>
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 p-3 sm:gap-2 sm:p-4">
            <button
              type="button"
              onClick={() => goToMonth(shiftMonth(view, -1))}
              aria-label="Bulan sebelumnya"
              className={cn(ICON_BTN, 'border-slate-200 bg-white text-slate-700 shadow-btn-secondary hover:bg-slate-50')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <CustomSelect
              value={String(view.month)}
              onValueChange={(v) => goToMonth({ year: view.year, month: Number(v) })}
              options={MONTH_NAMES.map((name, i) => ({ value: String(i), label: name }))}
              className="h-11 min-w-0 flex-1 sm:h-10 sm:w-40 sm:flex-none"
            />
            <CustomSelect
              value={String(view.year)}
              onValueChange={(v) => goToMonth({ year: Number(v), month: view.month })}
              options={yearOptions.map((y) => ({ value: String(y), label: String(y) }))}
              className="h-11 w-[88px] shrink-0 sm:h-10 sm:w-28"
            />
            <button
              type="button"
              onClick={() => goToMonth(shiftMonth(view, 1))}
              aria-label="Bulan berikutnya"
              className={cn(ICON_BTN, 'border-slate-200 bg-white text-slate-700 shadow-btn-secondary hover:bg-slate-50')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {quickActions}
          </div>

          <div className="p-1.5 sm:p-3">
            {loading ? (
              <CalendarGridSkeleton />
            ) : (
              <CalendarGrid
                cells={cells}
                todayKey={todayKey}
                selectedDate={selectedDate}
                ordersByDate={ordersByDate}
                notesByDate={notesByDate}
                onSelect={handleSelect}
                onSwipe={(direction) => goToMonth(shiftMonth(view, direction))}
              />
            )}
          </div>

          <div className="space-y-1.5 border-t border-slate-100 px-3 py-2.5 sm:px-4">
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
              {LEGEND.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-1.5">
                  <span className={cn('h-3 w-3 rounded border', item.swatch)} aria-hidden />
                  {item.label}
                </li>
              ))}
              <li className="inline-flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-rose-600" aria-hidden>
                  12
                </span>
                Minggu dan libur nasional
              </li>
            </ul>
            {ordersState === 'ready' && !monthHasDeadline && monthNotes.length === 0 && (
              <p className="text-[11px] text-slate-500">Belum ada deadline atau catatan di {monthLabel}.</p>
            )}
          </div>
        </section>

        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card-double sm:hidden" aria-label="Hari dipilih">
            <header className="border-b border-slate-100 p-3">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-teal-700">Hari dipilih</p>
              <h2 className="text-sm font-extrabold text-slate-900">{selectedDate ? formatLongDate(selectedDate) : 'Belum ada tanggal dipilih'}</h2>
            </header>
            <div className="p-3">
              {loading ? (
                <Shimmer className="h-28 w-full rounded-xl" />
              ) : selectedDate ? (
                <DayDetail
                  date={selectedDate}
                  orders={selectedOrders}
                  notes={selectedNotes}
                  baseUrl={baseUrl}
                  onAddNote={openNote}
                  onDeleteNote={requestDelete}
                />
              ) : (
                <EmptyState title="Ketuk tanggal di kalender" description="Deadline order dan catatan hari itu tampil di sini." />
              )}
            </div>
          </section>

          <CalendarSidePanel
            monthLabel={monthLabel}
            notes={monthNotes}
            notesState={notesData.state}
            highlights={highlights}
            onAddNote={() => openNote(defaultNoteDate)}
            onDeleteNote={requestDelete}
            onRetryNotes={notesData.retry}
          />
        </div>
      </div>

      <DeadlineDialog
        date={deadlineDate}
        orders={deadlineDate ? (ordersByDate[deadlineDate] ?? []) : []}
        notes={deadlineDate ? (notesByDate[deadlineDate] ?? []) : []}
        baseUrl={baseUrl}
        onClose={() => setDeadlineDate(null)}
        onAddNote={openNote}
        onDeleteNote={requestDelete}
      />
      <NoteDialog initialDate={noteDate} onClose={() => setNoteDate(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus catatan?"
        description={
          deleteTarget ? (
            <>
              Catatan tanggal <strong className="text-slate-900">{formatLongDate(deleteTarget.date)}</strong> akan dihapus permanen:{' '}
              <span className="break-words italic">&ldquo;{deleteTarget.text.length > 120 ? `${deleteTarget.text.slice(0, 117)}...` : deleteTarget.text}&rdquo;</span>
            </>
          ) : null
        }
        confirmLabel="Hapus catatan"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

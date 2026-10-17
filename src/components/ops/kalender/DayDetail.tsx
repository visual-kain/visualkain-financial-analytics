'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarPlus, ExternalLink, Plus } from 'lucide-react';
import { NoteCard } from '@/components/ops/kalender/NoteCard';
import { BTN_OUTLINE } from '@/components/ops/kalender/styles';
import { OrderStatusBadge } from '@/components/ops/OrderStatusBadge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import {
  buildGoogleCalendarUrl,
  formatLongDate,
  getHolidayName,
  orderEventDetails,
  orderEventTitle,
  type CalendarNote,
} from '@/lib/calendar';
import { calculateTotals } from '@/lib/legacy/calculations';
import type { LegacyOrder } from '@/lib/legacy/types';

interface DeadlineOrderCardProps {
  order: LegacyOrder;
  /** Tanggal deadline (kunci pengelompokan, sudah divalidasi). */
  date: string;
  baseUrl: string;
}

function DeadlineOrderCard({ order, date, baseUrl }: DeadlineOrderCardProps) {
  const totals = calculateTotals(order);
  const googleUrl = buildGoogleCalendarUrl({ title: orderEventTitle(order), date, details: orderEventDetails(order, baseUrl) });
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <span className="whitespace-nowrap rounded-md border border-teal-200/90 bg-teal-50 px-2 py-0.5 text-[11px] font-black tracking-tight text-teal-900">
          {order.noInv || '-'}
        </span>
        <OrderStatusBadge status={order.status} />
      </div>
      <dl className="mt-2.5 grid grid-cols-[64px_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-xs">
        <dt className="text-slate-500">Customer</dt>
        <dd className="break-words font-semibold text-slate-900">{order.namaCustomer || '-'}</dd>
        <dt className="text-slate-500">Project</dt>
        <dd className="break-words text-slate-700">{order.namaProject || '-'}</dd>
        <dt className="text-slate-500">Qty</dt>
        <dd className="font-semibold tabular-nums text-slate-800">{totals.totalPesanan} pcs</dd>
      </dl>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link href={`/data-customer/${order.id}`} className={BTN_OUTLINE}>
          <ExternalLink className="h-3.5 w-3.5 text-slate-500" /> Buka Order
        </Link>
        <a href={googleUrl} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
          <CalendarPlus className="h-3.5 w-3.5 text-slate-500" /> Tambah ke Google Calendar
        </a>
      </div>
    </article>
  );
}

interface DayDetailProps {
  date: string;
  orders: LegacyOrder[];
  notes: CalendarNote[];
  baseUrl: string;
  onAddNote: (date: string) => void;
  onDeleteNote: (note: CalendarNote) => void;
}

/** Isi satu hari: libur, deadline order, dan catatan. Dipakai di dialog (layar lebar) dan daftar di bawah grid (HP). */
export function DayDetail({ date, orders, notes, baseUrl, onAddNote, onDeleteNote }: DayDetailProps) {
  const holiday = getHolidayName(date);
  const empty = orders.length === 0 && notes.length === 0;
  return (
    <div className="space-y-3">
      {holiday && (
        <p className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">{holiday}</p>
      )}

      {orders.length > 0 && (
        <section aria-label="Deadline order" className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Deadline order ({orders.length})</h3>
          {orders.map((order) => (
            <DeadlineOrderCard key={order.id} order={order} date={date} baseUrl={baseUrl} />
          ))}
        </section>
      )}

      {notes.length > 0 && (
        <section aria-label="Catatan" className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Catatan ({notes.length})</h3>
          <ul className="space-y-2">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={onDeleteNote} />
            ))}
          </ul>
        </section>
      )}

      {empty && <EmptyState title="Tidak ada deadline atau catatan" description="Tambahkan catatan untuk tanggal ini bila perlu." />}

      <button type="button" onClick={() => onAddNote(date)} className={`${BTN_OUTLINE} w-full sm:w-auto`}>
        <Plus className="h-4 w-4 text-slate-500" /> Tambah Catatan
      </button>
    </div>
  );
}

interface DeadlineDialogProps extends Omit<DayDetailProps, 'date'> {
  /** `null` berarti dialog tertutup. */
  date: string | null;
  onClose: () => void;
}

export function DeadlineDialog({ date, onClose, ...detail }: DeadlineDialogProps) {
  return (
    <Modal
      open={!!date}
      onClose={onClose}
      size="lg"
      title={date ? `Deadline: ${formatLongDate(date)}` : 'Deadline'}
      description={detail.orders.length > 0 ? `${detail.orders.length} order jatuh tempo pada tanggal ini` : undefined}
    >
      {date && <DayDetail date={date} {...detail} />}
    </Modal>
  );
}

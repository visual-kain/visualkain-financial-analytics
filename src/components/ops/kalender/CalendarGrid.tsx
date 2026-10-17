'use client';

import React, { useRef, useState } from 'react';
import { Shimmer } from '@/components/ui/shimmer';
import {
  WEEKDAY_SHORT,
  formatLongDate,
  getDeadlineStatus,
  getHolidayName,
  isRedDate,
  type CalendarCell,
  type CalendarNote,
  type OrdersByDate,
} from '@/lib/calendar';
import type { LegacyOrder } from '@/lib/legacy/types';
import { cn } from '@/lib/utils';

const SWIPE_INTENT_PX = 10;
const SWIPE_COMMIT_PX = 56;
const SWIPE_MAX_SHIFT_PX = 48;

const CELL_HEIGHT = 'min-h-[52px] sm:min-h-[84px] xl:min-h-[92px]';

interface CalendarDayProps {
  cell: CalendarCell;
  todayKey: string;
  selected: boolean;
  orders: LegacyOrder[];
  notes: CalendarNote[];
  onSelect: (date: string) => void;
}

function CalendarDay({ cell, todayKey, selected, orders, notes, onSelect }: CalendarDayProps) {
  if (!cell.inMonth) {
    return (
      <div aria-hidden className={cn('flex items-start justify-center p-1 text-[11px] font-semibold text-slate-300 sm:justify-start sm:p-1.5 sm:text-xs', CELL_HEIGHT)}>
        {cell.day}
      </div>
    );
  }

  const status = getDeadlineStatus(orders);
  const hasNote = notes.length > 0;
  const holiday = getHolidayName(cell.date);
  const today = cell.date === todayKey;
  const first = orders[0];

  const tone =
    status === 'active'
      ? 'border-indigo-200 bg-indigo-100 hover:bg-indigo-200'
      : status === 'completed'
        ? 'border-green-200 bg-green-100 hover:bg-green-200'
        : hasNote
          ? 'border-teal-200 bg-teal-100 hover:bg-teal-200'
          : 'border-transparent hover:border-slate-200 hover:bg-slate-50';

  const numberTone = today
    ? 'bg-teal-600 text-white'
    : status === 'active'
      ? 'text-indigo-700'
      : status === 'completed'
        ? 'text-green-700'
        : hasNote
          ? 'text-teal-700'
          : isRedDate(cell.date)
            ? 'text-rose-600'
            : 'text-slate-700';

  const label = [
    formatLongDate(cell.date),
    holiday,
    orders.length > 0 ? `${orders.length} deadline order` : null,
    hasNote ? `${notes.length} catatan` : null,
    today ? 'hari ini' : null,
  ]
    .filter(Boolean)
    .join(', ');

  const dots = [
    ...orders.slice(0, 3).map((o) => (o.status === 'completed' ? 'bg-green-600' : 'bg-indigo-600')),
    ...(hasNote ? ['bg-teal-600'] : []),
  ];

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.date)}
      aria-label={label}
      aria-current={today ? 'date' : undefined}
      aria-pressed={selected}
      data-date={cell.date}
      className={cn(
        'relative flex min-w-0 cursor-pointer flex-col items-center gap-0.5 overflow-hidden rounded-lg border p-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:items-stretch sm:p-1.5 sm:text-left',
        CELL_HEIGHT,
        tone,
        selected && 'ring-2 ring-inset ring-slate-800'
      )}
    >
      <span className={cn('flex h-6 w-6 items-center justify-center self-center rounded-full text-xs font-bold tabular-nums sm:self-start', numberTone)}>
        {cell.day}
      </span>

      <span className="hidden min-w-0 flex-1 flex-col gap-0.5 sm:flex">
        {status && first ? (
          <>
            <span className={cn('line-clamp-2 break-words text-[10.5px] font-semibold leading-tight', status === 'active' ? 'text-indigo-800' : 'text-green-900')}>
              {first.namaCustomer || first.noInv}
            </span>
            {orders.length > 1 && (
              <span className={cn('text-[10px] font-bold', status === 'active' ? 'text-indigo-700' : 'text-green-800')}>+{orders.length - 1} order</span>
            )}
            {hasNote && <span className="text-[10px] font-bold text-teal-800">+ Catatan</span>}
          </>
        ) : hasNote ? (
          <span className="text-[10.5px] font-semibold leading-tight text-teal-800">Ada Catatan</span>
        ) : holiday ? (
          <span className="line-clamp-2 break-words text-[10px] font-medium leading-tight text-rose-600">{holiday}</span>
        ) : null}
      </span>

      <span className="mt-auto flex h-2 items-center justify-center gap-0.5 sm:hidden" aria-hidden>
        {dots.map((dot, i) => (
          <span key={i} className={cn('h-1.5 w-1.5 rounded-full', dot)} />
        ))}
      </span>
    </button>
  );
}

interface CalendarGridProps {
  cells: CalendarCell[];
  todayKey: string;
  selectedDate: string | null;
  ordersByDate: OrdersByDate;
  notesByDate: Record<string, CalendarNote[]>;
  onSelect: (date: string) => void;
  /** 1 = bulan berikutnya (geser ke kiri), -1 = bulan sebelumnya (geser ke kanan). */
  onSwipe: (direction: 1 | -1) => void;
}

const EMPTY_ORDERS: LegacyOrder[] = [];
const EMPTY_NOTES: CalendarNote[] = [];

export function CalendarGrid({ cells, todayKey, selectedDate, ordersByDate, notesByDate, onSelect, onSwipe }: CalendarGridProps) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const horizontal = useRef(false);
  const [shift, setShift] = useState(0);

  const reset = () => {
    start.current = null;
    horizontal.current = false;
    setShift(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY };
    horizontal.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!start.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - start.current.x;
    const dy = touch.clientY - start.current.y;
    if (!horizontal.current) {
      if (Math.abs(dx) < SWIPE_INTENT_PX && Math.abs(dy) < SWIPE_INTENT_PX) return;
      // Gerakan dominan vertikal adalah scroll halaman, bukan ganti bulan.
      if (Math.abs(dy) > Math.abs(dx)) {
        start.current = null;
        return;
      }
      horizontal.current = true;
    }
    setShift(Math.max(-SWIPE_MAX_SHIFT_PX, Math.min(SWIPE_MAX_SHIFT_PX, dx * 0.4)));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const origin = start.current;
    const wasHorizontal = horizontal.current;
    reset();
    if (!origin || !wasHorizontal) return;
    const dx = e.changedTouches[0].clientX - origin.x;
    if (Math.abs(dx) >= SWIPE_COMMIT_PX) onSwipe(dx < 0 ? 1 : -1);
  };

  return (
    <div className="overflow-hidden">
      <div
        className={cn('touch-pan-y', shift === 0 && 'transition-transform duration-200 motion-reduce:transition-none')}
        style={shift === 0 ? undefined : { transform: `translateX(${shift}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={reset}
      >
        <div className="mb-1 grid grid-cols-7 gap-0.5 sm:gap-1" aria-hidden>
          {WEEKDAY_SHORT.map((day, i) => (
            <div key={day} className={cn('py-1.5 text-center text-[10px] font-bold uppercase tracking-wide sm:text-[11px]', i === 0 ? 'text-rose-600' : 'text-slate-500')}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {cells.map((cell) => (
            <CalendarDay
              key={cell.date}
              cell={cell}
              todayKey={todayKey}
              selected={cell.date === selectedDate}
              orders={ordersByDate[cell.date] ?? EMPTY_ORDERS}
              notes={notesByDate[cell.date] ?? EMPTY_NOTES}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarGridSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat kalender">
      <div className="mb-1 grid grid-cols-7 gap-0.5 sm:gap-1">
        {WEEKDAY_SHORT.map((day) => (
          <div key={day} className="flex justify-center py-1.5">
            <Shimmer className="h-3 w-6 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {Array.from({ length: 42 }).map((_, i) => (
          <Shimmer key={i} className={cn('rounded-lg', CELL_HEIGHT)} />
        ))}
      </div>
    </div>
  );
}

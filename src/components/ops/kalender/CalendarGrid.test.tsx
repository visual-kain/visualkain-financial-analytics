import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CalendarGrid } from '@/components/ops/kalender/CalendarGrid';
import { buildMonthGrid, groupNotesByDate, groupOrdersByDeadline } from '@/lib/calendar';
import type { LegacyOrder } from '@/lib/legacy/types';

afterEach(cleanup);

function order(id: string, deadline: string, status: LegacyOrder['status'], namaCustomer = 'Budi'): LegacyOrder {
  return { id, noInv: `VK26${id}`, namaCustomer, status, deadline } as LegacyOrder;
}

function renderGrid(overrides: Partial<React.ComponentProps<typeof CalendarGrid>> = {}) {
  const props: React.ComponentProps<typeof CalendarGrid> = {
    cells: buildMonthGrid(2026, 9),
    todayKey: '2026-10-17',
    selectedDate: null,
    ordersByDate: groupOrdersByDeadline([
      order('1', '2026-10-20', 'production', 'Sari'),
      order('2', '2026-10-20', 'completed'),
      order('3', '2026-10-22', 'completed'),
    ]),
    notesByDate: groupNotesByDate([{ id: 'n1', date: '2026-10-24', text: 'Cek bahan', createdAt: '' }]),
    onSelect: vi.fn(),
    onSwipe: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<CalendarGrid {...props} />) };
}

describe('CalendarGrid', () => {
  it('renders one button per day of the month and no buttons for the spill-over days', () => {
    renderGrid();
    expect(screen.getAllByRole('button')).toHaveLength(31);
  });

  it('describes a day with deadlines, a note, and today in its accessible name', () => {
    renderGrid();
    expect(screen.getByRole('button', { name: '20 Oktober 2026, 2 deadline order' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '24 Oktober 2026, 1 catatan' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^17 Oktober 2026, hari ini$/ }).getAttribute('aria-current')).toBe('date');
    expect(screen.getByRole('button', { name: '4 Oktober 2026, Hari Minggu' })).toBeTruthy();
  });

  it('colors a day active until every order on it is completed', () => {
    renderGrid();
    expect(screen.getByRole('button', { name: /^20 Oktober 2026/ }).className).toContain('bg-indigo-100');
    expect(screen.getByRole('button', { name: /^22 Oktober 2026/ }).className).toContain('bg-green-100');
    expect(screen.getByRole('button', { name: /^24 Oktober 2026/ }).className).toContain('bg-teal-100');
  });

  it('shows the first customer and how many more orders share the date', () => {
    renderGrid();
    expect(screen.getByText('Sari')).toBeTruthy();
    expect(screen.getByText('+1 order')).toBeTruthy();
  });

  it('reports the tapped date', () => {
    const { props } = renderGrid();
    fireEvent.click(screen.getByRole('button', { name: /^20 Oktober 2026/ }));
    expect(props.onSelect).toHaveBeenCalledWith('2026-10-20');
  });

  it('marks the selected day as pressed', () => {
    renderGrid({ selectedDate: '2026-10-20' });
    expect(screen.getByRole('button', { name: /^20 Oktober 2026/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /^21 Oktober 2026/ }).getAttribute('aria-pressed')).toBe('false');
  });

  describe('swipe', () => {
    const swipe = (container: HTMLElement, from: [number, number], to: [number, number]) => {
      const area = container.querySelector('.touch-pan-y') as HTMLElement;
      fireEvent.touchStart(area, { touches: [{ clientX: from[0], clientY: from[1] }] });
      fireEvent.touchMove(area, { touches: [{ clientX: to[0], clientY: to[1] }] });
      fireEvent.touchEnd(area, { changedTouches: [{ clientX: to[0], clientY: to[1] }] });
    };

    it('goes to the next month on a leftward swipe', () => {
      const { props, container } = renderGrid();
      swipe(container, [250, 100], [120, 105]);
      expect(props.onSwipe).toHaveBeenCalledWith(1);
    });

    it('goes to the previous month on a rightward swipe', () => {
      const { props, container } = renderGrid();
      swipe(container, [100, 100], [230, 98]);
      expect(props.onSwipe).toHaveBeenCalledWith(-1);
    });

    it('ignores short drags and vertical scrolling', () => {
      const { props, container } = renderGrid();
      swipe(container, [200, 100], [170, 100]);
      swipe(container, [200, 100], [190, 260]);
      expect(props.onSwipe).not.toHaveBeenCalled();
    });
  });
});

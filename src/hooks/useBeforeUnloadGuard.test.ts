import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBeforeUnloadGuard } from './useBeforeUnloadGuard';

function fireBeforeUnload(): Event {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe('useBeforeUnloadGuard', () => {
  it('menahan penutupan tab saat form kotor', () => {
    renderHook(() => useBeforeUnloadGuard(true));
    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it('tidak menahan saat form bersih dan melepas listener setelah unmount', () => {
    const { rerender, unmount } = renderHook(({ dirty }) => useBeforeUnloadGuard(dirty), {
      initialProps: { dirty: true },
    });
    rerender({ dirty: false });
    expect(fireBeforeUnload().defaultPrevented).toBe(false);

    rerender({ dirty: true });
    unmount();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInitOnce } from './useInitOnce';

describe('useInitOnce', () => {
  it('menjalankan init sekali saat kunci pertama tersedia', () => {
    const init = vi.fn();
    const { rerender } = renderHook(({ k }) => useInitOnce(k, init), {
      initialProps: { k: undefined as string | undefined },
    });
    expect(init).not.toHaveBeenCalled();

    rerender({ k: 'ord-1' });
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('tidak menjalankan ulang saat objek sumber berganti identitas dengan kunci sama', () => {
    const init = vi.fn();
    const { rerender } = renderHook(({ k, source }) => useInitOnce(k, () => init(source)), {
      initialProps: { k: 'ord-1', source: { catatan: 'a' } },
    });
    rerender({ k: 'ord-1', source: { catatan: 'a' } });
    rerender({ k: 'ord-1', source: { catatan: 'b' } });
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('menjalankan ulang saat kunci berganti ke order lain', () => {
    const init = vi.fn();
    const { rerender } = renderHook(({ k }) => useInitOnce(k, init), {
      initialProps: { k: 'ord-1' },
    });
    rerender({ k: 'ord-2' });
    expect(init).toHaveBeenCalledTimes(2);
  });

  it('menunda init selama skip aktif lalu menjalankannya setelah skip dilepas', () => {
    const init = vi.fn();
    const { rerender } = renderHook(({ k, skip }) => useInitOnce(k, init, { skip }), {
      initialProps: { k: 'ord-1', skip: true },
    });
    expect(init).not.toHaveBeenCalled();
    rerender({ k: 'ord-1', skip: false });
    expect(init).toHaveBeenCalledTimes(1);
  });
});

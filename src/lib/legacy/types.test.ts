import { describe, expect, it } from 'vitest';
import { STATUS_ORDER, normalizeOrderStatus } from './types';

describe('status order 6 tahap', () => {
  it('urutan sama dengan visualkaindb main', () => {
    expect(STATUS_ORDER).toEqual(['received', 'payment', 'approval', 'production', 'delivery', 'completed']);
  });

  it('status lama finishing, qc, packing dibaca sebagai produksi', () => {
    expect(normalizeOrderStatus('finishing')).toBe('production');
    expect(normalizeOrderStatus('qc')).toBe('production');
    expect(normalizeOrderStatus('packing')).toBe('production');
  });

  it('status baru tetap, nilai asing atau kosong menjadi diterima', () => {
    expect(normalizeOrderStatus('approval')).toBe('approval');
    expect(normalizeOrderStatus('delivery')).toBe('delivery');
    expect(normalizeOrderStatus('')).toBe('received');
    expect(normalizeOrderStatus(undefined)).toBe('received');
    expect(normalizeOrderStatus('lainnya')).toBe('received');
  });
});

import { describe, it, expect } from 'vitest';
import { resolveEditKasStatus } from './EditKasStatusNotice';

describe('resolveEditKasStatus', () => {
  it('none saat bukan mode edit', () => {
    expect(resolveEditKasStatus(null, false, true)).toBe('none');
  });
  it('loading selama snapshot kas belum tiba', () => {
    expect(resolveEditKasStatus('kas-1', false, false)).toBe('loading');
  });
  it('missing bila kas sudah dimuat tetapi transaksi tidak ada', () => {
    expect(resolveEditKasStatus('kas-1', false, true)).toBe('missing');
  });
  it('ready bila transaksi ditemukan', () => {
    expect(resolveEditKasStatus('kas-1', true, false)).toBe('ready');
  });
});

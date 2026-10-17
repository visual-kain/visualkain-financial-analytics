import { describe, expect, it } from 'vitest';
import { homeRouteFor, isProduksiEmail, parseEmailList } from './user-roles';

describe('user roles', () => {
  it('daftar email dari env dipisah koma, dirapikan, dan huruf kecil', () => {
    expect(parseEmailList(' Produksi@VisualKain.com, ,kedua@visualkain.com ')).toEqual(['produksi@visualkain.com', 'kedua@visualkain.com']);
    expect(parseEmailList(undefined)).toEqual([]);
    expect(parseEmailList('')).toEqual([]);
  });

  it('akun produksi dikenali tanpa peduli huruf besar dan spasi', () => {
    const list = ['produksi@visualkain.com'];
    expect(isProduksiEmail(' PRODUKSI@visualkain.com ', list)).toBe(true);
    expect(isProduksiEmail('owner@visualkain.com', list)).toBe(false);
    expect(isProduksiEmail(null, list)).toBe(false);
    expect(isProduksiEmail('', list)).toBe(false);
  });

  it('akun produksi mendarat di Ringkasan Produksi, akun lain di Ringkasan Finansial', () => {
    const list = ['produksi@visualkain.com'];
    expect(homeRouteFor('produksi@visualkain.com', list)).toBe('/produksi');
    expect(homeRouteFor('owner@visualkain.com', list)).toBe('/');
    expect(homeRouteFor(undefined, list)).toBe('/');
    expect(homeRouteFor('produksi@visualkain.com', [])).toBe('/');
  });
});

import { describe, it, expect } from 'vitest';
import { getVendorItems } from '@/lib/legacy/calculations';
import type { LegacyOrder } from '@/lib/legacy/types';
import { getPoItems } from './POPaper';

function order(extra: Record<string, unknown>): LegacyOrder {
  return { id: 'o1', noInv: 'VK260001', namaCustomer: 'PT Maju', status: 'received', kategoriOrder: 'Kaos', ...extra } as LegacyOrder;
}

describe('getPoItems', () => {
  it('memakai deskripsi legacy "Lengan Pendek", "Lengan Panjang", "Tanpa Lengan"', () => {
    const { items } = getPoItems(
      order({
        hargaVendorPendek: 40000,
        hargaVendorPanjang: 50000,
        hargaVendorTanpaLengan: 35000,
        pendekM: 10,
        panjangL: 4,
        tanpaLenganXL: 2,
      })
    );
    expect(items.map((i) => i.desc)).toEqual(['Kaos Lengan Pendek (M)', 'Kaos Lengan Panjang (L)', 'Kaos Tanpa Lengan (XL)']);
    expect(items.map((i) => i.no)).toEqual([1, 2, 3]);
  });

  it('harga item = harga modal vendor + tambahan ukuran besar, total = qty x harga', () => {
    const { items, grandTotal } = getPoItems(
      order({
        hargaVendorPendek: 40000,
        pendekS: 10,
        pendek2XL: 2,
        pendek3XL: 1,
        pendek4XL: 1,
        pendek5XL: 3,
      })
    );
    expect(items.map((i) => [i.desc, i.qty, i.price, i.total])).toEqual([
      ['Kaos Lengan Pendek (S)', 10, 40000, 400000],
      ['Kaos Lengan Pendek (2XL)', 2, 45000, 90000],
      ['Kaos Lengan Pendek (3XL)', 1, 50000, 50000],
      ['Kaos Lengan Pendek (4XL)', 1, 55000, 55000],
      ['Kaos Lengan Pendek (5XL)', 3, 60000, 180000],
    ]);
    expect(grandTotal).toBe(775000);
  });

  it('urutan baris: kategori dulu (pendek, panjang, tanpa lengan), lalu ukuran XS sampai 5XL', () => {
    const { items } = getPoItems(
      order({ hargaVendorPendek: 1, hargaVendorPanjang: 1, hargaVendorTanpaLengan: 1, tanpaLenganS: 1, panjangXL: 1, pendekXL: 1, pendekXS: 1 })
    );
    expect(items.map((i) => i.desc)).toEqual([
      'Kaos Lengan Pendek (XS)',
      'Kaos Lengan Pendek (XL)',
      'Kaos Lengan Panjang (XL)',
      'Kaos Tanpa Lengan (S)',
    ]);
  });

  it('melewati ukuran tanpa qty dan order tanpa qty menghasilkan daftar kosong', () => {
    expect(getPoItems(order({ hargaVendorPendek: 40000 }))).toEqual({ items: [], grandTotal: 0 });
  });

  it('kategori 3/4 Tangan masuk dengan harga modal vendor 3/4 dan tambahan ukuran besar yang sama', () => {
    const { items, grandTotal } = getPoItems(order({ hargaVendorTigaPerempat: 42000, tigaPerempatM: 5, tigaPerempat2XL: 2 }));
    expect(items.map((i) => [i.desc, i.price, i.total])).toEqual([
      ['Kaos Lengan 3/4 (M)', 42000, 210000],
      ['Kaos Lengan 3/4 (2XL)', 47000, 94000],
    ]);
    expect(grandTotal).toBe(304000);
  });

  it('order lama tanpa data 3/4 menghasilkan item yang sama dengan rumus legacy tiga kategori', () => {
    const legacy = order({
      hargaVendorPendek: 40000,
      hargaVendorPanjang: 52000,
      hargaVendorTanpaLengan: 33000,
      pendekM: 12,
      pendek2XL: 3,
      panjangL: 6,
      tanpaLengan5XL: 2,
    });
    const { items, grandTotal } = getPoItems(legacy);
    // Hitung ulang dengan rumus legacy ditulis tangan.
    const expected = 12 * 40000 + 3 * (40000 + 5000) + 6 * 52000 + 2 * (33000 + 20000);
    expect(grandTotal).toBe(expected);
    expect(items).toHaveLength(4);
  });

  it('harga, qty, dan total sama dengan getVendorItems; hanya teks kategori yang berbeda', () => {
    const o = order({ hargaVendorPendek: 40000, hargaVendorTigaPerempat: 42000, pendekM: 3, tigaPerempatL: 2, pendek2XL: 1 });
    const po = getPoItems(o).items;
    const vendor = getVendorItems(o);
    expect(po.map((i) => [i.qty, i.price, i.total])).toEqual(vendor.map((i) => [i.qty, i.price, i.total]));
    expect(po.map((i) => i.desc)).not.toEqual(vendor.map((i) => i.name));
  });

  it('tidak mencetak "undefined" bila kategori order kosong', () => {
    const { items } = getPoItems(order({ kategoriOrder: undefined, hargaVendorPendek: 1, pendekM: 1 }));
    expect(items[0].desc).toBe('Lengan Pendek (M)');
  });
});

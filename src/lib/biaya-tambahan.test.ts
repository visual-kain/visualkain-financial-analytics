import { describe, it, expect } from 'vitest';
import type { BiayaTambahanItem } from '@/types';
import { summarizeBiayaTambahan, deriveBiayaTambahanItems, deriveCostBase } from './biaya-tambahan';

const items: BiayaTambahanItem[] = [
  { id: 'b1', keterangan: 'Bordir nama', nominal: 600_000, sumber: 'customer' },
  { id: 'b2', keterangan: 'Packing premium', nominal: 300_000, sumber: 'customer' },
  { id: 'b3', keterangan: 'Sablon tambahan', nominal: 500_000, sumber: 'vendor' },
  { id: 'b4', keterangan: 'Ongkir sample', nominal: 50_000, sumber: 'lainnya' },
];

describe('F-12 biaya tambahan', () => {
  it('menjumlah per sumber', () => {
    expect(summarizeBiayaTambahan(items)).toEqual({ customer: 900_000, vendor: 500_000, lainnya: 50_000, selisih: 350_000 });
  });

  it('memakai list tersimpan bila cocok dengan field skalar', () => {
    const order = {
      biayaTambahanList: items,
      biayaTambahanCustomer: 900_000,
      biayaTambahanVendor: 500_000,
      biayaOperasional: 150_000,
      biayaOperasionalDasar: 100_000,
    };
    expect(deriveBiayaTambahanItems(order)).toEqual(items);
  });

  it('membentuk item dari field skalar untuk order lama tanpa list', () => {
    const derived = deriveBiayaTambahanItems({ biayaTambahanCustomer: 900_000, biayaTambahanVendor: 500_000 });
    expect(summarizeBiayaTambahan(derived)).toEqual({ customer: 900_000, vendor: 500_000, lainnya: 0, selisih: 400_000 });
  });

  it('kembali ke field skalar bila list tidak cocok (diubah dari aplikasi lain)', () => {
    const derived = deriveBiayaTambahanItems({ biayaTambahanList: items, biayaTambahanCustomer: 1_000_000, biayaTambahanVendor: 500_000 });
    const sum = summarizeBiayaTambahan(derived);
    expect(sum.customer).toBe(1_000_000);
    expect(sum.vendor).toBe(500_000);
  });

  it('membuang item lainnya bila biaya operasional tidak lagi cocok', () => {
    const derived = deriveBiayaTambahanItems({
      biayaTambahanList: items,
      biayaTambahanCustomer: 900_000,
      biayaTambahanVendor: 500_000,
      biayaOperasional: 80_000,
      biayaOperasionalDasar: 100_000,
    });
    expect(summarizeBiayaTambahan(derived).lainnya).toBe(0);
  });

  it('dasar HPP dan biaya operasional menjaga total awal tetap sama', () => {
    const order = {
      totalHpp: 2_400_000,
      biayaOperasional: 150_000,
      biayaOperasionalDasar: 100_000,
      biayaTambahanCustomer: 900_000,
      biayaTambahanVendor: 500_000,
      biayaTambahanList: items,
    };
    const list = deriveBiayaTambahanItems(order);
    const base = deriveCostBase(order, list);
    const sum = summarizeBiayaTambahan(list);
    expect(base).toEqual({ hppDasar: 1_900_000, opexDasar: 100_000 });
    expect(base.hppDasar + sum.vendor).toBe(order.totalHpp);
    expect(base.opexDasar + sum.lainnya).toBe(order.biayaOperasional);
  });

  it('selisih = tagihan customer dikurangi tagihan vendor dan biaya lainnya (feedback VK260039)', () => {
    const vk260039: BiayaTambahanItem[] = [
      { id: 'c', keterangan: 'Percepat produksi EXTRA CHARGE', nominal: 900_000, sumber: 'customer' },
      { id: 'v', keterangan: 'EXTRA CHARGE produksi', nominal: 500_000, sumber: 'vendor' },
    ];
    expect(summarizeBiayaTambahan(vk260039).selisih).toBe(400_000);
  });

  it('selisih negatif bila biaya vendor dan lainnya melebihi tagihan customer', () => {
    const rugi: BiayaTambahanItem[] = [
      { id: 'c', keterangan: 'Bordir', nominal: 100_000, sumber: 'customer' },
      { id: 'v', keterangan: 'Bordir vendor', nominal: 150_000, sumber: 'vendor' },
      { id: 'l', keterangan: 'Ongkir', nominal: 20_000, sumber: 'lainnya' },
    ];
    expect(summarizeBiayaTambahan(rugi).selisih).toBe(-70_000);
  });

  it('order tanpa biaya tambahan tidak berubah', () => {
    const order = { totalHpp: 1_020_000, biayaOperasional: 0 };
    const list = deriveBiayaTambahanItems(order);
    expect(list).toEqual([]);
    expect(deriveCostBase(order, list)).toEqual({ hppDasar: 1_020_000, opexDasar: 0 });
  });
});

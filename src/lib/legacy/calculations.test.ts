import { describe, expect, it } from 'vitest';
import { calculateTotals, calculateVendorGrandTotal, countPcs, getInvoiceItems } from './calculations';

// Salinan rumus asli visualkaindb (3 kategori) sebagai pembanding: order tanpa 3/4 wajib menghasilkan angka identik.
const LEGACY_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const LEGACY_CATS = ['pendek', 'panjang', 'tanpaLengan'];
function legacyExtra(size: string) {
  return ({ '2XL': 5000, '3XL': 10000, '4XL': 15000, '5XL': 20000 } as Record<string, number>)[size] || 0;
}
function legacyCap(s: string) {
  return s === 'tanpaLengan' ? 'TanpaLengan' : s.charAt(0).toUpperCase() + s.slice(1);
}
function legacyCalculateTotals(order: Record<string, number>) {
  let qty = 0;
  let jual = 0;
  let modal = 0;
  LEGACY_CATS.forEach((cat) => {
    const bj = order[`harga${legacyCap(cat)}`] || 0;
    const bm = order[`hargaVendor${legacyCap(cat)}`] || 0;
    LEGACY_SIZES.forEach((s) => {
      const q = order[`${cat}${s}`] || 0;
      qty += q;
      jual += q * (bj + legacyExtra(s));
      modal += q * (bm + legacyExtra(s));
    });
  });
  const net = jual - (order.diskonHarga || 0);
  const nominalDP = Math.round(net * ((order.dpPersen || 0) / 100));
  const profit = net - modal - (order.biayaOperasional || 0);
  return { totalPesanan: qty, grossTotal: jual, jumlahSemua: net, nominalDP, sisaPelunasan: net - nominalDP, profit, profitPercent: net > 0 ? (profit / net) * 100 : 0 };
}

function seededOrder(seed: number): Record<string, number> {
  let x = seed;
  const rnd = (max: number) => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x % max;
  };
  const order: Record<string, number> = {
    hargaPendek: 50000 + rnd(50) * 1000,
    hargaPanjang: 60000 + rnd(50) * 1000,
    hargaTanpaLengan: 40000 + rnd(50) * 1000,
    hargaVendorPendek: 30000 + rnd(30) * 1000,
    hargaVendorPanjang: 35000 + rnd(30) * 1000,
    hargaVendorTanpaLengan: 25000 + rnd(30) * 1000,
    diskonHarga: rnd(5) * 10000,
    biayaOperasional: rnd(4) * 25000,
    dpPersen: [0, 50, 70, 100][rnd(4)],
  };
  LEGACY_CATS.forEach((cat) => LEGACY_SIZES.forEach((s) => (order[`${cat}${s}`] = rnd(4) === 0 ? rnd(30) : 0)));
  return order;
}

describe('legacy calculateTotals', () => {
  it('menghasilkan angka identik dengan rumus visualkaindb untuk order tanpa 3/4', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const order = seededOrder(seed);
      const expected = legacyCalculateTotals(order);
      const actual = calculateTotals(order);
      expect(actual.totalPesanan).toBe(expected.totalPesanan);
      expect(actual.grossTotal).toBe(expected.grossTotal);
      expect(actual.jumlahSemua).toBe(expected.jumlahSemua);
      expect(actual.nominalDP).toBe(expected.nominalDP);
      expect(actual.sisaPelunasan).toBe(expected.sisaPelunasan);
      expect(actual.profit).toBe(expected.profit);
      expect(actual.profitPercent).toBeCloseTo(expected.profitPercent, 10);
    }
  });

  it('kategori 3/4 memakai harga dan tambahan ukuran besar yang sama', () => {
    const order = { hargaTigaPerempat: 70000, hargaVendorTigaPerempat: 45000, tigaPerempatM: 10, tigaPerempat2XL: 2 };
    const t = calculateTotals(order);
    expect(t.qtyPerKategori.tigaPerempat).toBe(12);
    expect(t.grossTotal).toBe(10 * 70000 + 2 * (70000 + 5000));
    expect(t.grossModal).toBe(10 * 45000 + 2 * (45000 + 5000));
    expect(calculateVendorGrandTotal(order)).toBe(t.grossModal);
    expect(countPcs(order)).toBe(12);
  });

  it('profit dan sisa bisa minus seperti aslinya (tanpa clamp)', () => {
    const t = calculateTotals({ hargaPendek: 10000, hargaVendorPendek: 15000, pendekM: 2, dpPersen: 120 });
    expect(t.profit).toBe(-10000);
    expect(t.sisaPelunasan).toBeLessThan(0);
  });
});

describe('legacy getInvoiceItems', () => {
  it('membuat baris per kategori × ukuran dengan label lama dan 3/4 Tangan', () => {
    const items = getInvoiceItems({ kategoriOrder: 'Kaos', hargaPendek: 50000, pendekL: 3, pendek3XL: 1, hargaTigaPerempat: 60000, tigaPerempatS: 2 });
    expect(items).toEqual([
      { name: 'Kaos Pendek (L)', qty: 3, price: 50000, total: 150000 },
      { name: 'Kaos Pendek (3XL)', qty: 1, price: 60000, total: 60000 },
      { name: 'Kaos 3/4 Tangan (S)', qty: 2, price: 60000, total: 120000 },
    ]);
  });
});

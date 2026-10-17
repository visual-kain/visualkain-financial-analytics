import type { KategoriDoc, LegacyOrder, SizeChart, VendorDoc } from '@/lib/legacy/types';

// Data fiktif untuk halaman pratinjau dev dan test; bukan data produksi.
function ts(iso: string) {
  const ms = new Date(iso).getTime();
  return { seconds: Math.floor(ms / 1000), nanoseconds: 0, toDate: () => new Date(ms) };
}

export const fixtureVendors: VendorDoc[] = [
  { id: 'v-1', nama: 'KONVEKSI MAJU JAYA', alamat: 'Bandung', wa: '0811000001', pic: 'Pak Andi' },
  { id: 'v-2', nama: 'SABLON SEJAHTERA', alamat: 'Tangerang', wa: '0811000002', pic: 'Bu Rina' },
];

export const fixtureKategori: KategoriDoc[] = [
  { id: 'k-1', nama: 'Kaos' },
  { id: 'k-2', nama: 'Kemeja' },
  { id: 'k-3', nama: 'Rompi' },
];

export const fixtureSizeCharts: SizeChart[] = [
  {
    id: 'sc-1',
    nama: 'Kaos Reguler Dewasa',
    sizes: {
      XS: { panjang: 64, lebar: 46 }, S: { panjang: 66, lebar: 48 }, M: { panjang: 70, lebar: 50 }, L: { panjang: 72, lebar: 52 },
      XL: { panjang: 74, lebar: 54 }, '2XL': { panjang: 76, lebar: 57 }, '3XL': { panjang: 78, lebar: 60 }, '4XL': { panjang: 80, lebar: 63 }, '5XL': { panjang: 82, lebar: 66 },
    },
  },
  { id: 'sc-2', nama: 'Kemeja Lengan Panjang Slim Fit untuk Seragam Kantor Cabang', sizes: {} },
];

export const fixtureOrders: LegacyOrder[] = [
  {
    id: 'fx-1',
    noInv: 'VK260052',
    tanggalInv: '2026-10-16',
    namaCustomer: 'PT CONTOH ABADI SENTOSA INDONESIA CABANG TANGERANG SELATAN',
    noWaCustomer: '081200000001',
    namaProject: 'SERAGAM GATHERING TAHUNAN DIVISI OPERASIONAL & LOGISTIK 2026',
    jenisMetodeProduksi: 'Sablon Plastisol + Bordir Logo Dada',
    kategoriOrder: 'Kaos',
    jenisBahan: 'COTTON COMBED 30S',
    warna: 'Navy Blue',
    deadline: '2026-10-30',
    notes: 'Logo dada kiri bordir, punggung sablon 2 warna.',
    prodDetail1: 'Sablon punggung 2 warna',
    prodDetail2: 'Bordir logo dada kiri',
    hargaPendek: 85000,
    hargaTigaPerempat: 95000,
    hargaVendorPendek: 55000,
    hargaVendorTigaPerempat: 62000,
    vendorId: 'v-1',
    sizeChartId: 'sc-1',
    status: 'production',
    createdBy: 'Sari Operasional',
    pendekS: 10, pendekM: 20, pendekL: 15, pendek2XL: 5,
    tigaPerempatM: 6, tigaPerempatL: 4,
    pembayaranList: [{ id: 'p1', nominal: 3000000, jenis: 'dp', label: 'DP 1', tanggal: '2026-10-16' }],
    createdAt: ts('2026-10-17T02:40:00Z'),
  },
  {
    id: 'fx-2',
    noInv: 'VK260051',
    tanggalInv: '2026-10-12',
    namaCustomer: 'BU CONTOH',
    noWaCustomer: '081200000002',
    namaProject: 'Sample Rompi',
    jenisMetodeProduksi: 'Bordir',
    kategoriOrder: 'Rompi',
    jenisBahan: 'DRILL',
    warna: 'Hitam',
    deadline: '2026-10-14',
    hargaTanpaLengan: 150000,
    hargaVendorTanpaLengan: 200000,
    vendorId: 'v-2',
    status: 'payment',
    tanpaLenganM: 1,
    pembayaranList: [],
    createdAt: ts('2026-10-12T05:00:00Z'),
  },
  {
    id: 'fx-3',
    noInv: 'VK260050',
    tanggalInv: '2026-10-05',
    namaCustomer: 'OM CONTOH',
    namaProject: 'Kemeja PDH',
    jenisMetodeProduksi: 'Jahit',
    kategoriOrder: 'Kemeja',
    jenisBahan: 'AMERICAN DRILL',
    warna: 'Krem',
    hargaPanjang: 175000,
    hargaVendorPanjang: 120000,
    vendorId: 'v-1',
    status: 'completed',
    panjangL: 8, panjangXL: 4,
    totalDibayarKeVendor: 1440000,
    pembayaranList: [
      { id: 'q1', nominal: 1000000, jenis: 'dp', tanggal: '2026-10-05' },
      { id: 'q2', nominal: 470000, jenis: 'termin', tanggal: '2026-10-08' },
      { id: 'q3', nominal: 630000, jenis: 'pelunasan', tanggal: '2026-10-15' },
    ],
    createdAt: ts('2026-10-05T03:00:00Z'),
  },
  {
    id: 'fx-4',
    noInv: 'VK260030',
    tanggalInv: '2026-08-02',
    namaCustomer: 'ARSIP CONTOH',
    namaProject: 'Order lama',
    kategoriOrder: 'Kaos',
    hargaPendek: 70000,
    hargaVendorPendek: 50000,
    status: 'completed',
    pendekL: 3,
    createdAt: ts('2026-08-02T03:00:00Z'),
  },
];

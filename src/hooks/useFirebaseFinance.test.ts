import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const fs = vi.hoisted(() => {
  type Listener = { next: (snap: unknown) => void; error: (err: Error) => void };
  return {
    listeners: {} as Record<string, Listener>,
    subscribeCount: 0,
    updateDoc: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
  };
});

vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ name }),
  doc: (_db: unknown, col: string, id: string) => ({ col, id }),
  onSnapshot: (
    ref: { name: string },
    next: (snap: unknown) => void,
    error: (err: Error) => void
  ) => {
    fs.listeners[ref.name] = { next, error };
    fs.subscribeCount += 1;
    return () => undefined;
  },
  updateDoc: fs.updateDoc,
  addDoc: fs.addDoc,
  deleteDoc: fs.deleteDoc,
  serverTimestamp: () => 'server-ts',
}));

import { useFirebaseFinance } from './useFirebaseFinance';

function snapshot(docs: Array<Record<string, unknown> & { id: string }>) {
  return {
    empty: docs.length === 0,
    docs: docs.map(({ id, ...data }) => ({ id, data: () => data })),
  };
}

const orderDoc = {
  id: 'ord-1',
  noInv: 'VK-T1',
  namaCustomer: 'Customer Uji',
  tanggalInv: '2026-10-10',
  isManualFinanceOverride: true,
  grossTotal: 1_000_000,
  totalInvoice: 1_000_000,
  totalHpp: 600_000,
  catatanFinance: 'awal',
};

const kasDoc = {
  id: 'kas-1',
  tanggal: '2026-10-11',
  jenis: 'keluar',
  jumlah: 50_000,
  kategori: 'Operasional',
  keterangan: 'Listrik',
};

function emitLive() {
  act(() => {
    fs.listeners.vendors.next(snapshot([]));
    fs.listeners.orders.next(snapshot([orderDoc]));
    fs.listeners.kas.next(snapshot([kasDoc]));
    fs.listeners.finance_investor.next(snapshot([]));
  });
}

beforeEach(() => {
  fs.updateDoc.mockReset();
  fs.addDoc.mockReset();
  fs.deleteDoc.mockReset();
  for (const key of Object.keys(fs.listeners)) delete fs.listeners[key];
});

describe('useFirebaseFinance: penulisan Firestore yang gagal', () => {
  it('updateOrderFinance menolak dan mengembalikan order ke nilai semula', async () => {
    fs.updateDoc.mockRejectedValueOnce(new Error('permission-denied'));
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();

    await act(async () => {
      await expect(
        result.current.updateOrderFinance('ord-1', { catatanFinance: 'diubah' })
      ).rejects.toThrow();
    });

    expect(result.current.orders.find((o) => o.id === 'ord-1')?.catatanFinance).toBe('awal');
  });

  it('addKas menolak tanpa menyisipkan transaksi kas-local', async () => {
    fs.addDoc.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();

    await act(async () => {
      await expect(
        result.current.addKas({
          tanggal: '2026-10-12',
          tipe: 'masuk',
          nominal: 10_000,
          kategori: 'Saldo Awal',
          keterangan: 'Setoran',
        })
      ).rejects.toThrow();
    });

    expect(result.current.cashTransactions.some((t) => t.id.startsWith('kas-local-'))).toBe(false);
    expect(result.current.cashTransactions).toHaveLength(1);
  });

  it('updateKas menolak dan mengembalikan transaksi ke nilai semula', async () => {
    fs.updateDoc.mockRejectedValueOnce(new Error('permission-denied'));
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();

    await act(async () => {
      await expect(result.current.updateKas('kas-1', { nominal: 99_000 })).rejects.toThrow();
    });

    expect(result.current.cashTransactions.find((t) => t.id === 'kas-1')?.nominal).toBe(50_000);
  });

  it('deleteKas menolak dan mengembalikan transaksi yang dihapus', async () => {
    fs.deleteDoc.mockRejectedValueOnce(new Error('permission-denied'));
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();

    await act(async () => {
      await expect(result.current.deleteKas('kas-1')).rejects.toThrow();
    });

    await waitFor(() =>
      expect(result.current.cashTransactions.map((t) => t.id)).toContain('kas-1')
    );
  });

  it('penulisan yang berhasil tetap memperbarui state', async () => {
    fs.updateDoc.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();

    await act(async () => {
      await result.current.updateOrderFinance('ord-1', { catatanFinance: 'diubah' });
    });

    expect(result.current.orders.find((o) => o.id === 'ord-1')?.catatanFinance).toBe('diubah');
  });
});

describe('useFirebaseFinance: state awal dan status sinkronisasi', () => {
  it('mulai kosong dengan status connecting sebelum snapshot pertama', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    expect(result.current.orders).toEqual([]);
    expect(result.current.cashTransactions).toEqual([]);
    expect(result.current.syncState).toBe('connecting');
  });

  it('snapshot orders kosong menghasilkan status live dengan daftar kosong', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => fs.listeners.orders.next(snapshot([])));
    expect(result.current.orders).toEqual([]);
    expect(result.current.syncState).toBe('live');
  });

  it('snapshot kas kosong mengosongkan transaksi yang sebelumnya ada', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();
    expect(result.current.cashTransactions).toHaveLength(1);
    act(() => fs.listeners.kas.next(snapshot([])));
    expect(result.current.cashTransactions).toEqual([]);
  });

  it.each(['orders', 'kas', 'vendors'])('error pada listener %s menjadikan status error', (name) => {
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => fs.listeners[name].error(new Error('permission-denied')));
    expect(result.current.syncState).toBe('error');
    expect(result.current.error).toBe('permission-denied');
  });

  it('retry memasang ulang keempat listener', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    const before = fs.subscribeCount;
    act(() => result.current.retry());
    expect(fs.subscribeCount - before).toBe(4);
    expect(result.current.syncState).toBe('connecting');
  });
});

describe('useFirebaseFinance: persistensi label termin', () => {
  it('menyimpan label otomatis sebagai string kosong dan mempertahankan label kustom', async () => {
    fs.updateDoc.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();

    await act(async () => {
      await result.current.updateOrderFinance('ord-1', {
        pembayaranList: [
          { id: 'p1', orderId: 'ord-1', noInv: 'VK-T1', tanggal: '2026-10-02', nominal: 100, jenis: 'dp', terminKe: 1, label: 'DP 1', createdAt: '1' },
          { id: 'p2', orderId: 'ord-1', noInv: 'VK-T1', tanggal: '2026-10-03', nominal: 100, jenis: 'termin', terminKe: 2, label: 'Booking Bahan', createdAt: '2' },
          { id: 'p3', orderId: 'ord-1', noInv: 'VK-T1', tanggal: '2026-10-04', nominal: 100, jenis: 'termin', terminKe: 3, createdAt: '3' },
        ],
        vendorPembayaranList: [
          { id: 'v1', vendorName: 'AMRIN', tanggal: '2026-10-02', nominal: 50, jenis: 'dp_vendor', label: 'Pembayaran ke-1' },
        ],
      });
    });

    const payload = fs.updateDoc.mock.calls[0][1] as Record<string, Array<{ label: string }>>;
    expect(payload.pembayaranList.map((p) => p.label)).toEqual(['', 'Booking Bahan', '']);
    expect(payload.riwayatPembayaran.map((p) => p.label)).toEqual(['', 'Booking Bahan', '']);
    expect(payload.vendorPembayaranList.map((p) => p.label)).toEqual(['']);
  });
});

describe('useFirebaseFinance: kesiapan data kas', () => {
  it('kasReady bernilai false sampai snapshot kas dan investor pertama tiba', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => fs.listeners.orders.next(snapshot([orderDoc])));
    expect(result.current.kasReady).toBe(false);
    act(() => fs.listeners.kas.next(snapshot([])));
    expect(result.current.kasReady).toBe(false);
    act(() => fs.listeners.finance_investor.next(snapshot([])));
    expect(result.current.kasReady).toBe(true);
  });
});

describe('useFirebaseFinance: entri riwayat yang disaring reader', () => {
  it('mempertahankan entri pinjaman di riwayatPembayaran saat termin disimpan', async () => {
    fs.updateDoc.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => {
      fs.listeners.vendors.next(snapshot([]));
      fs.listeners.orders.next(
        snapshot([
          {
            ...orderDoc,
            riwayatPembayaran: [
              { jumlah: 200_000, tanggal: '2026-10-05', catatan: 'Transfer BCA' },
              { jumlah: 500_000, tanggal: '2026-10-06', catatan: 'Pinjaman modal dari owner' },
            ],
          },
        ])
      );
    });

    await act(async () => {
      await result.current.updateOrderFinance('ord-1', {
        pembayaranList: [
          { id: 'p1', orderId: 'ord-1', noInv: 'VK-T1', tanggal: '2026-10-05', nominal: 250_000, jenis: 'dp', createdAt: '1' },
        ],
      });
    });

    const payload = fs.updateDoc.mock.calls[0][1] as Record<string, Array<{ catatan?: string; jumlah: number }>>;
    expect(payload.riwayatPembayaran).toHaveLength(2);
    expect(payload.riwayatPembayaran.some((p) => p.catatan === 'Pinjaman modal dari owner' && p.jumlah === 500_000)).toBe(true);
    expect(payload.totalUangMasukCustomer).toBe(250_000);
  });
});

describe('useFirebaseFinance: status gabungan ketiga listener', () => {
  it('tetap error bila listener kas gagal walaupun snapshot orders datang setelahnya', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => fs.listeners.kas.error(new Error('permission-denied')));
    act(() => fs.listeners.orders.next(snapshot([orderDoc])));
    expect(result.current.syncState).toBe('error');
  });

  it('kembali live setelah listener yang gagal menerima snapshot berikutnya', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => fs.listeners.vendors.error(new Error('unavailable')));
    act(() => fs.listeners.orders.next(snapshot([orderDoc])));
    act(() => fs.listeners.vendors.next(snapshot([])));
    expect(result.current.syncState).toBe('live');
  });
});

describe('useFirebaseFinance: entri pinjaman milik app sendiri', () => {
  const appPayment = { id: 'p1', orderId: 'ord-1', noInv: 'VK-T1', tanggal: '2026-10-05', nominal: 300_000, jenis: 'dp', keterangan: 'Transfer dana pinjaman keluarga', createdAt: '1' };
  const otherPayment = { id: 'p2', orderId: 'ord-1', noInv: 'VK-T1', tanggal: '2026-10-07', nominal: 100_000, jenis: 'termin', keterangan: 'Transfer BCA', createdAt: '2' };

  function emitOrderWithAppRiwayat() {
    act(() => {
      fs.listeners.vendors.next(snapshot([]));
      fs.listeners.orders.next(
        snapshot([
          {
            ...orderDoc,
            pembayaranList: [appPayment, otherPayment],
            riwayatPembayaran: [
              { id: 'p1', jumlah: 300_000, tanggal: '2026-10-05', catatan: appPayment.keterangan },
              { id: 'p2', jumlah: 100_000, tanggal: '2026-10-07', catatan: 'Transfer BCA' },
            ],
          },
        ])
      );
    });
  }

  it('tidak menggandakan pembayaran yang catatannya mengandung kata pinjaman', async () => {
    fs.updateDoc.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useFirebaseFinance());
    emitOrderWithAppRiwayat();

    await act(async () => {
      await result.current.updateOrderFinance('ord-1', { pembayaranList: [appPayment, otherPayment] as never });
    });

    const payload = fs.updateDoc.mock.calls[0][1] as Record<string, Array<{ id?: string }>>;
    expect(payload.riwayatPembayaran.filter((p) => p.id === 'p1')).toHaveLength(1);
  });

  it('menghapus pembayaran tersebut dari riwayat saat dihapus dari daftar termin', async () => {
    fs.updateDoc.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useFirebaseFinance());
    emitOrderWithAppRiwayat();

    await act(async () => {
      await result.current.updateOrderFinance('ord-1', { pembayaranList: [otherPayment] as never });
    });

    const payload = fs.updateDoc.mock.calls[0][1] as Record<string, Array<{ id?: string }>>;
    expect(payload.riwayatPembayaran.map((p) => p.id)).toEqual(['p2']);
  });
});

describe('useFirebaseFinance: F-12 dana investor dan master vendor', () => {
  it('membaca transaksi investor dari koleksi finance_investor dan menggabungkannya dengan kas', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => {
      fs.listeners.vendors.next(snapshot([]));
      fs.listeners.orders.next(snapshot([orderDoc]));
      fs.listeners.kas.next(snapshot([kasDoc]));
      fs.listeners.finance_investor.next(
        snapshot([
          { id: 'inv-1', tanggal: '2026-10-03', jenis: 'masuk', nominal: 1_000_000, keterangan: '-', investorNama: ' Pak Budi ', jatuhTempo: '2027-01-31' },
          { id: 'inv-2', tanggal: '2026-10-20', jenis: 'pengembalian', nominal: 400_000, investorNama: 'Pak Budi' },
          { id: 'inv-lama', tanggal: '2026-09-01', jenis: 'masuk', nominal: 9, investorNama: 'Sebelum cutoff' },
        ])
      );
    });

    const ids = result.current.cashTransactions.map((t) => t.id).sort();
    expect(ids).toEqual(['inv-1', 'inv-2', 'kas-1']);
    expect(result.current.cashTransactions.find((t) => t.id === 'inv-1')).toMatchObject({
      tipe: 'masuk',
      kategori: 'Dana Investor',
      investorNama: 'Pak Budi',
      jatuhTempo: '2027-01-31',
      koleksi: 'investor',
    });
    expect(result.current.cashTransactions.find((t) => t.id === 'inv-2')).toMatchObject({ tipe: 'keluar', kategori: 'Pengembalian Dana Investor' });
    expect(result.current.cashTransactions.find((t) => t.id === 'kas-1')?.koleksi).toBeUndefined();
  });

  it('kas masuk berkategori lama "Biaya Lain" terbaca sebagai Pendapatan Lain, kas keluar tetap Biaya Lain', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => {
      fs.listeners.vendors.next(snapshot([]));
      fs.listeners.orders.next(snapshot([orderDoc]));
      fs.listeners.kas.next(
        snapshot([
          { id: 'kas-masuk-lama', tanggal: '2026-10-13', jenis: 'masuk', jumlah: 2_000_000, kategori: 'Biaya Lain', keterangan: 'Pendapatan' },
          { id: 'kas-keluar', tanggal: '2026-10-13', jenis: 'keluar', jumlah: 50_000, kategori: 'Biaya Lain', keterangan: 'Admin' },
        ])
      );
      fs.listeners.finance_investor.next(snapshot([]));
    });

    expect(result.current.cashTransactions.find((t) => t.id === 'kas-masuk-lama')?.kategori).toBe('Pendapatan Lain');
    expect(result.current.cashTransactions.find((t) => t.id === 'kas-keluar')?.kategori).toBe('Biaya Lain');
  });

  it('snapshot kas berikutnya tidak menghapus transaksi investor, dan sebaliknya', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();
    act(() => {
      fs.listeners.finance_investor.next(snapshot([{ id: 'inv-1', tanggal: '2026-10-03', jenis: 'masuk', nominal: 1_000, investorNama: 'A' }]));
    });
    act(() => fs.listeners.kas.next(snapshot([])));
    expect(result.current.cashTransactions.map((t) => t.id)).toEqual(['inv-1']);
    act(() => fs.listeners.kas.next(snapshot([kasDoc])));
    act(() => fs.listeners.finance_investor.next(snapshot([])));
    expect(result.current.cashTransactions.map((t) => t.id)).toEqual(['kas-1']);
  });

  it('addKas kategori investor ditulis ke finance_investor dengan jenis, bukan ke kas', async () => {
    fs.addDoc.mockResolvedValueOnce({ id: 'inv-baru' });
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();

    await act(async () => {
      await result.current.addKas({
        tanggal: '2026-10-12',
        tipe: 'masuk',
        nominal: 5_000_000,
        kategori: 'Dana Investor',
        keterangan: 'Transfer BCA',
        investorNama: 'Bu Sari',
        jatuhTempo: '2026-12-31',
      });
    });

    expect(fs.addDoc.mock.calls[0][0]).toEqual({ name: 'finance_investor' });
    expect(fs.addDoc.mock.calls[0][1]).toMatchObject({ jenis: 'masuk', nominal: 5_000_000, investorNama: 'Bu Sari', jatuhTempo: '2026-12-31' });
    expect(fs.addDoc.mock.calls[0][1]).not.toHaveProperty('kategori');
    expect(result.current.cashTransactions.find((t) => t.id === 'inv-baru')).toMatchObject({ koleksi: 'investor', investorNama: 'Bu Sari' });
  });

  it('addKas kategori biasa tetap ditulis ke kas tanpa field investor', async () => {
    fs.addDoc.mockResolvedValueOnce({ id: 'kas-baru' });
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();

    await act(async () => {
      await result.current.addKas({ tanggal: '2026-10-12', tipe: 'keluar', nominal: 10_000, kategori: 'Operasional', keterangan: 'Listrik' });
    });

    expect(fs.addDoc.mock.calls[0][0]).toEqual({ name: 'kas' });
    expect(fs.addDoc.mock.calls[0][1]).not.toHaveProperty('investorNama');
  });

  it('updateKas dan deleteKas transaksi investor menuju finance_investor dan rollback bila gagal', async () => {
    fs.updateDoc.mockRejectedValueOnce(new Error('permission-denied'));
    fs.deleteDoc.mockRejectedValueOnce(new Error('permission-denied'));
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();
    act(() => {
      fs.listeners.finance_investor.next(snapshot([{ id: 'inv-1', tanggal: '2026-10-03', jenis: 'masuk', nominal: 1_000_000, investorNama: 'Pak Budi' }]));
    });

    await act(async () => {
      await expect(result.current.updateKas('inv-1', { nominal: 2_000_000, kategori: 'Dana Investor', investorNama: 'Pak Budi', jatuhTempo: '2027-02-01' })).rejects.toThrow();
    });
    expect(fs.updateDoc.mock.calls[0][0]).toEqual({ col: 'finance_investor', id: 'inv-1' });
    expect(fs.updateDoc.mock.calls[0][1]).toMatchObject({ nominal: 2_000_000, jenis: 'masuk', jatuhTempo: '2027-02-01' });
    expect(fs.updateDoc.mock.calls[0][1]).not.toHaveProperty('jumlah');
    expect(result.current.cashTransactions.find((t) => t.id === 'inv-1')?.nominal).toBe(1_000_000);

    await act(async () => {
      await expect(result.current.deleteKas('inv-1')).rejects.toThrow();
    });
    expect(fs.deleteDoc.mock.calls[0][0]).toEqual({ col: 'finance_investor', id: 'inv-1' });
    await waitFor(() => expect(result.current.cashTransactions.map((t) => t.id)).toContain('inv-1'));
  });

  it('error pada listener investor menjadikan status error', () => {
    const { result } = renderHook(() => useFirebaseFinance());
    emitLive();
    act(() => fs.listeners.finance_investor.error(new Error('permission-denied')));
    expect(result.current.syncState).toBe('error');
  });

  it('menambah vendor baru dan menolak nama yang sudah ada', async () => {
    fs.addDoc.mockResolvedValueOnce({ id: 'v-new' });
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => {
      fs.listeners.vendors.next(snapshot([{ id: 'v-1', nama: 'Vendor Wisnu' }]));
      fs.listeners.orders.next(snapshot([orderDoc]));
      fs.listeners.kas.next(snapshot([]));
    });

    await act(async () => {
      await expect(result.current.addVendor('vendor wisnu')).rejects.toThrow(/sudah terdaftar/);
    });
    expect(fs.addDoc).not.toHaveBeenCalled();

    await act(async () => {
      const created = await result.current.addVendor('  Konveksi  Baru ');
      expect(created).toMatchObject({ id: 'v-new', nama: 'Konveksi Baru' });
    });
    expect(fs.addDoc.mock.calls[0][0]).toEqual({ name: 'vendors' });
    expect(result.current.vendors.map((v) => v.nama)).toContain('Konveksi Baru');
  });

  it('rename vendor gagal mengembalikan nama semula', async () => {
    fs.updateDoc.mockRejectedValueOnce(new Error('permission-denied'));
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => {
      fs.listeners.vendors.next(snapshot([{ id: 'v-1', nama: 'Vendor Wisnu' }]));
      fs.listeners.orders.next(snapshot([orderDoc]));
      fs.listeners.kas.next(snapshot([]));
    });

    await act(async () => {
      await expect(result.current.renameVendor('v-1', 'Wisnu Konveksi')).rejects.toThrow();
    });
    expect(result.current.vendors.find((v) => v.id === 'v-1')?.nama).toBe('Vendor Wisnu');
  });

  it('rename vendor langsung memperbarui nama vendor di order yang terhubung', async () => {
    fs.updateDoc.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useFirebaseFinance());
    act(() => {
      fs.listeners.vendors.next(snapshot([{ id: 'v-1', nama: 'Vendor Wisnu' }]));
      fs.listeners.orders.next(snapshot([{ ...orderDoc, vendorId: 'v-1' }]));
      fs.listeners.kas.next(snapshot([]));
    });
    expect(result.current.orders[0].vendorName).toBe('Vendor Wisnu');

    await act(async () => {
      await result.current.renameVendor('v-1', 'Wisnu Konveksi');
    });
    expect(result.current.orders[0].vendorName).toBe('Wisnu Konveksi');
  });
});

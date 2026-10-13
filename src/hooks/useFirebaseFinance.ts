'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateOrderTotals } from '@/lib/calculations';
import { initialOrdersData, initialCashTransactions } from '@/lib/seed-data';
import type { Order, CashTransaction, CustomerPayment, CashOutflowCategory } from '@/types';

export type SyncState = 'connecting' | 'live' | 'fallback' | 'error';

interface VendorInfo {
  id: string;
  nama: string;
  pic?: string;
}

interface UseFirebaseFinanceResult {
  orders: Order[];
  cashTransactions: CashTransaction[];
  vendors: VendorInfo[];
  syncState: SyncState;
  lastSyncAt: Date | null;
  error: string | null;
  updateOrderFinance: (
    orderId: string,
    data: Partial<Order> & {
      pembayaranList?: CustomerPayment[];
      vendorPrices?: { pendek: number; panjang: number; tanpaLengan: number };
    }
  ) => Promise<boolean>;
  addKas: (data: Omit<CashTransaction, 'id'>) => Promise<string>;
  deleteKas: (id: string) => Promise<void>;
}

export function useFirebaseFinance(
  initialOrders: Order[] = initialOrdersData,
  initialTransactions: CashTransaction[] = initialCashTransactions
): UseFirebaseFinanceResult {
  const [orders, setOrders] = useState<Order[]>(
    initialOrders.length > 0 ? initialOrders : initialOrdersData
  );
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(
    initialTransactions.length > 0 ? initialTransactions : initialCashTransactions
  );
  const [vendors, setVendors] = useState<VendorInfo[]>([]);
  const [syncState, setSyncState] = useState<SyncState>('connecting');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Simpan raw orders dan vendors map untuk sinkronisasi reaktif
  const vendorsMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    let unsubscribeKas: (() => void) | undefined;
    let unsubscribeVendors: (() => void) | undefined;

    try {
      // 1. Realtime Listener Koleksi 'vendors'
      const vendorsRef = collection(db, 'vendors');
      unsubscribeVendors = onSnapshot(
        vendorsRef,
        (snapshot) => {
          const map = new Map<string, string>();
          const list: VendorInfo[] = [];
          snapshot.docs.forEach((d) => {
            const vData = d.data();
            map.set(d.id, vData.nama || 'Vendor');
            list.push({ id: d.id, nama: vData.nama || 'Vendor', pic: vData.pic || '-' });
          });
          vendorsMapRef.current = map;
          setVendors(list);
        },
        (err) => {
          console.warn('[Firebase] Listener vendors fallback:', err.message);
        }
      );

      // 2. Realtime Listener Koleksi 'orders' (SEMUA DATA, TANPA LIMIT)
      const ordersRef = collection(db, 'orders');

      unsubscribeOrders = onSnapshot(
        ordersRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const mappedOrders: Order[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();

              // Hitung metrik komprehensif menggunakan rumus baku VisualKain
              const totals = calculateOrderTotals(d);

              const totalInv = totals.jumlahSemua;
              const totalHpp = totals.totalHpp;

              // DP Vendor: prioritaskan totalDibayarKeVendor / dpNominalPO yang tersimpan, fallback persentase
              const dpVendor =
                d.totalDibayarKeVendor !== undefined
                  ? Number(d.totalDibayarKeVendor)
                  : d.dpNominalPO && Number(d.dpNominalPO) > 0
                  ? Number(d.dpNominalPO)
                  : Math.round(totalHpp * (Number(d.dpPersenPO || 0) / 100));

              // Ekstrak riwayat pembayaran konsumen
              const payments: CustomerPayment[] = [];
              let hasModernPaymentRecord = false;

              // Cek riwayat pembayaran bertahap modern (riwayatPembayaran)
              if (Array.isArray(d.riwayatPembayaran)) {
                hasModernPaymentRecord = true;
                d.riwayatPembayaran.forEach((p: any, idx: number) => {
                  const nominal = Number(p.jumlah || p.nominal || 0);
                  const catatan = String(p.catatan || '').toLowerCase();
                  // Saring pinjaman internal non-konsumen agar rincian pembayaran bersih
                  if (nominal > 0 && !catatan.includes('pinjaman')) {
                    payments.push({
                      id: `${docSnap.id}-p-${idx}`,
                      orderId: docSnap.id,
                      noInv: d.noInv || 'INV',
                      tanggal: p.tanggal || d.tanggalInv || '2026-10-01',
                      nominal,
                      jenis: (p.jenis as any) || (idx === 0 ? 'dp' : 'termin'),
                      keterangan: p.catatan || (idx === 0 ? 'DP Pembayaran' : 'Pembayaran Termin'),
                      createdAt: new Date().toISOString(),
                    });
                  }
                });
              } else if (Array.isArray(d.pembayaranList)) {
                hasModernPaymentRecord = true;
                d.pembayaranList.forEach((p: any, idx: number) => {
                  const nominal = Number(p.nominal || p.jumlah || 0);
                  if (nominal > 0) {
                    payments.push({
                      id: p.id || `${docSnap.id}-p-${idx}`,
                      orderId: docSnap.id,
                      noInv: d.noInv || 'INV',
                      tanggal: p.tanggal || d.tanggalInv || '2026-10-01',
                      nominal,
                      jenis: (p.jenis as any) || (idx === 0 ? 'dp' : 'termin'),
                      keterangan: p.keterangan || p.catatan || 'Pembayaran Termin',
                      createdAt: p.createdAt || new Date().toISOString(),
                    });
                  }
                });
              }

              // Fallback field dp1, dp2, pelunasan HANYA jika dokumen belum memiliki riwayat pembayaran modern
              if (!hasModernPaymentRecord) {
                const dp1 = Number(d.dp1Nominal || 0);
                const dp2 = Number(d.dp2Nominal || 0);
                const pelunasan = Number(d.pelunasanNominal || 0);
                const legacyDp = Number(d.dpNominal || totals.nominalDP || 0);

                if (dp1 > 0) {
                  payments.push({
                    id: `${docSnap.id}-dp1`,
                    orderId: docSnap.id,
                    noInv: d.noInv || 'INV',
                    tanggal: d.dp1Tanggal || d.tanggalInv || '2026-10-07',
                    nominal: dp1,
                    jenis: 'dp',
                    keterangan: d.dp1Notes || 'DP 1 Transfer',
                    createdAt: new Date().toISOString(),
                  });
                }

                if (dp2 > 0) {
                  payments.push({
                    id: `${docSnap.id}-dp2`,
                    orderId: docSnap.id,
                    noInv: d.noInv || 'INV',
                    tanggal: d.dp2Tanggal || d.tanggalInv || '2026-10-07',
                    nominal: dp2,
                    jenis: 'termin',
                    keterangan: d.dp2Notes || 'DP 2 (70% Produksi)',
                    createdAt: new Date().toISOString(),
                  });
                }

                if (pelunasan > 0) {
                  payments.push({
                    id: `${docSnap.id}-pelunasan`,
                    orderId: docSnap.id,
                    noInv: d.noInv || 'INV',
                    tanggal: d.pelunasanTanggal || d.tanggalInv || '2026-10-07',
                    nominal: pelunasan,
                    jenis: 'pelunasan',
                    keterangan: 'Pelunasan Penuh',
                    createdAt: new Date().toISOString(),
                  });
                }

                if (payments.length === 0 && legacyDp > 0) {
                  payments.push({
                    id: `${docSnap.id}-dp-legacy`,
                    orderId: docSnap.id,
                    noInv: d.noInv || 'INV',
                    tanggal: d.tanggalInv || '2026-10-07',
                    nominal: legacyDp,
                    jenis: 'dp',
                    keterangan: 'DP Terkunci',
                    createdAt: new Date().toISOString(),
                  });
                }
              }

              // DP Customer terverifikasi (SSOT VisualKainDB: prioritaskan riwayat pembayaran bertahap jika ada)
              const sumPayments = payments.reduce((acc, p) => acc + p.nominal, 0);
              const lockedDpCustomer = hasModernPaymentRecord
                ? sumPayments
                : (d.dpNominal !== undefined && Number(d.dpNominal) >= 0
                    ? Number(d.dpNominal)
                    : (sumPayments > 0 ? sumPayments : totals.nominalDP));
              const isOrderCompleted = (d.status === 'completed' || d.statusOrder === 'SELESAI' || d.statusPembayaran === 'lunas') && lockedDpCustomer >= totalInv;
              const totalMasuk = isOrderCompleted ? totalInv : lockedDpCustomer;

              const resolvedVendorName =
                (d.vendorId && vendorsMapRef.current.get(d.vendorId)) ||
                d.vendorName ||
                (d.vendorId ? 'Vendor Mitra' : 'Tanpa Vendor');

              const tanggalInv = d.tanggalInv || d.tanggalOrder || '2026-10-01';

              return {
                ...d,
                rawOrder: d,
                id: docSnap.id,
                noInv: d.noInv || `INV-${docSnap.id.slice(0, 6)}`,
                customerName: d.namaCustomer || d.customerName || 'Customer',
                projectName: d.namaProject || d.projectName || '-',
                noWaCustomer: d.noWaCustomer || '',
                tanggalOrder: tanggalInv,
                grossTotal: totals.grossTotal,
                totalInvoice: totalInv,
                totalHpp: totalHpp,
                targetMargin: totals.profit,
                totalQty: totals.totalPesanan,
                biayaOperasional: Number(d.biayaOperasional || 0),
                biayaTambahanVendor: Number(d.biayaTambahanVendor || d.biayaLainnya || 0),
                biayaTambahanCustomer: Number(d.biayaTambahanCustomer || d.biayaTambahanCust || 0),
                diskon: totals.diskon,
                kategoriOrder: (d.kategoriOrder || '').trim(),
                hargaVendorPendek: Number(d.hargaVendorPendek || 0),
                hargaVendorPanjang: Number(d.hargaVendorPanjang || 0),
                hargaVendorTanpaLengan: Number(d.hargaVendorTanpaLengan || 0),
                hppAktual: d.hppAktual !== undefined ? Number(d.hppAktual) : totalHpp,
                profitAktual: d.profitAktual !== undefined && d.profitAktual !== null ? Number(d.profitAktual) : totals.profit,
                catatanFinance: d.catatanFinance || '',
                vendorId: d.vendorId || '',
                vendorName: resolvedVendorName,
                pembayaranList: payments,
                dpNominal: lockedDpCustomer,
                dpNominalPO: dpVendor,
                totalUangMasukCustomer: totalMasuk,
                statusPembayaran: totalMasuk >= totalInv && totalInv > 0 ? 'lunas' : totalMasuk > 0 ? 'parsial' : 'belum_bayar',
                totalDibayarKeVendor: dpVendor,
                statusPembayaranVendor: dpVendor >= totalHpp && totalHpp > 0 ? 'lunas_vendor' : dpVendor > 0 ? 'dp_vendor' : 'belum_bayar',
                statusOrder: d.status || d.statusOrder || 'production',
              };
            });

            // Urutkan order berdasarkan tanggal terbaru
            mappedOrders.sort((a, b) => b.tanggalOrder.localeCompare(a.tanggalOrder));

            setOrders(mappedOrders);
            setSyncState('live');
            setLastSyncAt(new Date());
          } else {
            setSyncState('fallback');
          }
        },
        (err) => {
          console.warn('[Firebase] Listener orders fallback to local seed:', err.message);
          setError(err.message);
          setSyncState('fallback');
        }
      );

      // 3. Realtime Listener Koleksi 'kas' (Bukan 'kasEntries')
      const kasRef = collection(db, 'kas');
      unsubscribeKas = onSnapshot(
        kasRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const mappedKas: CashTransaction[] = snapshot.docs.map((dSnap) => {
              const kd = dSnap.data();
              return {
                id: dSnap.id,
                tanggal: kd.tanggal || new Date().toISOString().slice(0, 10),
                tipe: kd.jenis === 'masuk' ? 'masuk' : 'keluar',
                nominal: Number(kd.jumlah || kd.nominal || 0),
                kategori: (kd.kategori || 'Biaya Lain') as CashOutflowCategory,
                keterangan: kd.keterangan || '-',
              };
            });

            // Urutkan transaksi kas terbaru ke terlama
            mappedKas.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
            setCashTransactions(mappedKas);
          }
        },
        (err) => {
          console.warn('[Firebase] Listener kas fallback:', err.message);
        }
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Koneksi Firestore gagal';
      console.warn('[Firebase] Initialization error:', msg);
      setError(msg);
      setSyncState('fallback');
    }

    return () => {
      unsubscribeOrders?.();
      unsubscribeKas?.();
      unsubscribeVendors?.();
    };
  }, []);

  // Mutasi pembaruan ke Firestore & Local State
  const updateOrderFinance = useCallback(
    async (
      orderId: string,
      data: Partial<Order> & {
        pembayaranList?: CustomerPayment[];
        vendorPrices?: { pendek: number; panjang: number; tanpaLengan: number };
      }
    ): Promise<boolean> => {
      const firestorePayload: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      if (data.totalDibayarKeVendor !== undefined) {
        firestorePayload.dpNominalPO = Number(data.totalDibayarKeVendor);
      }
      if (data.diskon !== undefined) {
        firestorePayload.diskonHarga = Number(data.diskon);
      }

      if (data.pembayaranList !== undefined && Array.isArray(data.pembayaranList)) {
        const riwayatPembayaranFirestore = data.pembayaranList.map((p) => ({
          jumlah: Number(p.nominal),
          nominal: Number(p.nominal),
          tanggal: p.tanggal,
          catatan: p.keterangan || (p.jenis === 'dp' ? 'DP Pembayaran' : 'Pembayaran Termin'),
          jenis: p.jenis,
        }));
        firestorePayload.riwayatPembayaran = riwayatPembayaranFirestore;
        const totalMasuk = data.pembayaranList.reduce((acc, p) => acc + Number(p.nominal), 0);
        firestorePayload.dpNominal = totalMasuk;
        firestorePayload.totalUangMasukCustomer = totalMasuk;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...data } : o))
      );

      try {
        const orderDocRef = doc(db, 'orders', orderId);
        await updateDoc(orderDocRef, firestorePayload);
        return true;
      } catch (err: unknown) {
        console.warn('[Firestore] Update failed, keeping local fallback:', err);
        return true;
      }
    },
    []
  );

  const addKas = useCallback(async (data: Omit<CashTransaction, 'id'>): Promise<string> => {
    try {
      const ref = await addDoc(collection(db, 'kas'), {
        tanggal: data.tanggal,
        jenis: data.tipe,
        kategori: data.kategori,
        keterangan: data.keterangan,
        jumlah: data.nominal,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    } catch (err: unknown) {
      console.error('[Firestore] addKas failed:', err);
      throw err;
    }
  }, []);

  const deleteKas = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'kas', id));
    } catch (err: unknown) {
      console.error('[Firestore] deleteKas failed:', err);
      throw err;
    }
  }, []);

  return {
    orders,
    cashTransactions,
    vendors,
    syncState,
    lastSyncAt,
    error,
    updateOrderFinance,
    addKas,
    deleteKas,
  };
}

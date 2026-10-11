'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateOrderTotals } from '@/lib/calculations';
import type { Order, CashTransaction, CustomerPayment, CashOutflowCategory } from '@/types';

export type SyncState = 'connecting' | 'live' | 'fallback' | 'error';

interface VendorInfo {
  id: string;
  nama: string;
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
    data: { hppAktual?: number | null; profitAktual?: number | null; catatanFinance?: string }
  ) => Promise<boolean>;
}

export function useFirebaseFinance(
  initialOrders: Order[],
  initialTransactions: CashTransaction[]
): UseFirebaseFinanceResult {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(initialTransactions);
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
            list.push({ id: d.id, nama: vData.nama || 'Vendor' });
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

              // DP Vendor: prioritaskan dpNominalPO yang tersimpan, fallback persentase
              const dpVendor = d.dpNominalPO && Number(d.dpNominalPO) > 0
                ? Number(d.dpNominalPO)
                : Math.round(totalHpp * (Number(d.dpPersenPO || 0) / 100));

              // Ekstrak riwayat pembayaran konsumen
              const payments: CustomerPayment[] = [];

              // Cek riwayat pembayaran bertahap modern (riwayatPembayaran)
              if (Array.isArray(d.riwayatPembayaran) && d.riwayatPembayaran.length > 0) {
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
                      jenis: idx === 0 ? 'dp' : 'termin',
                      keterangan: p.catatan || (idx === 0 ? 'DP Pembayaran' : 'Pembayaran Termin'),
                      createdAt: new Date().toISOString(),
                    });
                  }
                });
              } else {
                // Fallback field dp1, dp2, pelunasan
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

              // DP Customer terverifikasi (SSOT VisualKainDB)
              const lockedDpCustomer = d.dpNominal && Number(d.dpNominal) > 0
                ? Number(d.dpNominal)
                : totals.nominalDP;
              const isOrderCompleted = d.status === 'completed' || d.statusOrder === 'SELESAI' || d.statusPembayaran === 'lunas';
              const totalMasuk = isOrderCompleted ? totalInv : lockedDpCustomer;

              const resolvedVendorName =
                (d.vendorId && vendorsMapRef.current.get(d.vendorId)) ||
                d.vendorName ||
                (d.vendorId ? 'Vendor Mitra' : 'Tanpa Vendor');

              const tanggalInv = d.tanggalInv || d.tanggalOrder || '2026-10-01';

              return {
                id: docSnap.id,
                noInv: d.noInv || `INV-${docSnap.id.slice(0, 6)}`,
                customerName: d.namaCustomer || d.customerName || 'Customer',
                projectName: d.namaProject || d.projectName || '-',
                noWaCustomer: d.noWaCustomer || '',
                tanggalOrder: tanggalInv,
                totalInvoice: totalInv,
                totalHpp: totalHpp,
                targetMargin: Math.max(0, totalInv - totalHpp),
                totalQty: totals.totalPesanan,
                biayaOperasional: Number(d.biayaOperasional || 0),
                biayaTambahanVendor: Number(d.biayaTambahanVendor || d.biayaLainnya || 0),
                biayaTambahanCustomer: Number(d.biayaTambahanCustomer || d.biayaTambahanCust || 0),
                diskon: totals.diskon,
                hppAktual: d.hppAktual !== undefined ? Number(d.hppAktual) : totalHpp,
                profitAktual: d.profitAktual !== undefined && d.profitAktual !== null ? Number(d.profitAktual) : totals.profit,
                catatanFinance: d.catatanFinance || '',
                vendorId: d.vendorId || '',
                vendorName: resolvedVendorName,
                pembayaranList: payments,
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
      data: Partial<Order>
    ): Promise<boolean> => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...data } : o))
      );

      try {
        const orderDocRef = doc(db, 'orders', orderId);
        await updateDoc(orderDocRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err: unknown) {
        console.warn('[Firestore] Update failed, keeping local fallback:', err);
        return true;
      }
    },
    []
  );

  return {
    orders,
    cashTransactions,
    vendors,
    syncState,
    lastSyncAt,
    error,
    updateOrderFinance,
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, CashTransaction, CustomerPayment, CashOutflowCategory } from '@/types';
import { toast } from 'sonner';

export type SyncState = 'connecting' | 'live' | 'fallback' | 'error';

interface UseFirebaseFinanceResult {
  orders: Order[];
  cashTransactions: CashTransaction[];
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
  const [syncState, setSyncState] = useState<SyncState>('connecting');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    let unsubscribeKas: (() => void) | undefined;

    try {
      // 1. Realtime Listener Koleksi 'orders'
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, limit(100));

      unsubscribeOrders = onSnapshot(
        ordersQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const mappedOrders: Order[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();

              // Ekstrak riwayat pembayaran konsumen
              const payments: CustomerPayment[] = [];
              const dp1 = Number(d.dp1Nominal || 0);
              const dp2 = Number(d.dp2Nominal || 0);
              const pelunasan = Number(d.pelunasanNominal || 0);
              const legacyDp = Number(d.dpNominal || 0);

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

              // Fallback jika hanya ada legacy dpNominal
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

              const totalMasuk =
                payments.length > 0
                  ? payments.reduce((sum, p) => sum + p.nominal, 0)
                  : legacyDp;

              const totalInv = Number(d.jumlahSemua || d.totalInvoice || d.revenue || 0);
              const totalHpp = Number(d.totalBiayaVendor || d.hpp || d.totalHpp || 0);
              const dpVendor = Number(d.dpNominalPO || d.dpVendor || 0);

              return {
                id: docSnap.id,
                noInv: d.noInv || `INV-${docSnap.id.slice(0, 6)}`,
                customerName: d.namaCustomer || d.customerName || 'Customer',
                projectName: d.namaProject || d.projectName || '-',
                noWaCustomer: d.noWaCustomer || '',
                tanggalOrder: d.tanggalInv || d.tanggalOrder || '2026-10-01',
                totalInvoice: totalInv,
                totalHpp: totalHpp,
                targetMargin: Math.max(0, totalInv - totalHpp),
                totalQty: Number(d.totalPesanan || d.totalQty || 1),
                biayaOperasional: Number(d.biayaOperasional || 0),
                biayaTambahanVendor: Number(d.biayaTambahanVendor || 0),
                biayaTambahanCustomer: Number(d.biayaTambahanCustomer || 0),
                diskon: Number(d.diskon || d.diskonHarga || 0),
                hppAktual: d.hppAktual !== undefined ? Number(d.hppAktual) : totalHpp,
                profitAktual: d.profitAktual !== undefined ? Number(d.profitAktual) : Math.max(0, totalInv - totalHpp),
                catatanFinance: d.catatanFinance || '',
                pembayaranList: payments,
                totalUangMasukCustomer: totalMasuk,
                statusPembayaran: totalMasuk >= totalInv && totalInv > 0 ? 'lunas' : totalMasuk > 0 ? 'parsial' : 'belum_bayar',
                totalDibayarKeVendor: dpVendor,
                statusPembayaranVendor: dpVendor >= totalHpp && totalHpp > 0 ? 'lunas_vendor' : dpVendor > 0 ? 'dp_vendor' : 'belum_bayar',
                statusOrder: d.statusOrder || d.statusProduksi || d.status || (totalMasuk >= totalInv ? 'SELESAI' : totalMasuk >= 0.7 * totalInv ? 'PRODUKSI' : 'PEMBAYARAN'),
              };
            });

            setOrders(mappedOrders);
            setSyncState('live');
            setLastSyncAt(new Date());
          } else {
            // Snapshot kosong, gunakan dataset acuan
            setSyncState('fallback');
          }
        },
        (err) => {
          console.warn('[Firebase] Listener orders fallback to local seed:', err.message);
          setError(err.message);
          setSyncState('fallback');
        }
      );

      // 2. Realtime Listener Koleksi 'kasEntries'
      const kasRef = collection(db, 'kasEntries');
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
            setCashTransactions(mappedKas);
          }
        },
        (err) => {
          console.warn('[Firebase] Listener kasEntries fallback to local seed:', err.message);
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
    };
  }, []);

  // Mutasi pembaruan ke Firestore & Local State
  const updateOrderFinance = useCallback(
    async (
      orderId: string,
      data: Partial<Order>
    ): Promise<boolean> => {
      // 1. Optimistic local state update
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
    syncState,
    lastSyncAt,
    error,
    updateOrderFinance,
  };
}

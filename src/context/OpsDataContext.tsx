'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { timestampToDate } from '@/lib/legacy/formatters';
import { normalizeOrderStatus, type KategoriDoc, type LegacyOrder, type SizeChart, type VendorDoc } from '@/lib/legacy/types';

type LoadState = 'loading' | 'ready' | 'error';

interface OpsDataValue {
  orders: LegacyOrder[];
  sizeCharts: SizeChart[];
  kategoriList: KategoriDoc[];
  vendors: VendorDoc[];
  ordersState: LoadState;
  sizeChartsState: LoadState;
  vendorsState: LoadState;
  kategoriState: LoadState;
  error: string | null;
  retry: () => void;
  getOrderById: (id: string) => LegacyOrder | undefined;
  getVendorName: (id: string | undefined) => string;
  getSizeChart: (id: string | undefined) => SizeChart | undefined;
}

const OpsDataContext = createContext<OpsDataValue | undefined>(undefined);

function createdAtMillis(order: LegacyOrder): number {
  return timestampToDate(order.createdAt)?.getTime() ?? -1;
}

/** Terbaru dulu; dokumen lama tanpa createdAt tetap tampil di akhir (legacy membuangnya lewat orderBy). */
export function sortOrdersNewestFirst(orders: LegacyOrder[]): LegacyOrder[] {
  return [...orders].sort((a, b) => createdAtMillis(b) - createdAtMillis(a));
}

export function OpsDataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<LegacyOrder[]>([]);
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriDoc[]>([]);
  const [vendors, setVendors] = useState<VendorDoc[]>([]);
  const [ordersState, setOrdersState] = useState<LoadState>('loading');
  const [sizeChartsState, setSizeChartsState] = useState<LoadState>('loading');
  const [vendorsState, setVendorsState] = useState<LoadState>('loading');
  const [kategoriState, setKategoriState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setOrdersState('loading');
    setSizeChartsState('loading');
    setVendorsState('loading');
    setKategoriState('loading');
    setError(null);

    const fail = (label: string) => (err: Error) => {
      console.warn(`[Firebase] Listener ${label} gagal:`, err.message);
      setError(err.message);
    };

    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            noInv: String(data.noInv || ''),
            namaCustomer: String(data.namaCustomer || ''),
            status: normalizeOrderStatus(data.status),
          } as LegacyOrder;
        });
        setOrders(sortOrdersNewestFirst(list));
        setOrdersState('ready');
      },
      (err) => {
        fail('orders')(err);
        setOrdersState('error');
      }
    );

    const unsubSizeCharts = onSnapshot(
      collection(db, 'sizecharts'),
      (snap) => {
        const list = snap.docs
          .map((d) => {
            const data = d.data();
            return { id: d.id, nama: String(data.nama || ''), sizes: data.sizes || {}, createdAt: data.createdAt } as SizeChart;
          })
          .sort((a, b) => a.nama.localeCompare(b.nama));
        setSizeCharts(list);
        setSizeChartsState('ready');
      },
      (err) => {
        fail('sizecharts')(err);
        setSizeChartsState('error');
      }
    );

    const unsubKategori = onSnapshot(
      collection(db, 'cp_kategori'),
      (snap) => {
        setKategoriList(
          snap.docs
            .map((d) => ({ id: d.id, nama: String(d.data().nama || '') }))
            .filter((k) => k.nama)
            .sort((a, b) => a.nama.localeCompare(b.nama))
        );
        setKategoriState('ready');
      },
      (err) => {
        fail('cp_kategori')(err);
        setKategoriState('error');
      }
    );

    const unsubVendors = onSnapshot(
      collection(db, 'vendors'),
      (snap) => {
        setVendors(
          snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                nama: String(data.nama || ''),
                alamat: String(data.alamat || ''),
                wa: String(data.wa || ''),
                pic: String(data.pic || ''),
              };
            })
            .filter((v) => v.nama)
            .sort((a, b) => a.nama.localeCompare(b.nama))
        );
        setVendorsState('ready');
      },
      (err) => {
        fail('vendors')(err);
        setVendorsState('error');
      }
    );

    return () => {
      unsubOrders();
      unsubSizeCharts();
      unsubKategori();
      unsubVendors();
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const value = useMemo<OpsDataValue>(() => {
    const orderMap = new Map(orders.map((o) => [o.id, o]));
    const vendorMap = new Map(vendors.map((v) => [v.id, v.nama]));
    const chartMap = new Map(sizeCharts.map((c) => [c.id, c]));
    return {
      orders,
      sizeCharts,
      kategoriList,
      vendors,
      ordersState,
      sizeChartsState,
      vendorsState,
      kategoriState,
      error,
      retry,
      getOrderById: (id) => orderMap.get(id),
      getVendorName: (id) => (id ? vendorMap.get(id) || '-' : '-'),
      getSizeChart: (id) => (id ? chartMap.get(id) : undefined),
    };
  }, [orders, sizeCharts, kategoriList, vendors, ordersState, sizeChartsState, vendorsState, kategoriState, error, retry]);

  return <OpsDataContext.Provider value={value}>{children}</OpsDataContext.Provider>;
}

interface OpsFixtureData {
  orders: LegacyOrder[];
  sizeCharts: SizeChart[];
  kategoriList: KategoriDoc[];
  vendors: VendorDoc[];
}

/** Provider berisi data statis untuk halaman pratinjau dev; tidak membuka listener Firestore. */
export function OpsDataFixtureProvider({ data, children }: { data: OpsFixtureData; children: React.ReactNode }) {
  const value = useMemo<OpsDataValue>(() => {
    const orders = sortOrdersNewestFirst(data.orders);
    const orderMap = new Map(orders.map((o) => [o.id, o]));
    const vendorMap = new Map(data.vendors.map((v) => [v.id, v.nama]));
    const chartMap = new Map(data.sizeCharts.map((c) => [c.id, c]));
    return {
      ...data,
      orders,
      ordersState: 'ready',
      sizeChartsState: 'ready',
      vendorsState: 'ready',
      kategoriState: 'ready',
      error: null,
      retry: () => undefined,
      getOrderById: (id) => orderMap.get(id),
      getVendorName: (id) => (id ? vendorMap.get(id) || '-' : '-'),
      getSizeChart: (id) => (id ? chartMap.get(id) : undefined),
    };
  }, [data]);
  return <OpsDataContext.Provider value={value}>{children}</OpsDataContext.Provider>;
}

export function useOpsData(): OpsDataValue {
  const ctx = useContext(OpsDataContext);
  if (!ctx) throw new Error('useOpsData must be used within OpsDataProvider');
  return ctx;
}

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
import { isFromFinanceStartDate, normalizeKategoriKasMasuk, todayInJakarta } from '@/lib/constants';
import { toPersistedLabel } from '@/lib/payment-ledger';
import { validateVendorName } from '@/lib/vendor-ref';
import { INVESTOR_COLLECTION, investorJenisFromKategori, mapInvestorDoc } from '@/lib/investor-ledger';
import type { Order, CashTransaction, CustomerPayment } from '@/types';

export type SyncState = 'connecting' | 'live' | 'error';

export type FinanceWriteOperation = 'updateOrder' | 'addKas' | 'updateKas' | 'deleteKas' | 'addVendor' | 'renameVendor';

/** Dilempar saat penulisan Firestore gagal; state lokal sudah dikembalikan ke nilai sebelum mutasi. */
export class FinanceWriteError extends Error {
  readonly operation: FinanceWriteOperation;

  constructor(operation: FinanceWriteOperation, cause: unknown) {
    super(cause instanceof Error ? cause.message : 'Penulisan Firestore gagal');
    this.name = 'FinanceWriteError';
    this.operation = operation;
    this.cause = cause;
  }
}

// Entri riwayat berlabel pinjaman bukan pembayaran customer: dikecualikan saat dibaca, tetapi wajib dipertahankan saat ditulis ulang.
function isPinjamanEntry(p: { catatan?: unknown } | null | undefined): boolean {
  return String(p?.catatan || '').toLowerCase().includes('pinjaman');
}

type ListenerName = 'orders' | 'kas' | 'investor' | 'vendors' | 'init';

function sortKasDesc(list: CashTransaction[]): CashTransaction[] {
  return [...list].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

export interface VendorInfo {
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
  retry: () => void;
  kasReady: boolean;
  updateOrderFinance: (
    orderId: string,
    data: Partial<Order> & {
      pembayaranList?: CustomerPayment[];
      vendorPrices?: { pendek: number; panjang: number; tanpaLengan: number };
    }
  ) => Promise<void>;
  addKas: (data: Omit<CashTransaction, 'id'>) => Promise<string>;
  updateKas: (id: string, data: Partial<Omit<CashTransaction, 'id'>>) => Promise<void>;
  deleteKas: (id: string) => Promise<void>;
  addVendor: (nama: string) => Promise<VendorInfo>;
  renameVendor: (id: string, nama: string) => Promise<void>;
}

export function useFirebaseFinance(): UseFirebaseFinanceResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [subscriptionKey, setSubscriptionKey] = useState<number>(0);
  const [kasLoaded, setKasLoaded] = useState<boolean>(false);
  const [investorLoaded, setInvestorLoaded] = useState<boolean>(false);
  // Daftar kas gabungan dari `kas` dan `finance_investor`; baru siap setelah keduanya memberi snapshot pertama.
  const kasReady = kasLoaded && investorLoaded;
  const [vendors, setVendors] = useState<VendorInfo[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState<boolean>(false);
  const [listenerErrors, setListenerErrors] = useState<Partial<Record<ListenerName, string>>>({});
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  // Status gabungan: satu listener gagal cukup untuk menandai error, supaya angka kas yang tidak lengkap tidak tampil sebagai live.
  const errorMessages = Object.values(listenerErrors);
  const syncState: SyncState = errorMessages.length > 0 ? 'error' : ordersLoaded ? 'live' : 'connecting';
  const error = errorMessages[0] ?? null;
  const markListenerOk = useCallback((name: ListenerName) => {
    setListenerErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);
  const markListenerError = useCallback((name: ListenerName, message: string) => {
    setListenerErrors((prev) => ({ ...prev, [name]: message }));
  }, []);

  const vendorsMapRef = useRef<Map<string, string>>(new Map());
  const ordersRef = useRef<Order[]>(orders);
  ordersRef.current = orders;
  const cashTransactionsRef = useRef<CashTransaction[]>(cashTransactions);
  cashTransactionsRef.current = cashTransactions;

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    let unsubscribeKas: (() => void) | undefined;
    let unsubscribeInvestor: (() => void) | undefined;
    let unsubscribeVendors: (() => void) | undefined;

    try {
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
          // Order hanya me-resolve nama vendor saat snapshot orders; rename vendor perlu dipantulkan ke order yang sudah dimuat.
          setOrders((prev) => {
            let changed = false;
            const next = prev.map((o) => {
              const nama = o.vendorId ? map.get(o.vendorId) : undefined;
              if (!nama || nama === o.vendorName) return o;
              changed = true;
              return { ...o, vendorName: nama };
            });
            return changed ? next : prev;
          });
          markListenerOk('vendors');
        },
        (err) => {
          console.warn('[Firebase] Listener vendors gagal:', err.message);
          markListenerError('vendors', err.message);
        }
      );

      const ordersRef = collection(db, 'orders');

      unsubscribeOrders = onSnapshot(
        ordersRef,
        (snapshot) => {
          const mappedOrders: Order[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            const totals = calculateOrderTotals(d);

            const totalInv = totals.jumlahSemua;
            const totalHpp = totals.totalHpp;

            // Prioritaskan nilai positif antara totalDibayarKeVendor dan dpNominalPO agar nilai 0 salah satu field tidak menimpa pembayaran vendor yang sah.
            const rawPaidVendor = Number(d.totalDibayarKeVendor || 0);
            const rawDpPo = Number(d.dpNominalPO || 0);
            const dpVendor = Array.isArray(d.vendorPembayaranList) && d.totalDibayarKeVendor !== undefined
              ? rawPaidVendor
              : rawPaidVendor > 0
              ? rawPaidVendor
              : rawDpPo > 0
              ? rawDpPo
              : d.totalDibayarKeVendor !== undefined
              ? rawPaidVendor
              : Math.round(totalHpp * (Number(d.dpPersenPO || 0) / 100));

            const payments: CustomerPayment[] = [];
            let hasModernPaymentRecord = false;

            const validPembayaranList = Array.isArray(d.pembayaranList)
              ? d.pembayaranList.filter((p: any) => Number(p?.nominal || p?.jumlah || 0) > 0)
              : [];
            const validRiwayatList = Array.isArray(d.riwayatPembayaran)
              ? d.riwayatPembayaran.filter((p: any) => {
                  const nom = Number(p?.jumlah || p?.nominal || 0);
                  return nom > 0 && !isPinjamanEntry(p);
                })
              : [];

            // Gunakan array pembayaran yang memiliki entri bernominal > 0 agar riwayatPembayaran: [] tidak mengabaikan pembayaranList yang terisi.
            if (validPembayaranList.length > 0 && validPembayaranList.length >= validRiwayatList.length) {
              hasModernPaymentRecord = true;
              validPembayaranList.forEach((p: any, idx: number) => {
                const nominal = Number(p.nominal || p.jumlah || 0);
                payments.push({
                  id: p.id || `${docSnap.id}-p-${idx}`,
                  orderId: docSnap.id,
                  noInv: d.noInv || 'INV',
                  tanggal: p.tanggal || d.tanggalInv || '2026-10-01',
                  nominal,
                  jenis: (p.jenis as any) || (idx === 0 ? 'dp' : 'termin'),
                  terminKe: typeof p.terminKe === 'number' ? p.terminKe : undefined,
                  label: typeof p.label === 'string' ? p.label : undefined,
                  keterangan: p.keterangan || p.catatan || 'Pembayaran Termin',
                  createdAt: p.createdAt || new Date().toISOString(),
                });
              });
            } else if (validRiwayatList.length > 0) {
              hasModernPaymentRecord = true;
              validRiwayatList.forEach((p: any, idx: number) => {
                const nominal = Number(p.jumlah || p.nominal || 0);
                payments.push({
                  id: `${docSnap.id}-p-${idx}`,
                  orderId: docSnap.id,
                  noInv: d.noInv || 'INV',
                  tanggal: p.tanggal || d.tanggalInv || '2026-10-01',
                  nominal,
                  jenis: (p.jenis as any) || (idx === 0 ? 'dp' : 'termin'),
                  terminKe: typeof p.terminKe === 'number' ? p.terminKe : undefined,
                  label: typeof p.label === 'string' ? p.label : undefined,
                  keterangan: p.catatan || (idx === 0 ? 'DP Pembayaran' : 'Pembayaran Termin'),
                  createdAt: new Date().toISOString(),
                });
              });
            } else if (Array.isArray(d.riwayatPembayaran) || Array.isArray(d.pembayaranList)) {
              hasModernPaymentRecord = true;
            }

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

            const sumPayments = payments.reduce((acc, p) => acc + p.nominal, 0);
            const fallbackPaidCust = Number(d.totalUangMasukCustomer || d.dpNominal || 0);
            const lockedDpCustomer = hasModernPaymentRecord
              ? (sumPayments > 0 ? sumPayments : fallbackPaidCust)
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

          // Saring hanya pesanan mulai 1 Oktober 2026 ke atas sesuai kesepakatan pembukuan klien.
          const filteredByCutoff = mappedOrders
            .filter((o) => isFromFinanceStartDate(o.tanggalOrder))
            .sort((a, b) => b.tanggalOrder.localeCompare(a.tanggalOrder));

          setOrders(filteredByCutoff);
          setOrdersLoaded(true);
          markListenerOk('orders');
          setLastSyncAt(new Date());
        },
        (err) => {
          console.warn('[Firebase] Listener orders gagal:', err.message);
          markListenerError('orders', err.message);
        }
      );

      const kasRef = collection(db, 'kas');
      unsubscribeKas = onSnapshot(
        kasRef,
        (snapshot) => {
          const mappedKas: CashTransaction[] = snapshot.docs.map((dSnap) => {
            const kd = dSnap.data();
            const tipe = kd.jenis === 'masuk' ? 'masuk' : 'keluar';
            const tx: CashTransaction = {
              id: dSnap.id,
              tanggal: kd.tanggal || todayInJakarta(),
              tipe,
              nominal: Number(kd.jumlah || kd.nominal || 0),
              kategori: (tipe === 'masuk' ? normalizeKategoriKasMasuk(kd.kategori) : kd.kategori || 'Biaya Lain') as CashTransaction['kategori'],
              keterangan: kd.keterangan || '-',
            };
            if (typeof kd.investorNama === 'string' && kd.investorNama.trim()) tx.investorNama = kd.investorNama.trim();
            if (typeof kd.jatuhTempo === 'string' && kd.jatuhTempo) tx.jatuhTempo = kd.jatuhTempo;
            return tx;
          });

          // Saring hanya transaksi kas mulai 1 Oktober 2026 ke atas.
          const filteredKasByCutoff = mappedKas
            .filter((t) => isFromFinanceStartDate(t.tanggal))
            .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
          setCashTransactions((prev) => sortKasDesc([...prev.filter((t) => t.koleksi === 'investor'), ...filteredKasByCutoff]));
          setKasLoaded(true);
          markListenerOk('kas');
        },
        (err) => {
          console.warn('[Firebase] Listener kas gagal:', err.message);
          markListenerError('kas', err.message);
        }
      );

      unsubscribeInvestor = onSnapshot(
        collection(db, INVESTOR_COLLECTION),
        (snapshot) => {
          const investorTxs = snapshot.docs
            .map((dSnap) => mapInvestorDoc(dSnap.id, dSnap.data(), todayInJakarta()))
            .filter((t) => isFromFinanceStartDate(t.tanggal));
          setCashTransactions((prev) => sortKasDesc([...prev.filter((t) => t.koleksi !== 'investor'), ...investorTxs]));
          setInvestorLoaded(true);
          markListenerOk('investor');
        },
        (err) => {
          console.warn('[Firebase] Listener investor gagal:', err.message);
          markListenerError('investor', err.message);
        }
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Koneksi Firestore gagal';
      console.warn('[Firebase] Initialization error:', msg);
      markListenerError('init', msg);
    }

    return () => {
      unsubscribeOrders?.();
      unsubscribeKas?.();
      unsubscribeInvestor?.();
      unsubscribeVendors?.();
    };
  }, [subscriptionKey, markListenerOk, markListenerError]);

  const retry = useCallback(() => {
    setListenerErrors({});
    setOrdersLoaded(false);
    setKasLoaded(false);
    setInvestorLoaded(false);
    setSubscriptionKey((k) => k + 1);
  }, []);

  // Mutasi pembaruan ke Firestore & Local State
  const updateOrderFinance = useCallback(
    async (
      orderId: string,
      data: Partial<Order> & {
        pembayaranList?: CustomerPayment[];
        vendorPrices?: { pendek: number; panjang: number; tanpaLengan: number };
      }
    ): Promise<void> => {
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
        const sanitizedCustomerList = data.pembayaranList.map((p, idx) => ({
          id: p.id || `${orderId}-p-${idx}`,
          orderId: p.orderId || orderId,
          noInv: p.noInv || 'INV',
          tanggal: p.tanggal,
          nominal: Number(p.nominal),
          jenis: p.jenis || (idx === 0 ? 'dp' : 'termin'),
          terminKe: typeof p.terminKe === 'number' ? p.terminKe : idx + 1,
          label: toPersistedLabel(p.label),
          keterangan: p.keterangan || (p.jenis === 'dp' ? 'DP Pembayaran' : 'Pembayaran Termin'),
          createdAt: p.createdAt || new Date().toISOString(),
        }));
        const riwayatPembayaranFirestore = sanitizedCustomerList.map((p) => ({
          id: p.id,
          jumlah: Number(p.nominal),
          nominal: Number(p.nominal),
          tanggal: p.tanggal,
          catatan: p.keterangan,
          keterangan: p.keterangan,
          jenis: p.jenis,
          terminKe: p.terminKe,
          label: p.label,
        }));
        const rawOrder = ordersRef.current.find((o) => o.id === orderId)?.rawOrder;
        // ID yang pernah atau sedang ada di pembayaranList adalah milik app ini; sisanya entri pinjaman dari luar yang harus dipertahankan.
        const appPaymentIds = new Set<string>([
          ...sanitizedCustomerList.map((p) => p.id),
          ...(Array.isArray(rawOrder?.pembayaranList) ? rawOrder.pembayaranList.map((p: { id?: string }) => p?.id) : []),
        ].filter(Boolean) as string[]);
        const preservedPinjaman = Array.isArray(rawOrder?.riwayatPembayaran)
          ? rawOrder.riwayatPembayaran.filter(
              (p: { id?: string; catatan?: unknown }) => isPinjamanEntry(p) && !(p.id && appPaymentIds.has(p.id))
            )
          : [];
        firestorePayload.pembayaranList = sanitizedCustomerList;
        firestorePayload.riwayatPembayaran = [...riwayatPembayaranFirestore, ...preservedPinjaman];
        const totalMasuk = sanitizedCustomerList.reduce((acc, p) => acc + Number(p.nominal), 0);
        firestorePayload.dpNominal = totalMasuk;
        firestorePayload.totalUangMasukCustomer = totalMasuk;
      }

      if (data.vendorPembayaranList !== undefined && Array.isArray(data.vendorPembayaranList)) {
        firestorePayload.vendorPembayaranList = data.vendorPembayaranList.map((vp, idx) => ({
          id: vp.id || `vp-${orderId}-${idx + 1}`,
          orderId: vp.orderId || orderId,
          vendorName: vp.vendorName || '-',
          tanggal: vp.tanggal,
          nominal: Number(vp.nominal),
          jenis: vp.jenis || (idx === 0 ? 'dp_vendor' : 'termin_vendor'),
          terminKe: typeof vp.terminKe === 'number' ? vp.terminKe : idx + 1,
          label: toPersistedLabel(vp.label),
          keterangan: vp.keterangan || vp.catatan || 'Transfer BCA',
          catatan: vp.catatan || vp.keterangan || 'Transfer BCA',
          createdAt: vp.createdAt || new Date().toISOString(),
        }));
      }

      const previous = ordersRef.current.find((o) => o.id === orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...data } : o))
      );

      try {
        await updateDoc(doc(db, 'orders', orderId), firestorePayload);
      } catch (err: unknown) {
        if (previous) {
          setOrders((prev) => prev.map((o) => (o.id === orderId ? previous : o)));
        }
        throw new FinanceWriteError('updateOrder', err);
      }
    },
    []
  );

  const addKas = useCallback(async (data: Omit<CashTransaction, 'id'>): Promise<string> => {
    let newId: string;
    const investorJenis = investorJenisFromKategori(data.kategori);
    try {
      // Transaksi investor masuk ke koleksi sendiri supaya tidak ikut terhitung di aplikasi operasional yang membaca `kas`.
      const ref = investorJenis
        ? await addDoc(collection(db, INVESTOR_COLLECTION), {
            tanggal: data.tanggal,
            jenis: investorJenis,
            nominal: data.nominal,
            keterangan: data.keterangan,
            investorNama: data.investorNama || '',
            ...(data.jatuhTempo ? { jatuhTempo: data.jatuhTempo } : {}),
            createdAt: serverTimestamp(),
          })
        : await addDoc(collection(db, 'kas'), {
            tanggal: data.tanggal,
            jenis: data.tipe,
            kategori: data.kategori,
            keterangan: data.keterangan,
            jumlah: data.nominal,
            nominal: data.nominal,
            createdAt: serverTimestamp(),
          });
      newId = ref.id;
    } catch (err: unknown) {
      throw new FinanceWriteError('addKas', err);
    }

    if (isFromFinanceStartDate(data.tanggal)) {
      const newTx: CashTransaction = {
        id: newId,
        tanggal: data.tanggal,
        tipe: data.tipe,
        nominal: data.nominal,
        kategori: data.kategori,
        keterangan: data.keterangan,
        ...(data.investorNama ? { investorNama: data.investorNama } : {}),
        ...(data.jatuhTempo ? { jatuhTempo: data.jatuhTempo } : {}),
        ...(investorJenis ? { koleksi: 'investor' as const } : {}),
      };
      setCashTransactions((prev) =>
        prev.some((t) => t.id === newId) ? prev : sortKasDesc([newTx, ...prev])
      );
    }
    return newId;
  }, []);

  const updateKas = useCallback(
    async (id: string, data: Partial<Omit<CashTransaction, 'id'>>): Promise<void> => {
      const previous = cashTransactionsRef.current.find((t) => t.id === id);
      setCashTransactions((prev) =>
        sortKasDesc(
          prev
            .map((t) => (t.id === id ? { ...t, ...data } : t))
            .filter((t) => isFromFinanceStartDate(t.tanggal))
        )
      );

      const isInvestorDoc = previous?.koleksi === 'investor';
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (data.tanggal !== undefined) payload.tanggal = data.tanggal;
      if (data.keterangan !== undefined) payload.keterangan = data.keterangan;
      if (data.nominal !== undefined) {
        payload.nominal = Number(data.nominal);
        if (!isInvestorDoc) payload.jumlah = Number(data.nominal);
      }
      if (isInvestorDoc) {
        // Jenis investor tidak boleh berpindah koleksi; hanya kategori investor lain yang diterima.
        const jenis = investorJenisFromKategori(data.kategori);
        if (jenis) payload.jenis = jenis;
        if (data.investorNama !== undefined) payload.investorNama = data.investorNama;
        if (data.jatuhTempo !== undefined) payload.jatuhTempo = data.jatuhTempo;
      } else {
        if (data.tipe !== undefined) payload.jenis = data.tipe;
        if (data.kategori !== undefined) payload.kategori = data.kategori;
      }

      try {
        await updateDoc(doc(db, isInvestorDoc ? INVESTOR_COLLECTION : 'kas', id), payload);
      } catch (err: unknown) {
        if (previous) {
          setCashTransactions((prev) =>
            sortKasDesc([...prev.filter((t) => t.id !== id), previous])
          );
        }
        throw new FinanceWriteError('updateKas', err);
      }
    },
    []
  );

  const deleteKas = useCallback(async (id: string): Promise<void> => {
    const previous = cashTransactionsRef.current.find((t) => t.id === id);
    setCashTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteDoc(doc(db, previous?.koleksi === 'investor' ? INVESTOR_COLLECTION : 'kas', id));
    } catch (err: unknown) {
      if (previous) {
        setCashTransactions((prev) =>
          prev.some((t) => t.id === id) ? prev : sortKasDesc([...prev, previous])
        );
      }
      throw new FinanceWriteError('deleteKas', err);
    }
  }, []);

  const vendorsRef = useRef<VendorInfo[]>(vendors);
  vendorsRef.current = vendors;

  // Koleksi `vendors` dipakai bersama aplikasi operasional, jadi nama wajib unik agar resolveVendorRef tidak ambigu.
  const addVendor = useCallback(async (nama: string): Promise<VendorInfo> => {
    const clean = nama.trim().replace(/\s+/g, ' ');
    const invalid = validateVendorName(clean, vendorsRef.current);
    if (invalid) throw new Error(invalid);
    try {
      const ref = await addDoc(collection(db, 'vendors'), { nama: clean, pic: '-', createdAt: serverTimestamp() });
      const created: VendorInfo = { id: ref.id, nama: clean, pic: '-' };
      vendorsMapRef.current.set(ref.id, clean);
      setVendors((prev) => (prev.some((v) => v.id === ref.id) ? prev : [...prev, created]));
      return created;
    } catch (err: unknown) {
      throw new FinanceWriteError('addVendor', err);
    }
  }, []);

  const renameVendor = useCallback(async (id: string, nama: string): Promise<void> => {
    const clean = nama.trim().replace(/\s+/g, ' ');
    const invalid = validateVendorName(clean, vendorsRef.current, id);
    if (invalid) throw new Error(invalid);
    const previous = vendorsRef.current.find((v) => v.id === id);
    const renameOrders = (nama: string) =>
      setOrders((prev) => prev.map((o) => (o.vendorId === id ? { ...o, vendorName: nama } : o)));
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, nama: clean } : v)));
    vendorsMapRef.current.set(id, clean);
    renameOrders(clean);
    try {
      await updateDoc(doc(db, 'vendors', id), { nama: clean, updatedAt: serverTimestamp() });
    } catch (err: unknown) {
      if (previous) {
        setVendors((prev) => prev.map((v) => (v.id === id ? previous : v)));
        vendorsMapRef.current.set(id, previous.nama);
        renameOrders(previous.nama);
      }
      throw new FinanceWriteError('renameVendor', err);
    }
  }, []);

  return {
    orders,
    cashTransactions,
    vendors,
    syncState,
    lastSyncAt,
    error,
    retry,
    kasReady,
    updateOrderFinance,
    addKas,
    updateKas,
    deleteKas,
    addVendor,
    renameVendor,
  };
}

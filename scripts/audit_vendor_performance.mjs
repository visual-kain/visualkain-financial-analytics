import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { calculateOrderTotals } from '../src/lib/calculations.ts';

const app = initializeApp({
  apiKey: 'AIzaSyCzq3glrfK1JCa12bl4q3_7N_CT1wEU_44',
  authDomain: 'appkonveksi.firebaseapp.com',
  projectId: 'appkonveksi',
  appId: '1:1059702639854:web:8a415ae1713f32defcf7ff',
});

await signInWithEmailAndPassword(getAuth(app), 'glora.sawita@visualkain.com', 'Glora32145');
const db = getFirestore(app);

// Ambil semua vendors
const vendorsSnap = await getDocs(collection(db, 'vendors'));
const vendors = vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

// Ambil semua orders
const ordersSnap = await getDocs(collection(db, 'orders'));
const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

console.log(`Loaded ${vendors.length} vendors and ${orders.length} orders from Firestore.`);

// Hitung vendor performance per vendor
const vendorMap = new Map();

vendors.forEach(v => {
  vendorMap.set(v.id, {
    vendorId: v.id,
    vendorNama: v.nama,
    orderCount: 0,
    pcsTotal: 0,
    totalHpp: 0,
    hppAktual: 0,
    selisihQuotation: 0,
    profit: 0,
    marginPercent: 0,
    revenue: 0,
    pendekSum: 0,
    pendekCount: 0,
    panjangSum: 0,
    panjangCount: 0,
    tanpaLenganSum: 0,
    tanpaLenganCount: 0,
  });
});

orders.forEach(o => {
  const totals = calculateOrderTotals(o);
  const key = o.vendorId || 'none';
  if (!vendorMap.has(key)) {
    vendorMap.set(key, {
      vendorId: key,
      vendorNama: o.vendorName || 'Tanpa Vendor',
      orderCount: 0,
      pcsTotal: 0,
      totalHpp: 0,
      hppAktual: 0,
      selisihQuotation: 0,
      profit: 0,
      marginPercent: 0,
      revenue: 0,
      pendekSum: 0,
      pendekCount: 0,
      panjangSum: 0,
      panjangCount: 0,
      tanpaLenganSum: 0,
      tanpaLenganCount: 0,
    });
  }

  const v = vendorMap.get(key);
  v.orderCount++;
  v.pcsTotal += totals.totalPesanan;
  v.totalHpp += totals.totalHpp;
  const hppAktual = o.hppAktual !== undefined && o.hppAktual !== null ? Number(o.hppAktual) : totals.totalHpp;
  v.hppAktual += hppAktual;
  v.revenue += totals.jumlahSemua;
  const profit = o.profitAktual !== undefined && o.profitAktual !== null ? Number(o.profitAktual) : totals.profit;
  v.profit += profit;

  const hpPendek = Number(o.hargaVendorPendek || 0);
  if (hpPendek > 0) {
    v.pendekSum += hpPendek;
    v.pendekCount++;
  }
  const hpPanjang = Number(o.hargaVendorPanjang || 0);
  if (hpPanjang > 0) {
    v.panjangSum += hpPanjang;
    v.panjangCount++;
  }
  const hpTL = Number(o.hargaVendorTanpaLengan || 0);
  if (hpTL > 0) {
    v.tanpaLenganSum += hpTL;
    v.tanpaLenganCount++;
  }
});

const vendorRows = [...vendorMap.values()].map(v => {
  const avgPendek = v.pendekCount > 0 ? Math.round(v.pendekSum / v.pendekCount) : 0;
  const avgPanjang = v.panjangCount > 0 ? Math.round(v.panjangSum / v.panjangCount) : 0;
  const avgTanpaLengan = v.tanpaLenganCount > 0 ? Math.round(v.tanpaLenganSum / v.tanpaLenganCount) : 0;
  const marginPercent = v.revenue > 0 ? Number(((v.profit / v.revenue) * 100).toFixed(1)) : 0;
  const selisihQuotation = v.hppAktual - v.totalHpp;

  return {
    vendorId: v.vendorId,
    vendorNama: v.vendorNama,
    orderCount: v.orderCount,
    pcsTotal: v.pcsTotal,
    avgLenganPendek: avgPendek,
    avgLenganPanjang: avgPanjang,
    avgTanpaLengan: avgTanpaLengan,
    hppQuotation: v.totalHpp,
    hppAktual: v.hppAktual,
    selisihQuotation,
    profit: v.profit,
    marginPercent,
  };
});

// Urutkan berdasarkan orderCount desc
vendorRows.sort((a, b) => b.orderCount - a.orderCount);

console.log('\n=== HASIL AUDIT PERBANDINGAN VENDOR ===');
console.table(vendorRows);

// Hitung Cheapest by Kategori Produk
const catMap = new Map();
orders.forEach(o => {
  const totals = calculateOrderTotals(o);
  if (totals.totalPesanan <= 0) return;
  const kategori = o.kategoriOrder || '—';
  const vId = o.vendorId || 'none';
  const key = `${kategori}|${vId}`;
  const g = catMap.get(key) ?? { kategori, vendorId: vId, hpp: 0, pcs: 0, orderCount: 0 };
  g.hpp += totals.totalHpp;
  g.pcs += totals.totalPesanan;
  g.orderCount++;
  catMap.set(key, g);
});

const bestCat = new Map();
[...catMap.values()].forEach(g => {
  const avgCost = Math.round(g.hpp / g.pcs);
  const cur = bestCat.get(g.kategori);
  if (!cur || avgCost < cur.avgCost) {
    const vInfo = vendorRows.find(v => v.vendorId === g.vendorId);
    bestCat.set(g.kategori, {
      kategori: g.kategori,
      vendorId: g.vendorId,
      vendorNama: vInfo ? vInfo.vendorNama : 'Tanpa Vendor',
      avgCost,
      orderCount: g.orderCount,
      pcs: g.pcs,
    });
  }
});

const cheapestList = [...bestCat.values()].sort((a, b) => a.kategori.localeCompare(b.kategori));
console.log('\n=== HIGHLIGHT TERMURAH PER KATEGORI PRODUK ===');
console.table(cheapestList);

process.exit(0);

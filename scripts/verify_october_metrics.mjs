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

const ordersSnap = await getDocs(collection(db, 'orders'));
const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

const kasSnap = await getDocs(collection(db, 'kas'));
const kas = kasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

const octOrders = orders.filter(o => (o.tanggalInv || o.tanggalOrder || '').startsWith('2026-10'));
const octKas = kas.filter(k => (k.tanggal || '').startsWith('2026-10') && k.jenis === 'keluar');

let totalOmzet = 0;
let totalProfit = 0;
let totalHpp = 0;
let totalDpVendor = 0;
let totalDpCust = 0;
let totalOutstandingCust = 0;
let totalUtangVendor = 0;

octOrders.forEach(o => {
  const totals = calculateOrderTotals(o);
  totalOmzet += totals.jumlahSemua;
  totalProfit += totals.profit;
  totalHpp += totals.totalHpp;
  totalDpVendor += totals.dpVendor;
  totalUtangVendor += totals.sisaVendor;
  totalDpCust += totals.nominalDP;
  totalOutstandingCust += totals.sisaPelunasan;
  console.log(o.noInv, {
    omzet: totals.jumlahSemua,
    profit: totals.profit,
    hpp: totals.totalHpp,
    dpVendor: totals.dpVendor,
    utangVendor: totals.sisaVendor,
    dpCust: totals.nominalDP,
    sisaPelunasan: totals.sisaPelunasan,
  });
});

const totalUangKeluar = octKas.reduce((a, k) => a + Number(k.jumlah || 0), 0);
const saldoPeriode = totalDpCust - totalDpVendor - totalUangKeluar;

console.log('\n=== REKAP OKTOBER 2026 ===');
console.log('Omzet (Realtime):', totalOmzet);
console.log('Profit (Realtime):', totalProfit, `(Margin ${(totalProfit / totalOmzet * 100).toFixed(1)}%)`);
console.log('DP Customer:', totalDpCust);
console.log('DP Vendor Dibayar:', totalDpVendor);
console.log('Uang Keluar Kas:', totalUangKeluar);
console.log('Saldo Periode:', saldoPeriode);
console.log('Utang Vendor:', totalUtangVendor);
console.log('Outstanding Customer:', totalOutstandingCust);

process.exit(0);

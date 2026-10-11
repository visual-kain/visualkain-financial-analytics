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

let sumEstimasi = 0;
let sumAktual = 0;
let filledCount = 0;

const rows = orders.map(o => {
  const t = calculateOrderTotals(o);
  const estimasi = t.profit;
  const hasManual = o.profitAktual !== undefined && o.profitAktual !== null;
  if (hasManual) filledCount++;
  const aktual = hasManual ? Number(o.profitAktual) : estimasi;
  const delta = aktual - estimasi;
  sumEstimasi += estimasi;
  sumAktual += aktual;
  return {
    noInv: o.noInv,
    customer: o.namaCustomer,
    estimasi,
    aktual,
    delta,
    hasManual,
    hppAktual: o.hppAktual,
  };
});

console.log('Total orders:', orders.length);
console.log('Orders with manual profitAktual filled in Firestore:', filledCount);
console.log('Total Profit Estimasi:', sumEstimasi);
console.log('Total Profit Aktual (Realisasi):', sumAktual);
console.log('Net Delta:', sumAktual - sumEstimasi);

console.log('\nOrders with delta !== 0 (Deviasi):');
console.table(rows.filter(r => r.delta !== 0));

process.exit(0);

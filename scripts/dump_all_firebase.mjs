import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

const vendorsSnap = await getDocs(collection(db, 'vendors'));
const vendors = vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

console.log('=== RINGKASAN FIRESTORE APPKONVEKSI ===');
console.log(`Total Orders  : ${orders.length}`);
console.log(`Total Kas     : ${kas.length}`);
console.log(`Total Vendors : ${vendors.length}`);

console.log('\n=== DETAIL 3 ORDER OKTOBER 2026 ===');
const octOrders = orders.filter(o => (o.tanggalInv || o.tanggalOrder || '').startsWith('2026-10'));
octOrders.forEach(o => {
  console.log(`\n--------------------------------------------`);
  console.log(`Invoice: ${o.noInv} (${o.namaCustomer}) [ID: ${o.id}]`);
  console.log(`  Status               : ${o.status}`);
  console.log(`  Tanggal Invoice      : ${o.tanggalInv}`);
  console.log(`  Field dpNominal      : ${o.dpNominal}`);
  console.log(`  Field dpPersen       : ${o.dpPersen}%`);
  console.log(`  Field dpNominalPO    : ${o.dpNominalPO}`);
  console.log(`  Field dpPersenPO     : ${o.dpPersenPO}%`);
  console.log(`  Field biayaTambahan  : Cust=${o.biayaTambahanCust}, Vendor=${o.biayaLainnya}`);
  console.log(`  Field riwayatPembayaran:`);
  if (Array.isArray(o.riwayatPembayaran)) {
    let sumRiwayat = 0;
    o.riwayatPembayaran.forEach((p, idx) => {
      console.log(`    [${idx + 1}] ${p.tanggal} | Rp ${p.jumlah?.toLocaleString('id-ID')} | "${p.catatan}"`);
      sumRiwayat += (p.jumlah || 0);
    });
    console.log(`    >> TOTAL SUM RIWAYAT = Rp ${sumRiwayat.toLocaleString('id-ID')}`);
    console.log(`    >> SELISIH (dpNominal vs sumRiwayat) = Rp ${(o.dpNominal - sumRiwayat).toLocaleString('id-ID')}`);
  } else {
    console.log(`    (tidak ada riwayatPembayaran)`);
  }
});

console.log('\n=== CEK SEMUA ORDER LAIN DENGAN RIWAYAT PEMBAYARAN ===');
orders.forEach(o => {
  if (Array.isArray(o.riwayatPembayaran) && o.riwayatPembayaran.length > 0) {
    const sum = o.riwayatPembayaran.reduce((a, b) => a + (b.jumlah || 0), 0);
    const diff = (o.dpNominal || 0) - sum;
    if (diff !== 0) {
      console.log(`Order ${o.noInv} (${o.status}): dpNominal=${o.dpNominal} vs sumRiwayat=${sum} (SELISIH: ${diff})`);
    }
  }
});

process.exit(0);

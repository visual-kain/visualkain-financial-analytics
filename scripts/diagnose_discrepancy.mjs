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

// Ambil orders
const ordersSnap = await getDocs(collection(db, 'orders'));
const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

// Ambil kas
const kasSnap = await getDocs(collection(db, 'kas'));
const kas = kasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

console.log(`Total orders in DB: ${orders.length}`);
console.log(`Total kas in DB: ${kas.length}`);

// Filter untuk Oktober 2026 (2026-10)
const octOrders = orders.filter(o => (o.tanggalInv || o.tanggalOrder || '').startsWith('2026-10'));
console.log(`Total October 2026 orders: ${octOrders.length}`);

octOrders.forEach(o => {
  console.log(`\n--- Order ${o.noInv} (${o.namaCustomer}) ---`);
  console.log('tanggalInv:', o.tanggalInv);
  console.log('status:', o.status);
  console.log('jumlahSemua (stored):', o.jumlahSemua);
  console.log('totalInvoice (stored):', o.totalInvoice);
  console.log('totalBiayaVendor (stored):', o.totalBiayaVendor);
  console.log('hpp (stored):', o.hpp);
  console.log('dpNominal (stored):', o.dpNominal);
  console.log('dpNominalPO (stored):', o.dpNominalPO);
  console.log('dpPersen:', o.dpPersen);
  console.log('dpPersenPO:', o.dpPersenPO);
  console.log('biayaOperasional:', o.biayaOperasional);
  console.log('biayaLainnya:', o.biayaLainnya);
  console.log('biayaTambahanCust:', o.biayaTambahanCust);
  console.log('diskonHarga:', o.diskonHarga);
  console.log('riwayatPembayaran:', o.riwayatPembayaran);
  console.log('hargaPendek:', o.hargaPendek, 'hargaPanjang:', o.hargaPanjang);
  console.log('hargaVendorPendek:', o.hargaVendorPendek, 'hargaVendorPanjang:', o.hargaVendorPanjang);
  // Cek sizes
  const sizes = [];
  ['pendek', 'panjang', 'tanpaLengan'].forEach(c => {
    ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].forEach(s => {
      if (o[`${c}${s}`]) sizes.push(`${c}${s}: ${o[`${c}${s}`]}`);
    });
  });
  console.log('sizes with qty:', sizes.join(', '));
});

process.exit(0);

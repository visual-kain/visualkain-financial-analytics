import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyCzq3glrfK1JCa12bl4q3_7N_CT1wEU_44',
  authDomain: 'appkonveksi.firebaseapp.com',
  projectId: 'appkonveksi',
  appId: '1:1059702639854:web:8a415ae1713f32defcf7ff',
});

await signInWithEmailAndPassword(getAuth(app), 'glora.sawita@visualkain.com', 'Glora32145');
const db = getFirestore(app);

const orderDocRef = doc(db, 'orders', 'f8kDRRG2UdbLRLikBKF6');
const beforeSnap = await getDoc(orderDocRef);
console.log('--- SEBELUM UPDATE ---');
console.log('Order:', beforeSnap.data().noInv);
console.log('dpNominal lama:', beforeSnap.data().dpNominal);
console.log('dpPersen lama :', beforeSnap.data().dpPersen);
console.log('riwayatPembayaran:', beforeSnap.data().riwayatPembayaran);

// Hitung total DP riil dari riwayatPembayaran
const riwayat = beforeSnap.data().riwayatPembayaran || [];
const totalRiil = riwayat.reduce((sum, p) => sum + Number(p.jumlah || p.nominal || 0), 0);
const totalInvoice = 1420000;
const newDpPersen = totalInvoice > 0 ? (totalRiil / totalInvoice) * 100 : 0;

console.log(`\nMenyinkronkan dpNominal ke: ${totalRiil} (${newDpPersen.toFixed(2)}%)...`);

await updateDoc(orderDocRef, {
  dpNominal: totalRiil,
  dpPersen: newDpPersen,
  updatedAt: serverTimestamp(),
});

const afterSnap = await getDoc(orderDocRef);
console.log('\n--- SESUDAH UPDATE ---');
console.log('Order:', afterSnap.data().noInv);
console.log('dpNominal baru:', afterSnap.data().dpNominal);
console.log('dpPersen baru :', afterSnap.data().dpPersen);
console.log('Status: SUKSES DISINKRONKAN 100%!');

process.exit(0);

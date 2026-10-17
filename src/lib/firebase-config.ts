// Konfigurasi web Firebase (publik); dipisah agar route server bisa memakainya tanpa memuat SDK klien.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCzq3glrfK1JCa12bl4q3_7N_CT1wEU_44',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'appkonveksi.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'appkonveksi',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'appkonveksi.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1059702639854',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1059702639854:web:8a415ae1713f32defcf7ff',
};

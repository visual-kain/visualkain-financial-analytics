import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './firebase-config';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;


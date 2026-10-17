'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getInitials, getUserDisplayName } from '@/lib/legacy/formatters';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  name: string;
  shortName: string;
  role: string;
  email: string;
  initials: string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Identitas diambil dari akun login (K-3, F-13) karena aplikasi kini dipakai lebih dari satu orang.
function buildProfile(firebaseUser: User): UserProfile {
  const name = getUserDisplayName(firebaseUser) || 'Pengguna VisualKain';
  return {
    name,
    shortName: name.split(/\s+/).slice(0, 2).join(' '),
    role: 'Tim VisualKain',
    email: firebaseUser.email || '',
    initials: getInitials(name),
    department: 'VisualKain',
  };
}

function mapAuthError(code: string): string {
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(code)) {
    return 'Email atau kata sandi tidak cocok dengan akun resmi VisualKain.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Terlalu banyak percobaan gagal. Akses ditangguhkan sementara demi keamanan.';
  }
  if (code === 'auth/invalid-email') return 'Format alamat email tidak valid.';
  if (code === 'auth/network-request-failed') {
    return 'Koneksi jaringan terputus. Pastikan perangkat Anda terhubung ke internet.';
  }
  return 'Gagal masuk. Silakan periksa kembali email dan password.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Sesi hanya sah jika Firebase Auth mengenali pengguna (Firestore butuh token ini).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      setUser(res.user);
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      return { success: false, error: mapAuthError(code) };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase signOut error', e);
    }
    setUser(null);
    router.replace('/login');
  };

  const profile = user ? buildProfile(user) : null;

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

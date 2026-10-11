'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

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
  loginAsGlora: () => Promise<void>;
  logout: () => Promise<void>;
}

const DEFAULT_GLORA_PROFILE: UserProfile = {
  name: 'Glora Sawita Br Panjaitan',
  shortName: 'Kak Glora',
  role: 'Head of Finance & Accounting',
  email: 'glora.sawita@visualkain.com',
  initials: 'GS',
  department: 'Finance & Cashflow Intelligence',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'vk_finance_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 1. Initial Listen to Firebase Auth + Local Fallback Session
  useEffect(() => {
    // Check local demo session first if available
    const savedSession = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_SESSION_KEY) : null;
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setProfile(parsed);
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const email = firebaseUser.email || '';
        // If email or displayName matches or general executive
        const isGlora = email.toLowerCase().includes('glora') || email.toLowerCase().includes('sawita') || email.toLowerCase().includes('finance');
        
        const activeProfile: UserProfile = {
          name: firebaseUser.displayName || (isGlora ? 'Glora Sawita Br Panjaitan' : 'Glora Sawita Br Panjaitan'),
          shortName: isGlora ? 'Kak Glora' : 'Kak Glora',
          role: 'Head of Finance & Accounting',
          email: firebaseUser.email || 'glora.sawita@visualkain.com',
          initials: 'GS',
          department: 'Finance & Cashflow Intelligence',
        };
        setProfile(activeProfile);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(activeProfile));
      } else {
        setUser(null);
        // If no firebaseUser and no manual executive session, clear profile
        if (!localStorage.getItem(LOCAL_SESSION_KEY)) {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real Firebase Login with Email & Password
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      const isGlora = res.user.email?.toLowerCase().includes('glora') || res.user.email?.toLowerCase().includes('sawita') || res.user.email?.toLowerCase().includes('finance');

      const userProfile: UserProfile = {
        name: res.user.displayName || 'Glora Sawita Br Panjaitan',
        shortName: isGlora ? 'Kak Glora' : 'Kak Glora',
        role: 'Head of Finance & Accounting',
        email: res.user.email || email,
        initials: 'GS',
        department: 'Finance & Cashflow Intelligence',
      };

      setUser(res.user);
      setProfile(userProfile);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userProfile));
      return { success: true };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      let message = 'Gagal masuk. Silakan periksa kembali email dan password.';

      if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(code)) {
        message = 'Email atau kata sandi tidak cocok dengan akun resmi VisualKain.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Terlalu banyak percobaan gagal. Akses ditangguhkan sementara demi keamanan.';
      } else if (code === 'auth/invalid-email') {
        message = 'Format alamat email tidak valid.';
      } else if (code === 'auth/network-request-failed') {
        message = 'Koneksi jaringan terputus. Pastikan perangkat Anda terhubung ke internet.';
      }

      return { success: false, error: message };
    }
  };

  // 3. One-Click Executive Login (Khusus Demonstrasi & Sesi Cepat Kak Glora)
  const loginAsGlora = async () => {
    setProfile(DEFAULT_GLORA_PROFILE);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(DEFAULT_GLORA_PROFILE));
    router.replace('/');
  };

  // 4. Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase signOut error', e);
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_SESSION_KEY);
    router.replace('/login');
  };

  const isAuthenticated = useMemo(() => {
    return !!(user || profile);
  }, [user, profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated,
        login,
        loginAsGlora,
        logout,
      }}
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

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_LOGIN_EMAIL = 'glora.sawita@visualkain.com';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_LOGIN_EMAIL_HINT || DEFAULT_LOGIN_EMAIL);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Silakan lengkapi email dan kata sandi otorisasi Anda.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.replace('/');
    } else {
      setError(res.error || 'Autentikasi gagal. Silakan coba kembali.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#E8ECF2] p-4 sm:p-6 lg:p-8 select-none overflow-hidden">
      {/* Ambient Lighting Depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Background Subtle Accent Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Main Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-sm p-7 sm:p-8 shadow-xl shadow-slate-900/5">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center">
            {/* Logo Container with Refined Elevation */}
            <div className="relative mb-3.5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm ring-1 ring-slate-900/[0.04]">
              <img
                src="/img/logo.jpg"
                alt="Logo Resmi Visual Kain"
                className="h-full w-full object-contain rounded-xl"
              />
            </div>

            {/* Company Badge (Without PT) */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/80 px-3 py-1 text-[11px] font-bold text-teal-800 tracking-wider mb-2.5 shadow-2xs">
              <Building2 className="h-3.5 w-3.5 text-teal-600" />
              VISUAL KAIN INDONESIA
            </div>

            {/* Executive Professional Greeting */}
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Selamat Datang Kembali
            </h1>

            {/* Executive Identity & Role Chip */}
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/80 px-3.5 py-1 text-xs text-slate-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-semibold text-slate-900">Glora Sawita Br Panjaitan</span>
              <span className="text-slate-300 font-normal">&bull;</span>
              <span className="font-medium text-teal-700">Head of Finance</span>
            </div>

            <p className="mt-2.5 text-xs text-slate-500 leading-relaxed max-w-xs">
              Portal data keuangan terpadu, arus kas operasional riil &amp; rekonsiliasi vendor escrow.
            </p>
          </div>

          {/* Error Message Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Email Resmi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="glora.sawita@visualkain.com"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Kata Sandi Otorisasi
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Lock className="h-3 w-3 text-slate-400" />
                  Terenkripsi 256-bit
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-10 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-xs font-bold text-white shadow-md shadow-teal-700/20 hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Memverifikasi Otorisasi...</span>
                </div>
              ) : (
                <>
                  <span>Masuk ke Dashboard Finansial</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & BCA Escrow Disclaimer */}
          <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 py-2.5 px-3 border border-slate-100 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Rekening Terhubung: <span className="font-semibold text-slate-800">BCA a.n. Glora Sawita</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Terverifikasi
            </span>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-[11px] font-medium text-slate-400">
            &copy; 2026 Visual Kain Indonesia &bull; All Rights Reserved
          </p>
          <p className="text-[10px] text-slate-400/80">
            Sistem Finansial Eksekutif &bull; Akses Terenkripsi
          </p>
        </div>
      </motion.div>
    </div>
  );
}

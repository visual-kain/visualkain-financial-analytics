'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { AccImageThumb } from '@/components/ops/AccImageThumb';
import { cn } from '@/lib/utils';

const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024;

/**
 * Kompres di browser ke WebP sebelum unggah (salinan `compressImage` visualkaindb): sisi terpanjang 1600 px,
 * kualitas 0,82; WebP di bawah 300 KB dilewatkan apa adanya.
 */
export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/webp' && file.size < 300 * 1024) return file;

  const img = document.createElement('img');
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Gambar tidak bisa dibaca'));
      img.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

interface AccImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function AccImageUpload({ value, onChange, label = 'Gambar ACC Customer' }: AccImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Format harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      setError('File terlalu besar (maks 15 MB). Pilih gambar lain.');
      return;
    }
    setUploading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Sesi login berakhir. Silakan masuk ulang.');
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append('file', compressed);
      const res = await fetch('/api/upload', { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } });
      const text = await res.text();
      let payload: { url?: string; error?: string } = {};
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: res.status === 413 ? 'File terlalu besar untuk server.' : 'Respons server tidak valid.' };
      }
      if (!res.ok || !payload.url) throw new Error(payload.error || 'Upload gagal, coba lagi.');
      onChange(payload.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal, coba lagi.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <div className={cn('flex items-center gap-3 rounded-xl border border-dashed p-3', error ? 'border-rose-300 bg-rose-50/40' : 'border-slate-300 bg-slate-50/60')}>
        {value ? (
          <AccImageThumb url={value} label={label} size="md" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200">
            <ImagePlus className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-700">{uploading ? 'Mengunggah...' : value ? 'Gambar tersimpan' : 'Belum ada gambar'}</p>
          <p className="text-[11px] text-slate-500">JPG/PNG/WebP, maks 15 MB (dikompres otomatis ke WebP)</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : value ? <RefreshCw className="h-3.5 w-3.5" /> : <ImagePlus className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{value ? 'Ganti' : 'Pilih'}</span>
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Hapus gambar ACC"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-[11px] font-semibold text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

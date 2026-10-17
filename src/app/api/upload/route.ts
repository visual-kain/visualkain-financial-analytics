import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/lib/firebase-config';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;
const FOLDER = 'acc-customer';

/** Memastikan pengunggah sedang login: ID token Firebase divalidasi ke endpoint resmi Identity Toolkit. */
async function verifyFirebaseToken(idToken: string): Promise<boolean> {
  const apiKey = firebaseConfig.apiKey;
  if (!apiKey) return false;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    cache: 'no-store',
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { users?: unknown[] };
  return Array.isArray(data.users) && data.users.length > 0;
}

/** Signed upload Cloudinary via REST (setara `uploader.upload_stream` di visualkaindb, tanpa SDK). */
async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('CLOUDINARY_NOT_CONFIGURED');

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash('sha1').update(`folder=${FOLDER}&timestamp=${timestamp}${apiSecret}`).digest('hex');
  const body = new FormData();
  body.append('file', file);
  body.append('folder', FOLDER);
  body.append('timestamp', String(timestamp));
  body.append('api_key', apiKey);
  body.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body });
  const data = (await res.json()) as { secure_url?: string; public_id?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url || !data.public_id) throw new Error(data.error?.message || 'Upload Cloudinary gagal');
  return { url: data.secure_url, publicId: data.public_id };
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !(await verifyFirebaseToken(token).catch(() => false))) {
    return NextResponse.json({ error: 'Sesi login tidak valid. Silakan masuk ulang.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Tidak ada file' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus gambar (JPG/PNG/WebP)' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Maksimal 5MB setelah kompresi' }, { status: 400 });
    }
    const result = await uploadToCloudinary(file);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'CLOUDINARY_NOT_CONFIGURED') {
      console.error('[upload] Env Cloudinary belum diatur');
      return NextResponse.json({ error: 'Penyimpanan gambar belum dikonfigurasi di server.' }, { status: 500 });
    }
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Upload gagal, coba lagi' }, { status: 500 });
  }
}

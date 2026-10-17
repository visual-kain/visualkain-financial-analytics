import type { FirestoreTimestampLike } from './types';

/** Format Rupiah `visualkaindb` (Intl IDR, tanpa desimal) yang tercetak di kertas legacy. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function timestampToDate(ts: FirestoreTimestampLike | null | undefined): Date | null {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
  return null;
}

/** "2026-10-13" → "13 Oktober 2026"; string lain dikembalikan apa adanya (data lama berupa teks bebas). */
export function formatIsoDateLong(value: string | null | undefined): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, y, m, d] = match;
  return formatDate(new Date(Number(y), Number(m) - 1, Number(d)));
}

const RELATIVE_UNITS: Array<{ limit: number; div: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { limit: 60, div: 1, unit: 'second' },
  { limit: 3600, div: 60, unit: 'minute' },
  { limit: 86400, div: 3600, unit: 'hour' },
  { limit: 86400 * 30, div: 86400, unit: 'day' },
  { limit: 86400 * 365, div: 86400 * 30, unit: 'month' },
  { limit: Infinity, div: 86400 * 365, unit: 'year' },
];

const relativeFormatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });

/** "3 menit lalu", "kemarin", "2 bulan lalu". */
export function formatRelativeTime(date: Date | null, now: Date = new Date()): string {
  if (!date) return '-';
  const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 45) return 'baru saja';
  const unit = RELATIVE_UNITS.find((u) => abs < u.limit) ?? RELATIVE_UNITS[RELATIVE_UNITS.length - 1];
  return relativeFormatter.format(Math.round(diffSec / unit.div), unit.unit);
}

export function formatDateTime(date: Date | null): string {
  if (!date) return '-';
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Nomor invoice `VK{yy}{urut 4 digit}`: urut tertinggi tahun itu + 1 (generateInvoiceNumber lama). */
export function generateInvoiceNumber(date: Date, existingInvs: ReadonlyArray<string>): string {
  const yy = String(date.getFullYear()).slice(-2);
  const prefix = `VK${yy}`;
  let max = 0;
  existingInvs.forEach((inv) => {
    if (typeof inv === 'string' && inv.startsWith(prefix)) {
      const n = parseInt(inv.slice(prefix.length), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
  });
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

/** raja@viska.com → "Raja", budi.santoso@x.com → "Budi Santoso" (getUserDisplayName lama). */
export function getUserDisplayName(user: { displayName?: string | null; email?: string | null } | null): string {
  if (!user) return '';
  if (user.displayName) return user.displayName;
  if (user.email) {
    const raw = user.email.split('@')[0];
    const name = raw.replace(/[._\-]+/g, ' ').trim();
    if (!name) return '';
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return '';
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'VK';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

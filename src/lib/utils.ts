import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const formatted = Math.abs(rounded).toLocaleString('id-ID');
  return `${sign}Rp ${formatted}`;
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  const pct = (value / total) * 100;
  return `${pct.toFixed(1)}%`;
}

const COMPACT_UNITS = [
  { value: 1_000_000_000, suffix: 'M', digits: 1 },
  { value: 1_000_000, suffix: 'jt', digits: 1 },
  { value: 1_000, suffix: 'rb', digits: 0 },
] as const;

export function formatCompactRupiah(amount: number): string {
  if (!amount) return 'Rp 0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  let idx = COMPACT_UNITS.findIndex((u) => abs >= u.value);
  if (idx === -1) return `${sign}Rp ${abs.toLocaleString('id-ID')}`;

  const round = (i: number) => {
    const factor = 10 ** COMPACT_UNITS[i].digits;
    return Math.round((abs / COMPACT_UNITS[i].value) * factor) / factor;
  };
  // 999.999 dibulatkan menjadi "1000 rb"; naik ke satuan berikutnya supaya tampil "1 jt".
  let scaled = round(idx);
  while (scaled >= 1000 && idx > 0) {
    idx -= 1;
    scaled = round(idx);
  }

  const unit = COMPACT_UNITS[idx];
  return `${sign}Rp ${scaled.toLocaleString('id-ID', { maximumFractionDigits: unit.digits })} ${unit.suffix}`;
}

const MONTH_ABBR_ID: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'Mei',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Agu',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Des',
};

const MONTH_FULL_ID: Record<string, string> = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember',
};

/**
 * Format string tanggal YYYY-MM-DD atau MM-DD menjadi format sumbu X yang tidak membingungkan: "15 Sep", "02 Okt"
 */
export function formatDateTick(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const [, mm, dd] = parts;
    const month = MONTH_ABBR_ID[mm] || mm;
    const day = dd.length === 2 ? dd : dd.padStart(2, '0');
    return `${day} ${month}`;
  }
  if (parts.length === 2) {
    const [mm, dd] = parts;
    const month = MONTH_ABBR_ID[mm] || mm;
    const day = dd.length === 2 ? dd : dd.padStart(2, '0');
    return `${day} ${month}`;
  }
  return dateStr;
}

/**
 * Format string tanggal YYYY-MM-DD menjadi format formal Indonesia: "15 September 2026"
 */
export function formatIndonesianDateFull(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    const month = MONTH_FULL_ID[mm] || mm;
    return `${parseInt(dd, 10)} ${month} ${yyyy}`;
  }
  return dateStr;
}

/**
 * Membuat badge keterangan rentang tanggal eksplisit (misal: "Rentang: 15 Sep 2026 – 12 Okt 2026")
 */
export function formatDateRangeBadge(dates: string[]): string {
  if (!dates || dates.length === 0) return 'Rentang: Periode Aktif';
  const validDates = dates.filter(Boolean).sort();
  if (validDates.length === 0) return 'Rentang: Periode Aktif';
  if (validDates.length === 1) {
    return `Tanggal: ${formatIndonesianDateFull(validDates[0])}`;
  }
  const first = validDates[0];
  const last = validDates[validDates.length - 1];
  const start = formatDateTick(first);
  const end = formatDateTick(last);
  const year = last.length >= 4 ? last.slice(0, 4) : new Date().getFullYear().toString();
  return `Rentang: ${start} – ${end} ${year}`;
}

/**
 * Konversi key periode (misal: "2026-10" atau "all") menjadi suffix nama file ramah manusia (misal: "Oktober_2026")
 */
export function getPeriodFilenameSuffix(period?: string): string {
  if (!period || period === 'all') {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const monthName = MONTH_FULL_ID[mm] || mm;
    return `${monthName}_${yyyy}`;
  }
  const parts = period.split('-');
  if (parts.length === 2) {
    const [year, month] = parts;
    const monthName = MONTH_FULL_ID[month] || month;
    return `${monthName}_${year}`;
  }
  return period.replace(/[^a-zA-Z0-9_-]/g, '_');
}


/** Nomor WhatsApp format internasional Indonesia (62…), atau `null` bila kosong/tidak valid sehingga tombol kirim harus dinonaktifkan. */
export function normalizeWaNumber(raw: string | null | undefined): string | null {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

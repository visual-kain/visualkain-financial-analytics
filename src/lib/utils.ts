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

export function formatCompactRupiah(amount: number): string {
  if (!amount || amount === 0) return 'Rp 0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const m = abs / 1_000_000_000;
    return `${sign}Rp ${m % 1 === 0 ? m : m.toFixed(1)} M`;
  }
  if (abs >= 1_000_000) {
    const jt = abs / 1_000_000;
    return `${sign}Rp ${jt % 1 === 0 ? jt : jt.toFixed(1)} jt`;
  }
  if (abs >= 1_000) {
    const rb = abs / 1_000;
    return `${sign}Rp ${rb % 1 === 0 ? rb : rb.toFixed(0)} rb`;
  }
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

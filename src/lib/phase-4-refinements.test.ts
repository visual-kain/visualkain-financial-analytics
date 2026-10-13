import { describe, it, expect } from 'vitest';
import {
  formatDateTick,
  formatIndonesianDateFull,
  formatDateRangeBadge,
  getPeriodFilenameSuffix,
} from './utils';

describe('Phase 4: Client Feedback Refinements Engine', () => {
  describe('US-9.22: Unambiguous Date Formatting & Badges', () => {
    it('formatDateTick mengonversi format tanggal ISO menjadi format sumbu X yang tidak membingungkan (15 Sep, 02 Okt)', () => {
      expect(formatDateTick('2026-09-15')).toBe('15 Sep');
      expect(formatDateTick('2026-10-02')).toBe('02 Okt');
      expect(formatDateTick('2026-10-12')).toBe('12 Okt');
      expect(formatDateTick('2026-01-05')).toBe('05 Jan');
      expect(formatDateTick('2026-12-31')).toBe('31 Des');
    });

    it('formatDateTick dapat menangani format MM-DD', () => {
      expect(formatDateTick('09-15')).toBe('15 Sep');
      expect(formatDateTick('10-02')).toBe('02 Okt');
    });

    it('formatIndonesianDateFull mengonversi format tanggal ISO menjadi nama bulan formal lengkap Indonesia', () => {
      expect(formatIndonesianDateFull('2026-10-12')).toBe('12 Oktober 2026');
      expect(formatIndonesianDateFull('2026-09-15')).toBe('15 September 2026');
      expect(formatIndonesianDateFull('2026-01-01')).toBe('1 Januari 2026');
    });

    it('formatDateRangeBadge menyajikan rentang waktu awal dan akhir yang presisi', () => {
      const dates = ['2026-09-15', '2026-09-23', '2026-10-02', '2026-10-12'];
      const badge = formatDateRangeBadge(dates);
      expect(badge).toBe('Rentang: 15 Sep – 12 Okt 2026');
    });

    it('formatDateRangeBadge menangani single date dan array kosong', () => {
      expect(formatDateRangeBadge(['2026-10-12'])).toBe('Tanggal: 12 Oktober 2026');
      expect(formatDateRangeBadge([])).toBe('Rentang: Periode Aktif');
    });
  });

  describe('US-9.18: Contextual Export & Print Filename Helpers', () => {
    it('getPeriodFilenameSuffix menghasilkan nama bulan dan tahun formal ramah spreadsheet', () => {
      expect(getPeriodFilenameSuffix('2026-10')).toBe('Oktober_2026');
      expect(getPeriodFilenameSuffix('2026-09')).toBe('September_2026');
      expect(getPeriodFilenameSuffix('2025-12')).toBe('Desember_2025');
    });

    it('getPeriodFilenameSuffix menangani periode "all" dengan fallback bulan dan tahun aktif', () => {
      const suffix = getPeriodFilenameSuffix('all');
      expect(suffix).toMatch(/^[A-Za-z]+_\d{4}$/);
    });

    it('Sanitasi judul print dokumen PDF membersihkan karakter ilegal file system', () => {
      const noInv = 'VK26/0039';
      const projectName = 'Seragam PDL: Himpunan & Workshop *Final*';
      const cleanTitle = `${noInv} - ${projectName}`.replace(/[/\\?%*:|"<>]/g, '-').trim();
      expect(cleanTitle).toBe('VK26-0039 - Seragam PDL- Himpunan & Workshop -Final-');
    });
  });

  describe('US-9.20: Payment Terms Inflow Categorization Rules', () => {
    it('Membedakan antara DP 1 Booking, DP 2 Termin 70%, dan Pelunasan 30%', () => {
      const categorizePayment = (dpPersen: number, isLunas: boolean) => {
        if (isLunas || dpPersen >= 100) return 'pelunasan';
        if (dpPersen >= 70) return 'termin';
        return 'dp';
      };

      expect(categorizePayment(30, false)).toBe('dp');
      expect(categorizePayment(50, false)).toBe('dp');
      expect(categorizePayment(70, false)).toBe('termin');
      expect(categorizePayment(85, false)).toBe('termin');
      expect(categorizePayment(100, true)).toBe('pelunasan');
      expect(categorizePayment(70, true)).toBe('pelunasan');
    });
  });
});

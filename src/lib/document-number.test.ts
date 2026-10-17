import { describe, it, expect } from 'vitest';
import {
  COMPANY_CODE,
  counterId,
  documentYear,
  formatDocumentNumber,
  formatPoNumber,
  parseDocumentNumber,
} from './document-number';

describe('counterId', () => {
  it('menyusun id dokumen penghitung per prefix dan tahun', () => {
    expect(COMPANY_CODE).toBe('VK');
    expect(counterId('SK', 2026)).toBe('SK-VK-2026');
    expect(counterId('PH', 2027)).toBe('PH-VK-2027');
  });
});

describe('formatDocumentNumber', () => {
  it('memakai format PREFIX-VK-YYYY-NNN dengan urut 3 digit', () => {
    expect(formatDocumentNumber('SK', 2026, 1)).toBe('SK-VK-2026-001');
    expect(formatDocumentNumber('PH', 2026, 42)).toBe('PH-VK-2026-042');
  });

  it('tidak memotong urut lebih dari 3 digit', () => {
    expect(formatDocumentNumber('SK', 2026, 1000)).toBe('SK-VK-2026-1000');
  });
});

describe('parseDocumentNumber', () => {
  it('membaca kembali nomor yang dibuat formatDocumentNumber', () => {
    expect(parseDocumentNumber(formatDocumentNumber('PH', 2026, 7))).toEqual({ prefix: 'PH', year: 2026, urut: 7 });
    expect(parseDocumentNumber('SK-VK-2026-1000')).toEqual({ prefix: 'SK', year: 2026, urut: 1000 });
  });

  it('mengabaikan spasi di tepi', () => {
    expect(parseDocumentNumber('  SK-VK-2026-001 ')).toEqual({ prefix: 'SK', year: 2026, urut: 1 });
  });

  it.each(['SK-2610-123', 'PO-VK260001', 'SK-VK-26-001', 'SK-VK-2026-01', 'sk-vk-2026-001', '', 'XX-VK-2026-001'])(
    'menolak format yang bukan nomor dokumen: "%s"',
    (value) => {
      expect(parseDocumentNumber(value)).toBeNull();
    }
  );
});

describe('formatPoNumber', () => {
  it('nomor PO mengikuti No. Invoice (K-8)', () => {
    expect(formatPoNumber('VK260001')).toBe('PO-VK260001');
  });

  it('tidak melempar galat saat No. Invoice kosong', () => {
    expect(formatPoNumber('')).toBe('PO-');
  });
});

describe('documentYear', () => {
  it('mengambil tahun dari tanggal YYYY-MM-DD', () => {
    expect(documentYear('2026-10-17')).toBe(2026);
    expect(documentYear('2027-01-01')).toBe(2027);
  });

  it('tahun mengikuti tanggal dokumen, bukan tahun berjalan', () => {
    expect(documentYear('2025-12-31', new Date(2026, 5, 1))).toBe(2025);
  });

  it('memakai tahun berjalan saat tanggal kosong atau tidak valid', () => {
    const now = new Date(2026, 9, 17);
    expect(documentYear('', now)).toBe(2026);
    expect(documentYear(undefined, now)).toBe(2026);
    expect(documentYear('17/10/2026', now)).toBe(2026);
  });
});

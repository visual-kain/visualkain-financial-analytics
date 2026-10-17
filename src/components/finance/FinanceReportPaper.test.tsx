import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import FinanceReportPaper from './FinanceReportPaper';

afterEach(cleanup);

const baseOrder = {
  id: 'ord-r',
  noInv: 'VK-R1',
  tanggalOrder: '2026-10-10',
  isManualFinanceOverride: true,
  grossTotal: 1_000_000,
  totalInvoice: 1_000_000,
  totalHpp: 600_000,
  dpPersen: 70,
  pembayaranList: [],
};

const rowText = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('.tp-row')).find((r) => r.textContent?.startsWith(label))?.textContent || '';

describe('FinanceReportPaper', () => {
  it('tidak merender angka 0 nyasar saat belum ada pembayaran vendor', () => {
    const { container } = render(
      <FinanceReportPaper order={{ ...baseOrder, dpNominalPO: 0, totalDibayarKeVendor: 0, totalUangMasukCustomer: 0, dpNominal: 0 }} />
    );
    const strayZero = Array.from(container.querySelectorAll('.tp-section')).some((section) =>
      Array.from(section.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim() === '0')
    );
    expect(strayZero).toBe(false);
  });

  it('menampilkan DP dari pembayaran tercatat, bukan rencana dpPersen', () => {
    const { container } = render(
      <FinanceReportPaper order={{ ...baseOrder, totalUangMasukCustomer: 0, dpNominal: 0 }} />
    );
    expect(rowText(container, 'DP Konsumen')).toMatch(/\(0(,0)?%\)/);
    expect(rowText(container, 'DP Konsumen')).toMatch(/Rp\s?0$/);
    expect(rowText(container, 'Sisa Pelunasan')).toMatch(/1\.000\.000/);
  });

  it('persen DP dihitung dari nominal diterima dibagi total tagihan', () => {
    const { container } = render(
      <FinanceReportPaper order={{ ...baseOrder, totalUangMasukCustomer: 250_000, dpNominal: 250_000 }} />
    );
    expect(rowText(container, 'DP Konsumen')).toMatch(/\(25(,0)?%\)/);
  });

  it('menampilkan biaya tambahan customer sehingga subtotal − diskon + tambahan = total tagihan', () => {
    const { container } = render(
      <FinanceReportPaper
        order={{ ...baseOrder, grossTotal: 7_935_000, totalInvoice: 8_835_000, biayaTambahanCustomer: 900_000, totalUangMasukCustomer: 0, dpNominal: 0 }}
      />
    );
    expect(rowText(container, 'Nilai Tagihan Kotor')).toContain('7.935.000');
    expect(rowText(container, 'Biaya Tambahan Customer')).toContain('900.000');
    expect(rowText(container, 'Biaya Tambahan Customer')).toContain('+');
    expect(rowText(container, 'Total Tagihan')).toContain('8.835.000');
  });
});

import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { CashCoveragePanel } from './CashCoveragePanel';
import type { CashCoverageProjection } from '@/lib/cash-ledger';

const oktober: CashCoverageProjection = {
  saldoKas: 997_980,
  piutangCustomer: 6_010_500,
  utangVendor: 3_455_000,
  kewajibanInvestor: 2_000_000,
  danaTersedia: 7_008_480,
  totalKewajiban: 5_455_000,
  proyeksiSisa: 1_553_480,
  sisaTanpaPelunasan: -4_457_020,
};

afterEach(cleanup);

describe('CashCoveragePanel', () => {
  it('menampilkan status CUKUP, komponen hitungan, dan peringatan bila kas saat ini belum cukup tanpa pelunasan', () => {
    render(<CashCoveragePanel coverage={oktober} />);
    expect(screen.getByText('CUKUP')).toBeTruthy();
    expect(screen.getByText('Rp 997.980')).toBeTruthy();
    expect(screen.getByText('Rp 6.010.500')).toBeTruthy();
    expect(screen.getByText('Rp 3.455.000')).toBeTruthy();
    expect(screen.getByText('Rp 2.000.000')).toBeTruthy();
    expect(screen.getAllByText('+Rp 1.553.480').length).toBeGreaterThan(0);
    expect(screen.getByText('Rp 4.457.020')).toBeTruthy();
  });

  it('menampilkan status MINUS dengan nilai negatif pada varian compact', () => {
    render(
      <CashCoveragePanel
        variant="compact"
        coverage={{ ...oktober, piutangCustomer: 2_000_000, danaTersedia: 2_997_980, proyeksiSisa: -2_457_020 }}
      />
    );
    expect(screen.getByText('MINUS')).toBeTruthy();
    expect(screen.getByText('-Rp 2.457.020')).toBeTruthy();
  });

  it('tidak menampilkan peringatan bila kas saat ini sudah cukup', () => {
    render(<CashCoveragePanel coverage={{ ...oktober, saldoKas: 6_000_000, sisaTanpaPelunasan: 545_000 }} />);
    expect(screen.getByText(/sudah cukup menutup semua kewajiban tanpa menunggu/)).toBeTruthy();
  });
});

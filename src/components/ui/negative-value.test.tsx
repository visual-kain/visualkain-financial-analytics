import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NegativeAwareValue, isNegativeValue } from './negative-value';

describe('NegativeAwareValue', () => {
  it('nilai minus diberi ikon peringatan dan alasan untuk pembaca layar', () => {
    render(
      <NegativeAwareValue value={-50000} reason="Profit minus">
        -Rp 50.000
      </NegativeAwareValue>
    );
    const el = screen.getByTitle('Profit minus');
    expect(el.className).toContain('bg-rose-50');
    expect(el.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('Profit minus', { selector: '.sr-only' })).toBeTruthy();
  });

  it('nilai nol atau positif tampil biasa tanpa peringatan', () => {
    const { container } = render(
      <NegativeAwareValue value={0} positiveClassName="text-emerald-600">
        Rp 0
      </NegativeAwareValue>
    );
    expect(container.querySelector('svg')).toBeNull();
    expect(container.firstElementChild?.className).toContain('text-emerald-600');
  });

  it('isNegativeValue mengabaikan NaN dan null', () => {
    expect(isNegativeValue(-1)).toBe(true);
    expect(isNegativeValue(Number.NaN)).toBe(false);
    expect(isNegativeValue(null)).toBe(false);
  });
});

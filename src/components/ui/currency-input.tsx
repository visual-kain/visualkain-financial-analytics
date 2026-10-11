'use client';

import React from 'react';
import { NumericFormat } from 'react-number-format';
import { CURRENCY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps {
  id?: string;
  value: number | string | null | undefined;
  onValueChange: (value: number) => void;
  prefix?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  allowNegative?: boolean;
}

export function CurrencyInput({
  id,
  value,
  onValueChange,
  prefix = CURRENCY_CONFIG.prefix,
  placeholder = '0',
  className,
  disabled = false,
  required = false,
  autoFocus = false,
  allowNegative = false,
}: CurrencyInputProps) {
  // Pastikan value adalah angka atau kosong
  const numericValue = typeof value === 'number' ? value : value ? Number(value) : '';

  return (
    <NumericFormat
      id={id}
      value={numericValue}
      onValueChange={(values) => {
        const val = values.floatValue ?? 0;
        onValueChange(val);
      }}
      thousandSeparator={CURRENCY_CONFIG.thousandSeparator}
      decimalSeparator={CURRENCY_CONFIG.decimalSeparator}
      prefix={prefix}
      allowNegative={allowNegative}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className={cn(
        'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-bold tabular-num text-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
        className
      )}
    />
  );
}

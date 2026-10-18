'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

// Font 16px di HP mencegah Safari iOS memperbesar layar saat input difokuskan.
export const INPUT_CLASS =
  'h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors placeholder:font-normal placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:h-10 sm:text-xs';

export const READONLY_INPUT_CLASS = 'cursor-default bg-slate-100 text-slate-600 focus:border-slate-200 focus:ring-0';

export const TEXTAREA_CLASS =
  'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-xs';

export const PRIMARY_BUTTON_CLASS = 'h-11 border-teal-700 bg-teal-600 text-xs hover:bg-teal-700 focus:ring-teal-500/40 sm:h-10';
export const OUTLINE_BUTTON_CLASS = 'h-11 text-xs sm:h-10';
export const DANGER_BUTTON_CLASS = 'h-11 border-rose-200 text-xs text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 focus:ring-rose-500/30 sm:h-10';

// Di xl kolom form berdampingan dengan pratinjau dan menyempit, jadi field kembali satu kolom sampai 2xl.
export const FIELD_GRID = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2';
export const FIELD_SPAN = 'sm:col-span-2 xl:col-span-1 2xl:col-span-2';

export function FormSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-teal-700">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

interface FieldShellProps {
  label: string;
  hint?: string;
  className?: string;
}

type TextFieldProps = FieldShellProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'> & { inputClassName?: string };

export function TextField({ label, hint, className, inputClassName, ...props }: TextFieldProps) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[11px] font-bold text-slate-600">
        {label}
      </label>
      <input id={id} aria-describedby={hint ? `${id}-hint` : undefined} className={cn(INPUT_CLASS, inputClassName)} {...props} />
      {hint && (
        <p id={`${id}-hint`} className="text-[11px] leading-snug text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

type TextAreaFieldProps = FieldShellProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'id'>;

export function TextAreaField({ label, hint, className, ...props }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[11px] font-bold text-slate-600">
        {label}
      </label>
      <textarea id={id} aria-describedby={hint ? `${id}-hint` : undefined} className={TEXTAREA_CLASS} {...props} />
      {hint && (
        <p id={`${id}-hint`} className="text-[11px] leading-snug text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

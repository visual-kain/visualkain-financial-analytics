'use client';

import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface CustomSelectOption {
  value: string;
  label: string;
  badge?: string;
}

interface CustomSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  options: readonly CustomSelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function CustomSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Pilih...',
  icon,
  className = '',
}: CustomSelectProps) {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={cn(
          'group inline-flex h-9 min-w-0 items-center justify-between gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 active:scale-[0.98] cursor-pointer',
          className
        )}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
          {icon && <span className="text-slate-400 group-hover:text-slate-600 shrink-0">{icon}</span>}
          <span className="truncate">
            <SelectPrimitive.Value placeholder={placeholder}>
              {selectedOption?.label || placeholder}
            </SelectPrimitive.Value>
          </span>
        </div>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={5}
          className="z-[9999] min-w-[var(--radix-select-trigger-width,8rem)] max-h-72 overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-1 text-slate-800 shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-150"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className="relative flex cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none transition-colors hover:bg-teal-50 hover:text-teal-900 focus:bg-teal-50 focus:text-teal-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  {opt.badge && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <SelectPrimitive.ItemIndicator className="ml-2 inline-flex items-center text-teal-600">
                  <Check className="h-3.5 w-3.5" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

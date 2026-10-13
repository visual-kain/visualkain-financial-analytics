import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center',
        className
      )}
    >
      <Inbox className="h-6 w-6 text-slate-400" aria-hidden />
      <p className="text-xs font-bold text-slate-700">{title}</p>
      {description && <p className="max-w-xs text-[11px] text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

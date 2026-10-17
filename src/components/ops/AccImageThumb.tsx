'use client';

import React, { useState } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { safeImageUrl } from '@/lib/safe-url';
import { cn } from '@/lib/utils';

interface AccImageThumbProps {
  url: string;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = { sm: 'h-9 w-9', md: 'h-11 w-11', lg: 'h-40 w-full sm:h-56' };

/** Thumbnail gambar ACC customer yang membuka lightbox (pengganti "buka tab baru" di visualkaindb). */
export function AccImageThumb({ url: rawUrl, label, size = 'sm', className }: AccImageThumbProps) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const url = safeImageUrl(rawUrl || '');

  if (!url) return <span className="text-slate-400">-</span>;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Lihat gambar ACC ${label}`}
        className={cn(
          'group relative shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition-shadow hover:border-teal-300 hover:shadow-sm',
          SIZE[size],
          className
        )}
      >
        {broken ? (
          <ImageOff className="m-auto h-4 w-4 text-slate-400" aria-hidden />
        ) : (
          <img
            src={url}
            alt={`ACC ${label}`}
            loading="lazy"
            onError={() => setBroken(true)}
            className={cn('h-full w-full', size === 'lg' ? 'object-contain' : 'object-cover')}
          />
        )}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ACC Customer"
        description={label}
        size="xl"
        footer={
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:h-10"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Buka ukuran asli
          </a>
        }
      >
        <div className="flex justify-center rounded-xl bg-slate-100 p-2">
          <img src={url} alt={`ACC ${label}`} className="max-h-[70vh] w-auto max-w-full object-contain" />
        </div>
      </Modal>
    </>
  );
}

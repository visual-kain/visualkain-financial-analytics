'use client';

import React from 'react';
import { Pencil, Plus } from 'lucide-react';

export type ManageMode = 'add' | 'edit';

interface ManageActionsProps {
  onAdd: () => void;
  onEdit?: () => void;
  editDisabled?: boolean;
  noun: string;
}

/** Tombol kecil Tambah/Edit yang diletakkan di samping label select master data. */
export function ManageActions({ onAdd, onEdit, editDisabled = false, noun }: ManageActionsProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Tambah ${noun}`}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
      >
        <Plus className="h-3 w-3" /> Tambah
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={editDisabled}
          aria-label={`Edit ${noun}`}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
      )}
    </span>
  );
}

'use client';

import React, { useMemo } from 'react';
import { FileSignature } from 'lucide-react';
import { LetterListView } from '@/components/letters/LetterListView';
import { usePenawaranList } from '@/hooks/useLetters';
import { deletePenawaran } from '@/lib/firestore/letters-repo';
import { penawaranToRow } from '@/lib/letters';

export default function PenawaranListPage() {
  const { items, state, retry } = usePenawaranList();
  const rows = useMemo(() => items.map(penawaranToRow), [items]);

  return (
    <LetterListView
      title="Penawaran Harga"
      subtitle="Penawaran harga untuk calon klien. Nomor PH-VK-tahun-urut dibuat otomatis saat penawaran pertama kali disimpan."
      icon={<FileSignature className="h-3.5 w-3.5" aria-hidden />}
      noun="penawaran"
      numberLabel="No. Penawaran"
      basePath="/penawaran"
      newLabel="Penawaran Baru"
      rows={rows}
      state={state}
      onRetry={retry}
      onDelete={(row) => deletePenawaran(row.id)}
    />
  );
}

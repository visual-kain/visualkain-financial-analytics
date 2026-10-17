'use client';

import React, { useMemo } from 'react';
import { Handshake } from 'lucide-react';
import { LetterListView } from '@/components/letters/LetterListView';
import { useKerjasamaList } from '@/hooks/useLetters';
import { deleteKerjasama } from '@/lib/firestore/letters-repo';
import { kerjasamaToRow } from '@/lib/letters';

export default function KerjasamaListPage() {
  const { items, state, retry } = useKerjasamaList();
  const rows = useMemo(() => items.map(kerjasamaToRow), [items]);

  return (
    <LetterListView
      title="Pengajuan Kerjasama"
      subtitle="Surat pengajuan kerjasama ke calon klien. Nomor SK-VK-tahun-urut dibuat otomatis saat surat pertama kali disimpan."
      icon={<Handshake className="h-3.5 w-3.5" aria-hidden />}
      noun="surat"
      numberLabel="No. Surat"
      basePath="/kerjasama"
      newLabel="Surat Baru"
      rows={rows}
      state={state}
      onRetry={retry}
      onDelete={(row) => deleteKerjasama(row.id)}
    />
  );
}

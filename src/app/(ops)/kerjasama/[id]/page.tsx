'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { KerjasamaEditor } from '@/components/letters/KerjasamaEditor';
import { LetterDocGate } from '@/components/letters/LetterDocGate';
import { useKerjasamaDoc } from '@/hooks/useLetters';

export default function KerjasamaDetailPage() {
  const params = useParams<{ id: string }>();
  const result = useKerjasamaDoc(params.id);

  return (
    <LetterDocGate result={result} noun="surat" listHref="/kerjasama" listLabel="Daftar surat">
      {(doc) => <KerjasamaEditor key={doc.id} doc={doc} />}
    </LetterDocGate>
  );
}

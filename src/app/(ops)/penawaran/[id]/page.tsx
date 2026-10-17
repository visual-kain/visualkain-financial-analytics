'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { LetterDocGate } from '@/components/letters/LetterDocGate';
import { PenawaranEditor } from '@/components/letters/PenawaranEditor';
import { usePenawaranDoc } from '@/hooks/useLetters';

export default function PenawaranDetailPage() {
  const params = useParams<{ id: string }>();
  const result = usePenawaranDoc(params.id);

  return (
    <LetterDocGate result={result} noun="penawaran" listHref="/penawaran" listLabel="Daftar penawaran">
      {(doc) => <PenawaranEditor key={doc.id} doc={doc} />}
    </LetterDocGate>
  );
}

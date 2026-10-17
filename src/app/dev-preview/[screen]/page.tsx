import { notFound } from 'next/navigation';
import { DevPreviewScreen } from './DevPreviewScreen';

// Ditolak di server untuk build produksi sehingga pratinjau fixture tidak pernah dirender di luar `next dev`.
export default async function DevPreviewPage({ params }: { params: Promise<{ screen: string }> }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { screen } = await params;
  return <DevPreviewScreen screen={screen} />;
}

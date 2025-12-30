import { notFound } from 'next/navigation';
import PublicMapViewer from '@/components/PublicMapViewer/PublicMapViewer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicMapPage({ params }: PageProps) {
  const { slug } = await params;

  return <PublicMapViewer slug={slug} />;
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'ResiGest 360 — Conductores',
  description:
    'Portal móvil para conductores: consulta tus DeCAs asignados, firma portes, sube tickets y recibe avisos en ruta.',
  manifest: '/api/mobile/conductor/manifest',
  icons: {
    icon: [
      { url: '/images/logo/pwa-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/images/logo/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'ResiGest',
    statusBarStyle: 'black-translucent',
  },
};

export default function ConductorLayout({ children }: { children: ReactNode }) {
  return children;
}

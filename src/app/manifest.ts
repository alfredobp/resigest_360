import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ResiGest 360 — Conductores',
    short_name: 'ResiGest',
    description:
      'Portal móvil para conductores: consulta tus DeCAs asignados, firma portes, sube tickets y recibe avisos en ruta.',
    start_url: '/mobile/conductor',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#020617',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/images/logo/pwa-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/logo/pwa-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}


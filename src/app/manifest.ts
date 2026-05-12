import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cine Terabithia',
    short_name: 'CineT',
    description: 'Club de cine entre amigos',
    start_url: '/',
    display: 'standalone',
    background_color: '#14181C',
    theme_color: '#14181C',
    orientation: 'portrait',
    categories: ['entertainment'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}

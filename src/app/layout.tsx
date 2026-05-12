import type { Metadata, Viewport } from 'next';
import './globals.css';
import TopBar from '@/components/TopBar';
import { Providers } from '@/components/Providers';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  metadataBase: new URL('https://cine-terabithia.vercel.app'),
  title: 'Cine Terabithia',
  description: 'Club de cine entre amigos',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CineT',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#14181C',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <div className="app">
            <TopBar />
            {children}
          </div>
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

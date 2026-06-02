import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import TopBar from '@/components/TopBar';
import { Providers } from '@/components/Providers';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import UpdateBanner from '@/components/UpdateBanner';
import WhatsNewGate from '@/components/WhatsNewGate';
import AccentProvider from '@/components/AccentProvider';
import PageTracker from '@/components/PageTracker';
import { ACCENT_INIT_SCRIPT } from '@/lib/themes';

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
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
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
    <html lang="es" suppressHydrationWarning>
      <body>
        <Script id="accent-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: ACCENT_INIT_SCRIPT }} />
        <Providers>
          <AccentProvider />
          <PageTracker />
          <div className="app">
            <TopBar />
            {children}
          </div>
          <WhatsNewGate />
        </Providers>
        <ServiceWorkerRegister />
        <UpdateBanner />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import TopBar from '@/components/TopBar';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://cine-terabithia.vercel.app'),
  title: 'Cine Terabithia',
  description: 'Club de cine entre amigos',
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
      </body>
    </html>
  );
}

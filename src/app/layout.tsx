import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'VisualKain Financial Data & Analytics',
  description: 'Executive Financial Intelligence, Arus Kas Riil & Alokasi Vendor Escrow 2026',
  icons: {
    icon: '/img/logo.jpg',
    shortcut: '/img/logo.jpg',
    apple: '/img/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#e6ecf2] antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}


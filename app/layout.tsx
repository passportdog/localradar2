import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LocalRadar 2 | Deluxe Map Intelligence',
  description: 'Real-time Florida traffic camera monitoring with 3D map visualization. Live traffic intelligence for Miami-Dade and beyond.',
  keywords: ['traffic cameras', 'Florida traffic', 'Miami traffic', 'live cameras', 'map intelligence', '3D map'],
  authors: [{ name: 'LocalRadar Team' }],
  openGraph: {
    title: 'LocalRadar 2 | Deluxe Map Intelligence',
    description: 'Real-time Florida traffic camera monitoring with 3D map visualization.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalRadar 2 | Deluxe Map Intelligence',
    description: 'Real-time Florida traffic camera monitoring with 3D map visualization.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0c4a6e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-map-bg text-white min-h-screen`}
      >
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}

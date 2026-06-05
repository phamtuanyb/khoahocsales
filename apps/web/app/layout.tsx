import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import { withBasePath } from '@/lib/base-path';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
});

const iconPath = withBasePath('/brand/mkt-logo-vertical-positive.png');

export const metadata: Metadata = {
  title: 'MKT Academy - Hoc de chien thang',
  description:
    'Nen tang dao tao noi bo va game hoa cua MKT Software.',
  applicationName: 'MKT Academy',
  icons: {
    icon: iconPath,
    apple: iconPath,
  },
  authors: [{ name: 'Phan mem MKT' }],
};

export const viewport: Viewport = {
  themeColor: '#6FA9F9',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnamPro.variable} min-h-screen text-white antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

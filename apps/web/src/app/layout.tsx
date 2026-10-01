import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, IBM_Plex_Sans, Inter, Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import { appConfig } from '@/shared/config/env';
import { BrandingStyles } from '@/shared/components/branding-styles';
import { AppProviders } from '@/shared/providers/app-providers';
import { ThemeScript } from '@/shared/theme/theme-script';
import './globals.css';

// Inter is the default; the others are user-selectable in Settings → Appearance and
// only downloaded by the browser when actually used.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap', preload: false });
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-plex', display: 'swap', preload: false });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap', preload: false });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap', preload: false });

export const metadata: Metadata = {
  title: { default: appConfig.name, template: `%s · ${appConfig.name}` },
  description: appConfig.tagline,
  applicationName: appConfig.name,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0c111d' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fonts = [inter, geist, plex, manrope, geistMono].map((font) => font.variable).join(' ');
  return (
    // Theme attributes are set by ThemeScript before hydration.
    <html lang="en" className={fonts} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <BrandingStyles />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

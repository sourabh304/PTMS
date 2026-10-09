import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { appConfig } from '@/shared/config/env';
import { BrandingStyles } from '@/shared/components/branding-styles';
import { AppProviders } from '@/shared/providers/app-providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: appConfig.name, template: `%s · ${appConfig.name}` },
  description: appConfig.tagline,
  applicationName: appConfig.name,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <BrandingStyles />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

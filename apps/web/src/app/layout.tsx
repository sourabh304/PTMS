import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { appConfig } from '@/shared/config/env';
import { BrandingStyles } from '@/shared/components/branding-styles';
import { AppProviders } from '@/shared/providers/app-providers';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });

export const metadata: Metadata = {
  title: { default: appConfig.name, template: `%s · ${appConfig.name}` },
  description: appConfig.tagline,
  applicationName: appConfig.name,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>
        <BrandingStyles />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

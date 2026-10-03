import type { Metadata } from 'next';
import { AppearanceSettings } from '@/features/appearance/components/appearance-settings';

export const metadata: Metadata = { title: 'Appearance' };

export default function PlatformAppearancePage() {
  return <AppearanceSettings />;
}

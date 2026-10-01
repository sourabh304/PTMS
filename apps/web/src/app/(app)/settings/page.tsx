import { redirect } from 'next/navigation';
import { routes } from '@/shared/config/routes';

export default function SettingsPage() {
  redirect(routes.settingsOrganization);
}

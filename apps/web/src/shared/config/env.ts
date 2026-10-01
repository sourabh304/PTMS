/**
 * Public runtime configuration. Values are inlined by Next.js at build time from
 * NEXT_PUBLIC_* variables (see .env.example); fallbacks only keep the UI functional.
 */
const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Project Tracker',
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? process.env.NEXT_PUBLIC_APP_NAME ?? 'PT',
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE ?? '',
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME ?? '',
  brandColor: process.env.NEXT_PUBLIC_BRAND_COLOR ?? '#2563eb',
  apiBasePath: process.env.NEXT_PUBLIC_API_BASE_PATH ?? '/api',
  defaultPageSize: toNumber(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE, 20),
  boardPageSize: toNumber(process.env.NEXT_PUBLIC_BOARD_PAGE_SIZE, 200),
  notificationPollMs: toNumber(process.env.NEXT_PUBLIC_NOTIFICATION_POLL_MS, 30_000),
  dateFormat: process.env.NEXT_PUBLIC_DATE_FORMAT ?? 'dd MMM yyyy',
} as const;

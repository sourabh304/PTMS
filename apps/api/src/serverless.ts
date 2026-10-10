import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Vercel function entry (re-exported by api/index.js). The Nest app is created once per warm
 * instance and every request is handed to its Express instance; main.ts stays the entry for
 * local development and Docker.
 */
type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;

// Production settings (secure cookies) unless the project says otherwise.
process.env.NODE_ENV ??= 'production';
if (process.env.DATABASE_URL) process.env.DATABASE_URL = withPgBouncerMode(process.env.DATABASE_URL);

/** Neon's pooled connection runs PgBouncer in transaction mode, which needs Prisma's pgbouncer mode. */
function withPgBouncerMode(url: string): string {
  if (!url.includes('-pooler.') || /[?&]pgbouncer=/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}pgbouncer=true`;
}

let listener: Promise<RequestListener> | undefined;

async function init(): Promise<RequestListener> {
  // Imported after the environment defaults above are in place.
  const { createApp } = await import('./app.setup');
  const app = await createApp();
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // A failed start-up (e.g. the database was unreachable) is retried on the next request.
  listener ??= init().catch((error: unknown) => {
    listener = undefined;
    throw error;
  });
  const handle = await listener;
  await new Promise<void>((resolve) => {
    res.once('finish', resolve);
    res.once('close', resolve);
    handle(req, res);
  });
}

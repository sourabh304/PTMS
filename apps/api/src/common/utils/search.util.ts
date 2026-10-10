import { Prisma } from '@prisma/client';

/** PostgreSQL compares text case-sensitively; SQLite's LIKE already ignores case for ASCII. */
const caseInsensitive = /^postgres(ql)?:/i.test(process.env.DATABASE_URL ?? '');

/** Filter matching text that contains `value`, ignoring case on every supported database. */
export const textContains = (value: string): Prisma.StringFilter =>
  (caseInsensitive ? { contains: value, mode: 'insensitive' } : { contains: value }) as Prisma.StringFilter;

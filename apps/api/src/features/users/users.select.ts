import { Prisma } from '@prisma/client';

/** Public projection of a user - never exposes credentials. */
export const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  jobTitle: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  hourlyRate: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/** Compact projection used when embedding users in other resources. */
export const USER_SUMMARY_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof USER_PUBLIC_SELECT }>;

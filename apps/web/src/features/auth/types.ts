import type { Permission } from '@/shared/constants/domain';
import type { Organization } from '@/features/organization/types';

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  hourlyRate: number | null;
  lastLoginAt: string | null;
  createdAt: string;
  /** For the root account: the workspace it has opened from the platform console, or null. */
  organization: Organization | null;
  permissions: Permission[];
}

export interface AuthConfig {
  appName: string;
  allowPublicRegistration: boolean;
  /** Length of a "Keep me signed in" session. */
  rememberMeDays: number;
  passwordPolicy: {
    minLength: number;
    maxLength: number;
  };
}

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterInput extends LoginInput {
  organizationName: string;
  firstName: string;
  lastName: string;
}

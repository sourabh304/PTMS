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
  /** Null for the platform root account. */
  organization: Organization | null;
  permissions: Permission[];
}

export interface AuthConfig {
  appName: string;
  allowPublicRegistration: boolean;
  passwordPolicy: {
    minLength: number;
    maxLength: number;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  organizationName: string;
  firstName: string;
  lastName: string;
}

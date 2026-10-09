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
  isRootAdmin: boolean;
  isActive: boolean;
  hourlyRate: number | null;
  lastLoginAt: string | null;
  createdAt: string;
  organization: Organization;
  permissions: Permission[];
}

export interface AuthConfig {
  appName: string;
  passwordPolicy: {
    minLength: number;
    maxLength: number;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}


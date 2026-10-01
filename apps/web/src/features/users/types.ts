import type { OrgRole } from '@/shared/constants/domain';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  role: OrgRole;
  isActive: boolean;
  hourlyRate: number | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: OrgRole;
  isActive?: boolean;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: OrgRole;
  jobTitle?: string | null;
  hourlyRate?: number | null;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'email' | 'password'>> & { isActive?: boolean };

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  jobTitle?: string | null;
  avatarUrl?: string | null;
}

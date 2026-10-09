import type { Organization } from '@/features/organization/types';

export interface Workspace extends Organization {
  owner: { id: string; firstName: string; lastName: string; email: string } | null;
  userCount: number;
  projectCount: number;
}

export interface CreateWorkspaceInput {
  organizationName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

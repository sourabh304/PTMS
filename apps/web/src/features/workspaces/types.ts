import type { UserSummary } from '@/shared/types/api';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  owners: UserSummary[];
  userCount: number;
  projectCount: number;
}

export interface CreateWorkspaceInput {
  name: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPassword: string;
}

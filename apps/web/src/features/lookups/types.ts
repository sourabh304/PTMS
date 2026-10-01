import type { LookupType, StatusCategory } from '@/shared/constants/domain';

export interface Lookup {
  id: string;
  organizationId: string;
  type: LookupType;
  name: string;
  color: string;
  category: StatusCategory | null;
  position: number;
  isDefault: boolean;
}

export interface LookupInput {
  type: LookupType;
  name: string;
  color: string;
  category?: StatusCategory;
  isDefault?: boolean;
}

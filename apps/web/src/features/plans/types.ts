import type { BillingInterval } from '@/shared/constants/domain';

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  /** Price per billing interval in minor units (e.g. cents). */
  priceCents: number;
  currency: string;
  billingInterval: BillingInterval;
  /** null = unlimited */
  maxUsers: number | null;
  maxProjects: number | null;
  isActive: boolean;
  createdAt: string;
  _count?: { subscriptions: number };
}

export interface PlanInput {
  code: string;
  name: string;
  description?: string | null;
  priceCents: number;
  currency?: string;
  billingInterval: BillingInterval;
  maxUsers?: number | null;
  maxProjects?: number | null;
  isActive?: boolean;
}

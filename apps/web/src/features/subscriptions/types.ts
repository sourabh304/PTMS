import type { Plan } from '@/features/plans/types';
import type { SubscriptionStatus } from '@/shared/constants/domain';

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  plan: Plan;
  organization?: { id: string; name: string; slug: string; isActive: boolean };
}

export interface SubscriptionQuery {
  organizationId?: string;
  planId?: string;
  status?: SubscriptionStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SubscriptionInput {
  organizationId: string;
  planId: string;
  status?: SubscriptionStatus;
  startDate?: string;
  endDate?: string | null;
  notes?: string | null;
}

export interface PlanUsage {
  users: number;
  projects: number;
}

/** What an organization admin sees about their own subscription. */
export interface SubscriptionOverview {
  subscription: Subscription | null;
  usage: PlanUsage;
  requireActiveSubscription: boolean;
}

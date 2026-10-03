import type { Subscription, PlanUsage } from '@/features/subscriptions/types';
import type { SubscriptionStatus } from '@/shared/constants/domain';
import type { UserSummary } from '@/shared/types/api';

export interface PlatformOrganization {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  timezone: string;
  createdAt: string;
  _count: { users: number; projects: number };
  currentSubscription: Subscription | null;
}

export interface PlatformOrganizationDetail extends Omit<PlatformOrganization, 'currentSubscription'> {
  superAdmins: (UserSummary & { isActive: boolean; lastLoginAt: string | null })[];
  subscriptions: Subscription[];
  currentSubscription: Subscription | null;
  usage: PlanUsage;
}

export interface PlatformOrganizationQuery {
  search?: string;
  status?: 'active' | 'suspended';
  page?: number;
  limit?: number;
}

export interface CreateOrganizationInput {
  name: string;
  superAdmin: { firstName: string; lastName: string; email: string; password: string };
}

export interface PlatformOverview {
  organizations: { total: number; active: number; suspended: number };
  users: number;
  projects: number;
  activePlans: number;
  currentSubscriptions: number;
  subscriptionsByStatus: { status: SubscriptionStatus; count: number }[];
  mrr: { currency: string; amountCents: number }[];
  recentOrganizations: { id: string; name: string; slug: string; isActive: boolean; createdAt: string; _count: { users: number } }[];
}

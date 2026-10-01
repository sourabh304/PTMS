export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  timezone: string;
  weekStartsOn: number;
  workingHoursPerDay: number;
  createdAt: string;
  updatedAt: string;
}

export type UpdateOrganizationInput = Partial<
  Pick<Organization, 'name' | 'logoUrl' | 'primaryColor' | 'timezone' | 'weekStartsOn' | 'workingHoursPerDay'>
>;

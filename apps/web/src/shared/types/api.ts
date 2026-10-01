export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export interface LookupRef {
  id: string;
  name: string;
  color: string;
  category?: string | null;
}

export interface ProjectRef {
  id: string;
  name: string;
  key: string;
  color: string | null;
}

export interface LookupCount {
  id: string;
  name: string;
  color: string;
  count: number;
}

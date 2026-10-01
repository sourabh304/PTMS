import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';

export interface PageRequest {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Normalizes paging input against the configured defaults/limits. */
@Injectable()
export class PaginationService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  resolve(page?: number, limit?: number): PageRequest {
    const { defaultPageSize, maxPageSize } = this.config.get('pagination', { infer: true });
    const safePage = Math.max(1, page ?? 1);
    const safeLimit = Math.min(Math.max(1, limit ?? defaultPageSize), maxPageSize);
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit, take: safeLimit };
  }

  build<T>(data: T[], total: number, request: PageRequest): Paginated<T> {
    return {
      data,
      meta: {
        page: request.page,
        limit: request.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / request.limit)),
      },
    };
  }
}

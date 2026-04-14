import type { ParsedQs } from 'qs';
import { parsePositiveInt, clamp } from './parseNumber';

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

interface PaginationOptions {
    defaultPage?: number;
    defaultLimit?: number;
    maxLimit?: number;
    maxPage?: number;
}

export const parsePagination = (
    query: ParsedQs,
    options?: PaginationOptions,
): PaginationParams => {
    const defaultPage = options?.defaultPage ?? 1;
    const defaultLimit = options?.defaultLimit ?? 20;
    const maxLimit = options?.maxLimit ?? 50;
    const maxPage = options?.maxPage ?? 10_000;

    const pageRaw = parsePositiveInt(query.page, defaultPage);
    const limitRaw = parsePositiveInt(query.limit, defaultLimit);

    const page = clamp(pageRaw, 1, maxPage);
    const limit = clamp(limitRaw, 1, maxLimit);

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};